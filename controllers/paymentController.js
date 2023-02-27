const Farmer = require("../models/farmerModel");
const Payment = require("../models/paymentModel");
const PurchaseOrder = require("../models/purchaseOrderModel");
const catchAsync = require("../utils/catchAsync");
const { getAll, getOne } = require("./helperController");

const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const aws = require("aws-sdk");

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

  if (paymentFound.status !== "Pending") {
    return res.status(500).json({
      status: "Serer error",
      message: "Something went wrong",
    });
  }

  if (status === "Paid") {
    const farmerFound = await Farmer.findById(paymentFound.farmer._id);
    if (!farmerFound) {
      return res.status(500).json({
        status: "Server error",
        message: "Something went wrong",
      });
    }
    await Farmer.findByIdAndUpdate(farmerFound._id, {
      totalPay: farmerFound.totalPay + paymentFound.amount,
      totalBags: farmerFound.totalBags + paymentFound.totalBags,
      totalWeight: farmerFound.totalWeight + paymentFound.totalWeight,
    });
    const purchaseOrderFound = await PurchaseOrder.findById(
      paymentFound.purchaseOrderId
    );
    if (!purchaseOrderFound) {
      return res.status(500).json({
        status: "Server error",
        message: "Something went wrong",
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
