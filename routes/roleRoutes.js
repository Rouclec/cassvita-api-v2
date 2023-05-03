const express = require("express");
const {
  createRole,
  updateRole,
  getAllRoles,
  getRole,
} = require("../controllers/roleController");
const { restrictTo, protect } = require("../controllers/authController");
const router = express.Router();

router.use(protect);
router.route("/").post(restrictTo("admin"), createRole).get(getAllRoles);
router.route("/:id").get(getRole).patch(restrictTo("admin"), updateRole);

module.exports = router;
