"use strict";

const mongoose = require("mongoose");
const config = require("config");

mongoose.set("debug", true);

mongoose.connect(config.get("mongo"), {
  server: {
    socketOptions: {
      keepAlive: 1
    },
    poolSize: 5
  }
});

let db = mongoose.connection;

let waitDB = new Promise((resolve, reject) => {
  db.on("error", reject);
  db.on("open", resolve);
});

exports.mongoose = mongoose;
exports.waitDB = waitDB;