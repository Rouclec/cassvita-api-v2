const mongoose = require("mongoose");
const validator = require("validator");

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide the name for this driver"],
  },
  phoneNumber: {
    type: String,
    validate: [validator.isMobilePhone, "Please enter a valid phone number"],
  },
});

const Driver = mongoose.model("Driver", driverSchema);
module.exports = Driver;
