const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllFarmers,
  createFarmer,
  getFarmer,
  updateFarmer,
  stats,
  uploadProfilePic,
  resizePhoto,
  getAllFarmersFromCommunity,
  removeFromCommunity,
} = require("../controllers/farmerController");
const {
  stats: allFarmerStats,
  farmerStats,
} = require("../controllers/paymentController");
const router = express.Router();

router.use(protect);
router.get("/reports/:startDate?/:endDate?", allFarmerStats);
router.get("/reports/:farmerId/:startDate?/:endDate?", farmerStats);
router
  .route("/")
  .get(restrictTo("admin", "ceo", "manager"), getAllFarmers)
  .post(
    restrictTo("admin", "ceo", "manager"),
    uploadProfilePic,
    resizePhoto,
    createFarmer
  );
router
  .route("/:id/remove-from-community")
  .get(restrictTo("admin", "ceo", "manager"), removeFromCommunity);
router
  .route("/community/:communityId")
  .get(restrictTo("admin", "ceo", "manager"), getAllFarmersFromCommunity);
router.get("/stats", restrictTo("admin", "ceo", "manager"), stats);
router
  .route("/:id")
  .get(restrictTo("admin", "ceo", "manager"), getFarmer)
  .patch(
    restrictTo("admin", "ceo", "manager"),
    uploadProfilePic,
    resizePhoto,
    updateFarmer
  );

module.exports = router;
