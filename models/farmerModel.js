const mongoose = require("mongoose");
const validator = require("validator");

const farmerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide the name for this farmer"],
  },
  phoneNumber: {
    type: String,
    validate: [validator.isMobilePhone, "Please enter a valid phone number"],
  },
  dateOfBirth: Date,
  community: {
    type: mongoose.Schema.ObjectId,
    ref: "Community",
  },
});

const Farmer = mongoose.model("Farmer", farmerSchema);
module.exports = Farmer;
