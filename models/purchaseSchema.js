const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.ObjectId,
    ref: "Farmer",
    required: [true, "Select the farmer for this purchase"],
  },
  driver: {
    type: mongoose.Schema.ObjectId,
    ref: "Driver",
    required: [true, "Please select the driver for this purchase"],
  },
  unitPrice: {
    type: Number,
    required: [true, "Please select the unit price for this purchase"],
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  totalWeight: {
    type: Number,
    default: 0,
  },
  bdc: {
    type: mongoose.Schema.ObjectId,
    ref: "BDC",
    required: [true, "Each purchase must belong to a BDC"],
  },
  state: {
    type: String,
    enum: ["New", "Paid", "Confirmed"],
    default: "New",
  },
});

purchaseSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

const Purchase = mongoose.model("Purchase", purchaseSchema);
module.exports = Purchase;
