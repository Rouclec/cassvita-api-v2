const PurchaseOrder = require("../models/purchaseOrderModel");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const aws = require("aws-sdk");

const { getAll, getOne, createOne, updateOne } = require("./helperController");
const catchAsync = require("../utils/catchAsync");

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

  if (req.bdc) {
    bdc = req.bdc;
  } else {
    bdc = undefined;
  }

  const purchaseOrder = await PurchaseOrder.create({
    quantity: quantity * 1,
    amount: (quantity * 1) * (unitPrice * 1),
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
    amount: (quantity * 1) * (unitPrice * 1),
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
    status: "inactive",
  });

  next(
    res.status(200).json({
      status: "OK",
      data: purchaseOrder,
    })
  );
});

exports.purchaseOrderStats = catchAsync(async (req, res, next) => {
  let lowest = await PurchaseOrder.aggregate([
    { $sort: { quantity: 1 } },
    { $group: { _id: "$name", doc_with_max_ver: { $first: "$$ROOT" } } },
    { $replaceWith: "$doc_with_max_ver" },
  ]);

  let highest = await PurchaseOrder.aggregate([
    { $sort: { quantity: -1 } },
    { $group: { _id: "$name", doc_with_max_ver: { $first: "$$ROOT" } } },
    { $replaceWith: "$doc_with_max_ver" },
  ]);

  lowest[0].bdc = undefined;
  highest[0].bdc = undefined;

  let currentPO = await PurchaseOrder.findOne({ status: "active" });

  let data = {
    lowestPO: lowest[0],
    highestPO: highest[0],
    currentPO,
  };
  res.status(200).json({
    status: "OK",
    data,
  });
});
