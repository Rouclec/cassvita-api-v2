const express = require("express");
const {
  createRole,
  updateRole,
  getAllRoles,
  getRole,
} = require("../controllers/roleController");
const router = express.Router();

router.route("/").post(restrictTo("admin"), createRole).get(getAllRoles);
router.route("/:id").get(getRole).patch(restrictTo("admin"), updateRole);

module.exports = router;
