const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  optionSuccessStatus: 200,
};

const app = express();

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json());

//use session to enable passing cookies between different domains
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: "session",
    cookie: {
      maxAge: 1000 * 60 * 60,
      sameSite: "none", //set to true if F.E. is on production
      secure: false,
    },
  })
);
app.use(express.json({ limit: "10kb" }));

const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");
const driverRouter = require("./routes/driverRoutes");
const farmerRouter = require("./routes/farmerRoutes");
const communityRouter = require("./routes/communityRoutes");
const roleRouter = require("./routes/roleRoutes");

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/driver", driverRouter);
app.use("/api/v1/farmer", farmerRouter);
app.use("/api/v1/community", communityRouter);
app.use("/api/v1/role", roleRouter);

module.exports = app;
