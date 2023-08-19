const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const { getAll, getOne } = require("./helperController");

exports.updateMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      email: req.body?.email,
      fullName: req.body?.fullName,
      phoneNumber: req.body?.phoneNumber,
      country: req.body?.country,
      city: req.body?.city,
      state: req.body?.state,
      postalCode: req.body?.postalCode,
      taxID: req.body?.taxID
    },
    { runValidators: false }
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
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies) {
    token = req.cookies.jwt;
  } else {
    return res.status(401).json({
      status: "Unauthorized",
      message: "Please login to access this route",
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

  //5) pass user to the the req and move on to next middleware
  return next(
    res.status(200).json({
      status: 'OK',
      data: user
    })
  )
})
