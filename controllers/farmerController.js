const Community = require("../models/communityModel");
const Farmer = require("../models/farmerModel");
const catchAsync = require("../utils/catchAsync");
const { getAll, getOne, createOne } = require("./helperController");

const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const aws = require("aws-sdk");

const multerStorage = multer.memoryStorage();
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const uploadFile = (profilePicName) => {
  return new Promise((resolve, reject) => {
    try {
      const file = fs.readFileSync(
        `public/img/farmer-profile-pic/profile.jpeg`
      );
      const BUCKET = process.env.AWS_BUCKET;

      const uploadParams = {
        Bucket: BUCKET,
        Key: `${profilePicName}`,
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

exports.uploadProfilePic = upload.single("profilePic");

exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  await sharp(req.file.buffer)
    .resize(500, 500) //reizes the image to 500x500
    .toFormat("jpeg") //converts the image to a jpeg format
    .jpeg({ quality: 90 }) //sets the quality to 90% of the original quality
    .toFile(`public/img/farmer-profile-pic/profile.jpeg`);

  res = await uploadFile(`${req.file.originalname}`);
  req.profilePic = res.Location;
  next();
});

exports.getAllFarmers = getAll(Farmer);
exports.getFarmer = getOne(Farmer, "community");

// add new Farmer
exports.createFarmer = catchAsync(async (req, res, next) => {
  const {
    name,
    phoneNumber,
    gender,
    farmSize,
    dateOfBirth,
    community,
    preferedPaymentMethod,
  } = req.body;

  let profilePic;

  if (req.profilePic) {
    profilePic = req.profilePic;
  } else {
    profilePic = undefined;
  }

  const communityId = await Community.findOne({ name: community });

  if (!communityId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `Community ${community} not found`,
      })
    );
  }

  const farmer = {
    name,
    gender,
    farmSize,
    phoneNumber,
    preferedPaymentMethod,
    profilePic,
    dateOfBirth: new Date(dateOfBirth),
    community: communityId._id,
    createdBy: req.user._id,
  };

  const newFarmer = await Farmer.create(farmer);

  return next(
    res.status(201).json({
      status: "OK",
      data: newFarmer,
    })
  );
});

//Update Driver
exports.updateFarmer = catchAsync(async (req, res, next) => {
  const {
    name,
    phoneNumber,
    gender,
    farmSize,
    dateOfBirth,
    community,
    preferedpreferedPaymentMethod,
  } = req.body || null;

  let profilePic = undefined;

  if (req.profilePic) {
    profilePic = req.profilePic;
  }

  const communityId = await Community.find({ name: community });

  const farmer = {
    name,
    gender,
    farmSize,
    phoneNumber,
    dateOfBirth,
    profilePic,
    preferedpreferedPaymentMethod,
    community: communityId._id,
  };
  const newFarmer = await Farmer.findByIdAndUpdate(req.params.id, farmer);

  return next(
    res.status(200).json({
      status: "OK",
      data: newFarmer,
    })
  );
});

exports.stats = catchAsync(async (req, res, next) => {
  let totalFarmers = 0,
    fromCommunity = 0,
    individual = 0,
    males = 0,
    females = 0;
  active = 0;
  inactive = 0;
  const thisMonth = new Date().getMonth();
  const communities = await Farmer.aggregate([
    {
      $group: {
        _id: { $gt: ["$community", null] },
        total: { $sum: 1 },
      },
    },
  ]);

  communities.forEach((community) => {
    totalFarmers += community.total;
    if (community._id === true) fromCommunity = community?.total || 0;
    if (community._id === false) individual = community?.total || 0;
  });

  const genderGroup = await Farmer.aggregate([
    {
      $group: {
        _id: "$gender",
        total: { $sum: 1 },
      },
    },
  ]);

  genderGroup.forEach((gender) => {
    if (gender._id === "M") males = gender?.total || 0;
    if (gender._id === "F") females = gender?.total || 0;
  });

  const newFarmers = await Farmer.aggregate([
    {
      $match: { monthCreated: { $eq: thisMonth } },
    },
    {
      $group: {
        _id: "",
        total: { $sum: 1 },
      },
    },
  ]);

  const sortedFarmers = await Farmer.find().sort("-amount");
  const highestPaid = sortedFarmers[0];
  const lowestPaid = sortedFarmers[sortedFarmers.length - 1];

  const activeFarmers = await Farmer.aggregate([
    {
      $group: {
        _id: "$active",
        total: { $sum: 1 },
      },
    },
  ]);

  activeFarmers.forEach((farmer) => {
    if (farmer._id) active = farmer?.total || 0;
    if (!farmer._id) inactive = farmer?.total || 0;
  });

  let response = {
    totalFarmers,
    fromCommunity,
    individual,
    males,
    females,
    active,
    inactive,
    newFarmers: newFarmers[0]?.total || 0,
    highestPaid: highestPaid,
    lowestPaid: lowestPaid,
  };

  res.status(200).json({
    status: "OK",
    data: response,
  });
});
