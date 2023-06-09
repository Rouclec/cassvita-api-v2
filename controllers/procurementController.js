const Community = require("../models/communityModel");
const Driver = require("../models/driverModel");
const Farmer = require("../models/farmerModel");
const Payment = require("../models/paymentModel");
const Procurement = require("../models/procumentModel");
const PurchaseOrder = require("../models/purchaseOrderModel");
const catchAsync = require("../utils/catchAsync");
const { getAll, getOne, search } = require("./helperController");

exports.getAllProcurements = getAll(Procurement);
exports.getProcurement = getOne(Procurement);

exports.createProcurement = catchAsync(async (req, res, next) => {
  let {
    community,
    driver,
    farmLocation,
    pricePerKilo,
    payments,
    date,
    totalWeight,
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
        message: `Purchase Order ${purchaseOrder} not found`,
      })
    );
  }

  const id = `P-${new Date().toDateString().split(" ")[2]}-${
    purchaseOrder.split("-")[1]
  }-${purchaseOrder.split("-")[2]}`;

  const procurement = {
    driver,
    purchaseOrder: purchaseOrderId._id,
    totalWeight,
    totalAmount: totalWeight * purchaseOrderId.unitPrice * 1,
    farmLocation,
    pricePerKilo: purchaseOrderId.unitPrice * 1,
    community,
    date,
    id,
    totalBags,
    createdBy: req.user._id,
  };
  const newProcurement = await Procurement.create(procurement);

  await payments.forEach(async (payment) => {
    const farmerId = await Farmer.findOne({ name: payment.farmer });
    if (!farmerId) {
      return next(
        res.status(404).json({
          status: "Not found",
          message: `Farmer ${payment.farmer} not found`,
        })
      );
    }
    let newPayment = {
      farmer: farmerId._id,
      createdBy: req.user._id,
      amount: payment.amount,
      weight: payment.weight,
      bags: payment.bags,
      paymentMethod: payment.paymentMethod,
      purchaseOrder: purchaseOrderId._id,
      procurement: newProcurement._id,
    };
    const paymentCreated = await Payment.create(newPayment);

    if (!paymentCreated) {
      return next(
        res.status(500).json({
          status: "Server Error",
          message: `Error creating payment for farmer ${payment.farmer}`,
        })
      );
    }
  });
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
        message: `Purchase Order ${purchaseOrder} not found`,
      })
    );
  }

  const id = `P-${new Date().toDateString().split(" ")[2]}-${
    purchaseOrder.split("-")[1]
  }-${purchaseOrder.split("-")[2]}`;

  const procurement = {
    driver: driverId._id,
    purchaseOrder: purchaseOrderId._id,
    totalWeight,
    totalAmount,
    farmLocation,
    pricePerKilo,
    purchases,
    id,
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

exports.generalStats = catchAsync(async (req, res, next) => {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const lastMonthStart = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const lastMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0);

  const procurements = await Payment.find({
    $and: [{ createdAt: { $gt: firstDay } }, { createdAt: { $lte: lastDay } }],
  }).distinct("procurement");

  const lastProcurements = await Payment.find({
    $and: [
      { createdAt: { $gt: lastMonthStart } },
      { createdAt: { $lte: lastMonthEnd } },
    ],
  }).distinct("procurement");

  const farmers = await Payment.find({
    $and: [{ createdAt: { $gt: firstDay } }, { createdAt: { $lte: lastDay } }],
  }).distinct("farmer");

  const lastFarmers = await Payment.find({
    $and: [
      { createdAt: { $gt: lastMonthStart } },
      { createdAt: { $lte: lastMonthEnd } },
    ],
  }).distinct("farmer");

  const communities = await Procurement.find({
    $and: [{ createdAt: { $gt: firstDay } }, { createdAt: { $lte: lastDay } }],
  }).distinct("community");

  const lastCommunities = await Procurement.find({
    $and: [
      { createdAt: { $gt: lastMonthStart } },
      { createdAt: { $lte: lastMonthEnd } },
    ],
  }).distinct("community");

  const lastPayments = await Payment.find({
    $and: [
      { createdAt: { $gt: lastMonthStart } },
      { createdAt: { $lte: lastMonthEnd } },
    ],
  });

  const payments = await Payment.aggregate([
    {
      $match: {
        $and: [
          { createdAt: { $gt: firstDay } },
          { createdAt: { $lte: lastDay } },
        ],
      },
    },
    {
      $group: {
        _id: "",
        totalAmount: { $sum: "$amount" },
        totalWeight: { $sum: "$weight" },
        total: { $sum: 1 },
      },
    },
  ]);

  const data = {
    totalAmount: payments[0]?.totalAmount || 0,
    totalWeight: payments[0]?.totalWeight || 0,
    communities: {
      count: communities?.length,
      compare:
        communities?.length > lastCommunities?.length
          ? "greater"
          : communities?.length < lastCommunities?.length
          ? "less"
          : "equal",
    },
    farmers: {
      count: farmers?.length,
      compare:
        farmers?.length > lastFarmers?.length
          ? "greater"
          : farmers?.length < lastFarmers?.length
          ? "less"
          : "equal",
    },
    procurements: {
      count: procurements?.length,
      compare:
        procurements?.length > lastProcurements?.length
          ? "greater"
          : procurements?.length < lastProcurements?.length
          ? "less"
          : "equal",
    },
    payments: {
      count: payments[0]?.total || 0,
      compare:
        (payments[0]?.total || 0) > lastPayments?.length
          ? "greater"
          : (payments[0]?.total || 0) < lastPayments?.length
          ? "less"
          : "equal",
    },
  };

  return next(
    res.status(200).json({
      status: "OK",
      data,
    })
  );
});

exports.stats = catchAsync(async (req, res, next) => {
  let firstDay = new Date(2022, 0, 1);
  let lastDay = new Date(3000, 11, 31);

  let curr = new Date(); // get current date
  let first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
  let last = first + 6; // last day is the first day + 6

  let weekStart = new Date(curr.setDate(first + 1));
  let weekEnd = new Date(curr.setDate(last + 1));

  if (req.params.startDate && req.params.endDate) {
    firstDay = new Date(req.params.startDate);
    lastDay = new Date(req.params.endDate);
  }

  let procurements = await Procurement.aggregate([
    {
      $match: {
        $and: [
          { createdAt: { $gt: firstDay } },
          { createdAt: { $lte: lastDay } },
        ],
      },
    },
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        totalAmount: { $sum: "$totalAmount" },
        totalKg: { $sum: "$totalWeight" },
        totalBags: { $sum: "$totalBags" },
      },
    },
  ]);

  const weekly = await Procurement.aggregate([
    {
      $match: {
        $and: [
          { createdAt: { $gte: weekStart } },
          { createdAt: { $lte: weekEnd } },
        ],
      },
    },
    {
      $group: {
        _id: { day: { $dayOfWeek: "$createdAt" } },
        totalAmount: { $sum: "$totalAmount" },
        totalKg: { $sum: "$totalWeight" },
        totalBags: { $sum: "$totalBags" },
      },
    },
  ]);

  res.status(200).json({
    status: "OK",
    data: {
      generalStats: procurements,
      weeklyStats: weekly,
    },
  });
});

exports.searchProcurement = search(Procurement);
