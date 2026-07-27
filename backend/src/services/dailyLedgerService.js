import {
  getById,
  getByDate,
  getAll,
  getByMonth,
  getRecent,
  getToday,
  getYesterday,
  count,
  create,
  update,
  deleteById,
  getStatistics,
  getMissingDates,
  generateForDate,
  generateForDateRange,
  TABLE,
  FIELDS
} from '../models/DailyLedger.js';

/**
 * DailyLedger Service
 * Business logic layer for daily ledger operations
 * 
 * Handles:
 * - Data validation
 * - Pagination
 * - Date range processing
 * - Ledger generation
 * - Business rule enforcement
 */

// Validation constants
const DAILY_LEDGER_VALIDATION = {
  DATE_REGEX: /^\d{4}-\d{2}-\d{2}$/,
  MIN_DATE: '2000-01-01',
  MAX_DATE: '2099-12-31',
  MIN_AMOUNT: -999999999.99,
  MAX_AMOUNT: 999999999.99,
  MIN_TRANSACTION_COUNT: 0,
  MAX_TRANSACTION_COUNT: 10000,
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 1000
};

/**
 * Validate date format and range
 * @param {string} date - Date string in YYYY-MM-DD format
 * @param {string} fieldName - Name of the field for error messages
 * @returns {string|null} - Error message or null if valid
 */
function validateDate(date, fieldName = 'date') {
  if (!date) return `${fieldName} is required`;
  if (typeof date !== 'string') return `${fieldName} must be a string`;
  if (!DAILY_LEDGER_VALIDATION.DATE_REGEX.test(date)) {
    return `${fieldName} must be in YYYY-MM-DD format`;
  }
  if (date < DAILY_LEDGER_VALIDATION.MIN_DATE || date > DAILY_LEDGER_VALIDATION.MAX_DATE) {
    return `${fieldName} must be between ${DAILY_LEDGER_VALIDATION.MIN_DATE} and ${DAILY_LEDGER_VALIDATION.MAX_DATE}`;
  }
  return null;
}

/**
 * Validate numeric value
 * @param {number} value - Numeric value
 * @param {string} fieldName - Name of the field for error messages
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {string|null} - Error message or null if valid
 */
