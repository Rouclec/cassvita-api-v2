const mongoose = require("mongoose");
const { uuid } = require("uuidv4");
const uniqueValidator = require("mongoose-unique-validator");

const purchaseOrderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a title for this purchase order"],
  },
  id: { type: String, unique: true },
  quantity: {
    type: Number,
    required: [true, "Please enter the size for this purchase order"],
  },
  amount: {
    type: Number,
    required: [true, "Please enter the size for this purchase order"],
  },
  bdc: {
    filename: String,
    data: { type: Buffer, contentType: String },
  },
});

purchaseOrderSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

purchaseOrderSchema.pre("save", function (next) {
  this.id = uuid().slice(0, 7);
  next();
});
const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
module.exports = PurchaseOrder;
