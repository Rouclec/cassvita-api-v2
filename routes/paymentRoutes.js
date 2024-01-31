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
  validateAllPayment,
  topUp,
  pay,
  checkAccountBalance,
} = require("../controllers/paymentController");

const router = express.Router();

router.use(protect);

router.patch("/validate-all", restrictTo("admin"), validateAllPayment);

router.get(
  "/search/:searchString",
  restrictTo("accountant", "admin"),
  searchPayment
);

router.get(
  "/procurement/:id",
  restrictTo("accountant", "admin"),
  getPaymentsFromProcurement
);

router.get("/", getAllPayments);
router.get("/stats", getGeneralPaymentStats);

router.get(
  "/account-balance",
  restrictTo("accountant", "admin"),
  checkAccountBalance
);

router.get("/:id", restrictTo("accountant", "admin", "manager"), getPayment);
router.patch(
  "/:id/:status",
  restrictTo("accountant", "admin", "manager"),
  uploadReceipt,
  resizePhoto,
  changePaymentStatus
);

router.post("/top-up", restrictTo("accountant", "admin"), topUp);
router.post("/pay", restrictTo("accountant", "admin"), pay);

// router.get("/confirm-payment-transaction",confirmPaymentTransaction)

module.exports = router;
