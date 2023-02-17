const Purchase = require("../models/purchaseModel");
const { createOne, getOne, getAll, updateOne } = require("./helperController");
const Farmer = require("../models/farmerModel");
const Driver = require("../models/driverModel");
const PurchaseOrder = require("../models/purchaseOrderModel");
const catchAsync = require("../utils/catchAsync");
const Payment = require("../models/paymentModel");

// add new Purchase
exports.createPurchase = catchAsync(async (req, res, next) => {
  let {
    driver,
    totalWeight,
    totalAmount,
    purchaseOrder,
    farmer,
    totalBags,
    paymentMethod,
  } = req.body;

  const farmerId = await Farmer.findOne({ name: farmer });
  const driverId = await Driver.findOne({ name: driver });
  const purchaseOrderId = await PurchaseOrder.findOne({ id: purchaseOrder });

  if (!farmerId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `Farmer ${farmer} not found`,
      })
    );
  }
  if (farmerId.community) {
    unitPrice = farmerId.community.unitPrice;
  }
  if (!driverId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `Driver ${driver} not found`,
      })
    );
  }
  if (!purchaseOrderId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `PurchaseOrder ${PurchaseOrder} not found`,
      })
    );
  }

  const payment = {
    farmer: farmerId._id,
    createdBy: req.user._id,
    amount: totalAmount,
    totalWeight,
    totalBags,
    paymentMethod,
    purchaseOrderId: purchaseOrderId._id,
  };

  const purchase = {
    driver: driverId._id,
    purchaseOrder: purchaseOrderId._id,
    farmer: farmerId._id,
    totalWeight,
    totalBags,
    paymentMethod,
    totalAmount,
    unitPrice,
    createdBy: req.user._id,
  };

  await Payment.create(payment);
  const newPurchase = await Purchase.create(purchase);

  return next(
    res.status(201).json({
      status: "OK",
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
    totalAmount,
    totalBags,
    paymentMethod,
  };

  const newPurchase = await Purchase.findByIdAndUpdate(req.params.id, purchase);

  return next(
    res.status(200).json({
      status: "OK",
      data: newPurchase,
    })
  );
});

exports.stats = catchAsync(async (req, res, next) => {
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const stats = await Purchase.aggregate([
    {
      $match: {
        $and: [{ month: { $eq: thisMonth } }, { year: { $eq: thisYear } }],
      },
    },
    {
      $group: {
        _id: "",
        totalCassavaPurchase: { $sum: "$totalWeight" },
        totalAmount: { $sum: "$totalAmount" },
        numberOfPurchases: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    status: "OK",
    data: stats,
  });
});
