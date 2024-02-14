const Farmer = require("../models/farmerModel");
const Payment = require("../models/paymentModel");
const PurchaseOrder = require("../models/purchaseOrderModel");
const catchAsync = require("../utils/catchAsync");
const {
  getAll,
  getOne,
  search,
  getTokenFromCampay,
} = require("./helperController");

const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const aws = require("aws-sdk");
const Procurement = require("../models/procumentModel");
const mongoose = require("mongoose");
const Community = require("../models/communityModel");

const axios = require("axios");

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

const initiateTopUp = async (paymentRequest) => {
  const creds = {
    username: process.env.CAMPAY_USER,
    password: process.env.CAMPAY_PWD,
  };

  const token = await getTokenFromCampay(creds);

  try {
    const response = await axios.post(
      `${process.env.CAMPAY_BASE_URL_DEMO}/collect/`,
      paymentRequest,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token.token}`,
        },
      }
    );

    const data = response.data;
    return data;
  } catch (error) {
    return error;
  }
};

const initiatePayment = async (paymentRequest) => {
  const creds = {
    username: process.env.CAMPAY_USER,
    password: process.env.CAMPAY_PWD,
  };

  // get token from campay.
  const token = await getTokenFromCampay(creds);

  try {
    const response = await axios.post(
      `${process.env.CAMPAY_BASE_URL_DEMO}/withdraw/`,
      paymentRequest,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token.token}`,
        },
      }
    );
    const data = response?.data;
    return data;
  } catch (error) {
    return error;
  }
};

const checkTransactionStatus = async (reference) => {
  const creds = {
    username: process.env.CAMPAY_USER,
    password: process.env.CAMPAY_PWD,
  };

  // get token from campay.
  const token = await getTokenFromCampay(creds);

  try {
    const response = await axios.get(
      `${process.env.CAMPAY_BASE_URL_DEMO}/transaction/${reference}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token.token}`,
        },
      }
    );
    const data = response?.data;
    return data;
  } catch (error) {
    return error;
  }
};

