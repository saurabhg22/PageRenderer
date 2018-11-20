# Page-Renderer
- A simple plugin for rendering HTML pages on the server side that are generated by javascript.
- It creates the HTML page on the server side for SEO purposes and OG: Tags.

# Prerequisites
- Redis. Follow these steps yo install redis (Ignore if you already have redis)
  - sudo apt-get update
  - sudo apt-get install build-essential tcl
  - cd /tmp
  - curl -O http://download.redis.io/redis-stable.tar.gz
  - tar xzvf redis-stable.tar.gz
  - cd redis-stable
  - make
  - sudo make install
  - sudo mkdir /etc/redis
  - sudo mkdir /var/redis
  - sudo cp utils/redis_init_script /etc/init.d/redis_6379
  - sudo cp redis.conf /etc/redis/6379.conf
  - sudo mkdir /var/redis/6379
  - sudo vim /etc/redis/6379.conf
  - Set daemonize to yes (by default it is set to no).
  - Set the pidfile to /var/run/redis_6379.pid (modify the port if needed).
  - Change the port accordingly. In our example it is not needed as the default port is already 6379.
  - Set your preferred loglevel.
  - Set the logfile to /var/log/redis_6379.log
  - Set the dir to /var/redis/6379 (very important step!)
  - sudo update-rc.d redis_6379 defaults
  - sudo /etc/init.d/redis_6379 start


# Installation
1. Open terminal/cmd insaide the folder where you wnat to install PageRenderer and type following commands.
2. git clone https://github.com/saurabhg22/PageRenderer.git
3. cd PageRenderer
4. npm i

# Example
- Let us consider we need the http://example.com to be rendered on server-side.

- this plugin makes it extremely easy to do so. Just add an entry for http://example.com to the configuration provided to the pageRenderer.init() method.


- It should look like this:

```js
#!/usr/bin/env node
pageRenderer.init({
    "port":3007, // port on which the pagerenderer must run default is 3007
    "sites":[
        {
            "hostBot":"http://example.bot.com",
            "hostClient":"http://example.com"
        },
        {
            "hostBot":"http://anotherexample.bot.com",
            "hostClient":"http://anotherexample.com"
        }
    ]
});

```

- Then just call the start function of pagerenderer to start the service.

```js
#!/usr/bin/env node
pageRenderer.start();

```

- Now you just have to redirect all the requests coming from bots to http://example.com to http://example.bot.com, to http://anotherexample.com to http://anotherexample.bot.com and so on.


       
