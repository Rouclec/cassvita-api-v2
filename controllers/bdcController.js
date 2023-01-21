const BDC = require("../models/bdcModel");
const { getAll, getOne, createOne, updateOne } = require("./helperController");

exports.getAllBDC = getAll(BDC);
exports.getBDC = getOne(BDC);

// add new BDC
exports.createBDC = createOne(BDC, ["name", "size"]);

//Update BDC
exports.updateBDC = updateOne(BDC, ["name", "size"]);
