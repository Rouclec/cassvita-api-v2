const PurchaseStateChange = require("../models/purchaseStateChangeModel");
const { createOne, getAll, getOne, updateOne } = require("./helperController");

exports.createPurchaseStateChange = createOne(PurchaseStateChange, [
  "purchase",
  "state",
]);
exports.getAllPurchaseStateChanges = getAll(PurchaseStateChange);
exports.getPurchaseStateChange = getOne(PurchaseStateChange);
exports.updatePurchaseStateChange = updateOne(PurchaseStateChange, [
  "purchase",
  "state",
]);
