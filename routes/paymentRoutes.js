const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllPayments,
  getPayment,
  changePaymentStatus,
  uploadReceipt,
  resizePhoto,
  stats,
} = require("../controllers/paymentController");

const router = express.Router();
router.use(protect);

router.get("/", getAllPayments);

router.get("/stats/:startMonth/:startYear/:endMonth/:endYear", stats);

router.get("/:id", getPayment);
router.patch(
  "/:id/:status",
  restrictTo("admin", "manager", "ceo"),
  uploadReceipt,
  resizePhoto,
  changePaymentStatus
);

module.exports = router;
