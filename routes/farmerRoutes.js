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
  restrictTo("accountant", "admin", "procurement-officer"),
  searchFarmer
);
router.get('/overview', restrictTo("accountant", "admin", "procurement-officer"), overView)
router.get(
  "/reports/individual/:farmerId/:startDate?/:endDate?",
  restrictTo("accountant", "admin", "procurement-officer"),
  farmerStats
);
router.get(
  "/reports/:startDate?/:endDate?/:community?",
  restrictTo("accountant", "admin", "procurement-officer"),
  allFarmerStats
);
router.post(
  "/upload-from-file",
  restrictTo("accountant", "admin", "procurement-officer"),
  uploadXlFile,
  processXlFile
);
router
  .route("/")
  .get(restrictTo("accountant", "admin", "procurement-officer"), getAllFarmers)
  .post(
    restrictTo("accountant", "admin", "procurement-officer"),
    uploadProfilePic,
    resizePhoto,
    createFarmer
  );
router
  .route("/:id/remove-from-community")
  .get(
    restrictTo("accountant", "admin", "procurement-officer"),
    removeFromCommunity
  );
router
  .route("/community/:communityId")
  .get(
    restrictTo("accountant", "admin", "procurement-officer"),
    getAllFarmersFromCommunity
  );
router.get(
  "/stats",
  restrictTo("accountant", "admin", "procurement-officer"),
  stats
);
router
  .route("/:id")
  .get(restrictTo("accountant", "admin", "procurement-officer"), getFarmer)
  .patch(
    restrictTo("accountant", "admin", "procurement-officer"),
    uploadProfilePic,
    resizePhoto,
    updateFarmer
  );

module.exports = router;
