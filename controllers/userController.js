const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const { getAll, getOne } = require("./helperController");

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
exports.getUser = catchAsync(async (req, res, next) => {
  let token;
  if (req.params.token) {
    token = req.params.token
  } else {
    return res.status(401).json({
      status: "Server error",
      message: "Please provide a token",
    });
  }

  // 2) verify token
  const verifiedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  //3) check if token has expired
  if (verifiedToken.exp * 1000 < Date.now()) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "Invalid Token",
    });
  }
  //4) check if user exists
  const user = await User.findById(verifiedToken.id);
  if (!user) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "Something went wrong",
    });
  }

  return next(
    res.status(200).json({
      status: 'OK',
      data: user
    })
  )
})