const getAccountBalance = async () => {
  const creds = {
    username: process.env.CAMPAY_USER,
    password: process.env.CAMPAY_PWD,
  };

  // get token from campay.
  const token = await getTokenFromCampay(creds);

  try {
    const response = await axios.get(
      `${process.env.CAMPAY_BASE_URL_DEMO}/balance`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token.token}`,
        },
      }
    );
    const data = response?.data;
    return data;
  } catch (error) {
    return error;
  }
};

const subtractAmountOwed = async function (farmer, amount) {
  const farmerFound = await Farmer.findById(farmer);
  await Farmer.findByIdAndUpdate(farmer, {
    amountOwed: farmerFound.amountOwed - amount,
  });
};

const closeProcurement = async function (procurementId) {
  // const procurementFound = await Procurement.findById(procurementId);
  const paymentsFound = await Payment.find({ procurement: procurementId });

  let paidFully = true;

  paymentsFound.forEach((payment) => {
    if (payment.status === "Pending") paidFully = false;
  });

  if (paidFully === true)
    await Procurement.findByIdAndUpdate(procurementId, { status: "closed" });
};

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
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const payments = await Payment.aggregate([
    {
      $match: {
        $and: [
          { updatedAt: { $gt: firstDay } },
          { updatedAt: { $lte: lastDay } },
        ],
      },
    },
    {
      $group: {
        _id: "$status",
        amount: { $sum: "$amount" },
        total: { $sum: 1 },
      },
    },
  ]);

  const minMax = await Payment.aggregate([
    {
      $match: {
        $and: [
          { updatedAt: { $gt: firstDay } },
          { updatedAt: { $lte: lastDay } },
        ],
      },
    },
    {
      $group: {
        _id: "",
        highestPayment: { $max: "$amount" },
        lowestPayment: { $min: "$amount" },
      },
    },
  ]);

  return next(
    res.status(200).json({
      status: "OK",
      data: {
        payments,
        ...minMax[0],
      },
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

    await PurchaseOrder.findByIdAndUpdate(paymentFound.purchaseOrder, {
      totalPayments: purchaseOrderFound.totalPayments + 1,
      purchaseOrderId: null,
    });

    await subtractAmountOwed(paymentFound.farmer, paymentFound.amount);
    await closeProcurement(paymentFound.procurement);
  }

  const payment = await Payment.findByIdAndUpdate(
    paymentFound._id,
    {
      receipt,
      ...(status && { status }), // Conditionally update the status field if the status variable is truthy
      updatedBy: req.user._id,
    },
    { new: true }
  );

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

exports.getPaymentsFromProcurement = catchAsync(async (req, res, next) => {
  const procurement = await Procurement.findOne({ id: req?.params?.id });

  if (!procurement) {
    return next(
      res.status(401).json({
        status: "Not found",
        message: `No procurement with id: ${req?.params?.id}`,
      })
    );
  }

  const payments = await Payment.find({ procurement: procurement._id });

  return next(
    res.status(200).json({
      status: "OK",
      results: payments.length,
      data: payments,
    })
  );
});

exports.searchPayment = search(Payment);

exports.validateAllPayment = catchAsync(async (req, res, next) => {
  const pendingPayments = await Payment.find({ status: "Pending" });

  pendingPayments.forEach(async (payment) => {
    await Payment.findByIdAndUpdate(payment._id, { status: "Paid" });
  });

  return next(
    res.status(200).json({
      status: "OK",
      data: pendingPayments,
    })
  );
});

exports.topUp = catchAsync(async (req, res, next) => {
  const paymentRequest = {
    from: req?.body?.phoneNumber,
    external_ref: req?.body?.ref,
    amount: req?.body?.amount * 1,
  };

  const paymentResponse = await initiateTopUp(paymentRequest);

  if (paymentResponse?.reference) {
    let intervalId;
    let elapsedTime = 0;
    let responseSent = false;

    async function checkResult() {
      const result = await checkTransactionStatus(paymentResponse.reference);

      // Perform checks on the result
      if (result.status === "SUCCESSFUL") {
        clearInterval(intervalId);

        if (!responseSent) {
          responseSent = true;
          return res.status(200).json({
            status: "OK",
            data: result,
          });
        }
      } else if (result.status === "FAILED") {
        clearInterval(intervalId);
        if (!responseSent) {
          responseSent = true;
          return res.status(500).json({
            status: "FAILED",
            message: "Transaction did not complete",
          });
        }
      }

      // Increment elapsed time and check if it exceeds 2 minutes (120 seconds)
      elapsedTime += 5; // Assuming the interval runs every 5 seconds
      if (elapsedTime >= 120) {
        clearInterval(intervalId);
        if (!responseSent) {
          responseSent = true;
          return res.status(500).json({
            status: "FAILED",
            message: "Transaction timed out",
          });
        }
      }
    }

    intervalId = setInterval(checkResult, 5000);
  } else {
    return res.status(500).json(paymentResponse);
  }
});

exports.pay = catchAsync(async (req, res, next) => {
  const response = await initiatePayment({
    amount: req?.body?.amount * 1,
    to: req?.body?.phoneNumber,
    description: req?.body?.ref,
  });

  if (response?.reference) {
    let intervalId;
    let elapsedTime = 0;
    let responseSent = false; // Flag variable to track if a response has been sent

    async function checkResult() {
      const result = await checkTransactionStatus(response.reference);

      // Perform checks on the result
      if (result.status === "SUCCESSFUL") {
        clearInterval(intervalId);

        const confirmedPayment = await Payment.findByIdAndUpdate(
          req?.body?.paymentId,
          { status: "Paid" }
        );

        if (!responseSent) {
          // Check if a response has been sent before
          responseSent = true; // Set the flag to true
          return res.status(200).json({
            status: "OK",
            data: confirmedPayment,
          });
        }
      } else if (result?.status === "FAILED") {
        clearInterval(intervalId);

        if (!responseSent) {
          // Check if a response has been sent before
          responseSent = true; // Set the flag to true
          return res.status(500).json({
            status: "FAILED",
            message: "Transaction did not complete",
          });
        }
      }

      // Increment elapsed time and check if it exceeds 2 minutes (120 seconds)
      elapsedTime += 5; // Assuming the interval runs every 5 seconds
      if (elapsedTime >= 120) {
        clearInterval(intervalId);

        if (!responseSent) {
          // Check if a response has been sent before
          responseSent = true; // Set the flag to true
          return res.status(500).json({
            status: "FAILED",
            message: "Transaction timed out",
          });
        }
      }
    }

    intervalId = setInterval(checkResult, 5000);
  } else {
    if (
      response?.response?.data?.message.toLowerCase() ===
      "insufficient  balance"
    ) {
      return res.status(500).json({
        status: "Server error",
        message: "Insufficient balance",
      });
    } else {
      return res.status(500).json(response);
    }
  }
});

exports.checkAccountBalance = catchAsync(async (req, res, next) => {
  const response = await getAccountBalance();

  return res.status(200).json({
    status: "OK",
    data: response,
  });
});

// exports.confirmPaymentTransaction = catchAsync(async (req, res, next) => {
//   const reference = req?.query?.reference;

//   const response = await checkTransactionStatus(reference);

//   console.log({ response });

//   return next(res.send("OK"));
// });
