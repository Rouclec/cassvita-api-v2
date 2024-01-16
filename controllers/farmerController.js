const Community = require("../models/communityModel");
const Farmer = require("../models/farmerModel");
const catchAsync = require("../utils/catchAsync");
const { getAll, getOne, createOne, search } = require("./helperController");

const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const aws = require("aws-sdk");
const xlsx = require("xlsx");
const Payment = require("../models/paymentModel");
const { default: mongoose } = require("mongoose");

const formatNumber = (number) => {
  let phone;
  if (
    (number.startsWith("00") && number.indexOf("6") === 5) ||
    number.startsWith("+237") ||
    number.startsWith("237") ||
    number.startsWith("6")
  ) {
    phone = "+2376" + number.replaceAll(" ", "").slice(number.indexOf("6") + 1);
  } else if (number.startsWith("+2")) {
    phone = number.replaceAll(" ", "");
  } else if (number.startsWith("2") && number.length === 12) {
    phone = "+" + number.replaceAll(" ", "");
  } else {
    phone = "+237" + number.replaceAll(" ", "");
  }
  return phone;
};

const formatWord = (str) => {
  if (str && str.length > 0)
    return (
      str.toLowerCase().charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    );
};

const formatName = (str) => {
  if (str && str.length > 0) {
    let names = str.split(" ");
    names.forEach((name, i) => {
      names[i] =
        name.toLowerCase().charAt(0).toUpperCase() +
        name.slice(1).toLowerCase();
    });
    return names.join(" ");
  }
};

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

const fileStorage = multer.diskStorage({
  //_dirname will be ../../../controller. but, we want to save the file in ../../../public/files/farmer-data
  destination: __dirname.replace("controllers", "public/files/farmer-data"),
  filename: function (req, file, cb) {
    //req.body is empty... here is where req.body.new_file_name doesn't exists
    cb(null, file.originalname);
  },
});

const getStats = (farmers) => {
  const date = new Date();
  const firstDay = new Date(
    date.getFullYear(),
    date.getMonth() - 6,
    date.getDate()
  );
  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1
  );
  return new Promise((resolve, reject) => {
    try {
      let stats = [];
      farmers.forEach(async (farmer) => {
        let paymentStats = await Payment.aggregate([
          {
            $match: {
              $and: [
                { createdAt: { $gte: firstDay } },
                { createdAt: { $lt: lastDay } },
                { farmer: mongoose.Types.ObjectId(farmer._id) },
                { status: "Paid" },
              ],
            },
          },
          {
            $group: {
              _id: { $month: "$createdAt" },
              amount: { $sum: "$amount" },
              weight: { $sum: "$weight" },
              bags: { $sum: "$bags" },
            },
          },
        ]);
        const stat = {
          farmer: farmer.name,
          stats: paymentStats,
        };
        stats.push(stat);
        if (stats.length === farmers.length) {
          return resolve(stats);
        }
      });
    } catch (error) {
      return reject(error);
    }
  });
};

const getIndividualStats = (farmers, startDate, endDate, filter) => {
  let group = {
    _id: { $year: "$createdAt" },
    amount: { $sum: "$amount" },
    weight: { $sum: "$weight" },
    bags: { $sum: "$bags" },
  };

  if (filter === "month") {
    group = {
      _id: { $dayOfMonth: "$createdAt" },
      amount: { $sum: "$amount" },
      weight: { $sum: "$weight" },
      bags: { $sum: "$bags" },
    };
  } else if (filter === "year" || filter === "quater") {
    group = {
      _id: { $month: "$createdAt" },
      amount: { $sum: "$amount" },
      weight: { $sum: "$weight" },
      bags: { $sum: "$bags" },
    };
  }

  return new Promise((resolve, reject) => {
    try {
      let stats = [];
      farmers.forEach(async (farmer) => {
        let paymentStats = await Payment.aggregate([
          {
            $match: {
              $and: [
                { createdAt: { $gte: startDate } },
                { createdAt: { $lt: endDate } },
                { farmer: mongoose.Types.ObjectId(farmer._id) },
                { status: "Paid" },
              ],
            },
          },
          {
            $group: group,
          },
        ]);
        const stat = {
          farmer: farmer.name,
          stats: paymentStats,
        };
        stats.push(stat);
        if (stats.length === farmers.length) {
          return resolve(stats);
        }
      });
    } catch (error) {
      return reject(error);
    }
  });
};

exports.uploadXlFile = multer({
  storage: fileStorage,
}).single("farmersData");

