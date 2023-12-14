const express = require("express");
const { protect } = require("../controllers/authController");
const { genericSearch } = require("../controllers/helperController");

const router = express.Router();

router.use(protect);
router.get("/:query/:model?", genericSearch());

module.exports = router;
