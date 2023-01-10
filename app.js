const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

const app = express();

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json({ limit: "10kb" }));

const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);

module.exports = app;