function validateNumber(value, fieldName, min, max) {
  if (value === undefined || value === null) return null; // Optional field
  if (typeof value !== 'number' && typeof value !== 'string') {
    return `${fieldName} must be a number`;
  }
  const num = parseFloat(value);
  if (isNaN(num)) return `${fieldName} must be a valid number`;
  if (num < min || num > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return null;
}

/**
 * Validate daily ledger data
 * @param {Object} data - Data to validate
 * @param {boolean} isUpdate - Whether this is an update operation (id required)
 * @returns {Object} - Validation result with isValid and errors
 */
export function validateDailyLedgerData(data, isUpdate = false) {
  const errors = [];
  
  // Validate required fields for create
  if (!isUpdate) {
    if (!data.date) {
      errors.push('date is required');
    }
  }
  
  // Validate date
  if (data.date) {
    const dateError = validateDate(data.date, 'date');
    if (dateError) errors.push(dateError);
  }
  
  // Validate amounts
  const amountFields = [
    { field: 'opening_balance', min: DAILY_LEDGER_VALIDATION.MIN_AMOUNT, max: DAILY_LEDGER_VALIDATION.MAX_AMOUNT },
    { field: 'total_income', min: 0, max: DAILY_LEDGER_VALIDATION.MAX_AMOUNT },
    { field: 'total_expenses', min: 0, max: DAILY_LEDGER_VALIDATION.MAX_AMOUNT },
    { field: 'closing_balance', min: DAILY_LEDGER_VALIDATION.MIN_AMOUNT, max: DAILY_LEDGER_VALIDATION.MAX_AMOUNT },
    { field: 'net_movement', min: DAILY_LEDGER_VALIDATION.MIN_AMOUNT, max: DAILY_LEDGER_VALIDATION.MAX_AMOUNT }
  ];
  
  for (const { field, min, max } of amountFields) {
    if (data[field] !== undefined && data[field] !== null) {
      const error = validateNumber(data[field], field, min, max);
      if (error) errors.push(error);
    }
  }
  
  // Validate transaction count
  if (data.transaction_count !== undefined && data.transaction_count !== null) {
    const error = validateNumber(
      data.transaction_count,
      'transaction_count',
      DAILY_LEDGER_VALIDATION.MIN_TRANSACTION_COUNT,
      DAILY_LEDGER_VALIDATION.MAX_TRANSACTION_COUNT
    );
    if (error) errors.push(error);
    if (data.transaction_count % 1 !== 0) {
      errors.push('transaction_count must be an integer');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create pagination parameters
 * @param {number} page - Page number
 * @param {number} pageSize - Number of items per page
 * @returns {Object} - Pagination parameters
 */
export function createPaginationParams(page = DAILY_LEDGER_VALIDATION.DEFAULT_PAGE, pageSize = DAILY_LEDGER_VALIDATION.DEFAULT_PAGE_SIZE) {
  const parsedPage = parseInt(page) || DAILY_LEDGER_VALIDATION.DEFAULT_PAGE;
  const parsedPageSize = parseInt(pageSize) || DAILY_LEDGER_VALIDATION.DEFAULT_PAGE_SIZE;
  
  return {
    page: Math.max(1, parsedPage),
    pageSize: Math.min(Math.max(1, parsedPageSize), DAILY_LEDGER_VALIDATION.MAX_PAGE_SIZE),
    offset: (Math.max(1, parsedPage) - 1) * Math.min(Math.max(1, parsedPageSize), DAILY_LEDGER_VALIDATION.MAX_PAGE_SIZE)
  };
}

/**
 * Get paginated daily ledger records
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Filter by start date
 * @param {string} params.endDate - Filter by end date
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Number of items per page
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDirection - ASC or DESC
 * @returns {Promise<Object>} - Paginated results with data and metadata
 */
export async function getPaginatedDailyLedgers(params = {}) {
  const { page, pageSize, offset } = createPaginationParams(params.page, params.pageSize);
  
  // Validate date range
  let dateError = null;
  if (params.startDate) {
    dateError = validateDate(params.startDate, 'startDate');
  }
  if (!dateError && params.endDate) {
    dateError = validateDate(params.endDate, 'endDate');
  }
  if (dateError) {
    throw new Error(dateError);
  }
  
  // Validate orderBy
  const validOrderFields = Object.values(FIELDS);
  const orderBy = params.orderBy && validOrderFields.includes(params.orderBy) ? params.orderBy : FIELDS.DATE;
  const orderDirection = params.orderDirection === 'ASC' ? 'ASC' : 'DESC';
  
  const data = await getAll({
    startDate: params.startDate,
    endDate: params.endDate,
    limit: pageSize,
    offset,
    orderBy,
    orderDirection
  });
  
  const total = await count({
    startDate: params.startDate,
    endDate: params.endDate
  });
  
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: offset + pageSize < total,
      hasPrevious: page > 1
    }
  };
}

/**
 * Get daily ledger by ID with validation
 * @param {number} id - Ledger record ID
 * @returns {Promise<Object>} - Ledger record
 */
export async function getDailyLedgerById(id) {
  if (!id || typeof id !== 'number' && typeof id !== 'string') {
    throw new Error('id must be a number');
  }
  
  const ledger = await getById(parseInt(id));
  if (!ledger) {
    throw new Error(`Daily ledger record with id ${id} not found`);
  }
  return ledger;
}

/**
 * Get daily ledger by date with validation
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} - Ledger record
 */
export async function getDailyLedgerByDate(date) {
  const dateError = validateDate(date, 'date');
  if (dateError) {
    throw new Error(dateError);
  }
  
  const ledger = await getByDate(date);
  if (!ledger) {
    throw new Error(`Daily ledger record for date ${date} not found`);
  }
  return ledger;
}

/**
 * Get today's ledger
 * @returns {Promise<Object|null>} - Today's ledger record or null
 */
export async function getTodayLedger() {
  return getToday();
}

/**
 * Get yesterday's ledger
 * @returns {Promise<Object|null>} - Yesterday's ledger record or null
 */
export async function getYesterdayLedger() {
  return getYesterday();
}

/**
 * Get recent ledgers
 * @param {number} limit - Number of recent records to return
 * @returns {Promise<Array>} - Array of recent ledger records
 */
export async function getRecentLedgers(limit = 10) {
  if (limit < 1 || limit > 100) {
    throw new Error('limit must be between 1 and 100');
  }
  return getRecent(limit);
}

/**
 * Get ledgers for a specific month
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<Array>} - Array of ledger records for the month
 */
export async function getMonthlyLedgers(year, month) {
  if (!year || year < 2000 || year > 2100) {
    throw new Error('year must be between 2000 and 2100');
  }
  if (!month || month < 1 || month > 12) {
    throw new Error('month must be between 1 and 12');
  }
  return getByMonth(year, month);
}

/**
 * Get ledger statistics for a date range
 * @param {Object} params - Parameters
 * @param {string} params.startDate - Start date
 * @param {string} params.endDate - End date
 * @returns {Promise<Object>} - Statistics object
 */
export async function getDailyLedgerStatistics(params = {}) {
  // Validate date range
  if (params.startDate) {
    const dateError = validateDate(params.startDate, 'startDate');
    if (dateError) throw new Error(dateError);
  }
  if (params.endDate) {
    const dateError = validateDate(params.endDate, 'endDate');
    if (dateError) throw new Error(dateError);
  }
  if (params.startDate && params.endDate && params.startDate > params.endDate) {
    throw new Error('startDate must be less than or equal to endDate');
  }
  
  return getStatistics(params);
}

/**
 * Create a new daily ledger record
 * @param {Object} data - Ledger data
 * @returns {Promise<Object>} - Created ledger record
 */
export async function createDailyLedger(data) {
  const validation = validateDailyLedgerData(data, false);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }
  
  // Check for existing ledger on the same date
  if (data.date) {
    const existing = await getByDate(data.date);
    if (existing) {
      throw new Error(`Daily ledger for date ${data.date} already exists`);
    }
  }
  
  return create(data);
}

/**
 * Update an existing daily ledger record
 * @param {number} id - Ledger record ID
 * @param {Object} data - Ledger data to update
 * @returns {Promise<Object>} - Updated ledger record
 */
export async function updateDailyLedger(id, data) {
  const validation = validateDailyLedgerData(data, true);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }
  
  const existing = await getById(id);
  if (!existing) {
    throw new Error(`Daily ledger record with id ${id} not found`);
  }
  
  // Check for duplicate date
  if (data.date && data.date !== existing.date) {
    const duplicate = await getByDate(data.date);
    if (duplicate && duplicate.id !== id) {
      throw new Error(`Daily ledger for date ${data.date} already exists`);
    }
  }
  
  return update(id, data);
}

