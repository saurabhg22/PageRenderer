const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const axios = require("axios");
const redis = require("redis");
const redisClient = redis.createClient();


class PageRenderer {
    constructor(config) {
        this.config = config || {};
    }

    start() {
        const port = this.config.port || 3007;
        const sites = this.config.sites || [];
        app.get('*', async (req, res) => {
            let local_url;
            console.log(req.headers, req.orignalUrl);
            let indexOfClient = -1;
            sites.forEach((element, i) => {
                if (req.headers.host === element.hostBot) {
                    indexOfClient = i;
                    return false;
                }
            });
            if (indexOfClient === -1) {
                console.log(req.headers.host + " is not provided in the config. Assuming clientHost to be same.");
                local_url = req.protocol + '://' + req.headers.host + req.originalUrl;
                if(req.headers.host === `0.0.0.0:${port}` || req.headers.host === `127.0.0.1:${port}` || req.headers.host === `localhost:${port}`){
                   return res.send({status:404});
                }
            }
            else {
                local_url = sites[indexOfClient].hostClient + req.originalUrl;
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
                    if (doesExists) {
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
                                if (html[0] === '<') {// Wrapping all html docs into HTML tags.
                                    redisClient.set(local_url, `<html>${html}</html>`, 'EX', 60 * 60 * 24 * 7);
                                    res.send(`<html>${html}</html>`);
                                }
                                else {
                                    redisClient.set(local_url, html, 'EX', 60 * 60 * 24 * 7);
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
                                                                       
