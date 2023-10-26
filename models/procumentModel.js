const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const PurchaseOrder = require("./purchaseOrderModel");
const { v4: uuidv4 } = require("uuid");

const procurementSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
    },
    purchaseOrder: {
      type: mongoose.Schema.ObjectId,
      ref: "PurchaseOrder",
    },
    community: String,
    driver: String,
    date: Date,
    farmLocation: {
      type: String,
    },
    pricePerKilo: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["open", "closed", "expired"],
      default: "open",
    },
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

procurementSchema.virtual("payments", {
  ref: "Payment",
  foreignField: "procurement",
  localField: "_id",
});

procurementSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

procurementSchema.index({ "$**": "text" });

//Static middle ware to calculate payments and procurements for a certain PO
procurementSchema.statics.calculate = async function (purchaseOrderId) {
  const stats = await this.aggregate([
    {
      $match: { purchaseOrder: purchaseOrderId },
    },
    {
      $group: {
        _id: "$purchaseOrder", //group all procurements with thesame purchase order,
        totalProcurements: { $sum: 1 }, //add 1 for each procurement document which matches
        // totalWeight: { $sum: "$totalWeight" }, //
      },
    },
  ]);
  if (stats.length > 0) {
    await PurchaseOrder.findByIdAndUpdate(purchaseOrderId, {
      totalProcurements: stats[0].totalProcurements,
    });
  }
};

procurementSchema.post("save", async function () {
  this.constructor.calculate(this.purchaseOrder);
});

// procurementSchema.post(/^findOne/, async function (doc) {
//   if (doc.status === "open") {
//     let status = "open";
//     let completed = doc.purchases.every(
//       (purchase) => purchase.state === "Paid"
//     );

//     console.log("completed: ", completed);
//     // if (completed)
//     doc.status = "closed";
//     this.update(doc);
//   }
// });

procurementSchema.pre(/^find/, function (next) {
  this.populate({
    path: "driver",
    select: "name",
  })
    .populate({
      path: "community",
    })
    .populate("payments")
    .populate("purchaseOrder");
  next();
});

const Procurement = mongoose.model("Procurement", procurementSchema);
module.exports = Procurement;
