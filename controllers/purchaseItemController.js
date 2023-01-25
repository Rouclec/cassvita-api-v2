const Purchase = require("../models/purchaseSchema");
const { createOne, getOne, getAll, updateOne } = require("./helperController");
const Driver = require("../models/driverModel");
const catchAsync = require("../utils/catchAsync");
const purchaseItem = require("../models/purchaseItemSchema");



// add new Purchase
exports.createPurchaseItem = catchAsync(async (req, res, next) => {
  const {purchase, driversWeight, officeWeight,} = req.body;

  const purchaseId = await Purchase.findOne({ name: purchase });
  const driverId = await Driver.findOne({ name: driver });
  


  if (!purchaseId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `Purchase ${purchase} not found`,
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

  const purchaseItem = {
    driver: driverId._id,
    purchase: purchaseId._id,
    officeWeight,
    driversWeight,
  };

  const newPurchaseItem = await purchaseItem.create(purchaseItem);

  return next(
    res.status(201).json({
      status: "PurchaseItem Created!",
      data: newPurchaseItem,
    })
  );
});
exports.getAllPurchaseItem = getAll(purchaseItem);
exports.getPurchaseItem = getOne(Item);
exports.updatePurchaseItem = catchAsync(async (req, res, next) => {
  const { driver, officeWeight, purchase } = req.body;

  const purchaseId = await purchase.findOne({ name: purchase });
  const driverId = await Driver.findOne({ name: driver });


  if (!purchaseId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `Purchase ${purchase} not found`,
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

  const purchaseItem = {
    driver: driver._id,
    purchase: farmer._id,
    officeWeight,
  };

  const newPurchaseItem = await purchaseItem.findByIdAndUpdate(req.params.id,purchaseItem);

  return next(
    res.status(200).json({
      status: "PurchaseItem updated!",
      data: newPurchaseItem,
    })
  );
});