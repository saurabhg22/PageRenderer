const Pagerenderer = require("./index");
const config = require('./config.json');

pagerenderer = new Pagerenderer(config);

pagerenderer.start();