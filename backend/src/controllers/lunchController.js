import * as lunchService from '../services/lunchService.js';

/**
 * Lunch Controller
 * Route handlers for lunch management endpoints
 * 
 * Handles:
 * - HTTP request/response cycle
 * - Request validation
 * - Error handling
 * - Response formatting
 */

/**
 * Get paginated list of lunch payments
 * GET /api/lunch/payments
 * 
 * Query Parameters:
 * - studentId: Filter by student ID
 * - paymentType: Filter by payment type (daily, weekly, monthly)
 * - startDate: Filter by start date
 * - endDate: Filter by end date
 * - search: Search term for student
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20)
 * - orderBy: Field to order by (default: payment_date)
 * - orderDir: Order direction (default: DESC)
 */
export const getLunchPayments = (req, res) => {
  try {
    const {
      studentId,
      paymentType,
      startDate,
      endDate,
      search,
      page = 1,
      pageSize = 20,
      orderBy = 'lp.payment_date',
      orderDir = 'DESC'
    } = req.query;

    // Parse numeric parameters
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 20;
    const studentIdNum = studentId ? parseInt(studentId, 10) : undefined;

    const result = lunchService.getPaginatedLunchPayments({
      studentId: studentIdNum,
      paymentType,
      startDate,
      endDate,
      search,
      page: pageNum,
      pageSize: pageSizeNum,
      orderBy,
      orderDir
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all lunch payments (no pagination)
 * GET /api/lunch/payments/all
 */
export const getAllLunchPayments = (req, res) => {
  try {
    const { studentId, paymentType, startDate, endDate, search } = req.query;
    const studentIdNum = studentId ? parseInt(studentId, 10) : undefined;

    const payments = lunchService.getAllLunchPayments({
      studentId: studentIdNum,
      paymentType,
      startDate,
      endDate,
      search
    });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get a single lunch payment by ID
 * GET /api/lunch/payments/:id
 */
export const getLunchPaymentById = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid lunch payment ID'
      });
    }

    const payment = lunchService.getLunchPaymentById(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Lunch payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get lunch payments by student ID
 * GET /api/lunch/payments/student/:studentId
 */
export const getLunchPaymentsByStudentId = (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student ID'
      });
    }

    const payments = lunchService.getLunchPaymentsByStudentId(studentId);
    
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get lunch payments by date range
 * GET /api/lunch/payments/date-range
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 */
export const getLunchPaymentsByDateRange = (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Both startDate and endDate are required'
      });
    }

    const payments = lunchService.getLunchPaymentsByDateRange(startDate, endDate);
    
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a new lunch payment
 * POST /api/lunch/payments
 * 
 * Request Body:
 * - student_id (number, required): Student ID
 * - amount (number, required): Payment amount
 * - payment_date (string, required): Payment date (YYYY-MM-DD)
 * - payment_type (string): Payment type (daily, weekly, monthly) - default: daily
 * - start_date (string): Start date for the payment period (YYYY-MM-DD)
 * - end_date (string): End date for the payment period (YYYY-MM-DD)
 * - notes (string): Additional notes
 * - payment_method_id (number): Payment method ID
 * - created_by (number): User ID who created the record
 */
