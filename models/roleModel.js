const mongoose = require("mongoose");
const slugify = require("slugify");
const uniqueValidator = require("mongoose-unique-validator");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name for this role"],
    unique: true,
  },
  code: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
});

roleSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

roleSchema.pre("save", function (next) {
  this.code = slugify(this.name, { lower: true });
  next();
});

const Role = mongoose.model("Role", roleSchema);
module.exports = Role;
