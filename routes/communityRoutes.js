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
router.get("/search/:searchString", searchCommunity);
router
  .route("/")
  .get(getAllCommunities)
  .post(restrictTo("admin", "manager", "ceo"), createCommunity);

router.route("/:id").patch(updateCommunity).get(getCommunity);

module.exports = router;
