const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllBDC,
  createBDC,
  getBDC,
  updateBDC,
} = require("../controllers/bdcController");
const router = express.Router();

router.use(protect);
router
  .route("/")
  .get(restrictTo("admin", "ceo", "manager"), getAllBDC)
  .post(restrictTo("admin", "ceo", "manager"), createBDC);
router
  .route("/:id")
  .get(restrictTo("admin", "ceo", "manager"), getBDC)
  .patch(restrictTo("admin", "ceo", "manager"), updateBDC);

module.exports = router;