exports.processXlFile = catchAsync(async (req, res, next) => {
  const workbook = xlsx.readFile(
    `${__dirname.replace(
      "controllers",
      "public/files/farmer-data"
    )}/Cassvita Farmer Profiling (Responses).xlsx`,
    { cellDates: true }
  );
  const data = xlsx.utils.sheet_to_json(workbook.Sheets["Form Responses 1"]);
  // console.log("data: ", data);
  let farmersCreated = [];
  if (data.length > 0) {
    data.forEach(async (farmerData) => {
      // console.log('farmerData: ',farmerData.phoneNumber)
      let name = farmerData?.name || "";
      let gender = farmerData?.gender;
      let community = farmerData?.community;
      let farmSize = farmerData?.farmSize;
      let averageInvestment = farmerData?.averageInvestment || 0;
      let numberOfFarms = farmerData?.numberOfFarms || 1;
      let profilePic = farmerData?.profilePic;
      let preferedPaymentMethod = farmerData?.preferedPaymentMethod;
      let phoneNumber = farmerData.phoneNumber
        ? formatNumber(farmerData?.phoneNumber.toString().split("/")[0])
        : undefined;
      let dateOfBirth = farmerData.dateOfBirth
        ? new Date(farmerData?.dateOfBirth)
        : new Date("1994/01/01");

      let community_id = undefined;
      let communityId = undefined;

      if (community) {
        communityId = await Community.findOne({
          name: formatWord(community),
        });
      }

      if (communityId) {
        community_id = communityId._id;
      }

      if (name.length > 0) {
        const farmer = {
          name: formatName(name),
          gender: formatWord(gender) === "Male" ? "M" : "F",
          farmSize,
          phoneNumber,
          preferedPaymentMethod,
          numberOfFarms,
          averageInvestment,
          profilePic,
          dateOfBirth: new Date(dateOfBirth),
          community: community_id,
          createdBy: req.user._id,
        };

        const newFarmer = await Farmer.create(farmer);
        farmersCreated.push(newFarmer);
      }
    });
  }
  return next(
    res.status(201).json({
      status: "OK",
      results: farmersCreated.length,
      data: farmersCreated,
    })
  );
});

// exports.uploadFarmersFromExcel = catchAsync(async (req, res, next) => {
//   return next(
//     res.status(200).json({
//       status: "OK",
//       message: "File uploaded successfully!",
//     })
//   );
// });

exports.getAllFarmers = getAll(Farmer);
exports.getFarmer = getOne(Farmer, "community");

// add new Farmer
exports.createFarmer = catchAsync(async (req, res, next) => {
  const {
    name,
    phoneNumber,
    gender,
    farmSize,
    community,
    preferedPaymentMethod,
  } = req.body;

  let profilePic;
  let community_id = undefined;
  let dateOfBirth = undefined;

  if (req.profilePic) {
    profilePic = req.profilePic;
  } else {
    profilePic = undefined;
  }

  if (req.body.dateOfBirth) {
    let date = new Date(req.body.dateOfBirth);
    if (date.toString() !== "Invalid Date") {
      dateOfBirth = date;
    }
  }

  const communityId = await Community.findOne({ name: community });

  if (communityId) {
    community_id = communityId._id;
  }

  const farmer = {
    name,
    gender,
    farmSize,
    phoneNumber,
    preferedPaymentMethod,
    profilePic,
    dateOfBirth,
    community: community_id,
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
    community,
    preferedPaymentMethod,
  } = req.body || null;

  let profilePic = undefined;
  let community_id = undefined;
  let dateOfBirth = undefined;

  if (req.profilePic) {
    profilePic = req.profilePic;
  }

  if (req.body.dateOfBirth) {
    let date = new Date(req.body.dateOfBirth);
    if (date.toString() !== "Invalid Date") {
      dateOfBirth = date;
    }
  }

  const communityId = await Community.findOne({ name: community });
  if (communityId) {
    community_id = communityId._id;
  }

  const farmer = {
    name,
    gender,
    farmSize,
    phoneNumber,
    dateOfBirth,
    profilePic,
    preferedPaymentMethod,
    community: community_id,
  };
  const newFarmer = await Farmer.findByIdAndUpdate(req.params.id, farmer);

  return next(
    res.status(200).json({
      status: "OK",
      data: newFarmer,
    })
  );
});

exports.removeFromCommunity = catchAsync(async (req, res, next) => {
  const farmerFound = await Farmer.findById(req.params.id);

  if (!farmerFound) {
    return next(
      res.status(404).json({
        status: "Not found",
        message: `Farmer with id ${req.params.id} not found`,
      })
    );
  }

  const communityFound = await Community.findById(farmerFound.community._id);

  if (!communityFound) {
    return next(
      res.status(404).json({
        status: "Not found",
        message: `Community not found!`,
      })
    );
  }

  await Community.findByIdAndUpdate(communityFound._id, {
    numberOfFarmers: communityFound.numberOfFarmers - 1,
  });

  const updatedFarmer = await Farmer.findByIdAndUpdate(req.params.id, {
    community: undefined,
  });

  return next(
    res.status(200).json({
      status: "OK",
      data: updatedFarmer,
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
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 1);
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
        total: { $sum: 1 },
      },
    },
  ]);

  const sortedFarmers = await Farmer.find().sort("-totalPay");
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

  return next(
    res.status(200).json({
      status: "OK",
      data: response,
    })
  );
});

