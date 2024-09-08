// server.js
var express = require("express");
var app = express();
var cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
var mongoSanitize = require("express-mongo-sanitize");

// Middleware
app.use(cors());
app.use(mongoSanitize());

// Routes (before wildcard *)
const routes = require("./routes/routes");
app.use("/api", routes);

// Database Connection //
const mongoString = process.env.MONGO_URL;

mongoose.connect(mongoString);
const database = mongoose.connection;

database.on("error", (error) => {
  console.log(error);
});

database.once("connected", () => {
  console.log("Database Connected");
});

console.log(process.env.NODE_ENV);
// Static Route, serve static page in dist folder IF in production mode
if (process.env.NODE_ENV) {
  const distDir = __dirname + "/dist/fplv";
  app.use(express.static(distDir));
  app.get("*", function (req, res) {
    res.sendFile("index.html", { root: distDir });
  });

  if (process.env.NODE_ENV === "production") {
    console.log(`Production Environment: serving static Front End`);
  } else {
    console.log(`Development Environment: serving static Front End`);
  }
}

// Server start
LOCAL_PORT = 8080;
var server = app.listen(process.env.PORT || LOCAL_PORT, function () {
  console.log(`Backend Application listening at ${process.env.PORT || 8080}`);
});
