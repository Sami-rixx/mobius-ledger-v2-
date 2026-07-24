import * as studentChargeAssignmentService from '../services/studentChargeAssignmentService.js';

/**
 * Student Charge Assignment Controller
 * Route handlers for student charge assignment management endpoints
 * 
 * Handles:
 * - HTTP request/response cycle
 * - Request validation
 * - Error handling
 * - Response formatting
 */

/**
 * Get paginated list of student charge assignments
 * GET /api/charges/assignments
 * 
 * Query Parameters:
 * - chargeId: Filter by charge ID
 * - studentId: Filter by student ID
 * - paid: Filter by payment status (true/false)
 * - classId: Filter by student's class
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
      paid,
      classId,
      search,
      page = 1,
      pageSize = 20,
      orderBy = 'sca.assigned_at',
      orderDir = 'DESC'
    } = req.query;

    // Parse numeric and boolean parameters
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 20;
    const chargeIdNum = chargeId ? parseInt(chargeId, 10) : undefined;
    const studentIdNum = studentId ? parseInt(studentId, 10) : undefined;
    const classIdNum = classId ? parseInt(classId, 10) : undefined;
    const paidBool = paid !== undefined ? paid === 'true' : undefined;

    const result = studentChargeAssignmentService.getPaginatedStudentChargeAssignments({
      chargeId: chargeIdNum,
      studentId: studentIdNum,
      paid: paidBool,
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
 * GET /api/charges/assignments/all
 */
export const getAllStudentChargeAssignments = (req, res) => {
  try {
    const {
      chargeId,
      studentId,
      paid,
      classId,
      search
    } = req.query;

    const chargeIdNum = chargeId ? parseInt(chargeId, 10) : undefined;
    const studentIdNum = studentId ? parseInt(studentId, 10) : undefined;
    const classIdNum = classId ? parseInt(classId, 10) : undefined;
    const paidBool = paid !== undefined ? paid === 'true' : undefined;

    const assignments = studentChargeAssignmentService.getAllStudentChargeAssignments({
      chargeId: chargeIdNum,
      studentId: studentIdNum,
      paid: paidBool,
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
 * Get a single assignment by ID
 * GET /api/charges/assignments/:id
 */
export const getStudentChargeAssignmentById = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid assignment ID'
      });
    }

    const assignment = studentChargeAssignmentService.getStudentChargeAssignmentById(id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: `Assignment with ID ${id} not found`
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
 * Get assignments by charge ID
 * GET /api/charges/assignments/charge/:chargeId
 */
export const getStudentChargeAssignmentsByCharge = (req, res) => {
  try {
    const chargeId = parseInt(req.params.chargeId, 10);
    
    if (isNaN(chargeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid charge ID'
      });
    }

    const { paid } = req.query;
    const paidBool = paid !== undefined ? paid === 'true' : undefined;

    const assignments = studentChargeAssignmentService.getStudentChargeAssignmentsByCharge(
      chargeId,
      { paid: paidBool }
    );

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
 * Get assignments by student ID
 * GET /api/charges/assignments/student/:studentId
 */
export const getStudentChargeAssignmentsByStudent = (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student ID'
      });
    }

    const { paid } = req.query;
    const paidBool = paid !== undefined ? paid === 'true' : undefined;

    const assignments = studentChargeAssignmentService.getStudentChargeAssignmentsByStudent(
      studentId,
      { paid: paidBool }
    );

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
 * Get unpaid assignments for a student
 * GET /api/charges/assignments/student/:studentId/unpaid
 */
export const getUnpaidStudentChargeAssignmentsByStudent = (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student ID'
      });
    }

    const assignments = studentChargeAssignmentService.getUnpaidStudentChargeAssignmentsByStudent(studentId);

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
 * Get unpaid assignments by charge ID
 * GET /api/charges/assignments/charge/:chargeId/unpaid
 */
