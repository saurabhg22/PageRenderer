const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const ua = require("useragent");
const axios = require("axios");


class PageRenderer{
    constructor(config){
        this.config = config || {};
    }

    start(verbose = 0){
        const port = this.config.port || 3007;
        const sites = this.config.sites || [];
        app.get('*', async (req, res) => {
            let local_url;
            let indexOfClient = -1;
            if(verbose === 1){
                console.log(req.headers);
            }
            sites.forEach((element, i) => {
                if(req.headers.host === element.hostBot){
                    indexOfClient = i;
                    return false;
                }
            });
            if(indexOfClient === -1){
                console.log(req.headers.host + " is not provided in the config. Assuming clientHost to be same.");
                local_url = req.protocol + '://' + req.headers.host + req.originalUrl;
            }
            else{
                local_url = sites[indexOfClient].hostClient + req.originalUrl;
            }
            // JS and CSS files do not require a browser to render.
            if(/.*\.(js|css)$/.test(local_url)){
                let resoonse = await axios.request({
                    url: local_url
                });
                res.send(JSON.stringify(resoonse.data));
            }
            else{
                try {
                    puppeteer.launch({headless: true, args: ['--no-sandbox']}).then(async browser => {
                        const page = await browser.newPage();
            
                        // we need to override the headless Chrome user agent since its default one is still considered as "bot"
                        await page.setUserAgent('Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36');
                        await page.goto(local_url, { waitUntil: "networkidle0",});
            
            
                        let html = await page.evaluate(async() => {
                                    return await (new Promise(function(resolve) {
                                        setTimeout(function(){
                                                resolve(document.documentElement.innerHTML);
                                            }, 0)
                                        }));
                                    });
                        browser.close();
                        if(html[0] === '<') // Wrapping all html docs into HTML tags.
                            res.send(`<html>${html}</html>`);
                        else
                            res.send(html);
                    }).catch(e => {console.log("Launch Error", e)});
            
            
                } catch(e) {
                    console.log(e);
                    res.send("ERROR");
                }
            }
            });
        
        app.listen(port, () => {
            console.log(`Page Renderer is running at port ${port}`);
        });
    }
}
module.exports = PageRenderer;