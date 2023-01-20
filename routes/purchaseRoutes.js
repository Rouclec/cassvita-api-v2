const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllPurchase,
  createPurchase,
  updatePurchase,
  getPurchase,
} = require("../controllers/purchaseController");

const router = express.Router();
router.use(protect);
router
  .route("/")
  .get(getAllPurchase)
  .post(restrictTo("admin", "manager", "ceo"), createPurchase);

router.route("/:id")
.patch(updatePurchase)
.get(getPurchase);

module.exports = router;