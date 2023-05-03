const PurchaseOrder = require("../models/purchaseOrderModel");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const aws = require("aws-sdk");

const { getAll, getOne } = require("./helperController");
const catchAsync = require("../utils/catchAsync");
const Payment = require("../models/paymentModel");
const { default: mongoose } = require("mongoose");
const Procurement = require("../models/procumentModel");

const multerStorage = multer.memoryStorage();
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const uploadFile = (bdcName) => {
  return new Promise((resolve, reject) => {
    try {
      const file = fs.readFileSync(`public/img/bdc/bdc.jpeg`);
      const BUCKET = process.env.AWS_BUCKET;

      const uploadParams = {
        Bucket: BUCKET,
        Key: `${bdcName}`,
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

exports.uploadBdc = upload.single("bdc");

exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  await sharp(req.file.buffer)
    .resize(500, 500) //reizes the image to 500x500
    .toFormat("jpeg") //converts the image to a jpeg format
    .jpeg({ quality: 90 }) //sets the quality to 90% of the original quality
    .toFile(`public/img/bdc/bdc.jpeg`);

  res = await uploadFile(`${req.file.originalname}`);
  req.bdc = res.Location;

  next();
});

exports.getAllPurchaseOrder = getAll(PurchaseOrder);
exports.getPurchaseOrder = getOne(PurchaseOrder);

exports.createPurchaseOrder = catchAsync(async (req, res, next) => {
  let bdc;
  const { quantity, amount, startDate, endDate, unitPrice } = req.body;

  const date = new Date().toDateString().split(" ");

  const id = `PO-${date[1]}-${date[3].slice(-2)}`;

  const existingPo = await PurchaseOrder.find({ id: id });

  if (existingPo.length > 0) {
    return next(
      res.status(500).json({
        status: "Bad request",
        message: "An open purchase order already exists for this month",
      })
    );
  }

  if (req.bdc) {
    bdc = req.bdc;
  } else {
    bdc = undefined;
  }

  const purchaseOrder = await PurchaseOrder.create({
    id,
    quantity: quantity * 1,
    amount: quantity * 1 * (unitPrice * 1),
    unitPrice: unitPrice * 1,
    startDate,
    endDate,
    bdc: bdc,
    createdBy: req.user._id,
  });

  next(
    res.status(201).json({
      status: "OK",
      data: purchaseOrder,
    })
  );
});

//Update PurchaseOrder
exports.updatePurchaseOrder = catchAsync(async (req, res, next) => {
  let bdc;
  const { quantity, amount, startDate, endDate, unitPrice } = req.body;

  if (req.bdc) {
    bdc = req.bdc;
  } else {
    bdc = undefined;
  }

  const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(req.params.id, {
    quantity: quantity * 1,
    amount: quantity * 1 * (unitPrice * 1),
    unitPrice: unitPrice * 1,
    startDate,
    endDate,
    bdc,
  });

  next(
    res.status(200).json({
      status: "OK",
      data: purchaseOrder,
    })
  );
});

exports.closePurchaseOrder = catchAsync(async (req, res, next) => {
  const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(req.params.id, {
    status: "closed",
  });

  next(
    res.status(200).json({
      status: "OK",
      data: purchaseOrder,
    })
  );
});

exports.purchaseOrderStats = catchAsync(async (req, res, next) => {
  let currentPO = await PurchaseOrder.findOne({ status: "open" });
  const poObjectId = mongoose.Types.ObjectId(currentPO?._id);
  let amountPercentage = 0;
  let weightPercentage = 0;
  const today = new Date();

  const procurements = await Procurement.aggregate([
    {
      $match: { purchaseOrder: { $eq: poObjectId } },
    },
    {
      $group: {
        _id: "",
        totalAmount: { $sum: "$totalAmount" },
        totalWeight: { $sum: "$totalWeight" },
      },
    },
  ]);
  const daysLeft = Math.round((new Date(currentPO?.endDate) - today) / (1000 * 60 * 60 * 24));


  if (procurements[0].totalAmount) {
    amountPercentage = (
      (procurements[0].totalAmount * 100) /
      currentPO?.amount
    ).toFixed(2);
  }
  if (procurements[0].totalWeight) {
    weightPercentage = (
      (procurements[0].totalWeight * 100) /
      currentPO?.quantity
    ).toFixed(2);
  }

  let data = {
    poId: currentPO?.id,
    weight: currentPO?.quantity,
    weightPercentage: weightPercentage * 1,
    amount: currentPO?.amount,
    amountPercentage: amountPercentage * 1,
    procurements: currentPO?.totalProcurements,
    daysLeft,
  };
  res.status(200).json({
    status: "OK",
    data,
  });
});

exports.purchaseOrderReport = catchAsync(async (req, res, next) => {
  let firstDay = new Date(2022, 0, 1);
  let lastDay = new Date(3000, 11, 31);

  if (req.params.startDate && req.params.endDate) {
    firstDay = new Date(req.params.startDate);
    lastDay = new Date(req.params.endDate);
  }

  let purchases = await PurchaseOrder.find({
    $and: [{ createdAt: { $gt: firstDay } }, { createdAt: { $lte: lastDay } }],
  });

  const openPurchaseOrder = await PurchaseOrder.findOne({ status: "open" });

  let payments;

  const poObjectId = mongoose.Types.ObjectId(openPurchaseOrder?._id);

  payments = await Payment.aggregate([
    {
      $match: { purchaseOrder: { $eq: poObjectId } },
    },
    {
      $group: {
        _id: "$status",
        totalFarmers: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        totalWeight: { $sum: "$weight" },
      },
    },
  ]);

  res.status(200).json({
    status: "OK",
    data: {
      generalStats: purchases,
      weeklyStats: {
        openPo: openPurchaseOrder,
        paymentStats: payments,
      },
    },
  });
});
