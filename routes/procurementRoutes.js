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
router.get("/search/:searchString", searchProcurement);
router.get("/reports/:startDate?/:endDate?", stats);
router
  .route("/")
  .get(getAllProcurements)
  .post(
    restrictTo("accountant", "admin", "procurement-officer"),
    createProcurement
  );

router
  .route("/:id")
  .patch(
    restrictTo("accountant", "admin", "procurement-officer"),
    updateProcurement
  )
  .get(getProcurement);

module.exports = router;
