const express = require("express");
const {
  login,
  addUser,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

router.use(protect); //every route below this line, will pass through the protect middleware first
router.post("/addUser", restrictTo("manager", "admin"), addUser);

module.exports = router;
