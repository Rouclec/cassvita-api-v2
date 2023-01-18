const express = require("express");
const router = express.Router();

const driverController = require("../controllers/driverController")

router.get("/", driverController.index)
router.post("/show", driverController.show)
router.post("/store", driverController.store)
router.post("/update", driverController.update)

module.exports = router
