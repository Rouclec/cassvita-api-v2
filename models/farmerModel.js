const mongoose = require("mongoose");
const validator = require("validator");
const uniqueValidator = require("mongoose-unique-validator");

const farmerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide the name for this farmer"],
    },
    phoneNumber: {
      type: String,
      validate: [validator.isMobilePhone, "Please enter a valid phone number"],
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["M", "F"],
    },
    farmSize: Number,
    community: {
      type: mongoose.Schema.ObjectId,
      ref: "Community",
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    profilePic: String,
    totalPay: {
      type: Number,
      default: 0,
    },
    totalWeight: {
      type: Number,
      default: 0,
    },
    amountOwed: {
      type: Number,
      default: 0,
    },
    totalBags: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    paymentMethod: String,
    monthCreated: {
      type: Date,
      default: new Date().getMonth(),
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

farmerSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

// farmerSchema.pre(/^find/, async function (next) {
//   this.populate({
//     path: "community",
//     select: "name -_id unitPrice",
//   });
//   next();
// });

const Farmer = mongoose.model("Farmer", farmerSchema);
module.exports = Farmer;
