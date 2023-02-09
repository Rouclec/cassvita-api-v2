const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllPurchaseOrder,
  createPurchaseOrder,
  getPurchaseOrder,
  updatePurchaseOrder,
  uploadBdc,
  resizePhoto,
} = require("../controllers/purchaseOrderController");
const router = express.Router();

router.use(protect);
router
  .route("/")
  .get(restrictTo("admin", "ceo", "manager"), getAllPurchaseOrder)
  .post(
    restrictTo("admin", "ceo", "manager"),
    uploadBdc,
    resizePhoto,
    createPurchaseOrder
  );
router
  .route("/:id")
  .get(restrictTo("admin", "ceo", "manager"), getPurchaseOrder)
  .patch(
    restrictTo("admin", "ceo", "manager"),
    uploadBdc,
    resizePhoto,
    updatePurchaseOrder
  );

module.exports = router;
