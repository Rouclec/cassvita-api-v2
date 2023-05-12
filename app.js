const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://cassvita-web.vercel.app",
    "https://cassvita.vercel.app",
    "https://app.cassvita.com",
  ],
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
const purchaseOrderRouter = require("./routes/purchaseOrderRoutes");
const procurementRouter = require("./routes/procurementRoutes");
const paymentRouter = require("./routes/paymentRoutes");

app.use("/api/v2/auth", authRouter);
app.use("/api/v2/user", userRouter);
app.use("/api/v2/driver", driverRouter);
app.use("/api/v2/farmer", farmerRouter);
app.use("/api/v2/community", communityRouter);
app.use("/api/v2/role", roleRouter);
app.use("/api/v2/purchase-order", purchaseOrderRouter);
app.use("/api/v2/procurement", procurementRouter);
app.use("/api/v2/payment", paymentRouter);

module.exports = app;
