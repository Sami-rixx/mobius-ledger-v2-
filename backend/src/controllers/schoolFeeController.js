import * as schoolFeeService from '../services/schoolFeeService.js';

/**
 * School Fee Controller
 * Route handlers for school fee management endpoints
 * 
 * Handles:
 * - HTTP request/response cycle
 * - Request validation
 * - Error handling
 * - Response formatting
 */

/**
 * Get paginated list of school fee payments
 * GET /api/school-fees
 * 
 * Query Parameters:
 * - studentId: Filter by student ID
 * - academicYear: Filter by academic year
 * - term: Filter by term
 * - search: Search term for student
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20)
 * - orderBy: Field to order by (default: payment_date)
 * - orderDir: Order direction (default: DESC)
 */
export const getSchoolFeePayments = (req, res) => {
  try {
    const {
      studentId,
      academicYear,
      term,
      search,
      page = 1,
      pageSize = 20,
      orderBy = 'sfp.payment_date',
      orderDir = 'DESC'
    } = req.query;

    // Parse numeric parameters
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 20;
    const studentIdNum = studentId ? parseInt(studentId, 10) : undefined;

    const result = schoolFeeService.getPaginatedSchoolFeePayments({
      studentId: studentIdNum,
      academicYear,
      term,
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
 * Get all school fee payments (no pagination)
 * GET /api/school-fees/all
 */
export const getAllSchoolFeePayments = (req, res) => {
  try {
    const { studentId, academicYear, term, search } = req.query;
    const studentIdNum = studentId ? parseInt(studentId, 10) : undefined;

    const payments = schoolFeeService.getAllSchoolFeePayments({
      studentId: studentIdNum,
      academicYear,
      term,
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
 * Get a single school fee payment by ID
 * GET /api/school-fees/:id
 */
export const getSchoolFeePaymentById = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid school fee payment ID'
      });
    }

    const payment = schoolFeeService.getSchoolFeePaymentById(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'School fee payment not found'
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
 * Get school fee payments by student ID
 * GET /api/school-fees/student/:studentId
 */
export const getSchoolFeePaymentsByStudent = (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student ID'
      });
    }

    const payments = schoolFeeService.getSchoolFeePaymentsByStudent(studentId);
    
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
 * Get a student's current school fee balance
 * GET /api/school-fees/balance/:studentId
 */
export const getStudentSchoolFeeBalance = (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student ID'
      });
    }

    const balance = schoolFeeService.getStudentSchoolFeeBalance(studentId);
    
    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all students in arrears
 * GET /api/school-fees/arrears
 * 
 * Query Parameters:
 * - academicYear: Filter by academic year
 * - term: Filter by term
 */
export const getStudentsInArrears = (req, res) => {
  try {
    const { academicYear, term } = req.query;
    
    const students = schoolFeeService.getStudentsInArrears(academicYear, term);
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get school fee statistics
 * GET /api/school-fees/statistics
 * 
 * Query Parameters:
 * - academicYear: Filter by academic year
 * - term: Filter by term
 */
export const getSchoolFeeStatistics = (req, res) => {
  try {
    const { academicYear, term } = req.query;
    
    const stats = schoolFeeService.getSchoolFeeStatistics(academicYear, term);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get school fee summary for dashboard
 * GET /api/school-fees/summary
 */
export const getSchoolFeeSummary = (req, res) => {
  try {
    const summary = schoolFeeService.getSchoolFeeSummary();
    
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
 * Create a new school fee payment
 * POST /api/school-fees
 * 
 * Request Body:
 * - studentId (required): Student ID
 * - amount (required): Amount paid
 * - paymentDate (required): Payment date (YYYY-MM-DD)
 * - academicYear (required): Academic year
 * - term (required): Term (Term 1, Term 2, Term 3)
 * - paymentMethodId: Payment method ID
 * - description: Description
 * - notes: Notes
 * - createdBy: User ID who created the record
 */
export const createSchoolFeePayment = async (req, res) => {
  try {
    const {
      studentId,
      amount,
      paymentDate,
      academicYear,
      term,
      paymentMethodId,
      description,
      notes,
      createdBy
    } = req.body;

    // Validate required fields
    if (!studentId || !amount || !paymentDate || !academicYear || !term) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: studentId, amount, paymentDate, academicYear, term'
      });
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Validate term
    const validTerms = ['Term 1', 'Term 2', 'Term 3'];
    if (!validTerms.includes(term)) {
      return res.status(400).json({
        success: false,
        error: `Term must be one of: ${validTerms.join(', ')}`
      });
    }

    const payment = await schoolFeeService.createSchoolFeePaymentWithTransaction({
      studentId,
      amount: amountNum,
      paymentDate,
      academicYear,
      term,
      paymentMethodId,
      description,
      notes,
      createdBy
    });

    res.status(201).json({
      success: true,
      data: payment,
      message: 'School fee payment recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update a school fee payment
 * PUT /api/school-fees/:id
 * 
 * Request Body:
 * - studentId: Student ID
 * - transactionId: Transaction ID
 * - amount: Amount paid
 * - paymentDate: Payment date (YYYY-MM-DD)
 * - academicYear: Academic year
 * - term: Term
 * - notes: Notes
 * - updatedBy: User ID who updated the record
 */
export const updateSchoolFeePayment = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid school fee payment ID'
      });
    }

    const {
      studentId,
      transactionId,
      amount,
      paymentDate,
      academicYear,
      term,
      notes,
      updatedBy
    } = req.body;

    // Validate amount if provided
    if (amount !== undefined) {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be a positive number'
        });
      }
    }

    // Validate term if provided
    if (term) {
      const validTerms = ['Term 1', 'Term 2', 'Term 3'];
      if (!validTerms.includes(term)) {
        return res.status(400).json({
          success: false,
          error: `Term must be one of: ${validTerms.join(', ')}`
        });
      }
    }

    const payment = schoolFeeService.updateSchoolFeePayment(id, {
      studentId,
      transactionId,
      amount,
      paymentDate,
      academicYear,
      term,
      notes,
      updatedBy
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'School fee payment not found'
      });
    }

    res.json({
      success: true,
      data: payment,
      message: 'School fee payment updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a school fee payment
 * DELETE /api/school-fees/:id
 */
export const deleteSchoolFeePayment = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid school fee payment ID'
      });
    }

    const deleted = schoolFeeService.deleteSchoolFeePayment(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'School fee payment not found'
      });
    }

    res.json({
      success: true,
      message: 'School fee payment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  getSchoolFeePayments,
  getAllSchoolFeePayments,
  getSchoolFeePaymentById,
  getSchoolFeePaymentsByStudent,
  getStudentSchoolFeeBalance,
  getStudentsInArrears,
  getSchoolFeeStatistics,
  getSchoolFeeSummary,
  createSchoolFeePayment,
  updateSchoolFeePayment,
  deleteSchoolFeePayment
};
