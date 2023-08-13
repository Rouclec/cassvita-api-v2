const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllPurchaseOrder,
  createPurchaseOrder,
  getPurchaseOrder,
  updatePurchaseOrder,
  resizePhoto,
  closePurchaseOrder,
  purchaseOrderStats,
  uploadBdc,
  purchaseOrderReport,
} = require("../controllers/purchaseOrderController");
const router = express.Router();

router.use(protect);
router.get("/reports/:startDate?/:endDate?", purchaseOrderReport);
router
  .route("/")
  .get(
    getAllPurchaseOrder
  )
  .post(
    restrictTo("admin", "procurement-officer"),
    uploadBdc,
    resizePhoto,
    createPurchaseOrder
  );

router
  .route("/stats")
  .get(
    purchaseOrderStats
  );

router
  .route("/:id")
  .get(
    restrictTo("accountant", "admin", "procurement-officer"),
    getPurchaseOrder
  )
  .patch(
    restrictTo("admin", "procurement-officer"),
    uploadBdc,
    resizePhoto,
    updatePurchaseOrder
  );

router
  .route("/:id/close")
  .get(
    restrictTo("admin", "procurement-officer", "manager"),
    closePurchaseOrder
  );

module.exports = router;
