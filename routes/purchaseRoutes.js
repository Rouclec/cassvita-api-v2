const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");

const {
  getAllPurchase,
  createPurchase,
  updatePurchase,
  getPurchase,
  stats,
} = require("../controllers/purchaseController");

const router = express.Router();
router.use(protect);
router
  .route("/")
  .get(getAllPurchase)
  .post(
    restrictTo("admin", "manager", "ceo"), 
    createPurchase);

router.get("/stats", restrictTo("admin", "manager", "ceo"), stats);

router.route("/:id").patch(updatePurchase).get(getPurchase);

module.exports = router;
