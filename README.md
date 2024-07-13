# The Recycle Bin Boutique
An online store demo to showcase the capabilites of AWS Edge Services, mainly CloudFront and AWS WAF. Please note that this project is currently under development, and it's not the final version.
![The Recycle Bin Boutique](screenshot.jpeg)

# How to deploy

```javascript
git clone https://github.com/achrafsouk/recycle-bin-boutique.git
cd recycle-bin-boutique/store-infra
npm install
npm install -f --omit=optional --prefix functions/image-processing-lambda sharp @img/sharp-linux-x64 @img/sharp-libvips-linux-x64
cdk deploy
```

# Architecture

The backend includes:
* A nextJS based SSR application hosted on an EC2 instance.
* DynamoDB tables to store user and product information
* S3 bucket to store product images
* Image optimization component based on an S3 bucket for storing trasnformed images, Lambda function to transform them and a CloudFront Function to automatically detect the browser image capabilities.

It is exposed to the internet through CloudFront and protected with AWS WAF.

![](rbb-architecture.png)


# Edge security testing scenarios

Navigate to scripts folder using the ```cd scripts``` command, then go through the different testing scenarios, and make sure that you replace the CloudFront domain name in the commands with the one in the CDK deployment output.

| Threat category  | Test scenario  | How to test | 
|:------------- |:--------------- | :-------------|
| **DDoS** | Reduce attack surface of backend| Go to the deployed EC2 instance (_store_backend_ec2_), and try to load the page on port 3000. Connection will be refused, since only CloudFront IPs are allowed to using CloudFront prefixlist in its security group. | 
| **DDoS** | Reduce attack surface of APIs| Some APIs in the backend are only meant to be used by NextJS when rendering the page on the server side. Navigate to one of these APIs (e.g. api/products, api/product) and verify that you are blocked. | 
| **DDoS** | Malicious IPs | Load the website using a VPN proxy site (e.g. https://www.blockaway.net), and verify that the page is blocked. Note that this might not happen all the time as VPN operators constantly change their IPs.|
| **DDoS** | Rate limit with 400 threshold | Run the following bash script in AWS cloudshell, and verify how AWS WAF blocks an IP after threshold is breached within tens of seconds. Since the page does not exist, 404 response is returned, then a 202 challenge request is returned by the subsequent rules, and finally this rule will block with 403 <br/> ```bash rate-limit-test.sh https://xxxxxxxx.cloudfront.net/non_existing_page 400``` |
| **Web Scraping** | User-Agent classification | Run the following curl, and verify that WAF detects and blocks this HTTP library: <br/> ```curl -I https://xxxxxxxx.cloudfront.net/``` |
| **Web Scraping** | HTTP library detection | Execute the following curl and verify that a 202 javascript challenge is returned to force the acquisition of a token after multiple attempts without it from the same IP: <br/> ```for i in {1..30}; do curl -I --include --silent https://xxxxxxxx.cloudfront.net/ -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' \| grep -e HTTP/ -e x-amzn-waf-action; done``` <br/> Load the page using another browser to see the silent challenge in action|
| **Web Scraping** | Token detection replay | Load the home page in a browser, copy the token, and then run the following curl after replacing the cookie with the token value in AWS Cloud Shell in different refions. Verify that a 202 challenge is returned to force the acquisition of a token: <br/> ```curl -I --include --silent https://xxxxxxxx.cloudfront.net/ -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' -H 'Cookie: aws-waf-token=YOUR_TOKEN_VALUE'```|
| **Web Scraping** | Automation framework detection | Launch a headless chrome based on Selenium using the following command, and make sure that the scraper is not able to parse product page info: <br/> ```npm install``` <br/> ```node selenium.js https://xxxxxxxx.cloudfront.net/```|
| **Credential Stuffing** | Calling login api wihtout a token | Run the following curl and verify that WAF returns a 202 challenge: <br/> ```curl -d '{username: "Joe", password: "hackedpwd"}' -H "Content-Type: application/json" -X POST https://xxxxxxxx.cloudfront.net/api/login --include --silent -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' \| grep -e HTTP/ -e x-amzn-waf-action``` |
| **Credential Stuffing** | Stolen credential detection | Use the following test _stolen credentials_ and verify that the api returns 403 block  <br/> ```WAF_TEST_CREDENTIAL@wafexample.com``` <br/> ```WAF_TEST_CREDENTIAL_PASSWORD``` |
| **Credential Stuffing** | Password traversal detection | Using the same username, e.g. joe, login with different passwords 10-20 times until the api call returns 403 |
| **Fake Account Creation** | Use a session to create many accounts | Try to create multiple acounts, and verify a 405 block after a few successful attempts |

# Content delivery testing scenarios


| Use case  | Test scenario  | How to test | 
|:------------- |:--------------- | :-------------|
| **Image optimization** | Verfiy images are resized and format is optimized| NextJS Image component automatically selects the size of the image. Resize the browser and verify that the returned image size has changed. Verify that webp format is detected and returned autmatically. | 
| **A/B testing** | Return different versions of the home pages to users| Load the home page, and verify in the cookies to which segment you have been assigned to. Then, create an experiment that includes this segment in the deployed KeyValueStore, using the following config, and validate that you are receicing a different version of the home page <br/> Key: ```/``` <br/> Value: ```{ "segments" : "1,2,3,4,5,6", "countries" : "AE,FR", "rules": { "rewrite_path" : "/index-v2" }}```| 
| **Observability - RUM** | Analyze RUM performance data| Check CloudWatch RUM telemetry, and check the CloudWatch RUM console for more visibility on Core WebVitals  | 
| **HTTP redirection** | Redirect obselete links| Load this non existing campaign page ```/oldCampaign```. Verify that 404 is returned. Add the following http redirection rule to the deployed KeyValueStore, then validate that you are redirected to home page. <br/> Key: ```/oldCampaign``` <br/> Value: ```{ "rules": { "redirect" : "/" }}```| 
| **Observability - Server Timing Header** | Understand Server timing headers sent by CloudFront| Check this header on the home page response, and generate a new image size and check how the header value is incremented | 
| **Brotli compression** | Compress JS/CSS/HTML| Verify brotli compression on page text resources | 


# Troubleshooting

If the backend is not reachable, connect to the EC2 instance using the AWS console, and use the appropriate command of the following :

```
pm2 list
pm2 restart nextjs-app
pm2 start npm --name nextjs-app -- run start -- -p 3000
```

Querying WAF logs to understand what happened with a specific reauest
```
fields @timestamp, @message
| sort @timestamp desc
| filter httpRequest.requestId = ' UW9-AA4dRZVxrLJeVEWIoXt-8mZ98b7gfYH-NhXJhgwIG76HymvrOw=='
| limit 20
```

# Work in progress WIP

## Improve scenarios
* Use cloudshell when possible
* Change VPN scnenario to Captcha
* Reduce impact of random Captcha on loading pages (e.g. broken images)
* Evolve narration to to do build ups (attack scenarios, or performance improvement)
  
## Add scenarios  
* Observability: Logs for WAF and CloudFront, CloudWatch Metrics
* Graceful failover
* WAF Trace ID page
* SQLi / XSS

## Improve code 
* Refactor nextjs app code
* Understand why server is stopping after some time
* Add ico icon
* Generate intial data using GenAI
* Add cart action
* Caching of home page for non logged users

