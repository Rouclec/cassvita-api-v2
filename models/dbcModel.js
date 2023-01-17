const mongoose = require("mongoose");
const { uuid } = require("uuidv4");

const bdcSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide the name for this bdc"],
  },
  id: String,
  size: {
    type: Number,
    required: [true, "Please enter the size for this BDC"],
  },
});

bdcSchema.pre("save", function (next) {
  this.id = uuid();
  next();
});
const BDC = mongoose.model("bdc", bdcSchema);
module.exports = BDC;
