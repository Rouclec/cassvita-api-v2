const express = require("express");
const router = express.Router();

const communityController = require("../controllers/communityController")


router.get("/", communityController.read)
router.post("/show", communityController.show)
router.post("/create", communityController.create)
router.post("/updateCommunity", communityController.updateCommunity)

module.exports = router









