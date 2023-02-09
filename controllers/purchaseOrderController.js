const PurchaseOrder = require("../models/purchaseOrderModel");
const multer = require("multer");
const sharp = require("sharp");

const { getAll, getOne, createOne, updateOne } = require("./helperController");
const catchAsync = require("../utils/catchAsync");

const multerStorage = multer.memoryStorage();

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

  req.file.filename = `bdc-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    // .resize(500, 500) //reizes the image to 500x500
    // .toFormat("jpeg") //converts the image to a jpeg format
    .jpeg({ quality: 90 }) //sets the quality to 90% of the original quality
    .toBuffer();
  // .toFile(`public/img/bdc/${req.file.filename}`);
  next();
});

exports.getAllPurchaseOrder = getAll(PurchaseOrder);
exports.getPurchaseOrder = getOne(PurchaseOrder);

// exports.getPurchaseOrder = catchAsync(async (req, res, next) => {
//   const po = await PurchaseOrder.findById(req.params.id);

//   console.log("po: ", po);

//   await sharp(po.bdc.data)
//     .resize(500, 500) //reizes the image to 500x500
//     .toFormat("jpeg") //converts the image to a jpeg format
//     .jpeg({ quality: 90 }) //sets the quality to 90% of the original quality
//     // .toBuffer();
//     .toFile(`public/img/bdc/${po.bdc.filename}`);

//   return next(
//     res.status(200).json({
//       status: "OK",
//       data: po,
//     })
//   );
// });

// add new PurchaseOrder
exports.createPurchaseOrder = catchAsync(async (req, res, next) => {
  if (req.file) req.body.bdc = req.file.filename;

  const { title, quantity, amount } = req.body;

  const purchaseOrder = await PurchaseOrder.create({
    title,
    quantity,
    amount,
    bdc: { filename: req.body.bdc, data: req.file.buffer },
  });

  next(
    res.status(201).json({
      status: "Created",
      data: purchaseOrder,
    })
  );
});

//Update PurchaseOrder
exports.updatePurchaseOrder = catchAsync(async (req, res, next) => {
  if (req.file) req.body.bdc = req.file.filename;

  const { title, quantity, amount } = req.body;

  const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(req.params.id, {
    title,
    quantity,
    amount,
    bdc: req.file.buffer,
  });

  next(
    res.status(200).json({
      status: "Updated",
      data: purchaseOrder,
    })
  );
});
