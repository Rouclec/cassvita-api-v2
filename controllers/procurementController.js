const Community = require("../models/communityModel");
const Driver = require("../models/driverModel");
const Procurement = require("../models/procumentModel");
const PurchaseOrder = require("../models/purchaseOrderModel");
const catchAsync = require("../utils/catchAsync");
const { getAll, getOne } = require("./helperController");

exports.getAllProcurements = getAll(Procurement);
exports.getProcurement = getOne(Procurement);

exports.createProcurement = catchAsync(async (req, res, next) => {
  let {
    community,
    driver,
    farmLocation,
    pricePerKilo,
    purchases,
    date,
    totalWeight,
    totalBags,
    purchaseOrder,
  } = req.body;

  const driverId = await Driver.findOne({ name: driver });
  const purchaseOrderId = await PurchaseOrder.findOne({id: purchaseOrder});
  if (community) {
    const communityId = await Community.findOne({ name: community });
    if (!communityId) {
      return next(
        res.status(404).json({
          status: "Not found",
          message: `Community ${community} not found`,
        })
      );
    }
    farmLocation = communityId.location;
    pricePerKilo = communityId.unitPrice;
  }

  if (!driverId) {
    return next(
      res.status(404).json({
        status: "Not found",
        message: `Driver ${driver} not found`,
      })
    );
  }
  if (!purchaseOrderId) {
    return next(
      res.status(404).json({
        status: "Not found",
        message: `PurchaseOrder ${PurchaseOrder} not found`,
      })
    );
  }
  const procurement = {
    driver,
    purchaseOrder,
    totalWeight,
    totalAmount: totalWeight * pricePerKilo * 1,
    farmLocation,
    pricePerKilo,
    community,
    purchases,
    date,
    totalBags,
    createdBy: req.user._id,
  };
  const newProcurement = await Procurement.create(procurement);
  return next(
    res.status(201).json({
      status: "OK",
      data: newProcurement,
    })
  );
});

exports.updateProcurement = catchAsync(async (req, res, next) => {
  const procurementFound = await Procurement.findOne({
    status: "open",
    _id: req.params.id,
  });
  if (!procurementFound) {
    return next(
      res.status(404).json({
        status: "Not found",
        message: "Something went wrong",
      })
    );
  }

  let {
    community,
    driver,
    farmLocation,
    pricePerKilo,
    purchases,
    date,
    totalWeight,
    totalAmount,
    totalBags,
    purchaseOrder,
  } = req.body;

  const driverId = await Driver.findOne({ name: driver });
  const purchaseOrderId = await PurchaseOrder.findOne({ id: purchaseOrder });
  if (community) {
    const communityId = await Community.findOne({ name: community });
    if (!communityId) {
      return next(
        res.status(404).json({
          status: "Not found",
          message: `Community ${community} not found`,
        })
      );
    }
    farmLocation = communityId.location;
    pricePerKilo = communityId.unitPrice;
  }

  if (!driverId) {
    return next(
      res.status(404).json({
        status: "Not found",
        message: `Driver ${driver} not found`,
      })
    );
  }
  if (!purchaseOrderId) {
    return next(
      res.status(404).json({
        status: "Not found",
        message: `PurchaseOrder ${PurchaseOrder} not found`,
      })
    );
  }

  const procurement = {
    driver: driverId._id,
    purchaseOrder: purchaseOrderId._id,
    totalWeight,
    totalAmount,
    farmLocation,
    pricePerKilo,
    purchases,
    date,
    totalBags,
  };
  const newProcurement = await Procurement.findByIdAndUpdate(
    req.params.id,
    procurement
  );
  return next(
    res.status(201).json({
      status: "OK",
      data: newProcurement,
    })
  );
});

exports.closeProcurement = catchAsync(async (req, res, next) => {
  const procurementFound = await Procurement.findOne({
    status: "open",
    _id: req.params.id,
  });
  if (!procurementFound) {
    return next(
      res.status(404).json({
        status: "Not found",
        message: "Something went wrong",
      })
    );
  }

  const procurement = await Procurement.findByIdAndUpdate(req.params.id, {
    status: "closed",
  });

  return next(
    res.status(200).json({
      status: "OK",
      data: procurement,
    })
  );
});
