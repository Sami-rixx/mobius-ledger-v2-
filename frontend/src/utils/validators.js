/**
 * Utility functions for data validation
 */

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Kenyan format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Whether phone is valid
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  const phoneRegex = /^(\+254|0)[1-9]\d{8,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate positive number
 * @param {number|string} value - Value to validate
 * @returns {boolean} - Whether value is a positive number
 */
export function isPositiveNumber(value) {
  if (value === null || value === undefined) return false;
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(numericValue) && numericValue > 0;
}

/**
 * Validate non-negative number
 * @param {number|string} value - Value to validate
 * @returns {boolean} - Whether value is a non-negative number
 */
export function isNonNegativeNumber(value) {
  if (value === null || value === undefined) return false;
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(numericValue) && numericValue >= 0;
}

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean} - Whether value is present
 */
export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate string length
 * @param {string} value - String to validate
 * @param {number} min - Minimum length
 * @param {number} [max] - Maximum length
 * @returns {boolean} - Whether string length is valid
 */
export function isValidLength(value, min, max) {
  if (!value) return false;
  const length = value.toString().length;
  if (length < min) return false;
  if (max !== undefined && length > max) return false;
  return true;
}

/**
 * Validate date is not in the future
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - Whether date is valid
 */
export function isValidDate(date) {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return !isNaN(dateObj.getTime());
}

/**
 * Validate date is not in the future
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - Whether date is not in the future
 */
export function isDateNotInFuture(date) {
  if (!isValidDate(date)) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj <= today;
}

/**
 * Validate date is in the future
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - Whether date is in the future
 */
export function isDateInFuture(date) {
  if (!isValidDate(date)) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj > today;
}

/**
 * Validate receipt number format
 * @param {string} receiptNumber - Receipt number to validate
 * @returns {boolean} - Whether receipt number is valid
 */
export function isValidReceiptNumber(receiptNumber) {
  if (!receiptNumber) return false;
  const receiptRegex = /^[A-Z]{2,4}-\d{4}-\d{6}$/;
  return receiptRegex.test(receiptNumber);
}

/**
 * Validate student admission number
 * @param {string} admissionNumber - Admission number to validate
 * @returns {boolean} - Whether admission number is valid
 */
export function isValidAdmissionNumber(admissionNumber) {
  if (!admissionNumber) return false;
  // Basic validation: alphanumeric, 3-20 characters
  const admissionRegex = /^[a-zA-Z0-9]{3,20}$/;
  return admissionRegex.test(admissionNumber);
}

/**
 * Get validation error message
 * @param {string} fieldName - Name of the field
 * @param {string} validationType - Type of validation that failed
 * @returns {string} - Error message
 */
export function getValidationError(fieldName, validationType) {
  const messages = {
    required: `${fieldName} is required`,
    email: `${fieldName} must be a valid email address`,
    phone: `${fieldName} must be a valid phone number`,
    positive: `${fieldName} must be a positive number`,
    nonNegative: `${fieldName} must be a non-negative number`,
    minLength: `${fieldName} is too short`,
    maxLength: `${fieldName} is too long`,
    date: `${fieldName} must be a valid date`,
    futureDate: `${fieldName} cannot be in the future`,
    pastDate: `${fieldName} must be in the future`,
    receiptNumber: `${fieldName} must be in the format ML-YYYY-######`,
    admissionNumber: `${fieldName} must be 3-20 alphanumeric characters`
  };
  
  return messages[validationType] || `${fieldName} is invalid`;
}
