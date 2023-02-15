const Community = require("../models/communityModel");
const Farmer = require("../models/farmerModel");
const catchAsync = require("../utils/catchAsync");
const { getAll, getOne, createOne } = require("./helperController");

exports.getAllFarmers = getAll(Farmer);
exports.getFarmer = getOne(Farmer);

// add new Farmer
exports.createFarmer = catchAsync(async (req, res, next) => {
  const { name, phoneNumber, sex, farmSize, dateOfBirth, community } = req.body;

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
    sex,
    farmSize,
    phoneNumber,
    dateOfBirth: new Date(dateOfBirth),
    community: communityId._id,
    createdBy: req.user._id,
  };

  const newFarmer = await Farmer.create(farmer);

  return next(
    res.status(201).json({
      status: "Farmer Created!",
      data: newFarmer,
    })
  );
});

//Update Driver
exports.updateFarmer = catchAsync(async (req, res, next) => {
  const { name, phoneNumber, sex, farmSize, dateOfBirth, community } =
    req.body || null;

  const communityId = await Community.find({ name: community });

  const farmer = {
    name,
    sex,
    farmSize,
    phoneNumber,
    dateOfBirth,
    community: communityId._id,
  };
  const newFarmer = await Farmer.findById(req.params.id, farmer);

  return next(
    res.status(200).json({
      status: "Farmer Updated!",
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
    if (community._id === true) fromCommunity = community.total;
    if (community._id === false) individual = community.total;
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
    if (gender._id === "M") males = gender.total;
    if (gender._id === "F") females = gender.total;
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

  const highestPaid = await Farmer.aggregate([
    { $sort: { totalPay: -1 } },
    { $group: { _id: "$name", doc_with_max_ver: { $first: "$$ROOT" } } },
    { $replaceWith: "$doc_with_max_ver" },
  ]);
  const lowestPaid = await Farmer.aggregate([
    { $sort: { totalPay: 1 } },
    { $group: { _id: "$name", doc_with_max_ver: { $first: "$$ROOT" } } },
    { $replaceWith: "$doc_with_max_ver" },
  ]);

  const activeFarmers = await Farmer.aggregate([
    {
      $group: {
        _id: "$active",
        total: { $sum: 1 },
      },
    },
  ]);

  activeFarmers.forEach((farmer) => {
    if (farmer._id) active = farmer.total;
    if (!farmer._id) inactive = farmer.total;
  });

  let response = {
    totalFarmers,
    fromCommunity,
    individual,
    males,
    females,
    active,
    inactive,
    newFarmers: newFarmers[0].total,
    highestPaid: highestPaid[0],
    lowestPaid: lowestPaid[0],
  };

  res.status(200).json({
    status: "OK",
    data: response,
  });
});