/**
 * Delete a daily ledger record
 * @param {number} id - Ledger record ID
 * @returns {Promise<Object>} - Deletion result
 */
export async function deleteDailyLedger(id) {
  if (!id || typeof id !== 'number' && typeof id !== 'string') {
    throw new Error('id must be a number');
  }
  
  const success = await deleteById(parseInt(id));
  if (!success) {
    throw new Error(`Daily ledger record with id ${id} not found`);
  }
  return { success: true, message: `Daily ledger record ${id} deleted` };
}

/**
 * Get missing dates in the ledger sequence
 * @param {Object} params - Parameters
 * @param {string} params.startDate - Start date
 * @param {string} params.endDate - End date
 * @returns {Promise<Array>} - Array of missing dates
 */
export async function getMissingLedgerDates(params = {}) {
  // Validate date range
  if (params.startDate) {
    const dateError = validateDate(params.startDate, 'startDate');
    if (dateError) throw new Error(dateError);
  }
  if (params.endDate) {
    const dateError = validateDate(params.endDate, 'endDate');
    if (dateError) throw new Error(dateError);
  }
  
  return getMissingDates(params);
}

/**
 * Generate ledger for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} - Generated ledger data
 */
export async function generateLedgerForDate(date) {
  const dateError = validateDate(date, 'date');
  if (dateError) {
    throw new Error(dateError);
  }
  return generateForDate(date);
}

/**
 * Generate ledger for a date range
 * @param {Object} params - Parameters
 * @param {string} params.startDate - Start date
 * @param {string} params.endDate - End date
 * @param {boolean} params.force - Force regeneration even if records exist
 * @returns {Promise<Array>} - Array of generated ledger records
 */
export async function generateLedgerForDateRange(params = {}) {
  const { startDate, endDate, force = false } = params;
  
  // Validate date range
  if (startDate) {
    const dateError = validateDate(startDate, 'startDate');
    if (dateError) throw new Error(dateError);
  }
  if (endDate) {
    const dateError = validateDate(endDate, 'endDate');
    if (dateError) throw new Error(dateError);
  }
  if (startDate && endDate && startDate > endDate) {
    throw new Error('startDate must be less than or equal to endDate');
  }
  
  return generateForDateRange(params);
}

/**
 * Fill missing ledger dates by generating ledgers
 * @param {Object} params - Parameters
 * @param {string} params.startDate - Start date
 * @param {string} params.endDate - End date
 * @returns {Promise<Object>} - Result with filled count and missing dates
 */
export async function fillMissingLedgerDates(params = {}) {
  const missingDates = await getMissingLedgerDates(params);
  
  const results = [];
  for (const date of missingDates) {
    try {
      const generated = await generateLedgerForDate(date);
      await create(generated);
      results.push({ date, success: true, message: 'Ledger generated and created' });
    } catch (error) {
      results.push({ date, success: false, message: error.message });
    }
  }
  
  return {
    totalMissing: missingDates.length,
    filledCount: results.filter(r => r.success).length,
    results
  };
}

/**
 * Get ledger summary for dashboard
 * @param {Object} params - Parameters
 * @param {number} params.days - Number of recent days to include
 * @returns {Promise<Object>} - Summary data for dashboard
 */
export async function getLedgerSummary(params = {}) {
  const { days = 30 } = params;
  
  if (days < 1 || days > 365) {
    throw new Error('days must be between 1 and 365');
  }
  
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];
  
  const stats = await getDailyLedgerStatistics({ startDate: startDateStr, endDate });
  const recent = await getRecent(7);
  
  return {
    summary: stats,
    recentDays: recent,
    period: { startDate: startDateStr, endDate, days }
  };
}

// Export validation constants
export { DAILY_LEDGER_VALIDATION };

// Export table and field constants for external use
export { TABLE, FIELDS };
