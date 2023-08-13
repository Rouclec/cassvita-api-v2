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
  .get(getAllDrivers)
  .post(restrictTo("admin", "procurement-officer"), createDriver);
router
  .route("/:id")
  .get(restrictTo("admin", "procurement-officer"), getDriver)
  .patch(restrictTo("admin", "procurement-officer"), updateDriver);

module.exports = router;
