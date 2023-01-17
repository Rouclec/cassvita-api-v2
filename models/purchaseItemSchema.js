const mongoose = require("mongoose");

const purchaseItemSchema = new mongoose.Schema({
  purchase: {
    type: mongoose.Schema.ObjectId,
    ref: "Purchase",
    required: [true, "Each purchase item must belong to a purchase"],
  },
  driversWeight: Number,
  officeWeight: Number,
});

const PurchaseItem = mongoose.model("PurchaseItem", purchaseItemSchema);
module.exports = PurchaseItem;
