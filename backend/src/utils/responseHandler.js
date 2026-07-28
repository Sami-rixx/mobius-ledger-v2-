/**
 * Response Handler Utility
 * Standardized response formatting for API endpoints
 * Reduces code duplication in controllers
 */

/**
 * Standard success response
 * @param {Object} res - Express response object
 * @param {Object|Array} data - Response data
 * @param {Object} options - Additional response options
 * @param {string} options.message - Success message
 * @param {number} options.statusCode - HTTP status code (default: 200)
 * @param {Object} options.meta - Additional metadata (pagination, stats, etc.)
 */
export const successResponse = (res, data = null, options = {}) => {
  const {
    message = 'Request successful',
    statusCode = 200,
    meta = null
  } = options;

  const response = {
    success: true,
    message,
    ...(data !== null && data !== undefined && { data }),
    ...(meta && { meta })
  };

  return res.status(statusCode).json(response);
};

/**
 * Paginated success response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination information
 * @param {number} pagination.page - Current page
 * @param {number} pagination.pageSize - Items per page
 * @param {number} pagination.total - Total number of items
 * @param {number} pagination.totalPages - Total number of pages
 * @param {Object} options - Additional options
 */
export const paginatedResponse = (res, data, pagination, options = {}) => {
  const { message = 'Request successful', statusCode = 200 } = options;

  const response = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page || 1,
      pageSize: pagination.pageSize || 20,
      total: pagination.total || 0,
      totalPages: pagination.totalPages || Math.ceil((pagination.total || 0) / (pagination.pageSize || 20)) || 1,
      hasNext: pagination.hasNext || ((pagination.page || 1) < (pagination.totalPages || 1)),
      hasPrevious: pagination.hasPrevious || ((pagination.page || 1) > 1)
    }
  };

  return res.status(statusCode).json(response);
};

/**
 * Created/updated success response
 * @param {Object} res - Express response object
 * @param {Object} data - Created/updated data
 * @param {Object} options - Additional options
 * @param {string} options.message - Success message (default: 'Resource created successfully')
 * @param {number} options.statusCode - HTTP status code (default: 201 for create, 200 for update)
 */
export const createdResponse = (res, data = null, options = {}) => {
  const {
    message = 'Resource created successfully',
    statusCode = 201
  } = options;

  return successResponse(res, data, { message, statusCode });
};

export const updatedResponse = (res, data = null, options = {}) => {
  const {
    message = 'Resource updated successfully',
    statusCode = 200
  } = options;

  return successResponse(res, data, { message, statusCode });
};

/**
 * Deleted success response
 * @param {Object} res - Express response object
 * @param {Object} options - Additional options
 */
export const deletedResponse = (res, options = {}) => {
  const {
    message = 'Resource deleted successfully',
    statusCode = 200
  } = options;

  return successResponse(res, null, { message, statusCode });
};

/**
 * Error response helper
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {Object} options - Additional options
 */
export const errorResponse = (res, error, options = {}) => {
  const {
    message = error.message || 'An error occurred',
    statusCode = error.statusCode || 500,
    includeStack = false
  } = options;

  const response = {
    success: false,
    error: true,
    message,
    ...(error.code && { code: error.code }),
    ...(includeStack && process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  return res.status(statusCode).json(response);
};

/**
 * Standard not found response
 * @param {Object} res - Express response object
 * @param {string} message - Not found message
 */
export const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, { message, statusCode: 404 }, { includeStack: false });
};

/**
 * Standard validation error response
 * @param {Object} res - Express response object
 * @param {string|Array} errors - Validation error(s)
 */
export const validationErrorResponse = (res, errors) => {
  const message = Array.isArray(errors) ? 'Validation failed' : errors;
  const errorDetails = Array.isArray(errors) ? errors : [errors];

  return errorResponse(res, {
    message,
    statusCode: 400,
    errors: errorDetails
  }, { includeStack: false });
};

/**
 * Standard count response
 * @param {Object} res - Express response object
 * @param {number} count - Total count
 * @param {Object} options - Additional options
 */
export const countResponse = (res, count, options = {}) => {
  const { message = 'Count retrieved successfully', statusCode = 200 } = options;

  return successResponse(res, { count }, { message, statusCode });
};

/**
 * Standard statistics response
 * @param {Object} res - Express response object
 * @param {Object} stats - Statistics data
 * @param {Object} options - Additional options
 */
export const statsResponse = (res, stats, options = {}) => {
  const { message = 'Statistics retrieved successfully', statusCode = 200 } = options;

  return successResponse(res, stats, { message, statusCode });
};

export default {
  successResponse,
  paginatedResponse,
  createdResponse,
  updatedResponse,
  deletedResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  countResponse,
  statsResponse
};
