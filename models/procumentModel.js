const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const PurchaseOrder = require("./purchaseOrderModel");

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

procurementSchema.post("save", function () {
  this.constructor.calculate(this.purchaseOrder);
});

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
