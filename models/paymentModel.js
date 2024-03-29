const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { v4: uuidv4 } = require("uuid");
const Farmer = require("./farmerModel");
const Procurement = require("./procumentModel");

const paymentSchema = new mongoose.Schema(
  {
    id: String,
    farmer: {
      type: mongoose.Schema.ObjectId,
      ref: "Farmer",
      required: [true, "Select the farmer for this payment"],
    },
    amount: {
      type: Number,
      required: [true, "Please enter an amount for this payment"],
    },
    paymentMethod: {
      type: String,
    },
    procurement: {
      type: mongoose.Schema.ObjectId,
      ref: "Procurement",
    },
    weight: {
      type: Number,
      default: 0,
    },
    bags: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Paid", "Pending", "Canceled"],
      default: "Pending",
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    month: {
      type: String,
      default: `${new Date().getMonth()}:${new Date().getFullYear()}`,
    },
    updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    purchaseOrder: {
      type: mongoose.Schema.ObjectId,
      ref: "PurchaseOrder",
    },
    removed: {
      type: Boolean,
      default: false,
    },
    updatedOn: Date,
    receipt: String,
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

paymentSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

paymentSchema.index({ "$**": "text" });

paymentSchema.pre(/^find/, function (next) {
  this.populate({
    path: "farmer",
  });
  next();
});

paymentSchema.statics.addAmountOwed = async function (farmer, amount) {
  const farmerFound = await Farmer.findById(farmer);
  await Farmer.findByIdAndUpdate(farmer, {
    amountOwed: farmerFound.amountOwed + amount,
  });
};


paymentSchema.post("save", async function () {
  await this.constructor.addAmountOwed(this.farmer, this.amount);
});


paymentSchema.pre(/^save/, function (next) {
  this.id = `PA-${uuidv4().slice(0, 5)}`;
  next();
});

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
