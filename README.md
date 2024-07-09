# The Recycle Bin Boutique
A demo online store for showcasing aws edge services

![The Recycle Bin Boutique](screenshot.jpeg)

# WAS WAF testing scenarios

Navigate to scripts folder using the ```cd scripts``` command, then go through the different testing scenarios.

| Threat category  | Test scenario  | How to test | 
|:------------- |:--------------- | :-------------|
| **Credential Stuffing** | Fetch login api wihtout a token using curl | Update the CloudFront domain name in the following curl, then execute it in bash, and verify that a 403 block is returned: <br/> ```curl -d '{username: "Joe", password: "hackedpwd"}' -H "Content-Type: application/json" -X POST https://xxxxxxxx.cloudfront.net/api/login --include --silent -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' \| grep -e HTTP/ -e x-amzn-waf-action``` |
| **Credential Stuffing** | Stolen credential detection | Use the following test credentials and verify that the api returns 403 block  <br/> ```WAF_TEST_CREDENTIAL@wafexample.com``` <br/> ```WAF_TEST_CREDENTIAL_PASSWORD``` |
| **Credential Stuffing** | Password traversal detection | Using the same username, e.g. joe, login with different passwords 10-20 times until the api call returns 403 |
| **Web Scraping** | Fetch home page using curl | Update the CloudFront domain name in the following curl, then execute it in bash, and verify that a 403 block is returned: <br/> ```curl -I https://xxxxxxxx.cloudfront.net/``` |
| **Web Scraping** | Fetch home page using curl with browser User-Agent | Update the CloudFront domain name in the following curl, then execute it in bash, and verify that a 202 challenge is returned to force the acquisition of a token: <br/> ```for i in {1..30}; do curl -I --include --silent https://xxxxxxxx.cloudfront.net/ -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' \| grep -e HTTP/ -e x-amzn-waf-action; done``` <br/> Load the page using another browser to see the silent challenge in action|
| **Web Scraping (TBD)** | Fetch home page using curl with browser User-Agent and valid token | Update the CloudFront domain name in the following curl, and replace the cookie with a valid token value from a sucessful browser session, then execute it in AWS Cloud Shell in different refions, and verify that a 202 challenge is returned to force the acquisition of a token: <br/> ```curl -I --include --silent https://xxxxxxxx.cloudfront.net/ -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' -H 'Cookie: aws-waf-token=yyyyyyyyyyyyy'```|
| **Web Scraping** | Automation framework detection | Launch a headless chrome using Selenium using the following command, and make sure that the scraper is not able to parse product pages: <br/> ```node selenium.js https://xxxxxxxx.cloudfront.net/```|
| **DDoS** | Reduce attack surface of apis| Update the CloudFront domain name in the following curl, then execute it in bash, and verify that products api is not exposed on the internet <br/> ```curl  https://xxxxxxxx.cloudfront.net/api/products -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' ``` | 
| **DDoS** | Malicious IPs | Load the website using a VPN https://www.blockaway.net/, and verify that the page do not load|
| **DDoS** | Rate limit (400/5mins) | Run the following bash script, and check how long it takes AWS WAF to block an IP after limit is breached <br/> ```bash rate-limit-test.sh https://xxxxxxxx.cloudfront.net/hello 400``` |
| **Fake Account Creation** | Use a session to create many accounts | Try to create multiple acounts in the website, and verify a block after a multiple successful attempts |


# troubleshooting commands
```
pm2 stop nextjs-app
pm2 restart nextjs-app
pm2 start npm --name nextjs-app -- run start -- -p 3000
pm2 list
cat /var/log/cloud-init.log and
cat /var/log/cloud-init-output.log
```

# Polishing the code
* Refactor app code
* Add ico icon
* Script to generate data and populate the store
* Managing cart actions
* Image optimizatino
* A/B testing  with rule engine
* WAF logging
