const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const ua = require("useragent");


class PageRenderer{
    constructor(config){
        this.config = config
    }

    start(){
        const port = this.config.port;
        const sites = this.config.sites;
        app.get('*', async (req, res) => {
            try {
                puppeteer.launch({headless: true, args: ['--no-sandbox']}).then(async browser => {
                    const page = await browser.newPage();
        
                    // we need to override the headless Chrome user agent since its default one is still considered as "bot"
                    await page.setUserAgent('Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36');
                    let indexOfClient = -1;
                    sites.forEach((element, i) => {
                        if(req.headers.host === element.hostBot){
                            indexOfClient = i;
                            return false;
                        }
                    });
                    if(indexOfClient === -1){
                        const local_url = req.protocol + '://' + req.headers.host + req.originalUrl;
                    }
                    const local_url = sites[indexOfClient].hostClient + req.originalUrl;
                    await page.goto(local_url, {
                        waitUntil: "networkidle0",
                    });
        
        
                   let html = await page.evaluate(async() => {
                                return await (new Promise(function(resolve) {
                                    setTimeout(function(){
                                            resolve(document.documentElement.innerHTML);
                                        }, 0)
                                    }));
                                });
                    browser.close();
                    res.send(`<html>${html}</html>`);
                  }).catch(e => {console.log("Launch Error", e)});
        
        
            } catch(e) {
                console.log(e);
                res.send("ERROR");
            }
        });
        
        app.listen(port, () => {
            console.log(`Page Renderer is running at port ${port}`);
        });
    }
}