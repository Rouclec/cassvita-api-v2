const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllPurchaseItem,
  createPurchaseItem,
  updatePurchaseItem,
  getPurchaseItem,
} = require("../controllers/purchaseItemController");

const router = express.Router();
router.use(protect);
router
  .route("/")
  .get(getAllPurchaseItem)
  .post(restrictTo("admin", "manager", "ceo"), createPurchaseItem);

router.route("/:id")
.patch(updatePurchaseItem)
.get(getPurchaseItem);

module.exports = router;