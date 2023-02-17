const mongoose = require("mongoose");
const { uuid } = require("uuidv4");
const uniqueValidator = require("mongoose-unique-validator");

const purchaseOrderSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    quantity: {
      type: Number,
      required: [true, "Please enter the size for this purchase order"],
      select: false,
    },
    amount: {
      type: Number,
      required: [true, "Please enter the size for this purchase order"],
      select: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      select: false,
    },
    startDate: Date,
    endDate: Date,
    bdc: {
      filename: String,
      data: { type: Buffer, contentType: String },
      select: false,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      select: false,
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
  const activePOs = await PurchaseOrder.find({ status: "active" });
  if (activePOs) {
    activePOs.forEach(async (po) => {
      await PurchaseOrder.findByIdAndUpdate(po._id, { status: "inactive" });
    });
  }
  this.id = `PO-${uuid().slice(0, 5)}`;
  next();
});
purchaseOrderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "createdBy",
    select: "fullName -_id",
  });
  next();
});
const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
module.exports = PurchaseOrder;
