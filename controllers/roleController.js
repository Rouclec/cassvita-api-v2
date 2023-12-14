const Role = require("../models/roleModel");
const { createOne, getOne, getAll, updateOne, genericSearch } = require("./helperController");

exports.createRole = createOne(Role, ["name"]);
exports.updateRole = updateOne(Role, ["name"]);
exports.getRole = getOne(Role);
exports.getAllRoles = getAll(Role);