exports.getAllFarmersFromCommunity = catchAsync(async (req, res, next) => {
  let farmers = [];

  const community = await Community.findById(req.params.communityId);
  farmers = await Farmer.find({ community: community });

  return next(
    res.status(200).json({
      status: "OK",
      results: farmers?.length,
      data: farmers,
    })
  );
});

exports.searchFarmer = search(Farmer);

exports.overView = catchAsync(async (_, res, next) => {
  let stats = [];
  const farmers = await Farmer.find().sort("-totalPay").limit(4);
  if (farmers.length > 0) stats = await getStats(farmers);

  return next(
    res.status(200).json({
      status: "OK",
      data: stats,
    })
  );
});

exports.individualReport = catchAsync(async (req, res, next) => {
  let stats = [];

  const nameArray = req?.params?.farmers.split(",");

  let today = new Date();

  const startDate = req?.params?.startDate
    ? new Date(req?.params?.startDate)
    : new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  const endDate = req?.params?.endDate
    ? new Date(req?.params?.endDate)
    : new Date(today.getFullYear() + 100, today.getMonth(), today.getDate());

  const farmers = await Farmer.find({ name: { $in: nameArray } });
  if (farmers.length > 0)
    stats = await getIndividualStats(
      farmers,
      startDate,
      endDate,
      req.params?.filter
    );

  return next(
    res.status(200).json({
      status: "OK",
      data: stats,
    })
  );
});

//Technical script

exports.payAllFarmers = catchAsync(async (req, res, next) => {
  const farmers = await Farmer.find();

  farmers.forEach(async (farmer) => {
    const { amountOwed } = farmer;
    await Farmer.findByIdAndUpdate(
      farmer?._id,
      {
        $inc: { totalPay: amountOwed },
        $set: { amountOwed: 0 },
      },
      { new: true }
    );
  });

  return res.status(200).json({
    status: "OK",
    data: farmers,
  });
});

//End of technical script

exports.reports = catchAsync(async (req, res, next) => {
  const { startDate, endDate, communities, volumeUnit, minAmount, maxAmount } =
    req?.params || {};

  const communityArray = communities?.split(",") || [];
  const volumeArray = volumeUnit?.split(",") || [];
  //Build the aggregation pipeline based on provided params
  let pipeline = [];

  //Match stage to filter by startDate and endDate
  pipeline.push({
    $match: {
      $and: [
        { createdAt: { $gte: new Date(startDate) } },
        { createdAt: { $lte: new Date(endDate) } },
      ],
    },
  });

  //Match stage to filter by community
  if (communityArray?.length > 0 && communityArray[0] !== "all") {
    const communities = await Community.find({ name: { $in: communityArray } });

    // Extract the IDs from the fetched community documents
    const communityIds = communities.map((community) => community._id);

    pipeline.push({
      $match: {
        community: { $in: communityIds },
      },
    });
  }

  // Match stage to filter by amount range
  if (minAmount && maxAmount) {
    pipeline.push({
      $match: {
        $and: [
          { totalPay: { $gte: minAmount * 1 } },
          { totalPay: { $lte: maxAmount * 1 } },
        ],
      },
    });
  }

  pipeline.push({
    $lookup: {
      from: "communities", // Name of the communities collection
      localField: "community",
      foreignField: "_id",
      as: "communityData",
    },
  });

  pipeline.push({
    $unwind: "$communityData",
  });

  let projectStage = {
    $project: {
      createdAt: 1,
      community: "$communityData.name",
      totalPay: 1,
      name: 1,
      gender: 1,
    },
  };

  if (
    volumeArray.length > 0 &&
    volumeArray.find((unit) => unit.toLowerCase() === "bags")
  ) {
    projectStage.$project.totalBags = 1;
  }
  if (
    volumeArray.length > 0 &&
    volumeArray.find((unit) => unit.toLowerCase() === "kgs")
  ) {
    projectStage.$project.totalWeight = 1;
  }
  if (
    (volumeArray.length > 0 && volumeArray[0].toLowerCase() === "all") ||
    !volumeArray.length
  ) {
    projectStage.$project.totalBags = 1;
    projectStage.$project.totalWeight = 1;
  }

  pipeline.push(projectStage);

  const result = await Farmer.aggregate(pipeline);

  return next(
    res.status(200).json({
      status: "OK",
      data: result,
    })
  );
});
