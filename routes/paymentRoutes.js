const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllPayments,
  getPayment,
  changePaymentStatus,
} = require("../controllers/paymentController");

const router = express.Router();
router.use(protect);

router.get("/", getAllPayments);

router.get("/:id", getPayment);
router.patch(
  "/:id/:status",
  restrictTo("admin", "manager", "ceo"),
  changePaymentStatus
);

module.exports = router;
