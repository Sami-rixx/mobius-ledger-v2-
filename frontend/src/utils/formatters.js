/**
 * Utility functions for formatting data
 */

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} [currency='KES'] - Currency code
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount, currency = 'KES') {
  if (amount === null || amount === undefined) return '';
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return '';
  
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
}

/**
 * Format date
 * @param {string|Date} date - Date to format
 * @param {string} [format='medium'] - Date format (short, medium, long, full)
 * @returns {string} - Formatted date string
 */
export function formatDate(date, format = 'medium') {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const options = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  };
  
  return dateObj.toLocaleDateString('en-KE', options[format] || options.medium);
}

/**
 * Format time
 * @param {string|Date} date - Date to format
 * @param {boolean} [showSeconds=false] - Whether to show seconds
 * @returns {string} - Formatted time string
 */
export function formatTime(date, showSeconds = false) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: false
  };
  
  return dateObj.toLocaleTimeString('en-KE', options);
}

/**
 * Format date and time together
 * @param {string|Date} date - Date to format
 * @param {string} [dateFormat='medium'] - Date format
 * @param {boolean} [showSeconds=false] - Whether to show seconds
 * @returns {string} - Formatted date and time string
 */
export function formatDateTime(date, dateFormat = 'medium', showSeconds = false) {
  const formattedDate = formatDate(date, dateFormat);
  const formattedTime = formatTime(date, showSeconds);
  return `${formattedDate} ${formattedTime}`;
}

/**
 * Format receipt number
 * @param {string} receiptNumber - Receipt number to format
 * @returns {string} - Formatted receipt number
 */
export function formatReceiptNumber(receiptNumber) {
  if (!receiptNumber) return '';
  return receiptNumber;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} [maxLength=50] - Maximum length
 * @returns {string} - Truncated text
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Capitalize first letter
 * @param {string} text - Text to capitalize
 * @returns {string} - Capitalized text
 */
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Generate initials from name
 * @param {string} name - Full name
 * @returns {string} - Initials (up to 2 characters)
 */
export function getInitials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
export function formatPhone(phone) {
  if (!phone) return '';
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as +254 XXX XXX XXX or 0XXX XXX XXX
  if (digits.startsWith('254')) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  } else if (digits.startsWith('0')) {
    return `${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  
  return phone;
}
