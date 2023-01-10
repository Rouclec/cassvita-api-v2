const express = require("express");

const app = express();

app.use(express.json({ limit: "10kb" }));

const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);

module.exports = app;
