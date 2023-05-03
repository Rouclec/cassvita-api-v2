const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllProcurements,
  createProcurement,
  updateProcurement,
  getProcurement,
  stats,
  searchProcurement,
} = require("../controllers/procurementController");

const router = express.Router();
router.use(protect);
router.get(
  "/search/:searchString",
  restrictTo("accountant", "admin", "procurement-officer"),
  searchProcurement
);
router.get(
  "/reports/:startDate?/:endDate?",
  restrictTo("accountant", "admin", "procurement-officer"),
  stats
);
router
  .route("/")
  .get(getAllProcurements)
  .post(restrictTo("admin", "procurement-officer"), createProcurement);

router
  .route("/:id")
  .patch(restrictTo("admin", "procurement-officer"), updateProcurement)
  .get(
    restrictTo("accountant", "admin", "procurement-officer"),
    getProcurement
  );

module.exports = router;
