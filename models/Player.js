const mongoose = require("mongoose");

const schema = mongoose.Schema({
  name: String,
  team: String,
  fpl_id: Number,
  tsb: Number,
  price: Number,
  goals: [Number],
  assists: [Number],
  xG: [Number],
  xA: [Number],
  minutes: [Number],
  total_minutes: Number,
});

player2122 = mongoose.model("players2021-22", schema);
player2223 = mongoose.model("players2022-23", schema);

module.exports = { player2122, player2223 };
