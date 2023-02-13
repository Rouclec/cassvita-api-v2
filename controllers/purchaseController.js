const Purchase = require("../models/purchaseModel");
const { createOne, getOne, getAll, updateOne } = require("./helperController");
const Farmer = require("../models/farmerModel");
const Driver = require("../models/driverModel");
const PurchaseOrder = require("../models/purchaseOrderModel");
const catchAsync = require("../utils/catchAsync");



// add new Purchase
exports.createPurchase = catchAsync(async (req, res, next) => {
  const { driver, totalWeight, totalAmount, PurchaseOrder, farmer } = req.body;

  const farmerId = await Farmer.findOne({ name: farmer });
  const driverId = await Driver.findOne({ name: driver });
  const PurchaseOrderId = await PurchaseOrder.findOne({ id: PurchaseOrder });


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
  if (!PurchaseOrderId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `PurchaseOrder ${PurchaseOrder} not found`,
      })
    );
  }

  const purchase = {
    driver: driverId._id,
    PurchaseOrder: PurchaseOrderId._id,
    farmer: farmerId._id,
    totalWeight,
    totalAmount,
    unitPrice: farmerId.community.unitPrice,
    createdBy: req.user._id,
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
  const { driver, totalWeight, totalAmount, PurchaseOrder, farmer } = req.body;

  const farmerId = await Farmer.findOne({ name: farmer });
  const driverId = await Driver.findOne({ name: driver });
  const PurchaseOrderId = await PurchaseOrder.findOne({ name: PurchaseOrder });


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
  if (!PurchaseOrderId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `PurchaseOrder ${PurchaseOrder} not found`,
      })
    );
  }

  const purchase = {
    driver: driver._id,
    PurchaseOrder: PurchaseOrder._id,
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