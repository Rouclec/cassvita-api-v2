const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllProcurements,
  createProcurement,
  updateProcurement,
  getProcurement,
} = require("../controllers/procurementController");

const router = express.Router();
router.use(protect);

router
  .route("/")
  .get(getAllProcurements)
  .post(restrictTo("admin", "manager", "ceo"), createProcurement);

router
  .route("/:id")
  .patch(restrictTo("admin", "manager", "ceo"), updateProcurement)
  .get(getProcurement);

module.exports = router;
