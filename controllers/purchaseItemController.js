const Purchase = require("../models/purchaseSchema");
const { createOne, getOne, getAll, updateOne } = require("./helperController");
const Driver = require("../models/driverModel");
const catchAsync = require("../utils/catchAsync");
const purchaseItem = require("../models/purchaseItemSchema");



// add new Purchase
exports.createPurchaseItem = catchAsync(async (req, res, next) => {
  const {purchase, driversWeight, officeWeight,} = req.body;

  const purchaseId = await Purchase.findOne({ name: purchase });
  


  if (!purchaseId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `Purchase ${purchase} not found`,
      })
    );
  }

  const purchaseItem = {
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
  const { officeWeight, purchase, driversWeight } = req.body;

  const purchaseId = await purchase.findOne({ name: purchase });

  if (!purchaseId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `Purchase ${purchase} not found`,
      })
    );
  }

  const purchaseItem = {
    purchase: farmer._id,
    officeWeight,
    driversWeight
  };

  const newPurchaseItem = await purchaseItem.findByIdAndUpdate(req.params.id,purchaseItem);

  return next(
    res.status(200).json({
      status: "PurchaseItem updated!",
      data: newPurchaseItem,
    })
  );
});
