const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const purchaseStateChangeSchema = new mongoose.Schema({
  purchase: {
    type: mongoose.Schema.ObjectId,
    ref: "Purchase",
    required: [true, "Select a purchase for this change"],
  },
  state: {
    type: String,
    enum: ["New", "Pending", "Confirmed"],
    default: "New",
  },
  stateChangedAt: {
    type: Date,
    default: Date.now(),
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
});

purchaseStateChangeSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

purchaseStateChangeSchema.pre(/^find/, function (next) {
  this.populate({
    path: "purchase",
    select: "-__v -_id -farmer -driver -PurchaseOrder",
  });
  next();
});

const PurchaseStateChange = mongoose.model(
  "PurchaseStateChange",
  purchaseStateChangeSchema
);
module.exports = PurchaseStateChange;
