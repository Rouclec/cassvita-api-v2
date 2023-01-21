const Purchase = require("../models/purchaseSchema");
const { createOne, getOne, getAll, updateOne } = require("./helperController");
const Farmer = require("../models/farmerModel");
const Driver = require("../models/driverModel");
const BDC = require("../models/bdcModel");
const catchAsync = require("../utils/catchAsync");



// add new Purchase
exports.createPurchase = catchAsync(async (req, res, next) => {
  const { driver, totalWeight, totalAmount, bdc, farmer } = req.body;

  const farmerId = await Farmer.findOne({ name: farmer });
  const driverId = await Driver.findOne({ name: driver });
  const bdcId = await BDC.findOne({ id: bdc });


  if (!farmerId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `Farmer ${farmer} not found`,
      })
    );
  }
  if (!driverId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `Driver ${driver} not found`,
      })
    );
  }
  if (!bdcId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `BDC ${bdc} not found`,
      })
    );
  }

  const purchase = {
    driver: driverId._id,
    bdc: bdcId._id,
    farmer: farmerId._id,
    totalWeight,
    totalAmount,
    unitPrice: farmerId.community.unitPrice
  };

  const newPurchase = await Purchase.create(purchase);

  return next(
    res.status(201).json({
      status: "Purchase Created!",
      data: newPurchase,
    })
  );
});
exports.getAllPurchase = getAll(Purchase);
exports.getPurchase = getOne(Purchase);
exports.updatePurchase = catchAsync(async (req, res, next) => {
  const { driver, totalWeight, totalAmount, bdc, farmer } = req.body;

  const farmerId = await Farmer.findOne({ name: farmer });
  const driverId = await Driver.findOne({ name: driver });
  const bdcId = await BDC.findOne({ name: bdc });


  if (!farmerId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `Farmer ${farmer} not found`,
      })
    );
  }
  if (!driverId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `Driver ${driver} not found`,
      })
    );
  }
  if (!bdcId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `BDC ${bdc} not found`,
      })
    );
  }

  const purchase = {
    driver: driver._id,
    bdc: bdc._id,
    farmer: farmer._id,
    totalWeight,
    totalAmount
  };

  const newPurchase = await Purchase.findByIdAndUpdate(req.params.id,purchase);

  return next(
    res.status(200).json({
      status: "Purchase updated!",
      data: newPurchase,
    })
  );
});