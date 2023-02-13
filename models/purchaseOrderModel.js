const mongoose = require("mongoose");
const { uuid } = require("uuidv4");
const uniqueValidator = require("mongoose-unique-validator");

const purchaseOrderSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  quantity: {
    type: Number,
    required: [true, "Please enter the size for this purchase order"],
  },
  amount: {
    type: Number,
    required: [true, "Please enter the size for this purchase order"],
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  startDate: Date,
  endDate: Date,
  bdc: {
    filename: String,
    data: { type: Buffer, contentType: String },
  },
});

purchaseOrderSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

purchaseOrderSchema.pre("save", async function (next) {
  const activePOs = await PurchaseOrder.find({ status: "active" });
  if (activePOs) {
    activePOs.forEach(async (po) => {
      await PurchaseOrder.findByIdAndUpdate(po._id, { status: "inactive" });
    });
  }
  this.id = `PO-${uuid().slice(0, 5)}`;
  next();
});
const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
module.exports = PurchaseOrder;
