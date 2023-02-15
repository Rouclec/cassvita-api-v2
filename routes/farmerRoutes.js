const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllFarmers,
  createFarmer,
  getFarmer,
  updateFarmer,
  stats,
} = require("../controllers/farmerController");
const router = express.Router();

router.use(protect);
router
  .route("/")
  .get(restrictTo("admin", "ceo", "manager"), getAllFarmers)
  .post(restrictTo("admin", "ceo", "manager"), createFarmer);
router.get("/stats", restrictTo("admin", "ceo", "manager"), stats);
router
  .route("/:id")
  .get(restrictTo("admin", "ceo", "manager"), getFarmer)
  .patch(restrictTo("admin", "ceo", "manager"), updateFarmer);

module.exports = router;
