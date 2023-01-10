const express = require("express");
const { protect, updatePasswword } = require("../controllers/authController");
const { updateMe, getAllUsers } = require("../controllers/userController");

const router = express.Router();

router.get("/", getAllUsers);

router.use(protect);
router.patch("/updateProfile", updateMe);
router.patch("/updatePassword", updatePasswword);
module.exports = router;
