const paginate = async (model, filter = {}, req = {}, populateOptions = [], selectFields = '', sortOptions = { createdAt: -1 }) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  let query = model.find(filter).skip(skip).limit(limit).sort(sortOptions);

  if (selectFields) {
    query = query.select(selectFields);
  }

  if (populateOptions && populateOptions.length > 0) {
    populateOptions.forEach(opt => {
      query = query.populate(opt);
    });
  }

  const [results, total] = await Promise.all([
    query,
    model.countDocuments(filter)
  ]);

  return {
    results,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = paginate;
