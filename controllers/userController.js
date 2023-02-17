const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const { getAll } = require("./helperController");

exports.updateMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      email: req.body.email,
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
    },
    { new: true, runValidators: true }
  );

  next(
    res.status(200).json({
      status: "OK",
      data: user,
    })
  );
});

exports.getAllUsers = getAll(User);
