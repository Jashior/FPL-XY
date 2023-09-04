// This file is for testing with connection to live DB
// For speed use normal routes.js

const express = require("express");
const router = express.Router();

// Player Models
const Player2122 = require("../models/Player").player2122;
const Player2223 = require("../models/Player").player2223;
const Player2324 = require("../models/Player").player2324;

// About Models (year metadata)
const About2122 = require("../models/About").about2122;
const About2223 = require("../models/About").about2223;
const About2324 = require("../models/About").about2324;

// Meta
const Meta = require("../models/Meta").meta;

const PLAYER_DICT = {
  "2021-22": Player2122,
  "2022-23": Player2223,
  "2023-24": Player2324,
};
const ABOUT_DICT = {
  "2021-22": About2122,
  "2022-23": About2223,
  "2023-24": About2324,
};

// Example: /api/getPlayers/2022-23
// Get all tracks with >0 minutes played
router.get("/getPlayers/:y", async (req, res) => {
  let year = req.params.y;
  let Player = PLAYER_DICT[year];
  console.log(`Getting all  from ${year}`);
  const players = await Player.find({ total_minutes: { $gt: 0 } }).limit();
  console.log(`players: ${players.length}`);
  res.send(players);
});

// Example /api/getAbout/2021-22
// Meta data for that year
router.get("/getAbout/:y", async (req, res) => {
  let year = req.params.y;
  let About = ABOUT_DICT[year];
  console.log(`Getting About from ${year}`);
  const about = await About.find({});
  console.log(`about: ${about.length}`);
  res.send(about);
});

// Meta data (not year specific)
router.get("/getMeta/", async (req, res) => {
  console.log(`Getting Metadata`);
  const meta = await Meta.find({});
  console.log(`meta: ${meta}`);
  res.send(meta);
});

module.exports = router;
