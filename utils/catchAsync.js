module.exports = (fxn) => {
  return async (req, res, next) => {
    fxn(req, res, next).catch((err) => {
      if (err.name === "ValidationError") {
        return next(
          res.status(500).json({
            status: "Server Error",
            message: err.message.split(",")[0],
            // message: err.name,
          })
        );
      } else if (err.name === "JsonWebTokenError") {
        return next(
          res.status(500).json({
            status: "Server Error",
            message: err.message,
          })
        );
      } else {
        next(err);
      }
    });
  };
};
