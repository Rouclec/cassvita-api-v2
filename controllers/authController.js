const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const Email = require("../utils/email");
const crypto = require("crypto");
const Role = require("../models/roleModel");
const slugify = require("slugify");
const sharp = require("sharp");
const fs = require("fs");
const aws = require("aws-sdk");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION,
  });
};
const createAuthToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined; //to remove the password field

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRATION * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "Success",
    token,
    data: {
      user,
    },
  });
};

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const uploadFile = (profilePicName) => {
  return new Promise((resolve, reject) => {
    try {
      const file = fs.readFileSync(`public/img/profile-pic/profile.jpeg`);
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

exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  await sharp(req.file.buffer)
    .resize(500, 500) //reizes the image to 500x500
    .toFormat("jpeg") //converts the image to a jpeg format
    .jpeg({ quality: 90 }) //sets the quality to 90% of the original quality
    .toFile(`public/img/profile-pic/profile.jpeg`);

  res = await uploadFile(`${req.file.originalname}`);
  req.profilePic = res.Location;
  next();
});

exports.addUser = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
    country,
    passwordConfirm,
    role,
  } = req.body;

  const userFound = await User.exists({ email, removed: false });

  if (userFound) {
    return next(
      res.status(500).json({
        status: "Server error",
        message: `Email ${email} already in use, please try another`,
      })
    );
  }

  let profilePic;

  if (req.profilePic) {
    profilePic = req.profilePic;
  } else {
    profilePic = undefined;
  }

  const userRole = await Role.findOne({
    code: slugify(role, { lower: true }),
  });

  if (!userRole) {
    return next(
      res.status(404).json({
        status: "Not found",
        message: `No such role, ${role} found`,
      })
    );
  }

  const newUser = {
    fullName: firstName + " " + lastName,
    username: slugify(firstName),
    email,
    password,
    country,
    profilePic,
    phoneNumber,
    passwordConfirm,
    createdBy: req.user._id,
    role: userRole._id,
  };

  const user = await User.create(newUser);
  user.password = undefined;

  return next(
    res.status(201).json({
      status: "OK",
      data: user,
    })
  );
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!(email && password)) {
    //check if the request body contains email and password
    return next(
      res.status(400).json({
        status: "Bad request!",
        message: "Please enter your email and password!!",
      })
    );
  }

  let user = await User.findOne({ email, removed: { $ne: true } }).select(
    "+password"
  );
  if (!(user && (await user.comparePassword(password)))) {
    // check if user exists, and password is correct
    return next(
      res.status(401).json({
        status: "Unauthorized",
        message: "Incorrect email and password combination",
      })
    );
  }

  user = await User.findByIdAndUpdate(user.id, { lastLogin: Date.now() }); // update the user's last login
  createAuthToken(user, 200, res); //send token to the client
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token from authorizaton header
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
  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  //takes an array of roles
  return (req, res, next) => {
    if (!roles.includes(req.user.role.code)) {
      //if user role is not in this array,
      return next(
        res.status(403).json({
          status: "Forbidden",
          message: "You do not have permission to perform this action",
        })
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get the user by email
  const user = await User.findOne({
    email: req.body.email,
    removed: { $ne: true },
  });
  if (!user) {
    return next(
      res.status(404).json({
        status: "Not found!",
        message: "No such user exists",
      })
    );
  }

  //2) generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3 send token to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v2/auth/reset-password/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();
  } catch (error) {
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined; //reset the token and its expiration and save the user if there is an error
    await user.save({ validateBeforeSave: false });
    return next(
      res.status(500).json({
        status: "Server error!",
        message: `Error sending email: ${error}`,
      })
    );
  }

  res.status(200).json({
    status: "OK",
    message: `Follow the link sent to ${req.body.email} within 10 minutes to reset your password`,
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetToken: hashedToken,
    removed: { $ne: true },
    resetTokenExpiration: { $gt: Date.now() },
  }).select("+password");

  // 2) If token has not expired, and user exists, set the new password
  if (!user) {
    return next(
      res.status(500).json({
        status: "Something went Wrong!",
        message: "Invalid Token",
      })
    );
  }

  if (await user.comparePassword(req.body.newPassword)) {
    return next(
      res.status(500).json({
        status: "Error!",
        message: "Current password and new password cannot be thesame",
      })
    );
  }
  // 3) update the user
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  user.resetToken = undefined;
  user.resetTokenExpiration = undefined;

  await user.save();

  // 4) Log the user in, send JWT
  createAuthToken(user, 200, res);
  next();
});

exports.updatePasswword = catchAsync(async (req, res, next) => {
  // 1) Get user from the collection
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  if (!(currentPassword && newPassword && newPasswordConfirm)) {
    return next(
      res.status(400).json({
        status: "Bad request",
        message: "Invalid current password or new password",
      })
    );
  }

  const user = await User.findById(req?.user?.id).select("+password");
  if (!user) {
    return next(
      res.status(401).json({
        status: "Unauthorized",
        message: "You must be logged in to perfom this action",
      })
    );
  }
  // 2) Check if current password is correct
  if (!(await user.comparePassword(currentPassword))) {
    return next(
      res.status(401).json({
        status: "Unauthorized",
        message: "Current password is incorrect",
      })
    );
  }

  if (await user.comparePassword(newPassword)) {
    return next(
      res.status(500).json({
        status: "Error!",
        message: "Current password and new password cannot be thesame",
      })
    );
  }
  // 3) update the password
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;

  await user.save();

  // 4) Log user in
  createAuthToken(user, 200, res);
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.body?.userId);
  if (!user) {
    return next(
      res.status(500).json({
        status: "Something went Wrong!",
        message: "Invalid Token",
      })
    );
  }
  return createAuthToken(user, 200, res);
});
