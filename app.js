"use strict";

const koa = require("koa");
const Router = require("koa-router");
const path = require("path");
const fs = require("fs");
const config = require("config");
const bodyParser = require("koa-bodyparser");

const db = require("./mongoose").mongoose;
const waitDB = require("./mongoose").waitDB;
const User = require("./scheme/user");

const router = new Router();
const app = koa();

// error middleware
app.use(function* (next) {

  try {
    yield* next;
  } catch (e) {
    if (e.status) {
      this.status = e.status;
      this.body   = e.message;
    } else {
      this.status = 500;
      this.body = "error 500";
      console.error(e.message, e.stack);
    }
  }
});

// parsing middleware
app.use(bodyParser({
  onerror: function(err, ctx) {
    ctx.throw(422, "body parse error");
  }
}));

// wait mongodb connection
app.use(function* (next) {
  try {
    yield waitDB;
  } catch (err) {
    this.throw(500);
  }

  yield* next;
});

// getting index.html
router.get("/", function* (next) {
  let indexPath = path.join(config.get("publicRoot"), "index.html");

  this.type = "html";
  this.body = fs.createReadStream(indexPath);
});

// getting user by id
router.get("/users/:id", function* (next) {
  let id = this.params.id;
  let user = null;

  if (!id) {
    return yield* next;
  }

  try {
    user = yield* getUserById(id);
  } catch (err) {
    db.disconnect();
    this.throw(404, "user doesn't exist");
  }

  db.disconnect();
  this.body = user;
});

// delete user
router.delete("/users/:id", function* (next) {
  let id = this.params.id;

  if (!id) {
    return yield* next;
  }

  try {
    user = yield* deleteUserById(id);
  } catch (err) {
    db.disconnect();
    this.throw(404, "user doesn't exist");
  }

  db.disconnect();
  this.body = "deleted";
});

// create new user
router.post("/users", function* (next) {
  let name  = this.request.body.username;
  let email = this.request.body.email;
  let user = null;

  // validate
  try {
    validateUser({ name, email });
  } catch (err) {
    this.throw(400, "validate error");
  }

  // check existence of the user
  try {
    yield* existUser({ name, email });
  } catch (err) {
    db.disconnect();
    this.throw(409, "this user already exists");
  }

  // create new user
  try {
    user = yield* createUser({ name, email });
  } catch (err) {
    db.disconnect();
    this.throw(500);
  }

  db.disconnect();
  this.body = user;
});

app.use(router.routes());

app.on("error", console.error);

module.exports = app;

function* existUser(opts) {
  const name = opts.name;
  const email = opts.email;

  return yield User
    .find({ name, email })
    .then(user => {
      if (user) {
        throw "this user already exists";
      }
    });
}

function* getUserById(id) {
  return yield User
    .find({ id })
    .then(user => {
      if (!user) {
        throw "user doesn't exist";
      }

      return user;
    });
}

function validateUser(opts) {
  const name = opts.name;
  const email = opts.email;

  if (!name.trim().length || !email.trim().length || !validateEmail(email)) {
    throw "incorrect post data";
  }
}

function validateEmail(email) {
  return /^([a-z0-9_-]+\.)*[a-z0-9_-]+@[a-z0-9_-]+(\.[a-z0-9_-]+)*\.[a-z]{2,6}$/.test(email);
}

function* createUser(opts) {
  const name = opts.name;
  const email = opts.email;

  return yield User.create({ name, email });
}

function* deleteUserById(_id) {
  return yield User.remove({ _id });
}
