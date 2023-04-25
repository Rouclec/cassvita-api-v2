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
  .get(restrictTo("accountant", "admin", "procurement-officer"), getAllDrivers)
  .post(restrictTo("accountant", "admin", "procurement-officer"), createDriver);
router
  .route("/:id")
  .get(restrictTo("accountant", "admin", "procurement-officer"), getDriver)
  .patch(restrictTo("accountant", "admin", "procurement-officer"), updateDriver);

module.exports = router;
