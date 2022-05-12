const mongoose = require("mongoose");

const schema = mongoose.Schema({
  desc: String,
  teams: [String],
  current_gameweek: Number,
  max_gameweek: Number,
  current_year_string: String,
});

about2122 = mongoose.model("about2021-22", schema);
about2223 = mongoose.model("about2022-23", schema);

module.exports = { about2122, about2223 };
