"use strict";

const path = require("path");

module.exports = {
  publicRoot: path.join(process.cwd() + "/public"),
  port: 3000,
  host: "localhost",
  mongo: "mongodb://127.0.0.1:3003/test"
};
