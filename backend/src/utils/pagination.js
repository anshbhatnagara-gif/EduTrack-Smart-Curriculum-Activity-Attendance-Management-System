const getPaginationParams = (query, defaultLimit = 10, maxLimit = 100) => {
  const page = parseInt(query.page || '1', 10);
  let limit = parseInt(query.limit || defaultLimit.toString(), 10);

  if (isNaN(page) || page <= 0) {
    page = 1;
  }
  if (isNaN(limit) || limit <= 0) {
    limit = defaultLimit;
  }
  if (limit > maxLimit) {
    limit = maxLimit;
  }

  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset
  };
};

const formatPaginatedResponse = (data, totalRecords, page, limit) => {
  const totalPages = Math.ceil(totalRecords / limit);
  return {
    results: data,
    pagination: {
      totalRecords,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

module.exports = {
  getPaginationParams,
  formatPaginatedResponse
};
