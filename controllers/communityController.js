const Community = require("../models/communityModel");
const { createOne, getOne, getAll, updateOne } = require("./helperController");

exports.createCommunity = createOne(Community, [
  "name",
  "location",
  "cassavaSpecies",
  "communityHead",
  "unitPrice",
]);
exports.getAllCommunities = getAll(Community);
exports.getCommunity = getOne(Community);
exports.updateCommunity = updateOne(Community, [
  "name",
  "location",
  "cassavaSpecies",
  "communityHead",
  "unitPrice",
]);
