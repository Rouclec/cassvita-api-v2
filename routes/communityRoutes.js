const express = require("express");
const { protect, restrictTo } = require("../controllers/authController");
const {
  getAllCommunities,
  createCommunity,
  updateCommunity,
  getCommunity,
  searchCommunity,
} = require("../controllers/communityController");

const router = express.Router();

router.use(protect);
router.get(
  "/search/:searchString",
  restrictTo("accountant", "admin", "procurement-officer"),
  searchCommunity
);
router
  .route("/")
  .get(getAllCommunities)
  .post(restrictTo("admin", "procurement-officer"), createCommunity);

router
  .route("/:id")
  .patch(restrictTo("admin", "procurement-officer"), updateCommunity)
  .get(getCommunity);

module.exports = router;
