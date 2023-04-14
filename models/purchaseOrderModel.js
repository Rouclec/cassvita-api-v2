const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const uniqueValidator = require("mongoose-unique-validator");

const purchaseOrderSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    quantity: {
      type: Number,
      required: [true, "Please enter the size for this purchase order"],
    },
    amount: Number,
    status: {
      type: String,
      enum: ["open", "closed", "draft"],
      default: "open",
    },
    unitPrice: {
      type: Number,
      required: [true, "Please provide a unit price for this P.O."],
    },
    startDate: Date,
    endDate: Date,
    bdc: String,
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    totalProcurements: {
      type: Number,
      default: 0,
    },
    totalPayments: {
      type: Number,
      default: 0,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

purchaseOrderSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

purchaseOrderSchema.virtual("months").get(function () {
  return Array.from(
    { length: this.endDate.getMonth() - this.startDate.getMonth() + 1 },
    (value, index) => this.startDate.getMonth() + index
  );
});
purchaseOrderSchema.pre("save", async function (next) {
  const activePOs = await PurchaseOrder.find({ status: "open" });
  if (activePOs) {
    activePOs.forEach(async (po) => {
      await PurchaseOrder.findByIdAndUpdate(po._id, { status: "closed" });
    });
  }
  next();
});
purchaseOrderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "createdBy",
    select: "fullName -_id",
  });
  let today = new Date(Date.now());
  if (this.endDate < today) this.status = "closed";
  next();
});
const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
module.exports = PurchaseOrder;
