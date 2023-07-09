const express = require("express");
const router = express.Router();

// Player Models
const Player2122 = require("../models/Player").player2122;
const Player2223 = require("../models/Player").player2223;

// About Models (year metadata)
const About2122 = require("../models/About").about2122;
const About2223 = require("../models/About").about2223;

// Meta
const Meta = require("../models/Meta").meta;

const PLAYER_DICT = {
  "2021-22": Player2122,
  "2022-23": Player2223,
};
const ABOUT_DICT = {
  "2021-22": About2122,
  "2022-23": About2223,
};

// Example: /api/getPlayers/2022-23
// Get all tracks with >0 minutes played
router.get("/getPlayers/:y", async (req, res) => {
  let year = req.params.y;
  let Player = PLAYER_DICT[year];
  // console.log(`Getting all  from ${year}`);
  const players = await Player.find({ total_minutes: { $gt: 0 } }).limit();
  res.send(players);
});

// Example /api/getAbout/2021-22
// Meta data for that year
router.get("/getAbout/:y", async (req, res) => {
  let year = req.params.y;
  let About = ABOUT_DICT[year];
  // console.log(`Getting About from ${year}`);
  const about = await About.find({});
  res.send(about);
});

// Meta data (not year specific)
router.get("/getMeta/", async (req, res) => {
  // console.log(`Getting Metadata`);
  const meta = await Meta.find({});
  res.send(meta);
});

module.exports = router;
