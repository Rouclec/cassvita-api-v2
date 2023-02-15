const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const Farmer = require("./farmerModel");

const purchaseSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.ObjectId,
      ref: "Farmer",
      required: [true, "Select the farmer for this purchase"],
    },
    driver: {
      type: mongoose.Schema.ObjectId,
      ref: "Driver",
      required: [true, "Please select the driver for this purchase"],
    },
    unitPrice: {
      type: Number,
      required: [true, "Please select the unit price for this purchase"],
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    totalWeight: {
      type: Number,
      default: 0,
    },
    purchaseOrder: {
      type: mongoose.Schema.ObjectId,
      ref: "PurchaseOrder",
      required: [true, "Each purchase must belong to a PurchaseOrder"],
    },
    state: {
      type: String,
      enum: ["New", "Paid", "Confirmed"],
      default: "New",
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    month: {
      type: Number,
      default: new Date().getMonth(),
    },
    year: {
      type: Number,
      default: new Date().getFullYear(),
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

purchaseSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

purchaseSchema.pre(/^find/, function (next) {
  this.populate({
    path: "farmer",
    select: "-__v",
  })
    .populate({
      path: "driver",
      select: "-__v",
    })
    .populate({
      path: "purchaseOrder",
      select: "-__v",
    });
  next();
});

purchaseSchema.statics.calculateFarmerTotal = async function (farmerId) {
  const stats = await this.aggregate([
    {
      $match: { farmer: farmerId },
    },
    {
      $group: {
        _id: "$farmer", //group all purchases with thesame,
        totalPay: { $sum: "$totalAmount" }, //add 1 for each review document which matches
        totalWeight: { $sum: "$totalWeight" }, //get the average rating of all the docs that match
      },
    },
  ]);
  if (stats.length > 0) {
    await Farmer.findByIdAndUpdate(farmerId, {
      totalPay: stats[0].totalPay,
      totalWeight: stats[0].totalWeight,
    });
  }
};

purchaseSchema.post("save", function () {
  this.constructor.calculateFarmerTotal(this.farmer);
});

const Purchase = mongoose.model("Purchase", purchaseSchema);
module.exports = Purchase;
