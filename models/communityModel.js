const mongoose = require("mongoose");
const validator = require("validator");
const uniqueValidator = require("mongoose-unique-validator");

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide the name of this community"],
    unique: true,
  },
  location: {
    type: String,
    required: [true, "Enter the location of this community"],
    unique: true,
  },
  cassavaSpecies: {
    type: String,
  },
  communityHead: {
    name: {
      type: String,
      required: [true, "Enter the name of the community head"],
    },
    phoneNumber: {
      type: String,
      validate: [validator.isMobilePhone, "Please enter a valid phone number"],
    },
  },
  numberOfFarmers: {
    type: Number, 
    default: 0
  },
  unitPrice: Number,
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
});

communitySchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

const Community = mongoose.model("Community", communitySchema);
module.exports = Community;
