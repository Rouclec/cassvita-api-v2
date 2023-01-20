const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllDrivers,
  createDriver,
  getDriver,
  updateDriver,
} = require("../controllers/driverController");

const router = express.Router();

router.use(protect);
router
  .route("/")
  .get(restrictTo("admin", "ceo", "manager"), getAllDrivers)
  .post(restrictTo("admin", "ceo", "manager"), createDriver);
router
  .route("/:id")
  .get(restrictTo("admin", "ceo", "manager"), getDriver)
  .patch(restrictTo("admin", "ceo", "manager"), updateDriver);

module.exports = router;
