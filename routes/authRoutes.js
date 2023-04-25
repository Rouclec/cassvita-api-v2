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

router.post("/login", login, protect);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);

router.use(protect); //every route below this line, will pass through the protect middleware first
router.post("/add-user", restrictTo("accountant", "admin", "procurement-officer"), addUser);

module.exports = router;
