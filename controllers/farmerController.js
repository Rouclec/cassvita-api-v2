const Community = require("../models/communityModel");
const Farmer = require("../models/farmerModel");
const catchAsync = require("../utils/catchAsync");
const { getAll, getOne, createOne, search } = require("./helperController");

const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const aws = require("aws-sdk");
const xlsx = require("xlsx");

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
  destination: __dirname.replace("controllers", "public/files/farmer-data"),
  filename: function (req, file, cb) {
    //req.body is empty... here is where req.body.new_file_name doesn't exists
    cb(null, file.originalname);
  },
});

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
    if(date.toString() !== 'Invalid Date'){
      dateOfBirth = date
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
  let dateOfBirth = undefined

  if (req.profilePic) {
    profilePic = req.profilePic;
  }

  if (req.body.dateOfBirth) {
    let date = new Date(req.body.dateOfBirth);
    if(date.toString() !== 'Invalid Date'){
      dateOfBirth = date
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

exports.searchFarmer = search(Farmer)