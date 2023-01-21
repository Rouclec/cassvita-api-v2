const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllBDC,
  createBDC,
  getBDC,
  updateBDC,
} = require("../controllers/dbcController");
const router = express.Router();

router.use(protect);
router
  .route("/")
  .get(restrictTo( "ceo", "manager"), getAllBDC)
  .post(restrictTo( "ceo", "manager"), createBDC);
router
  .route("/:id")
  .get(restrictTo("admin", "ceo", "manager"), getBDC)
  .patch(restrictTo("admin", "ceo", "manager"), updateBDC);

module.exports = router;