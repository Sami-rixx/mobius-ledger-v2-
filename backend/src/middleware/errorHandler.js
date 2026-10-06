/**
 * Global error handler middleware
 * Handles all unhandled errors and sends appropriate responses
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle SQLite errors WITHOUT leaking raw SQL/constraint internals to
  // clients (specification §9). Full details stay in the server log above.
  if (typeof err.code === 'string' && err.code.startsWith('SQLITE_')) {
    if (err.code.startsWith('SQLITE_CONSTRAINT')) {
      statusCode = 400;
      message = 'The request conflicts with existing data and could not be completed';
    } else {
      statusCode = 500;
      message = 'A database error occurred';
    }
  }

  // Never leak internal 500 error details in production responses.
  if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // Handle not found errors
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

export class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

export class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
  }
}
