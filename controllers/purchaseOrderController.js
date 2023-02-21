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

// const uploadFile = (bdcName) => {
//   let path;
//   fs.readFile(`public/img/bdc/bdc.jpeg`, async (err, data) => {
//     if (err) throw err;
//     const params = {
//       Bucket: "cassvitastorage", // pass your bucket name
//       Key: `${bdcName}`, // file will be saved as cassvitastorage/bdcName.jpeg
//       Body: JSON.stringify(data, null, 2),
//     };
//     await s3
//       .upload(params, function (s3Err, data) {
//         if (s3Err) throw s3Err;
//         console.log(`File uploaded successfully at ${data.Location}`);
//         path = data.Location;
//         console.log(`data return : ${data}`);
//       })
//       .promise();
//   });
//   return path;
// };

const uploadFile = (bdcName) => {
  return new Promise((resolve, reject) => {
    try {
      const file = fs.readFileSync(`public/img/bdc/bdc.jpeg`);
      const BUCKET = "cassvitastorage";

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
      return reject(err);
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
    // .toBuffer();
    .toFile(`public/img/bdc/bdc.jpeg`);

  res = await uploadFile(`public/img/bdc/${req.file.originalname}`);
  req.bdc = res.Location;

  next();
});

exports.getAllPurchaseOrder = getAll(PurchaseOrder);
exports.getPurchaseOrder = getOne(PurchaseOrder);

// exports.getPurchaseOrder = catchAsync(async (req, res, next) => {
//   const po = await PurchaseOrder.findById(req.params.id);

// await sharp(po.bdc.data)
//   .resize(500, 500) //reizes the image to 500x500
//   .toFormat("jpeg") //converts the image to a jpeg format
//   .jpeg({ quality: 90 }) //sets the quality to 90% of the original quality
//   // .toBuffer();
//   .toFile(`public/img/bdc/${po.bdc.filename}`);

//   return next(
//     res.status(200).json({
//       status: "OK",
//       data: po,
//     })
//   );
// });

// add new PurchaseOrder
exports.createPurchaseOrder = catchAsync(async (req, res, next) => {
  // if (req.file) req.body.bdc = req.file.filename;

  // console.log("request body: ", req.body);

  // uploadBdc(req.body.bdc);

  const { quantity, amount, startDate, endDate } = req.body;

  const purchaseOrder = await PurchaseOrder.create({
    quantity,
    amount,
    startDate,
    endDate,
    bdc: req.bdc,
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
  if (req.file) req.body.bdc = req.file.filename;

  let bdc;
  const { quantity, amount, startDate, endDate } = req.body;

  if (req.file) {
    bdc = req.file.buffer;
  } else {
    bdc = undefined;
  }

  const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(req.params.id, {
    quantity,
    amount,
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
