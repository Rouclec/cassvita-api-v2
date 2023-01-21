const Driver = require("../models/driverModel");
const { getAll, getOne, createOne, updateOne } = require("./helperController");

exports.getAllDrivers = getAll(Driver);
exports.getDriver = getOne(Driver);
exports.createDriver = createOne(Driver, ["name", "phoneNumber"]);
exports.updateDriver = updateOne(Driver, ["name", "phoneNumber"]);
