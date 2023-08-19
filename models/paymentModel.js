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
    createdAt: {
      type: Date,
      default: Date.now(),
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

paymentSchema.statics.subtractAmountOwed = async function (farmer, amount) {
  const farmerFound = await Farmer.findById(farmer);
  await Farmer.findByIdAndUpdate(farmer, {
    amountOwed: farmerFound.amountOwed - amount,
  });
};

paymentSchema.statics.closeProcurement = async function (procurementId) {
  const procurementFound = await Procurement.findById(procurementId);
  const paymentsFound = await Payment.find({ procurement: procurementId });

  let paidFully = true;

  paymentsFound.forEach((payment) => {
    if (payment.status === "Pending") paidFully = false;
  });

  if (paidFully === true)
    await Procurement.findByIdAndUpdate(procurementId, { status: "closed" });
};

paymentSchema.post("save", async function () {
  await this.constructor.addAmountOwed(this.farmer, this.amount);
});

paymentSchema.post("findOneAndUpdate", async function (doc) {
  await doc.constructor.subtractAmountOwed(doc.farmer, doc.amount);
  await doc.constructor.closeProcurement(doc.procurement);
});

paymentSchema.pre(/^save/, function (next) {
  this.id = `PA-${uuidv4().slice(0, 5)}`;
  next();
});

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
