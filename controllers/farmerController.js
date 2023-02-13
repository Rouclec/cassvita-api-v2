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

  console.log("farmer: ", farmer);
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
  const { name, phoneNumber, sex, farmSize, dateOfBirth, community } = req.body || null;

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
