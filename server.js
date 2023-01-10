const mongoose = require("mongoose");
require("dotenv").config()

const app = require("./app");

console.log("process env variable: ", process.env.DATABASE_CONNECTION_STRING);

const DB = process.env.DATABASE_CONNECTION_STRING.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);
mongoose
  .set("strictQuery", true)
  .connect(DB)
  .then(() => {
    console.log("Connection Successful!");
  });

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("App is running on port : ", port);
});