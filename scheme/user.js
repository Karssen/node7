"use strict";

const mongoose = require("../mongoose").mongoose;

let userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  created: {
    type:    Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);
