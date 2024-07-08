# The Recycle Bin Boutique
A demo online store for showcasing aws edge services

![The Recycle Bin Boutique](screenshot.jpeg)

# WAS WAF testing scenarios

| Threat category  | Test scenario  | How to test | 
|:------------- |:--------------- | :-------------|
| **Credential Stuffing** | Test login api wihtout an acquired token using curl | Execute the following curl in bash, and verify that a 403 block is returned: <br/> ```curl -d '{username: "Joe", password: "hackedpwd"}' -H "Content-Type: application/json" -X POST https://ddilij7yr8kiv.cloudfront.net/api/login --include --silent -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' \| grep -e HTTP/ -e x-amzn-waf-action``` |
| **Credential Stuffing** | Test stolen credential detection | Use the following test credentials and verify that the api returns 403 block  <br/> ```WAF_TEST_CREDENTIAL@wafexample.com``` <br/> ```WAF_TEST_CREDENTIAL_PASSWORD``` |
| **Credential Stuffing** | Test password traversal detection | Using the same username, e.g. joe, login with different passwords 10-20 times until the api call returns 403 |



# scripts
```
pm2 stop nextjs-app
pm2 restart nextjs-app
pm2 start npm --name nextjs-app -- run start -- -p 3000
pm2 list
cat /var/log/cloud-init.log and
cat /var/log/cloud-init-output.log
```

# TODO
* Refactor app code
* Add ico icon
* Script to generate data and populate the store
* Managing cart actions
* Image optimizatino
* A/B testing  with rule engine
