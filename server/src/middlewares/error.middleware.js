export const errorMiddleware = (err, req, res, next) => {
  const defaultError = {
    statuscode: 500,
    message: err,
  };

  if (err.name === "ValidationError") {
    defaultError.statuscode = 400;
    defaultError.message = Object.values(err.errors)
      .map((item) => item.message)
      .join(",");
  }

  if (err.code && err.code === 11000) {
    defaultError.statuscode = 400;
    defaultError.message = `${Object.keys(err.keyValue)} already in use`;
  }

  res.status(defaultError.statuscode).json({
    message: defaultError.message,
  });
};
