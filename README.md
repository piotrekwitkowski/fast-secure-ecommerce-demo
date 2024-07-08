# The Recycle Bin Boutique
A demo online store for showcasing aws edge services

![The Recycle Bin Boutique](screenshot.jpeg)

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
