const mongoose = require("mongoose");
const validator = require("validator");
const uniqueValidator = require("mongoose-unique-validator");

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide the name for this driver"],
  },
  phoneNumber: {
    type: String,
    validate: [validator.isMobilePhone, "Please enter a valid phone number"],
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  removed: {
    type: Boolean,
    default: false,
  },
});

driverSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

const Driver = mongoose.model("Driver", driverSchema);
module.exports = Driver;
