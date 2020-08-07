const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const axios = require("axios");
const redis = require("redis");
const redisClient = redis.createClient();


const removeRegexSlashes=(string)=>{
    if(string.indexOf('/')===0 && (string.lastIndexOf('/')===string.length - 1)){
        return string.substring(1,string.length - 1)
    }
    return string
}
class PageRenderer {
    constructor(config) {
        this.config = config || {};
    }

    start() {
        const port = this.config.port || 3007;
        const sites = this.config.sites || [];
        app.get('*', async (req, res) => {
            let regexMatches=[];

            let local_url;
            let indexOfClient = -1;
            let found=false;
            let invalidate=false;
	        console.log("host", req.headers.host);
            sites.forEach((element, i) => {
                if(!found){
                    const regexString = removeRegexSlashes(element.hostBot);
                    regexMatches =  req.headers.host.match(regexString) || [];
                    
                    if ((req.headers.host === element.hostBot) || (regexMatches[0]===req.headers.host)) {
                        indexOfClient = i;
                        found=true;
                        invalidate=!!req.get('Invalidate-Cache')
                        return false;
                    }
                }
                
            });
            found=false;
            if (indexOfClient === -1) {
                return res.send({status:404});
            }
            else {
                let hostClient = sites[indexOfClient].hostClient;
                // const replaceGroups = hostClient.match(/(\$[0-9])/g);
                if(regexMatches && regexMatches.length > 0){
                    for(let i=1; i < regexMatches.length; i++){
                        hostClient=hostClient.replace(`$${i}`,regexMatches[i])
                    }
                    
                }
                local_url = hostClient + req.originalUrl;
		        console.log(local_url)
            }
            // JS and CSS files do not require a browser to render.
            if (/.*\.(js|css)$/.test(local_url)) {
                let response = await axios.request({
                    url: local_url
                });
                res.send(response.data);
            }
            else {

                redisClient.exists(local_url, (err, doesExists) => {
                    if (doesExists && !invalidate) {
                        redisClient.get(local_url, (err, page) => {
                            res.send(page);
                        });
                    }
                    else {
                        try {
                            puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-http2'] }).then(async browser => {
                                const page = await browser.newPage();

                                // we need to override the headless Chrome user agent since its default one is still considered as "bot"
                                await page.setUserAgent('Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36');
                                await page.goto(local_url, { waitUntil: "networkidle0", });


                                let html = await page.evaluate(async () => {
                                    return await (new Promise(function (resolve) {
                                        setTimeout(function () {
                                            resolve(document.documentElement.innerHTML);
                                        }, 0)
                                    }));
                                });
                                browser.close();
                                const siteExpiry=sites[indexOfClient].expiry || 604800;
                                if (html[0] === '<') {// Wrapping all html docs into HTML tags.
                                    redisClient.set(local_url, `<html>${html}</html>`, 'EX', siteExpiry);
                                    res.send(`<html>${html}</html>`);
                                }
                                else {
                                    redisClient.set(local_url, html, 'EX', siteExpiry);
                                    res.send(html);
                                }
                            }).catch(e => {
                                console.log("Launch Error", e)
                                res.send({status:404});
                            });


                        } catch (e) {
                            console.log(e);
                            res.send({status:500});
                        }
                    }
                });


            }
        });

        app.listen(port, () => {
            console.log(`Page Renderer is running at port ${port}`);
        });
    }
    
}
module.exports = PageRenderer;
                                                                       

