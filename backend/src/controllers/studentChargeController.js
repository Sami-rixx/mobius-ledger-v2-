import * as studentChargeService from '../services/studentChargeService.js';

/**
 * Student Charge Controller
 * Route handlers for student charge management endpoints
 * 
 * Handles:
 * - HTTP request/response cycle
 * - Request validation
 * - Error handling
 * - Response formatting
 */

/**
 * Get paginated list of student charges
 * GET /api/student-charges
 * 
 * Query Parameters:
 * - name: Filter by charge name
 * - chargeType: Filter by charge type (individual, all, class, grade, custom)
 * - classId: Filter by class ID
 * - isActive: Filter by active status
 * - search: Search term for name or description
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20)
 * - orderBy: Field to order by (default: created_at)
 * - orderDir: Order direction (default: DESC)
 */
export const getStudentCharges = (req, res) => {
  try {
    const {
      name,
      chargeType,
      classId,
      isActive,
      search,
      page = 1,
      pageSize = 20,
      orderBy = 'sc.created_at',
      orderDir = 'DESC'
    } = req.query;

    // Parse numeric parameters
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 20;
    const classIdNum = classId ? parseInt(classId, 10) : undefined;
    const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;

    const result = studentChargeService.getPaginatedStudentCharges({
      name,
      chargeType,
      classId: classIdNum,
      isActive: isActiveBool,
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
 * Get all student charges (no pagination)
 * GET /api/student-charges/all
 */
export const getAllStudentCharges = (req, res) => {
  try {
    const { name, chargeType, classId, isActive, search } = req.query;
    const classIdNum = classId ? parseInt(classId, 10) : undefined;
    const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;

    const charges = studentChargeService.getAllStudentCharges({
      name,
      chargeType,
      classId: classIdNum,
      isActive: isActiveBool,
      search
    });

    res.json({
      success: true,
      data: charges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get a single student charge by ID
 * GET /api/student-charges/:id
 */
export const getStudentChargeById = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student charge ID'
      });
    }

    const charge = studentChargeService.getStudentChargeById(id);
    
    if (!charge) {
      return res.status(404).json({
        success: false,
        error: 'Student charge not found'
      });
    }

    res.json({
      success: true,
      data: charge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get student charges by class ID
 * GET /api/student-charges/class/:classId
 */
export const getStudentChargesByClassId = (req, res) => {
  try {
    const classId = parseInt(req.params.classId, 10);
    
    if (isNaN(classId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid class ID'
      });
    }

    const charges = studentChargeService.getStudentChargesByClassId(classId);
    
    res.json({
      success: true,
      data: charges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get active student charges
 * GET /api/student-charges/active
 */
export const getActiveStudentCharges = (req, res) => {
  try {
    const charges = studentChargeService.getActiveStudentCharges();
    
    res.json({
      success: true,
      data: charges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get upcoming student charges
 * GET /api/student-charges/upcoming
 * 
 * Query Parameters:
 * - days: Number of days to look ahead (default: 7)
 */
export const getUpcomingStudentCharges = (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = parseInt(days, 10) || 7;
    
    const charges = studentChargeService.getUpcomingStudentCharges(daysNum);
    
    res.json({
      success: true,
      data: charges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get overdue student charges
 * GET /api/student-charges/overdue
 */
export const getOverdueStudentCharges = (req, res) => {
  try {
    const charges = studentChargeService.getOverdueStudentCharges();
    
    res.json({
      success: true,
      data: charges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get student charge statistics
 * GET /api/student-charges/statistics
 */
export const getStudentChargeStatistics = (req, res) => {
  try {
    const statistics = studentChargeService.getStudentChargeStatistics();
    
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
 * Create a new student charge
 * POST /api/student-charges
 * 
 * Request Body:
 * - name (string, required): Charge name
 * - description (string): Charge description
 * - amount (number, required): Charge amount
 * - charge_type (string): Charge type (individual, all, class, grade, custom)
 * - class_id (number): Class ID (optional, for class-specific charges)
 * - is_active (boolean): Whether the charge is active (default: true)
 * - due_date (string): Due date (YYYY-MM-DD)
 * - created_by (number): User ID who created the record
 */
export const createStudentCharge = (req, res) => {
  try {
    const {
      name,
      description,
      amount,
      charge_type = 'individual',
      class_id,
      is_active = true,
      due_date,
      created_by
    } = req.body;

    // Validate required fields
    if (!name || !amount) {
      return res.status(400).json({
        success: false,
        error: 'name and amount are required'
      });
    }

    // Validate amount
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Validate charge type
    const validChargeTypes = ['individual', 'all', 'class', 'grade', 'custom'];
    if (charge_type && !validChargeTypes.includes(charge_type)) {
      return res.status(400).json({
        success: false,
        error: `charge_type must be one of: ${validChargeTypes.join(', ')}`
      });
    }

    const charge = studentChargeService.createStudentCharge({
      name,
      description,
      amount,
      charge_type,
      class_id,
      is_active,
      due_date,
      created_by
    });

    res.status(201).json({
      success: true,
      data: charge,
      message: 'Student charge created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a student charge and assign it to students
 * POST /api/student-charges/with-assignments
 * 
 * Request Body:
 * - charge (object, required): Student charge data
 * - studentIds (Array<number>, required): Array of student IDs to assign to
 * - created_by (number): User ID who created the record
 */
export const createStudentChargeWithAssignments = (req, res) => {
  try {
    const { charge, studentIds = [], created_by } = req.body;

    // Validate required fields
    if (!charge || !studentIds || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'charge and studentIds are required and studentIds must not be empty'
      });
    }

    // Validate charge data
    if (!charge.name || !charge.amount) {
      return res.status(400).json({
        success: false,
        error: 'charge.name and charge.amount are required'
      });
    }

    const result = studentChargeService.createStudentChargeWithAssignments(
      charge,
      studentIds,
      created_by
    );

    res.status(201).json({
      success: true,
      data: result,
      message: `Student charge created with ${result.assigned_count} assignments`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update an existing student charge
 * PUT /api/student-charges/:id
 * 
 * Request Body:
 * - name (string): Charge name
 * - description (string): Charge description
 * - amount (number): Charge amount
 * - charge_type (string): Charge type
 * - class_id (number): Class ID
 * - is_active (boolean): Whether the charge is active
 * - due_date (string): Due date (YYYY-MM-DD)
 * - updated_by (number): User ID who updated the record
 */
export const updateStudentCharge = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student charge ID'
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

    // Validate charge type if provided
    const validChargeTypes = ['individual', 'all', 'class', 'grade', 'custom'];
    if (updates.charge_type && !validChargeTypes.includes(updates.charge_type)) {
      return res.status(400).json({
        success: false,
        error: `charge_type must be one of: ${validChargeTypes.join(', ')}`
      });
    }

    const charge = studentChargeService.updateStudentCharge(id, updates);
    
    if (!charge) {
      return res.status(404).json({
        success: false,
        error: 'Student charge not found'
      });
    }

    res.json({
      success: true,
      data: charge,
      message: 'Student charge updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a student charge
 * DELETE /api/student-charges/:id
 */
export const deleteStudentCharge = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student charge ID'
      });
    }

    const result = studentChargeService.deleteStudentCharge(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Student charge not found'
      });
    }

    res.json({
      success: true,
      message: 'Student charge and its assignments deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// Student Charge Assignment Controllers
// ============================================

/**
 * Get paginated list of student charge assignments
 * GET /api/student-charges/assignments
 * 
 * Query Parameters:
 * - chargeId: Filter by charge ID
 * - studentId: Filter by student ID
 * - classId: Filter by class ID
 * - search: Search term
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20)
 * - orderBy: Field to order by (default: assigned_at)
 * - orderDir: Order direction (default: DESC)
 */
export const getStudentChargeAssignments = (req, res) => {
  try {
    const {
      chargeId,
      studentId,
      classId,
      search,
      page = 1,
      pageSize = 20,
      orderBy = 'sca.assigned_at',
      orderDir = 'DESC'
    } = req.query;

    // Parse numeric parameters
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 20;
    const chargeIdNum = chargeId ? parseInt(chargeId, 10) : undefined;
    const studentIdNum = studentId ? parseInt(studentId, 10) : undefined;
    const classIdNum = classId ? parseInt(classId, 10) : undefined;

    const result = studentChargeService.getPaginatedStudentChargeAssignments({
      chargeId: chargeIdNum,
      studentId: studentIdNum,
      classId: classIdNum,
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
 * Get all student charge assignments (no pagination)
 * GET /api/student-charges/assignments/all
 */
export const getAllStudentChargeAssignments = (req, res) => {
  try {
    const { chargeId, studentId, classId, search } = req.query;
    const chargeIdNum = chargeId ? parseInt(chargeId, 10) : undefined;
    const studentIdNum = studentId ? parseInt(studentId, 10) : undefined;
    const classIdNum = classId ? parseInt(classId, 10) : undefined;

    const assignments = studentChargeService.getAllStudentChargeAssignments({
      chargeId: chargeIdNum,
      studentId: studentIdNum,
      classId: classIdNum,
      search
    });

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get a single student charge assignment by ID
 * GET /api/student-charges/assignments/:id
 */
export const getStudentChargeAssignmentById = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student charge assignment ID'
      });
    }

    const assignment = studentChargeService.getStudentChargeAssignmentById(id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Student charge assignment not found'
      });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get student charge assignments by charge ID
 * GET /api/student-charges/assignments/charge/:chargeId
 */
export const getStudentChargeAssignmentsByChargeId = (req, res) => {
  try {
    const chargeId = parseInt(req.params.chargeId, 10);
    
    if (isNaN(chargeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid charge ID'
      });
    }

    const assignments = studentChargeService.getStudentChargeAssignmentsByChargeId(chargeId);
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get student charge assignments by student ID
 * GET /api/student-charges/assignments/student/:studentId
 */
export const getStudentChargeAssignmentsByStudentId = (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student ID'
      });
    }

    const assignments = studentChargeService.getStudentChargeAssignmentsByStudentId(studentId);
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get student charge assignments by class ID
 * GET /api/student-charges/assignments/class/:classId
 */
export const getStudentChargeAssignmentsByClassId = (req, res) => {
  try {
    const classId = parseInt(req.params.classId, 10);
    
    if (isNaN(classId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid class ID'
      });
    }

    const assignments = studentChargeService.getStudentChargeAssignmentsByClassId(classId);
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get unpaid student charge assignments
 * GET /api/student-charges/assignments/unpaid
 */
export const getUnpaidStudentChargeAssignments = (req, res) => {
  try {
    const assignments = studentChargeService.getUnpaidStudentChargeAssignments();
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a new student charge assignment
 * POST /api/student-charges/assignments
 * 
 * Request Body:
 * - charge_id (number, required): Charge ID
 * - student_id (number, required): Student ID
 * - amount (number, required): Assignment amount
 * - notes (string): Additional notes
 */
export const createStudentChargeAssignment = (req, res) => {
  try {
    const {
      charge_id,
      student_id,
      amount,
      notes
    } = req.body;

    // Validate required fields
    if (!charge_id || !student_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'charge_id, student_id, and amount are required'
      });
    }

    // Validate amount
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    const assignment = studentChargeService.createStudentChargeAssignment({
      charge_id,
      student_id,
      amount,
      notes
    });

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Student charge assignment created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create multiple student charge assignments at once
 * POST /api/student-charges/assignments/bulk
 * 
 * Request Body:
 * - assignments (Array<object>, required): Array of assignment objects
 */
export const createBulkStudentChargeAssignments = (req, res) => {
  try {
    const { assignments = [] } = req.body;

    // Validate required fields
    if (!assignments || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'assignments is required and must not be empty'
      });
    }

    // Validate each assignment
    for (const assignment of assignments) {
      if (!assignment.charge_id || !assignment.student_id || !assignment.amount) {
        return res.status(400).json({
          success: false,
          error: 'Each assignment must have charge_id, student_id, and amount'
        });
      }
      
      if (isNaN(parseFloat(assignment.amount)) || parseFloat(assignment.amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Each assignment amount must be a positive number'
        });
      }
    }

    const results = studentChargeService.createBulkStudentChargeAssignments(assignments);

    res.status(201).json({
      success: true,
      data: results,
      message: `${results.length} student charge assignments created successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Assign a charge to all students in a class
 * POST /api/student-charges/assignments/assign-to-class
 * 
 * Request Body:
 * - chargeId (number, required): Charge ID
 * - classId (number, required): Class ID
 * - createdBy (number): User ID who created the assignments
 */
export const assignChargeToClass = (req, res) => {
  try {
    const { chargeId, classId, createdBy } = req.body;

    // Validate required fields
    if (!chargeId || !classId) {
      return res.status(400).json({
        success: false,
        error: 'chargeId and classId are required'
      });
    }

    const assignments = studentChargeService.assignChargeToClass(
      parseInt(chargeId, 10),
      parseInt(classId, 10),
      createdBy
    );

    res.status(201).json({
      success: true,
      data: assignments,
      message: `${assignments.length} assignments created for class ${classId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Assign a charge to all students in the school
 * POST /api/student-charges/assignments/assign-to-all
 * 
 * Request Body:
 * - chargeId (number, required): Charge ID
 * - createdBy (number): User ID who created the assignments
 */
export const assignChargeToAllStudents = (req, res) => {
  try {
    const { chargeId, createdBy } = req.body;

    // Validate required fields
    if (!chargeId) {
      return res.status(400).json({
        success: false,
        error: 'chargeId is required'
      });
    }

    const assignments = studentChargeService.assignChargeToAllStudents(
      parseInt(chargeId, 10),
      createdBy
    );

    res.status(201).json({
      success: true,
      data: assignments,
      message: `${assignments.length} assignments created for all students`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update an existing student charge assignment
 * PUT /api/student-charges/assignments/:id
 * 
 * Request Body:
 * - charge_id (number): Charge ID
 * - student_id (number): Student ID
 * - amount (number): Assignment amount
 * - notes (string): Additional notes
 */
export const updateStudentChargeAssignment = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student charge assignment ID'
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

    const assignment = studentChargeService.updateStudentChargeAssignment(id, updates);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Student charge assignment not found'
      });
    }

    res.json({
      success: true,
      data: assignment,
      message: 'Student charge assignment updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a student charge assignment
 * DELETE /api/student-charges/assignments/:id
 */
export const deleteStudentChargeAssignment = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student charge assignment ID'
      });
    }

    const result = studentChargeService.deleteStudentChargeAssignment(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Student charge assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Student charge assignment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get student charge assignment statistics
 * GET /api/student-charges/assignments/statistics
 */
export const getStudentChargeAssignmentStatistics = (req, res) => {
  try {
    const statistics = studentChargeService.getStudentChargeAssignmentStatistics();
    
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
 * Check if a student has been assigned a specific charge
 * GET /api/student-charges/assignments/check/:chargeId/:studentId
 */
export const isStudentAssignedToCharge = (req, res) => {
  try {
    const chargeId = parseInt(req.params.chargeId, 10);
    const studentId = parseInt(req.params.studentId, 10);
    
    if (isNaN(chargeId) || isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid charge ID or student ID'
      });
    }

    const isAssigned = studentChargeService.isStudentAssignedToCharge(chargeId, studentId);
    
    res.json({
      success: true,
      data: { isAssigned }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Record a payment for a student charge assignment
 * POST /api/student-charges/assignments/:id/pay
 * 
 * Request Body:
 * - amount (number, required): Payment amount
 * - paymentDate (string, required): Payment date (YYYY-MM-DD)
 * - paymentMethodId (number, required): Payment method ID
 * - createdBy (number): User ID who created the record
 */
export const recordStudentChargePayment = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student charge assignment ID'
      });
    }

    const {
      amount,
      paymentDate,
      paymentMethodId,
      createdBy
    } = req.body;

    // Validate required fields
    if (!amount || !paymentDate || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'amount, paymentDate, and paymentMethodId are required'
      });
    }

    // Validate amount
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    const result = studentChargeService.recordStudentChargePayment(
      id,
      parseFloat(amount),
      paymentDate,
      parseInt(paymentMethodId, 10),
      createdBy
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get student charge summary for a student
 * GET /api/student-charges/summary/:studentId
 */
export const getStudentChargeSummary = (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student ID'
      });
    }

    const summary = studentChargeService.getStudentChargeSummary(studentId);
    
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

export default {
  // Student Charge Controllers
  getStudentCharges,
  getAllStudentCharges,
  getStudentChargeById,
  getStudentChargesByClassId,
  getActiveStudentCharges,
  getUpcomingStudentCharges,
  getOverdueStudentCharges,
  getStudentChargeStatistics,
  createStudentCharge,
  createStudentChargeWithAssignments,
  updateStudentCharge,
  deleteStudentCharge,
  
  // Student Charge Assignment Controllers
  getStudentChargeAssignments,
  getAllStudentChargeAssignments,
  getStudentChargeAssignmentById,
  getStudentChargeAssignmentsByChargeId,
  getStudentChargeAssignmentsByStudentId,
  getStudentChargeAssignmentsByClassId,
  getUnpaidStudentChargeAssignments,
  createStudentChargeAssignment,
  createBulkStudentChargeAssignments,
  assignChargeToClass,
  assignChargeToAllStudents,
  updateStudentChargeAssignment,
  deleteStudentChargeAssignment,
  getStudentChargeAssignmentStatistics,
  isStudentAssignedToCharge,
  
  // Payment Controllers
  recordStudentChargePayment,
  getStudentChargeSummary
};
