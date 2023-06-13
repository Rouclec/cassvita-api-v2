const Farmer = require("../models/farmerModel");
const Payment = require("../models/paymentModel");
const PurchaseOrder = require("../models/purchaseOrderModel");
const catchAsync = require("../utils/catchAsync");
const { getAll, getOne, search } = require("./helperController");

const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const aws = require("aws-sdk");
const Procurement = require("../models/procumentModel");
const { default: mongoose } = require("mongoose");
const Community = require("../models/communityModel");

const multerStorage = multer.memoryStorage();
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const uploadFile = (receiptName) => {
  return new Promise((resolve, reject) => {
    try {
      const file = fs.readFileSync(`public/img/payment-receipt/receipt.jpeg`);
      const BUCKET = process.env.AWS_BUCKET;

      const uploadParams = {
        Bucket: BUCKET,
        Key: `${receiptName}`,
        Body: file,
      };

      s3.upload(uploadParams, function (err, data) {
        if (err) {
          return reject(err);
        }
        if (data) {
          return resolve(data);
        }
      });
    } catch (error) {
      return reject(error);
    }
  });
};

const multerFilter = (req, file, cbFxn) => {
  if (file.mimetype.startsWith("image")) {
    cbFxn(null, true);
  } else {
    cbFxn("Error: Not an image! Please upload only images", false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadReceipt = upload.single("receipt");

exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  await sharp(req.file.buffer)
    .resize(500, 500) //reizes the image to 500x500
    .toFormat("jpeg") //converts the image to a jpeg format
    .jpeg({ quality: 90 }) //sets the quality to 90% of the original quality
    .toFile(`public/img/payment-receipt/receipt.jpeg`);

  res = await uploadFile(`${req.file.originalname}`);
  req.receipt = res.Location;

  next();
});

exports.getAllPayments = getAll(Payment);
exports.getPayment = getOne(Payment);

exports.getGeneralPaymentStats = catchAsync(async (req, res, next) => {
  const payments = await Payment.aggregate([
    {
      $group: {
        _id: "",
        totalPayment: { $sum: "$amount" },
        highestPayment: { $max: "$amount" },
        lowestPayment: { $min: "$amount" },
      },
    },
  ]);

  return next(
    res.status(200).json({
      status: "OK",
      data: payments,
    })
  );
});

exports.changePaymentStatus = catchAsync(async (req, res, next) => {
  const { status, id } = req.params;

  let receipt = undefined;

  if (req.receipt) {
    receipt = req.receipt;
  }

  const paymentFound = await Payment.findOne({ id: id }).select(
    "+purchaseOrderId"
  );

  if (!paymentFound) {
    return res.status(404).json({
      status: "Not found",
      message: "Payment not found",
    });
  }

  if (status === "Paid") {
    const farmerFound = await Farmer.findById(paymentFound.farmer._id);
    if (!farmerFound) {
      return res.status(404).json({
        status: "Not found",
        message: `Farmer ${farmerFound.name} doesn't exist`,
      });
    }

    await Farmer.findByIdAndUpdate(farmerFound._id, {
      totalPay: farmerFound.totalPay + paymentFound.amount,
      totalBags: farmerFound.totalBags + paymentFound.bags,
      totalWeight: farmerFound.totalWeight + paymentFound.weight,
    });
    const purchaseOrderFound = await PurchaseOrder.findById(
      paymentFound.purchaseOrder
    );
    if (!purchaseOrderFound) {
      return res.status(404).json({
        status: "Not found",
        message: `Purchase Order ${purchaseOrderFound.id} not found`,
      });
    }

    await PurchaseOrder.findByIdAndUpdate(paymentFound.purchaseOrderId, {
      totalPayments: purchaseOrderFound.totalPayments + 1,
      purchaseOrderId: null,
    });
  }

  const payment = await Payment.findByIdAndUpdate(paymentFound._id, {
    receipt,
    status,
    updatedBy: req.user._id,
    updatedOn: Date.now(),
  });

  return res.status(200).json({
    status: "OK",
    data: payment,
  });
});

exports.stats = catchAsync(async (req, res, next) => {
  let firstDay = new Date(2022, 0, 1);
  let lastDay = new Date(3000, 11, 31);
  let community = await Community.findOne({ name: req.params.community });

  if (req.params.startDate && req.params.endDate) {
    firstDay = new Date(req.params.startDate);
    lastDay = new Date(req.params.endDate);
  }

  let purchases = await Payment.aggregate([
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
        _id: "$farmer",
        totalAmount: { $sum: "$amount" },
        totalKg: { $sum: "$weight" },
        totalBags: { $sum: "$bags" },
      },
    },
  ]);
  let farmers = [];

  if (community) {
    farmers = await Farmer.find({ community: community._id.toString() });
  } else {
    farmers = await Farmer.find();
  }

  purchases.forEach(async (purchase) => {
    purchase.totalTon = (purchase.totalKg / 907.2).toFixed(2) * 1;
    purchase.farmer = farmers.find((farmer) => {
      return farmer._id.equals(purchase._id);
    });
  });

  // purchases.filter(purchase => )
  purchases = purchases.filter((purchase) => farmers.includes(purchase.farmer));

  res.status(200).json({
    status: "OK",
    data: purchases,
  });
});

exports.farmerStats = catchAsync(async (req, res, next) => {
  const { farmerId } = req.params;
  let firstDay = new Date(2022, 0, 1);
  let lastDay = new Date(3000, 11, 31);

  if (req.params.startDate && req.params.endDate) {
    firstDay = new Date(req.params.startDate);
    lastDay = new Date(req.params.endDate);
  }

  const farmerObjectId = mongoose.Types.ObjectId(farmerId);

  let purchases = await Payment.find({
    $and: [
      { createdAt: { $gt: firstDay } },
      { createdAt: { $lte: lastDay } },
      { status: { $eq: "Paid" } },
      { farmer: { $eq: farmerObjectId } },
    ],
  }).select(
    "-farmer -procurement -createdBy -month -updatedBy -updatedOn -purchaseOrder"
  );
  const farmer = await Farmer.findById(farmerId);

  let data = {
    farmer: {
      name: farmer?.name,
      dateOfBirth: farmer?.dateOfBirth,
      gender: farmer?.gender,
      community: farmer?.community?.name,
      createdAt: farmer?.createdAt,
    },
    purchases: purchases,
  };
  res.status(200).json({
    status: "OK",
    data,
  });
});

exports.searchPayment = search(Payment);
