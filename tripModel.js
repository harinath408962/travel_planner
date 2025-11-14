const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  destination: String,
  startDate: String,
  endDate: String,
  budget: Number,
  notes: String,
});

module.exports = mongoose.model("Trip", tripSchema);
