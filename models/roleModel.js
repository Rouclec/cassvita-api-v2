const mongoose = require("mongoose");
const slugify = require("slugify");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name for this role"],
    unique: true,
  },
  code: {
    type: String,
  },
});

roleSchema.pre("save", function (next) {
  this.code = slugify(this.name, { lower: true });
  next();
});

const Role = mongoose.model("Role", roleSchema);
module.exports = Role;
