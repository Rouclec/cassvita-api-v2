const mongoose = require("mongoose");

const purhcaseStateChangeSchema = new mongoose.Schema({
  purchase: {
    type: mongoose.Schema.ObjectId,
    ref: "Purchase",
    required: [true, "Select a purchase for this change"],
  },
  state: {
    type: String,
    enum: ["New", "Pending", "Confirmed"],
    default: "New",
  },
  stateChangedAt: {
    type: Date,
    default: Date.now(),
  },
});

const purhcaseStateChange = mongoose.model(
  "purhcaseStateChange",
  purhcaseStateChangeSchema
);
module.exports = purhcaseStateChange;
