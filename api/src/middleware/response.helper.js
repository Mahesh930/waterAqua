module.exports = (req, res, next) => {
  res.success = (data, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  };

  res.error = (message, statusCode = 500) => {
    return res.status(statusCode).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    });
  };

  next();
};
