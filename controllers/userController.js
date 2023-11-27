const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const { getAll, getOne } = require("./helperController");
const APIFeatures = require("../utils/apiFeatures");

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

exports.getAllUsers = catchAsync(async (req, res) => {
  let Model = User;
  const features = new APIFeatures(Model.find({ removed: { $ne: true } }), req.query)
    .filter()
    .sort("-createdAt")
    .limitFields()
    .paginate();

  let docs = await features.query;
  let pageQuery = features.queryString.page;
  let limitQuery = features.queryString.limit;
  let newQueryString = features.queryString;
  delete newQueryString.sort;
  delete newQueryString.page;
  delete newQueryString.limit;
  newQueryString = {
    ...newQueryString,
    removed: { $ne: true }
  }
  const count = await Model.count(newQueryString) - 1;
  let page = "1 of 1";
  if (pageQuery && limitQuery) {
    const pages = Math.ceil(count / limitQuery);
    page = `${pageQuery} of ${pages}`;
  }

  docs = docs.filter(doc => doc.id !== req.user.id)

  res.status(200).json({
    status: "OK",
    results: count,
    page: page,
    data: docs,
  });
});

exports.removeUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    return next(res.status(404).json({
      status: 'Not found',
      message: "No such user"
    }))
  }

  const updatedUser = await User.findByIdAndUpdate(user?._id, { removed: true })
  return next(
    res.status(200).json({
      status: "OK",
      data: updatedUser
    })
  )
})
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
