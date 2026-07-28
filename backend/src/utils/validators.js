/**
 * Centralized Validation Utilities
 * Reduces duplicate validation code across services and controllers
 */

/**
 * Validate pagination parameters
 * @param {Object} params - Pagination parameters
 * @param {Object} defaults - Default values
 * @returns {Object} - Validated pagination parameters
 */
export const validatePagination = (params = {}, defaults = {}) => {
  const {
    page = defaults.page || 1,
    pageSize = defaults.pageSize || 20,
    orderBy = defaults.orderBy || 'id',
    orderDir = defaults.orderDir || 'ASC'
  } = params;

  // Validate page
  const pageNum = parseInt(page);
  if (isNaN(pageNum) || pageNum < 1) {
    throw new Error('Page must be a positive integer');
  }

  // Validate pageSize
  const pageSizeNum = parseInt(pageSize);
  const maxPageSize = defaults.maxPageSize || 100;
  if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > maxPageSize) {
    throw new Error(`Page size must be between 1 and ${maxPageSize}`);
  }

  // Validate orderDir
  const validOrderDirs = ['ASC', 'DESC', 'asc', 'desc'];
  const orderDirUpper = orderDir.toUpperCase();
  if (!validOrderDirs.includes(orderDirUpper)) {
    throw new Error('Order direction must be ASC or DESC');
  }

  return {
    page: pageNum,
    pageSize: pageSizeNum,
    offset: (pageNum - 1) * pageSizeNum,
    orderBy,
    orderDir: orderDirUpper
  };
};

/**
 * Validate ID parameter
 * @param {*} id - ID to validate
 * @param {string} name - Parameter name for error message
 * @returns {number} - Validated integer ID
 */
export const validateId = (id, name = 'ID') => {
  const parsed = parseInt(id);
  if (isNaN(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
};

/**
 * Validate date string (YYYY-MM-DD or ISO format)
 * @param {string} date - Date string to validate
 * @param {string} name - Parameter name for error message
 * @returns {string} - Validated date string
 */
export const validateDate = (date, name = 'Date') => {
  if (!date) return null;
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (!isoRegex.test(date)) {
      throw new Error(`${name} must be in YYYY-MM-DD or ISO format`);
    }
  }
  
  // Try to parse the date
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    throw new Error(`${name} is not a valid date`);
  }
  
  return date;
};

/**
 * Validate date range
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @param {string} startName - Start date parameter name
 * @param {string} endName - End date parameter name
 * @returns {Object} - Validated date range
 */
export const validateDateRange = (startDate, endDate, startName = 'startDate', endName = 'endDate') => {
  const start = validateDate(startDate, startName);
  const end = validateDate(endDate, endName);
  
  if (start && end && new Date(start) > new Date(end)) {
    throw new Error(`${startName} cannot be after ${endName}`);
  }
  
  return { startDate: start, endDate: end };
};

/**
 * Validate string length
 * @param {string} value - String to validate
 * @param {Object} options - Validation options
 * @param {string} options.name - Parameter name for error message
 * @param {number} options.min - Minimum length
 * @param {number} options.max - Maximum length
 * @returns {string} - Validated string
 */
export const validateString = (value, options = {}) => {
  const { name = 'Value', min = 0, max = Infinity, required = false } = options;
  
  if (required && !value) {
    throw new Error(`${name} is required`);
  }
  
  if (value && typeof value !== 'string') {
    throw new Error(`${name} must be a string`);
  }
  
  if (value && value.length < min) {
    throw new Error(`${name} must be at least ${min} characters`);
  }
  
  if (value && value.length > max) {
    throw new Error(`${name} must be at most ${max} characters`);
  }
  
  return value;
};

/**
 * Validate numeric range
 * @param {number|string} value - Numeric value to validate
 * @param {Object} options - Validation options
 * @param {string} options.name - Parameter name for error message
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @returns {number} - Validated number
 */
