const mongoose = require("mongoose");

const schema = mongoose.Schema({
  desc: String,
  start_year: String,
  current_year_string: String,
  possible_year_strings: [String],
  current_gameweek: Number,
});

// Mongoose#model(name, [schema], [collection])
meta = mongoose.model("meta", schema, "about");
module.exports = { meta };
