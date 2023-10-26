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
    recent: {
      type: Boolean,
      default: true,
    },
    removed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
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

purchaseOrderSchema.pre(/^find/, async function (next) {
  this.populate({
    path: "createdBy",
    select: "fullName -_id",
  });
  next();
});

purchaseOrderSchema.post(/^find/, function (docs) {
  const today = new Date(Date.now());
  if (docs && docs.length) {
    docs.forEach(async (doc) => {
      if (doc.endDate < today && doc.status === "open") {
        await PurchaseOrder.findByIdAndUpdate(
          doc._id,
          { status: "closed" },
          { new: true }
        );
      }
    });
  }
});

purchaseOrderSchema.post("save", async function () {
  const recent = await PurchaseOrder.findOne({ recent: true });

  if (!!recent) {
    await PurchaseOrder.findByIdAndUpdate(
      recent._id,
      { recent: false },
      { new: true }
    );
  }
});

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
module.exports = PurchaseOrder;
