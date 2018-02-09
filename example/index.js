const Pagerenderer = require("pagerenderer");

pagerenderer = new Pagerenderer({port:3007, sites:[
    {
        "hostBot":"localhost:3007",
        "hostClient":"http://localhost:3004"
    }
]});

pagerenderer.start();