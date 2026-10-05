/**
 * Global error handler middleware
 * Handles all unhandled errors and sends appropriate responses.
 *
 * SECURITY: raw SQLite error text (which can include table/column names
 * and constraint internals) and stack traces must never reach the client
 * in production - only the generic, hand-authored messages from our own
 * ValidationError/NotFoundError classes are considered safe to echo back
 * verbatim, since we wrote them ourselves. Everything else collapses to a
 * generic message in production while the full detail is always logged
 * server-side.
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Default error
  let statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  let message = isProduction ? 'An unexpected error occurred. Please try again or contact support.' : (err.message || 'Internal Server Error');

  // Handle SQLite constraint errors - never echo the raw driver message
  // (it can reveal table/column names and constraint internals).
  if (err.code && String(err.code).startsWith('SQLITE_')) {
    statusCode = 400;
    message = isProduction ? 'The request could not be completed due to a data constraint.' : 'Database constraint violation: ' + err.message;
  }

  // Handle validation errors - these are hand-authored by our own code and
  // safe to return verbatim in any environment.
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // Handle not found errors - also hand-authored and safe.
  if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    error: true,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Custom error classes
export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

export class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
  }
}
