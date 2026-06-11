const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Assign validated/sanitized data back to request
    req.body = parsed.body || req.body;
    req.query = parsed.query || req.query;
    req.params = parsed.params || req.params;
    
    next();
  } catch (error) {
    const errorMessage = error.errors
      ? error.errors.map((e) => `${e.path.join('.').replace(/^(body|query|params)\./, '')}: ${e.message}`).join(', ')
      : error.message;

    return res.status(400).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = validate;
