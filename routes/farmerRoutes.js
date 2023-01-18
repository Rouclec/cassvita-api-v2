const express = require("express");
const router = express.Router();

const farmerController = require("../controllers/farmer.Controller")

router.get("/", farmerController.index)
router.post("/show", farmerController.show)
router.post("/store", farmerController.store)
router.post("/update", farmerController.update)

module.exports = router