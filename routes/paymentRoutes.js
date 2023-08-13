const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllPayments,
  getPayment,
  getPaymentsFromProcurement,
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

router.get('/procurement/:id', restrictTo("accountant", "admin"), getPaymentsFromProcurement)

router.get("/", getAllPayments);
router.get(
  "/stats",
  getGeneralPaymentStats
);

router.get("/:id", restrictTo("accountant", "admin","manager"), getPayment);
router.patch(
  "/:id/:status",
  restrictTo("accountant", "admin","manager"),
  uploadReceipt,
  resizePhoto,
  changePaymentStatus
);

module.exports = router;
