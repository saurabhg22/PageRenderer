const Pagerenderer = require("pagerenderer");
const config = require('./config.json');

pagerenderer = new Pagerenderer(config);

pagerenderer.start();