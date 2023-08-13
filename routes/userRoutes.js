const express = require("express");
const { protect, updatePasswword } = require("../controllers/authController");
const { updateMe, getAllUsers, getUser } = require("../controllers/userController");

const router = express.Router();

router.get("/", getAllUsers);
router.get('/get', getUser)

router.use(protect);
router.patch("/update-profile", updateMe);
router.patch("/update-password", updatePasswword);
module.exports = router;