export const getUnpaidStudentChargeAssignmentsByCharge = (req, res) => {
  try {
    const chargeId = parseInt(req.params.chargeId, 10);
    
    if (isNaN(chargeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid charge ID'
      });
    }

    const assignments = studentChargeAssignmentService.getUnpaidStudentChargeAssignmentsByCharge(chargeId);

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
 * POST /api/charges/assignments
 * 
 * Request Body:
 * {
 *   chargeId: number (required),
 *   studentId: number (required),
 *   amount: number (optional, defaults to charge amount),
 *   notes: string (optional)
 * }
 */
export const createStudentChargeAssignment = (req, res) => {
  try {
    const assignmentData = req.body;
    const assignedBy = req.user?.id || 1;

    // Validate required fields
    if (!assignmentData.chargeId) {
      return res.status(400).json({
        success: false,
        error: 'chargeId is required'
      });
    }

    if (!assignmentData.studentId) {
      return res.status(400).json({
        success: false,
        error: 'studentId is required'
      });
    }

    const assignment = studentChargeAssignmentService.createStudentChargeAssignment(
      assignmentData,
      assignedBy
    );

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create multiple student charge assignments
 * POST /api/charges/assignments/bulk
 * 
 * Request Body:
 * {
 *   assignments: Array<{
 *     chargeId: number (required),
 *     studentId: number (required),
 *     amount: number (optional),
 *     notes: string (optional)
 *   }> (required)
 * }
 */
export const createMultipleStudentChargeAssignments = (req, res) => {
  try {
    const { assignments } = req.body;
    const assignedBy = req.user?.id || 1;

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Assignments must be a non-empty array'
      });
    }

    const createdAssignments = studentChargeAssignmentService.createMultipleStudentChargeAssignments(
      assignments,
      assignedBy
    );

    res.status(201).json({
      success: true,
      data: createdAssignments,
      message: `${createdAssignments.length} assignments created successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update a student charge assignment
 * PUT /api/charges/assignments/:id
 * 
 * Request Body:
 * {
 *   amount: number,
 *   notes: string
 * }
 */
export const updateStudentChargeAssignment = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid assignment ID'
      });
    }

    const assignmentData = req.body;
    const updatedBy = req.user?.id || 1;

    // Validate amount if provided
    if (assignmentData.amount !== undefined && assignmentData.amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Assignment amount must be a positive number'
      });
    }

    const assignment = studentChargeAssignmentService.updateStudentChargeAssignment(
      id,
      assignmentData,
      updatedBy
    );

    res.json({
      success: true,
      data: assignment,
      message: 'Assignment updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Mark an assignment as paid
 * POST /api/charges/assignments/:id/pay
 * 
 * Request Body:
 * {
 *   amount: number (optional, defaults to assignment amount),
 *   paymentMethod: string (optional),
 *   paymentMethodId: number (optional),
 *   reference: string (optional),
 *   notes: string (optional)
 * }
 */
export const markAssignmentAsPaid = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid assignment ID'
      });
    }

    const paymentData = req.body;
    const recordedBy = req.user?.id || 1;

    const result = await studentChargeAssignmentService.markAssignmentAsPaid(
      id,
      paymentData,
      recordedBy
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Assignment marked as paid successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Mark an assignment as unpaid
 * POST /api/charges/assignments/:id/unpay
 */
export const markAssignmentAsUnpaid = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid assignment ID'
      });
    }

    const reversedBy = req.user?.id || 1;

    const assignment = studentChargeAssignmentService.markAssignmentAsUnpaid(id, reversedBy);

    res.json({
      success: true,
      data: assignment,
      message: 'Assignment marked as unpaid successfully'
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
 * DELETE /api/charges/assignments/:id
 */
export const deleteStudentChargeAssignment = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid assignment ID'
      });
    }

    const deletedBy = req.user?.id || 1;
    const deleted = studentChargeAssignmentService.deleteStudentChargeAssignment(id, deletedBy);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Assignment with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete all assignments for a charge
 * DELETE /api/charges/assignments/charge/:chargeId
 */
export const deleteStudentChargeAssignmentsByCharge = (req, res) => {
  try {
    const chargeId = parseInt(req.params.chargeId, 10);
    
    if (isNaN(chargeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid charge ID'
      });
    }

    const deletedBy = req.user?.id || 1;
    const deletedCount = studentChargeAssignmentService.deleteStudentChargeAssignmentsByCharge(
      chargeId,
      deletedBy
    );

    res.json({
      success: true,
      data: { deletedCount },
      message: `${deletedCount} assignments deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get assignment statistics
 * GET /api/charges/assignments/statistics
 * 
 * Query Parameters:
 * - chargeId: Filter by charge ID
 */
export const getStudentChargeAssignmentStatistics = (req, res) => {
  try {
    const { chargeId } = req.query;
    const chargeIdNum = chargeId ? parseInt(chargeId, 10) : undefined;

    const stats = studentChargeAssignmentService.getStudentChargeAssignmentStatistics(chargeIdNum);

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
 * Check if a student has been assigned a specific charge
 * GET /api/charges/assignments/check
 * 
 * Query Parameters:
 * - chargeId: Charge ID (required)
 * - studentId: Student ID (required)
 */
export const isStudentAssignedToCharge = (req, res) => {
  try {
    const { chargeId, studentId } = req.query;
    
    if (!chargeId || !studentId) {
      return res.status(400).json({
        success: false,
        error: 'chargeId and studentId are required'
      });
    }

    const chargeIdNum = parseInt(chargeId, 10);
    const studentIdNum = parseInt(studentId, 10);

    if (isNaN(chargeIdNum) || isNaN(studentIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chargeId or studentId'
      });
    }

    const isAssigned = studentChargeAssignmentService.isStudentAssignedToCharge(
      chargeIdNum,
      studentIdNum
    );

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
 * Get the total outstanding charge amount for a student
 * GET /api/charges/assignments/student/:studentId/outstanding
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

    const amount = studentChargeAssignmentService.getStudentOutstandingChargeAmount(studentId);

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

/**
 * Get summary of all outstanding student charges
 * GET /api/charges/assignments/outstanding/summary
 */
export const getOutstandingChargesSummary = (req, res) => {
  try {
    const summary = studentChargeAssignmentService.getOutstandingChargesSummary();

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
