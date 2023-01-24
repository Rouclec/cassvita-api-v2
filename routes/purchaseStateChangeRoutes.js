const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllPurchaseStateChanges,
  createPurchaseStateChange,
  updatePurchaseStateChange,
  getPurchaseStateChange,
} = require("../controllers/purchaseStateChangeController");

const router = express.Router();
router.use(protect);
router
  .route("/")
  .get(getAllPurchaseStateChanges)
  .post(restrictTo("admin", "manager", "ceo"), createPurchaseStateChange);

router
  .route("/:id")
  .patch(updatePurchaseStateChange)
  .get(getPurchaseStateChange);

module.exports = router;
