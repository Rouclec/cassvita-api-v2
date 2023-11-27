const express = require("express");
const { protect, updatePasswword, restrictTo } = require("../controllers/authController");
const { updateMe, getAllUsers, getUser, removeUser } = require("../controllers/userController");

const router = express.Router();


router.use(protect);
router.get("/", getAllUsers);
router.get('/get', getUser)
router.patch("/update-profile", updateMe);
router.patch('/:id/remove', restrictTo('admin'), removeUser)
router.patch("/update-password", updatePasswword);
module.exports = router;
