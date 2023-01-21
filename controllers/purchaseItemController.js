const PurchaseItem = require("../models/purchaseItemSchema");
const { createOne, getOne, getAll, updateOne } = require("./helperController");

exports.createPurchaseItem  = createOne(PurchaseItem , [
  "purchase",
  "driverWeight",
  "officeWeight",

]);
exports.getAllPurchaseItem  = getAll(PurchaseItem );
exports.getPurchaseItem  = getOne(PurchaseItem );
exports.updatePurchaseItem  = updateOne(PurchaseItem , [
    "purchase",
    "driverWeight",
    "officeWeight",
]);