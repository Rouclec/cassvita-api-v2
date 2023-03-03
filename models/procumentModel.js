const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const PurchaseOrder = require("./purchaseOrderModel");
const { v4: uuidv4 } = require("uuid");

const procurementSchema = new mongoose.Schema({
  id: String,
  purchaseOrder: String,
  community: String,
  driver: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  date: Date,
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
    const poFound = await PurchaseOrder.findOne({ id: purchaseOrderId });
    await PurchaseOrder.findByIdAndUpdate(poFound._id, {
      totalProcurements: stats[0].totalProcurements,
    });
  }
};

procurementSchema.pre("save", async function (next) {
  this.id = `P-${uuidv4().slice(0, 3)}`;
  next();
});

procurementSchema.post("save", function () {
  this.constructor.calculate(this.purchaseOrder);
});

procurementSchema.post(/^findOne/, async function (doc) {
  console.log("this document: ", this);
  if (doc.status === "open") {
    let status = "open";
    let completed = doc.purchases.every(
      (purchase) => purchase.state === "Paid"
    );

    console.log("completed: ", completed);
    // if (completed)
    doc.status = "closed";
    this.update(doc);
  }
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
