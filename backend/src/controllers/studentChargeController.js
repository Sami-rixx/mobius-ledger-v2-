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
 * GET /api/charges
 * 
 * Query Parameters:
 * - name: Filter by charge name
 * - chargeType: Filter by charge type (individual, all, class, grade, custom)
 * - classId: Filter by class ID
 * - isActive: Filter by active status (true/false)
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

    // Parse numeric and boolean parameters
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
 * GET /api/charges/all
 * 
 * Query Parameters:
 * - name: Filter by charge name
 * - chargeType: Filter by charge type
 * - classId: Filter by class ID
 * - isActive: Filter by active status
 * - search: Search term
 */
export const getAllStudentCharges = (req, res) => {
  try {
    const {
      name,
      chargeType,
      classId,
      isActive,
      search
    } = req.query;

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
 * GET /api/charges/:id
 */
export const getStudentChargeById = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid charge ID'
      });
    }

    const charge = studentChargeService.getStudentChargeById(id);
    
    if (!charge) {
      return res.status(404).json({
        success: false,
        error: `Student charge with ID ${id} not found`
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
 * Get student charges by class
 * GET /api/charges/class/:classId
 */
export const getStudentChargesByClass = (req, res) => {
  try {
    const classId = parseInt(req.params.classId, 10);
    
    if (isNaN(classId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid class ID'
      });
    }

    const { isActive } = req.query;
    const isActiveBool = isActive !== undefined ? isActive === 'true' : true;

    const charges = studentChargeService.getStudentChargesByClass(classId, {
      isActive: isActiveBool
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
 * Get active student charges
 * GET /api/charges/active
 */
export const getActiveStudentCharges = (req, res) => {
  try {
    const {
      name,
      chargeType,
      classId,
      search
    } = req.query;

    const classIdNum = classId ? parseInt(classId, 10) : undefined;

    const charges = studentChargeService.getActiveStudentCharges({
      name,
      chargeType,
      classId: classIdNum,
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
 * Create a new student charge
 * POST /api/charges
 * 
 * Request Body:
 * {
 *   name: string (required),
 *   description: string,
 *   amount: number (required, > 0),
 *   chargeType: string (individual, all, class, grade, custom),
 *   classId: number (for class-wide charges),
 *   dueDate: string (YYYY-MM-DD),
 *   isActive: boolean
 * }
 */
export const createStudentCharge = (req, res) => {
  try {
    const chargeData = req.body;
    const createdBy = req.user?.id || 1; // Default to user 1 if not authenticated

    // Validate required fields
    if (!chargeData.name) {
      return res.status(400).json({
        success: false,
        error: 'Charge name is required'
      });
    }

    if (!chargeData.amount || chargeData.amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Charge amount must be a positive number'
      });
    }

    const charge = studentChargeService.createStudentCharge(chargeData, createdBy);

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
 * Update a student charge
 * PUT /api/charges/:id
 * 
 * Request Body:
 * {
 *   name: string,
 *   description: string,
 *   amount: number (> 0),
 *   chargeType: string,
 *   classId: number,
 *   dueDate: string,
 *   isActive: boolean
 * }
 */
export const updateStudentCharge = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid charge ID'
      });
    }

    const chargeData = req.body;
    const updatedBy = req.user?.id || 1;

    // Validate amount if provided
    if (chargeData.amount !== undefined && chargeData.amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Charge amount must be a positive number'
      });
    }

    const charge = studentChargeService.updateStudentCharge(id, chargeData, updatedBy);

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
 * DELETE /api/charges/:id
 */
export const deleteStudentCharge = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid charge ID'
      });
    }

    const deletedBy = req.user?.id || 1;
    const deleted = studentChargeService.deleteStudentCharge(id, deletedBy);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Student charge with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      message: 'Student charge deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Force delete a student charge and all its assignments
 * DELETE /api/charges/:id/force
 */
export const forceDeleteStudentCharge = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid charge ID'
      });
    }

    const deletedBy = req.user?.id || 1;
    const deleted = studentChargeService.forceDeleteStudentCharge(id, deletedBy);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Student charge with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      message: 'Student charge and all assignments deleted successfully'
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
 * GET /api/charges/statistics
 */
export const getStudentChargeStatistics = (req, res) => {
  try {
    const stats = studentChargeService.getStudentChargeStatistics();

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
 * Assign a charge to specific students
 * POST /api/charges/:id/assign
 * 
 * Request Body:
 * {
 *   studentIds: Array<number> (required),
 *   amount: number (optional, defaults to charge amount),
 *   notes: string (optional)
 * }
 */
export const assignChargeToStudents = (req, res) => {
  try {
    const chargeId = parseInt(req.params.id, 10);
    
    if (isNaN(chargeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid charge ID'
      });
    }

    const { studentIds, amount, notes } = req.body;
    const assignedBy = req.user?.id || 1;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one student ID is required'
      });
    }

    const assignments = studentChargeService.assignChargeToStudents(
      chargeId,
      studentIds,
      amount,
      notes,
      assignedBy
    );

    res.status(201).json({
      success: true,
      data: assignments,
      message: `${assignments.length} assignments created successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get charges for a specific student
 * GET /api/charges/student/:studentId
 */
export const getChargesForStudent = (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student ID'
      });
    }

    const charges = studentChargeService.getChargesForStudent(studentId);

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
 * Get unpaid charges for a specific student
 * GET /api/charges/student/:studentId/unpaid
 */
export const getUnpaidChargesForStudent = (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student ID'
      });
    }

    const charges = studentChargeService.getUnpaidChargesForStudent(studentId);

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
 * Get the total outstanding charge amount for a student
 * GET /api/charges/student/:studentId/outstanding
 */
export const getStudentOutstandingChargeAmount = (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student ID'
      });
    }

    const amount = studentChargeService.getStudentOutstandingChargeAmount(studentId);

    res.json({
      success: true,
      data: { outstandingAmount: amount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
