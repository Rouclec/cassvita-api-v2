const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const purchaseItemSchema = new mongoose.Schema({
  purchase: {
    type: mongoose.Schema.ObjectId,
    ref: "Purchase",
    required: [true, "Each purchase item must belong to a purchase"],
  },
  driversWeight: Number,
  officeWeight: Number,
});

purchaseItemSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

purchaseItemSchema.pre(/^find/, function (next) {
  this.populate({
    path: "purchase",
    select: "-__v -_id -farmer -driver -bdc",
  });
  next();
});

const PurchaseItem = mongoose.model("PurchaseItem", purchaseItemSchema);
module.exports = PurchaseItem;
