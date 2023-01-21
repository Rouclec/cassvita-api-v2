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
  unitPrice: Number,
});

communitySchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

const Community = mongoose.model("Community", communitySchema);
module.exports = Community;