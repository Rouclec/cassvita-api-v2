const mongoose = require("mongoose");
const validator = require("validator");
const uniqueValidator = require("mongoose-unique-validator");
const Community = require("./communityModel");

const farmerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide the name for this farmer"],
    },
    phoneNumber: {
      type: String,
      // validate: [validator.isMobilePhone, "Please enter a valid phone number"],
    },
    dateOfBirth: {
      type: Date,
      validate: [validator.isDate, "Invalid date, please enter a correct date"],
    },
    gender: {
      type: String,
      enum: ["M", "F"],
    },
    farmSize: Number,
    numberOfFarms: {
      type: Number,
      default: 1,
    },
    averageInvestment: {
      type: String,
    },
    community: {
      type: mongoose.Schema.ObjectId,
      ref: "Community",
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    profilePic: String,
    totalPay: {
      type: Number,
      default: 0,
    },
    totalWeight: {
      type: Number,
      default: 0,
    },
    amountOwed: {
      type: Number,
      default: 0,
    },
    totalBags: {
      type: Number,
      default: 0,
    },
    preferedPaymentMethod: String,
    monthCreated: {
      type: Date,
      default: new Date().getMonth(),
    },
    active: {
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

farmerSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

farmerSchema.index({ "$**": "text" });

farmerSchema.pre(/^find/, async function (next) {
  this.populate({
    path: "community",
  });
  next();
});

farmerSchema.statics.addNumberOfFarmers = async (community) => {
  const communityFound = await Community.findById(community);
  if (!communityFound) {
    console.log("Error: community ", community, " not found!");
  }
  await Community.findByIdAndUpdate(community, {
    numberOfFarmers: communityFound.numberOfFarmers + 1,
  });
};

farmerSchema.post("save", async function (doc) {
  if (doc.community) {
    await doc.constructor.addNumberOfFarmers(doc.community);
  }
});

const Farmer = mongoose.model("Farmer", farmerSchema);
module.exports = Farmer;
