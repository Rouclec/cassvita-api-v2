const Community = require("../models/communityModel");
const { createOne, getOne, getAll, updateOne } = require("./helperController");

exports.createCommunity = createOne(Community, [
  "name",
  "location",
  "communityHead",
  "unitPrice",
]);
exports.getAllCommunities = getAll(Community);
exports.getCommunity = getOne(Community);
exports.updateCommunity = updateOne(Community, [
  "name",
  "location",
  "communityHead",
  "unitPrice",
]);