export const createLunchPayment = (req, res) => {
  try {
    const {
      student_id,
      amount,
      payment_date,
      payment_type = 'daily',
      start_date,
      end_date,
      notes,
      payment_method_id,
      created_by
    } = req.body;

    // Validate required fields
    if (!student_id || !amount || !payment_date) {
      return res.status(400).json({
        success: false,
        error: 'student_id, amount, and payment_date are required'
      });
    }

    // Validate amount
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Validate payment type
    const validPaymentTypes = ['daily', 'weekly', 'monthly'];
    if (payment_type && !validPaymentTypes.includes(payment_type)) {
      return res.status(400).json({
        success: false,
        error: `payment_type must be one of: ${validPaymentTypes.join(', ')}`
      });
    }

    // Create lunch payment with transaction
    const result = lunchService.createLunchPaymentWithTransaction({
      student_id,
      amount,
      payment_date,
      payment_type,
      start_date,
      end_date,
      notes,
      payment_method_id,
      created_by
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Lunch payment created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update an existing lunch payment
 * PUT /api/lunch/payments/:id
 * 
 * Request Body:
 * - student_id (number): Student ID
 * - amount (number): Payment amount
 * - payment_date (string): Payment date (YYYY-MM-DD)
 * - payment_type (string): Payment type (daily, weekly, monthly)
 * - start_date (string): Start date for the payment period
 * - end_date (string): End date for the payment period
 * - notes (string): Additional notes
 * - updated_by (number): User ID who updated the record
 */
export const updateLunchPayment = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid lunch payment ID'
      });
    }

    const updates = req.body;
    
    // Validate amount if provided
    if (updates.amount && (isNaN(parseFloat(updates.amount)) || parseFloat(updates.amount) <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Validate payment type if provided
    const validPaymentTypes = ['daily', 'weekly', 'monthly'];
    if (updates.payment_type && !validPaymentTypes.includes(updates.payment_type)) {
      return res.status(400).json({
        success: false,
        error: `payment_type must be one of: ${validPaymentTypes.join(', ')}`
      });
    }

    const result = lunchService.updateLunchPayment(id, updates);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Lunch payment not found'
      });
    }

    res.json({
      success: true,
      data: result,
      message: 'Lunch payment updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a lunch payment
 * DELETE /api/lunch/payments/:id
 */
export const deleteLunchPayment = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid lunch payment ID'
      });
    }

    const result = lunchService.deleteLunchPayment(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Lunch payment not found'
      });
    }

    res.json({
      success: true,
      message: 'Lunch payment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get lunch payment statistics
 * GET /api/lunch/payments/statistics
 */
export const getLunchPaymentStatistics = (req, res) => {
  try {
    const statistics = lunchService.getLunchPaymentStatistics();
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get lunch payment summary for a specific date
 * GET /api/lunch/payments/summary/:date
 */
export const getLunchPaymentSummaryByDate = (req, res) => {
  try {
    const date = req.params.date;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required'
      });
    }

    const summary = lunchService.getLunchPaymentSummaryByDate(date);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// Lunch Attendance Controllers
// ============================================

/**
 * Get paginated list of lunch attendance records
 * GET /api/lunch/attendance
 * 
 * Query Parameters:
 * - studentId: Filter by student ID
 * - date: Filter by specific date
 * - startDate: Filter by start date
 * - endDate: Filter by end date
 * - status: Filter by status (paid, unpaid, absent)
 * - search: Search term for student
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20)
 * - orderBy: Field to order by (default: date)
 * - orderDir: Order direction (default: DESC)
 */
export const getLunchAttendance = (req, res) => {
  try {
    const {
      studentId,
      date,
      startDate,
      endDate,
      status,
      search,
      page = 1,
      pageSize = 20,
      orderBy = 'la.date',
      orderDir = 'DESC'
    } = req.query;

    // Parse numeric parameters
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 20;
    const studentIdNum = studentId ? parseInt(studentId, 10) : undefined;

    const result = lunchService.getPaginatedLunchAttendance({
      studentId: studentIdNum,
      date,
      startDate,
      endDate,
      status,
      search,
      page: pageNum,
      pageSize: pageSizeNum,
      orderBy,
      orderDir
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all lunch attendance records (no pagination)
 * GET /api/lunch/attendance/all
 */
export const getAllLunchAttendance = (req, res) => {
  try {
    const { studentId, date, startDate, endDate, status, search } = req.query;
    const studentIdNum = studentId ? parseInt(studentId, 10) : undefined;

    const records = lunchService.getAllLunchAttendance({
      studentId: studentIdNum,
      date,
      startDate,
      endDate,
      status,
      search
    });

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get a single lunch attendance record by ID
 * GET /api/lunch/attendance/:id
 */
export const getLunchAttendanceById = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid lunch attendance ID'
      });
    }

    const record = lunchService.getLunchAttendanceById(id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Lunch attendance record not found'
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get lunch attendance for a specific date
 * GET /api/lunch/attendance/date/:date
 */
export const getLunchAttendanceByDate = (req, res) => {
  try {
    const date = req.params.date;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required'
      });
    }

    const records = lunchService.getLunchAttendanceByDate(date);
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get lunch attendance for a student
 * GET /api/lunch/attendance/student/:studentId
 */
export const getLunchAttendanceByStudentId = (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    const { startDate, endDate } = req.query;
    
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student ID'
      });
    }

    const records = lunchService.getLunchAttendanceByStudentId(studentId, startDate, endDate);
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a new lunch attendance record
 * POST /api/lunch/attendance
 * 
 * Request Body:
 * - student_id (number, required): Student ID
 * - date (string, required): Date (YYYY-MM-DD)
 * - status (string): Status (paid, unpaid, absent) - default: paid
 * - payment_id (number): Payment ID to link
 * - notes (string): Additional notes
 * - created_by (number): User ID who created the record
 */
export const createLunchAttendance = (req, res) => {
  try {
    const {
      student_id,
      date,
      status = 'paid',
      payment_id,
      notes,
      created_by
    } = req.body;

    // Validate required fields
    if (!student_id || !date) {
      return res.status(400).json({
        success: false,
        error: 'student_id and date are required'
      });
    }

    // Validate status
    const validStatuses = ['paid', 'unpaid', 'absent'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const record = lunchService.createLunchAttendance({
      student_id,
      date,
      status,
      payment_id,
      notes,
      created_by
    });

    res.status(201).json({
      success: true,
      data: record,
      message: 'Lunch attendance record created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update an existing lunch attendance record
 * PUT /api/lunch/attendance/:id
 * 
 * Request Body:
 * - student_id (number): Student ID
 * - date (string): Date (YYYY-MM-DD)
 * - status (string): Status (paid, unpaid, absent)
 * - payment_id (number): Payment ID to link
 * - notes (string): Additional notes
 * - updated_by (number): User ID who updated the record
 */
export const updateLunchAttendance = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid lunch attendance ID'
      });
    }

    const updates = req.body;
    
    // Validate status if provided
    const validStatuses = ['paid', 'unpaid', 'absent'];
    if (updates.status && !validStatuses.includes(updates.status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const record = lunchService.updateLunchAttendance(id, updates);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Lunch attendance record not found'
      });
    }

    res.json({
      success: true,
      data: record,
      message: 'Lunch attendance record updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a lunch attendance record
 * DELETE /api/lunch/attendance/:id
 */
export const deleteLunchAttendance = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid lunch attendance ID'
      });
    }

    const result = lunchService.deleteLunchAttendance(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Lunch attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Lunch attendance record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get lunch attendance statistics
 * GET /api/lunch/attendance/statistics
 */
export const getLunchAttendanceStatistics = (req, res) => {
  try {
    const statistics = lunchService.getLunchAttendanceStatistics();
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get lunch attendance summary for a specific date
 * GET /api/lunch/attendance/summary/:date
 */
export const getLunchAttendanceSummaryByDate = (req, res) => {
  try {
    const date = req.params.date;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required'
      });
    }

    const summary = lunchService.getLunchAttendanceSummaryByDate(date);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get students with unpaid lunch attendance (arrears)
 * GET /api/lunch/attendance/arrears
 * 
 * Query Parameters:
 * - startDate: Optional start date filter
 * - endDate: Optional end date filter
 */
export const getLunchArrears = (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const arrears = lunchService.getLunchArrears(startDate, endDate);
    
    res.json({
      success: true,
      data: arrears
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Record lunch attendance for multiple students on a specific date
 * POST /api/lunch/attendance/bulk
 * 
 * Request Body:
 * - date (string, required): Date (YYYY-MM-DD)
 * - studentIds (Array<number>, required): Array of student IDs
 * - status (string): Status (paid, unpaid, absent) - default: paid
 * - created_by (number): User ID who created the records
 */
export const recordBulkLunchAttendance = (req, res) => {
  try {
    const {
      date,
      studentIds = [],
      status = 'paid',
      created_by
    } = req.body;

    // Validate required fields
    if (!date || !studentIds || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'date and studentIds are required and studentIds must not be empty'
      });
    }

    // Validate status
    const validStatuses = ['paid', 'unpaid', 'absent'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const records = lunchService.recordBulkLunchAttendance(date, studentIds, status, created_by);
    
    res.status(201).json({
      success: true,
      data: records,
      message: `${records.length} lunch attendance records created successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Mark lunch attendance as paid for a student
 * POST /api/lunch/attendance/mark-paid
 * 
 * Request Body:
 * - student_id (number, required): Student ID
 * - date (string, required): Date (YYYY-MM-DD)
 * - payment_id (number): Payment ID to link
 * - updated_by (number): User ID who updated the record
 */
export const markLunchAttendanceAsPaid = (req, res) => {
  try {
    const {
      student_id,
      date,
      payment_id,
      updated_by
    } = req.body;

    // Validate required fields
    if (!student_id || !date) {
      return res.status(400).json({
        success: false,
        error: 'student_id and date are required'
      });
    }

    const record = lunchService.markLunchAttendanceAsPaid(student_id, date, payment_id, updated_by);
    
    res.status(201).json({
      success: true,
      data: record,
      message: 'Lunch attendance marked as paid successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  // Lunch Payment Controllers
  getLunchPayments,
  getAllLunchPayments,
  getLunchPaymentById,
  getLunchPaymentsByStudentId,
  getLunchPaymentsByDateRange,
  createLunchPayment,
  updateLunchPayment,
  deleteLunchPayment,
  getLunchPaymentStatistics,
  getLunchPaymentSummaryByDate,
  
  // Lunch Attendance Controllers
  getLunchAttendance,
  getAllLunchAttendance,
  getLunchAttendanceById,
  getLunchAttendanceByDate,
  getLunchAttendanceByStudentId,
  createLunchAttendance,
  updateLunchAttendance,
  deleteLunchAttendance,
  getLunchAttendanceStatistics,
  getLunchAttendanceSummaryByDate,
  getLunchArrears,
  recordBulkLunchAttendance,
  markLunchAttendanceAsPaid
};
