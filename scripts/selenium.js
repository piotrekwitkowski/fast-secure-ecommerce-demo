const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const { Builder, By, Key, until } = require('selenium-webdriver');

const screen = {
    width: 640,
    height: 480
};

let driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options().addArguments('--headless').windowSize(screen))
    .setFirefoxOptions(new firefox.Options().addArguments('--headless').windowSize(screen))
    .build();

var domainName = process.argv[2]

console.log("scraping homepage to get product links");
driver.get(domainName)
    .then(_ =>
        driver.findElements(By.xpath('/html/body/div/div/main/div/a')).then(function (elems) {
            elems[0].getAttribute("href").then(function (productLink) {
                console.log("product found-> ", productLink);
                console.log("scraping this product page");
                driver.get(productLink)
                .then(_ =>
                    driver.findElements(By.xpath('/html/body/div/div/main/div/div')).then(function (elems) {
                        elems.forEach(function (elem) {
                            elem.getText().then(function (text) {
                                console.log(text);
                    
                            });
                        });
                    })
                )
            });
        })
    )

