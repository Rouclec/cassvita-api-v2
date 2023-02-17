const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const procurementSchema = new mongoose.Schema({
  purchaseOrder: {
    type: mongoose.Schema.ObjectId,
    ref: "PurchaseOrder",
  },
  community: {
    type: mongoose.Schema.ObjectId,
    ref: "Community",
  },
  driver: {
    type: mongoose.Schema.ObjectId,
    ref: "Driver",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  farmLocation: {
    type: String,
  },
  pricePerKilo: {
    type: Number,
  },
  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open",
  },
  purchases: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Purchase",
    },
  ],
  totalWeight: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  totalBags: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
});

procurementSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

procurementSchema.pre(/^find/, function (next) {
  this.populate({
    path: "driver",
    select: "name",
  })
    .populate({
      path: "purchases",
    })
    .populate({
      path: "community",
    });
  next();
});

const Procurement = mongoose.model("Procument", procurementSchema);
module.exports = Procurement;
