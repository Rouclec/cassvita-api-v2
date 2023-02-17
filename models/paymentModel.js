const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const paymentSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.ObjectId,
      ref: "Farmer",
      required: [true, "Select the farmer for this payment"],
    },
    amount: {
      type: Number,
      required: [true, "Please enter an amount for this payment"],
    },
    paymentMethod: {
      type: String,
    },
    totalWeight: {
      type: Number,
      default: 0,
    },
    totalBags: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Paid", "Pending", "Canceled"],
      default: "Pending",
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

paymentSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

paymentSchema.pre(/^find/, function (next) {
  this.populate({
    path: "farmer",
    select: "name _id",
  });
  next();
});

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
