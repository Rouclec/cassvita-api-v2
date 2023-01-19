const express = require("express");
const {
  createRole,
  updateRole,
  getAllRoles,
  getRole,
} = require("../controllers/roleController");
const router = express.Router();

router.route("/").post(createRole).get(getAllRoles);
router.route("/:id").get(getRole).patch(updateRole);

module.exports = router;
