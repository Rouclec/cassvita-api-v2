const mongoose = require("mongoose");
const { uuid } = require("uuidv4");
const uniqueValidator = require("mongoose-unique-validator");

const bdcSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide the name for this bdc"],
  },
  id: { type: String, unique: true },
  size: {
    type: Number,
    required: [true, "Please enter the size for this BDC"],
  },
});

bdcSchema.plugin(uniqueValidator, {
  message: "{PATH} {VALUE} already in use, please try another!",
}); //enable beautifying on this schema

bdcSchema.pre("save", function (next) {
  this.id = uuid().slice(0, 7);
  next();
});
const BDC = mongoose.model("BDC", bdcSchema);
module.exports = BDC;
