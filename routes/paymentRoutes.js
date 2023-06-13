const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllPayments,
  getPayment,
  changePaymentStatus,
  uploadReceipt,
  resizePhoto,
  searchPayment,
  getGeneralPaymentStats,
} = require("../controllers/paymentController");

const router = express.Router();
router.use(protect);
router.get(
  "/search/:searchString",
  restrictTo("accountant", "admin"),
  searchPayment
);

router.get("/", restrictTo("accountant", "admin"), getAllPayments);
router.get(
  "/stats",
  restrictTo("accountant", "admin"),
  getGeneralPaymentStats
);

router.get("/:id", restrictTo("accountant", "admin"), getPayment);
router.patch(
  "/:id/:status",
  restrictTo("accountant", "admin"),
  uploadReceipt,
  resizePhoto,
  changePaymentStatus
);

module.exports = router;
