const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

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

purhcaseStateChangeSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

const purhcaseStateChange = mongoose.model(
  "purhcaseStateChange",
  purhcaseStateChangeSchema
);
module.exports = purhcaseStateChange;
