const Community = require("../models/communityModel");
const Farmer = require("../models/farmerModel");
const catchAsync = require("../utils/catchAsync");
const { getAll, getOne } = require("./helperController");

exports.getAllFarmers = getAll(Farmer);
exports.getFarmer = getOne(Farmer);

// add new Driver
exports.createFarmer = catchAsync(async (req, res, next) => {
  const { name, phoneNumber, dateOfBirth, community } = req.body;

  const communityId = await Community.findOne({ name: community });

  if (!communityId) {
    return next(
      res.status(404).json({
        status: "Not Found",
        message: `Community ${communityId._id} not found`,
      })
    );
  }

  const farmer = {
    name,
    phoneNumber,
    dateOfBirth: new Date(dateOfBirth),
    community: communityId._id,
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
  const { name, phoneNumber, dateOfBirth, community } = req.body || null;

  const communityId = await Community.find({ name: community });

  const farmer = {
    name,
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