export const validateNumber = (value, options = {}) => {
  const { name = 'Value', min = -Infinity, max = Infinity, required = false } = options;
  
  if (required && value === undefined && value === null) {
    throw new Error(`${name} is required`);
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error(`${name} must be a number`);
  }
  
  if (num < min) {
    throw new Error(`${name} must be at least ${min}`);
  }
  
  if (num > max) {
    throw new Error(`${name} must be at most ${max}`);
  }
  
  return num;
};

/**
 * Validate currency amount (must be positive or zero)
 * @param {number|string} amount - Amount to validate
 * @param {string} name - Parameter name for error message
 * @returns {number} - Validated amount
 */
export const validateAmount = (amount, name = 'Amount') => {
  return validateNumber(amount, {
    name,
    min: 0,
    max: 9999999999.99,
    required: true
  });
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @param {string} name - Parameter name for error message
 * @returns {string} - Validated email
 */
export const validateEmail = (email, name = 'Email') => {
  if (!email) return email;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error(`${name} is not a valid email address`);
  }
  
  return email;
};

/**
 * Validate phone number (basic international format)
 * @param {string} phone - Phone number to validate
 * @param {string} name - Parameter name for error message
 * @returns {string} - Validated phone number
 */
export const validatePhone = (phone, name = 'Phone') => {
  if (!phone) return phone;
  
  const phoneRegex = /^[\d\s\-\+\(\)]{8,20}$/;
  if (!phoneRegex.test(phone)) {
    throw new Error(`${name} is not a valid phone number`);
  }
  
  return phone;
};

/**
 * Validate enum value
 * @param {string} value - Value to validate
 * @param {Array} validValues - Array of valid values
 * @param {string} name - Parameter name for error message
 * @returns {string} - Validated value
 */
export const validateEnum = (value, validValues, name = 'Value') => {
  if (value === undefined || value === null) return value;
  
  if (!validValues.includes(value)) {
    throw new Error(`${name} must be one of: ${validValues.join(', ')}`);
  }
  
  return value;
};

/**
 * Validate boolean value
 * @param {*} value - Value to validate
 * @param {string} name - Parameter name for error message
 * @returns {boolean} - Validated boolean
 */
export const validateBoolean = (value, name = 'Value') => {
  if (value === undefined || value === null) return value;
  
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
  }
  
  throw new Error(`${name} must be a boolean value`);
};

/**
 * Validate array of values
 * @param {Array} value - Array to validate
 * @param {Object} options - Validation options
 * @param {string} options.name - Parameter name for error message
 * @param {Function} options.validateItem - Function to validate each item
 * @param {number} options.minLength - Minimum array length
 * @param {number} options.maxLength - Maximum array length
 * @returns {Array} - Validated array
 */
export const validateArray = (value, options = {}) => {
  const { name = 'Array', validateItem = null, minLength = 0, maxLength = Infinity } = options;
  
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array`);
  }
  
  if (value.length < minLength) {
    throw new Error(`${name} must have at least ${minLength} items`);
  }
  
  if (value.length > maxLength) {
    throw new Error(`${name} must have at most ${maxLength} items`);
  }
  
  if (validateItem) {
    value.forEach((item, index) => {
      try {
        validateItem(item);
      } catch (error) {
        throw new Error(`${name}[${index}]: ${error.message}`);
      }
    });
  }
  
  return value;
};

/**
 * Create a validation chain
 * @param {...Function} validators - Validator functions to chain
 * @returns {Function} - Chained validator function
 */
export const chainValidators = (...validators) => {
  return (value, ...args) => {
    let result = value;
    for (const validator of validators) {
      result = validator(result, ...args);
    }
    return result;
  };
};

export default {
  validatePagination,
  validateId,
  validateDate,
  validateDateRange,
  validateString,
  validateNumber,
  validateAmount,
  validateEmail,
  validatePhone,
  validateEnum,
  validateBoolean,
  validateArray,
  chainValidators
};
