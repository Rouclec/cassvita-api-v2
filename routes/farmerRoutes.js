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
  uploadXlFile,
  processXlFile,
  searchFarmer,
  overView,
} = require("../controllers/farmerController");
const {
  stats: allFarmerStats,
  farmerStats,
} = require("../controllers/paymentController");
const router = express.Router();

router.use(protect);
router.get(
  "/search/:searchString",
  restrictTo("accountant", "admin", "procurement-officer", "manager"),
  searchFarmer
);
router.get('/overview', overView)
router.get(
  "/reports/individual/:farmerId/:startDate?/:endDate?",
  farmerStats
);
router.get(
  "/reports/:startDate?/:endDate?/:community?",
  allFarmerStats
);
router.post(
  "/upload-from-file",
  restrictTo("accountant", "admin", "procurement-officer", "manager"),
  uploadXlFile,
  processXlFile
);
router
  .route("/")
  .get(restrictTo("accountant", "admin", "procurement-officer", "manager"), getAllFarmers)
  .post(
    restrictTo("accountant", "admin", "procurement-officer", "manager"),
    uploadProfilePic,
    resizePhoto,
    createFarmer
  );
router
  .route("/:id/remove-from-community")
  .get(
    restrictTo("accountant", "admin", "procurement-officer", "manager"),
    removeFromCommunity
  );
router
  .route("/community/:communityId")
  .get(
    restrictTo("accountant", "admin", "procurement-officer", "manager"),
    getAllFarmersFromCommunity
  );
router.get(
  "/stats",
  stats
);
router
  .route("/:id")
  .get(restrictTo("accountant", "admin", "procurement-officer", "manager"), getFarmer)
  .patch(
    restrictTo("accountant", "admin", "procurement-officer", "manager"),
    uploadProfilePic,
    resizePhoto,
    updateFarmer
  );

module.exports = router;
