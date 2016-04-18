"use strict";

const app = require("./app");
const config = require("config");

const port = config.get("port");
const host = config.get("host");

app.listen(port, host);
