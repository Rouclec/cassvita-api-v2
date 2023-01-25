const mongoose = require("mongoose");
const validator = require("validator");
const uniqueValidator = require("mongoose-unique-validator");

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
  sex: {
    type: String
  },
  farmSize: Number,
  community: {
    type: mongoose.Schema.ObjectId,
    ref: "Community",
  },
});

farmerSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

farmerSchema.pre(/^find/, function (next) {
  this.populate({
    path: "community",
    select: "-__v -_id",
  });
  next();
});

const Farmer = mongoose.model("Farmer", farmerSchema);
module.exports = Farmer;
