import * as StudentChargeModel from '../models/StudentCharge.js';
import * as StudentChargeAssignmentModel from '../models/StudentChargeAssignment.js';
import * as StudentModel from '../models/Student.js';
import * as TransactionModel from '../models/Transaction.js';
import db from '../config/database.js';
import { generateReceiptNumber } from '../utils/receiptGenerator.js';

/**
 * Student Charge Service
 * Business logic layer for student charge management
 * 
 * Handles:
 * - Business rule validation
 * - Data transformation
 * - Complex queries
 * - Transaction management
 * - Receipt generation
 * - Bulk operations
 * - Assignment management
 */

/**
 * Get paginated list of student charges
 * @param {Object} options - Filter and pagination options
 * @param {string} options.name - Filter by charge name
 * @param {string} options.chargeType - Filter by charge type
 * @param {number} options.classId - Filter by class ID
 * @param {boolean} options.isActive - Filter by active status
 * @param {string} options.search - Search term
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction
 * @returns {Object} - Paginated result with student charges and metadata
 */
export const getPaginatedStudentCharges = (options = {}) => {
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
  } = options;

  const offset = (page - 1) * pageSize;

  // Get student charges
  const charges = StudentChargeModel.getAllStudentCharges({
    name,
    chargeType,
    classId,
    isActive,
    search,
    limit: pageSize,
    offset,
    orderBy,
    orderDir
  });

  // Get total count
  const total = StudentChargeModel.getStudentChargeCount({
    name,
    chargeType,
    classId,
    isActive,
    search
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    data: charges,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? page + 1 : null,
      previousPage: hasPreviousPage ? page - 1 : null
    }
  };
};

/**
 * Get all student charges (no pagination)
 * @param {Object} options - Filter options
 * @returns {Array} - Array of student charges
 */
export const getAllStudentCharges = (options = {}) => {
  return StudentChargeModel.getAllStudentCharges(options);
};

/**
 * Get a single student charge by ID with enhanced data
 * @param {number} id - Student charge ID
 * @returns {Object|null} - Student charge with computed fields
 */
export const getStudentChargeById = (id) => {
  const charge = StudentChargeModel.getStudentChargeById(id);
  if (!charge) {
    return null;
  }

  // Add computed fields
  return {
    ...charge,
    // Get assignments for this charge
    assignments: StudentChargeAssignmentModel.getStudentChargeAssignmentsByChargeId(id),
    // Count assigned students
    assigned_student_count: StudentChargeAssignmentModel.getStudentChargeAssignmentCount({ chargeId: id })
  };
};

/**
 * Get student charges by class ID
 * @param {number} classId - Class ID
 * @returns {Array} - Array of student charges for the class
 */
export const getStudentChargesByClassId = (classId) => {
  return StudentChargeModel.getStudentChargesByClassId(classId);
};

/**
 * Get active student charges
 * @returns {Array} - Array of active student charges
 */
export const getActiveStudentCharges = () => {
  return StudentChargeModel.getActiveStudentCharges();
};

/**
 * Get upcoming student charges
 * @param {number} days - Number of days to look ahead
 * @returns {Array} - Array of upcoming student charges
 */
export const getUpcomingStudentCharges = (days = 7) => {
  return StudentChargeModel.getUpcomingStudentCharges(days);
};

/**
 * Get overdue student charges
 * @returns {Array} - Array of overdue student charges
 */
export const getOverdueStudentCharges = () => {
  return StudentChargeModel.getOverdueStudentCharges();
};

/**
 * Create a new student charge
 * @param {Object} chargeData - Student charge data
 * @param {string} chargeData.name - Charge name
 * @param {string} chargeData.description - Charge description
 * @param {number} chargeData.amount - Charge amount
 * @param {string} chargeData.charge_type - Charge type (individual, all, class, grade, custom)
 * @param {number} chargeData.class_id - Class ID (optional)
 * @param {boolean} chargeData.is_active - Whether the charge is active
 * @param {string} chargeData.due_date - Due date (YYYY-MM-DD)
 * @param {number} chargeData.created_by - User ID who created the record
 * @returns {Object} - Created student charge
 */
export const createStudentCharge = (chargeData) => {
  const {
    name,
    description,
    amount,
    charge_type = 'individual',
    class_id,
    is_active = true,
    due_date,
    created_by
  } = chargeData;

  // Validate required fields
  if (!name || !amount) {
    throw new Error('Name and amount are required');
  }

  // Validate amount
  if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    throw new Error('Amount must be a positive number');
  }

  // Validate charge type
  const validChargeTypes = ['individual', 'all', 'class', 'grade', 'custom'];
  if (charge_type && !validChargeTypes.includes(charge_type)) {
    throw new Error(`charge_type must be one of: ${validChargeTypes.join(', ')}`);
  }

  // Create the charge
  const charge = StudentChargeModel.createStudentCharge({
    name,
    description,
    amount,
    charge_type,
    class_id,
    is_active,
    due_date,
    created_by
  });

  return charge;
};

/**
 * Create a student charge and assign it to students
 * @param {Object} chargeData - Student charge data
 * @param {Array<number>} studentIds - Array of student IDs to assign to
 * @param {number} createdBy - User ID who created the record
 * @returns {Object} - Created charge with assignments
 */
export const createStudentChargeWithAssignments = (chargeData, studentIds, createdBy) => {
  // Create the charge first
  const charge = createStudentCharge({ ...chargeData, created_by: createdBy });

  // Create assignments for each student
  const assignments = [];
  for (const studentId of studentIds) {
    const assignment = StudentChargeAssignmentModel.createStudentChargeAssignment({
      charge_id: charge.id,
      student_id: studentId,
      amount: chargeData.amount, // Use the same amount as the charge
      notes: chargeData.notes || `Assigned via charge #${charge.id}`
    });
    assignments.push(assignment);
  }

  return {
    charge,
    assignments,
    assigned_count: assignments.length
  };
};

/**
 * Update an existing student charge
 * @param {number} id - Student charge ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} - Updated student charge or null if not found
 */
export const updateStudentCharge = (id, updates) => {
  const existing = StudentChargeModel.getStudentChargeById(id);
  if (!existing) {
    return null;
  }

  // Validate amount if provided
  if (updates.amount && (isNaN(parseFloat(updates.amount)) || parseFloat(updates.amount) <= 0)) {
    throw new Error('Amount must be a positive number');
  }

  // Validate charge type if provided
  const validChargeTypes = ['individual', 'all', 'class', 'grade', 'custom'];
  if (updates.charge_type && !validChargeTypes.includes(updates.charge_type)) {
    throw new Error(`charge_type must be one of: ${validChargeTypes.join(', ')}`);
  }

  return StudentChargeModel.updateStudentCharge(id, updates);
};

/**
 * Delete a student charge and its assignments
 * @param {number} id - Student charge ID
 * @returns {boolean} - True if deleted, false if not found
 */
export const deleteStudentCharge = (id) => {
  const existing = StudentChargeModel.getStudentChargeById(id);
  if (!existing) {
    return false;
  }

  // Delete all assignments for this charge
  StudentChargeAssignmentModel.deleteStudentChargeAssignmentsByChargeId(id);

  // Delete the charge
  return StudentChargeModel.deleteStudentCharge(id);
};

/**
 * Get student charge statistics
 * @returns {Object} - Statistics object
 */
export const getStudentChargeStatistics = () => {
  return StudentChargeModel.getStudentChargeStatistics();
};

// ============================================
// Student Charge Assignment Services
// ============================================

/**
 * Get paginated list of student charge assignments
 * @param {Object} options - Filter and pagination options
 * @param {number} options.chargeId - Filter by charge ID
 * @param {number} options.studentId - Filter by student ID
 * @param {number} options.classId - Filter by class ID
 * @param {string} options.search - Search term
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction
 * @returns {Object} - Paginated result with assignments and metadata
 */
export const getPaginatedStudentChargeAssignments = (options = {}) => {
  const {
    chargeId,
    studentId,
    classId,
    search,
    page = 1,
    pageSize = 20,
    orderBy = 'sca.assigned_at',
    orderDir = 'DESC'
  } = options;

  const offset = (page - 1) * pageSize;

  // Get assignments
  const assignments = StudentChargeAssignmentModel.getAllStudentChargeAssignments({
    chargeId,
    studentId,
    classId,
    search,
    limit: pageSize,
    offset,
    orderBy,
    orderDir
  });

  // Get total count
  const total = StudentChargeAssignmentModel.getStudentChargeAssignmentCount({
    chargeId,
    studentId,
    classId,
    search
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    data: assignments,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? page + 1 : null,
      previousPage: hasPreviousPage ? page - 1 : null
    }
  };
};

/**
 * Get all student charge assignments (no pagination)
 * @param {Object} options - Filter options
 * @returns {Array} - Array of student charge assignments
 */
export const getAllStudentChargeAssignments = (options = {}) => {
  return StudentChargeAssignmentModel.getAllStudentChargeAssignments(options);
};

/**
 * Get a single student charge assignment by ID
 * @param {number} id - Student charge assignment ID
 * @returns {Object|null} - Student charge assignment
 */
export const getStudentChargeAssignmentById = (id) => {
  return StudentChargeAssignmentModel.getStudentChargeAssignmentById(id);
};

/**
 * Get student charge assignments by charge ID
 * @param {number} chargeId - Charge ID
 * @returns {Array} - Array of student charge assignments for the charge
 */
export const getStudentChargeAssignmentsByChargeId = (chargeId) => {
  return StudentChargeAssignmentModel.getStudentChargeAssignmentsByChargeId(chargeId);
};

/**
 * Get student charge assignments by student ID
 * @param {number} studentId - Student ID
 * @returns {Array} - Array of student charge assignments for the student
 */
export const getStudentChargeAssignmentsByStudentId = (studentId) => {
  return StudentChargeAssignmentModel.getStudentChargeAssignmentsByStudentId(studentId);
};

/**
 * Get student charge assignments by class ID
 * @param {number} classId - Class ID
 * @returns {Array} - Array of student charge assignments for the class
 */
export const getStudentChargeAssignmentsByClassId = (classId) => {
  return StudentChargeAssignmentModel.getStudentChargeAssignmentsByClassId(classId);
};

/**
 * Get unpaid student charge assignments
 * @returns {Array} - Array of unpaid student charge assignments
 */
export const getUnpaidStudentChargeAssignments = () => {
  return StudentChargeAssignmentModel.getUnpaidStudentChargeAssignments();
};

/**
 * Create a new student charge assignment
 * @param {Object} assignment - Student charge assignment data
 * @returns {Object} - Created student charge assignment
 */
export const createStudentChargeAssignment = (assignment) => {
  return StudentChargeAssignmentModel.createStudentChargeAssignment(assignment);
};

/**
 * Create multiple student charge assignments at once
 * @param {Array<Object>} assignments - Array of assignment objects
 * @returns {Array<Object>} - Array of created assignments
 */
export const createBulkStudentChargeAssignments = (assignments) => {
  return StudentChargeAssignmentModel.createBulkStudentChargeAssignments(assignments);
};

/**
 * Assign a charge to all students in a class
 * @param {number} chargeId - Charge ID
 * @param {number} classId - Class ID
 * @param {number} createdBy - User ID who created the assignments
 * @returns {Array<Object>} - Array of created assignments
 */
export const assignChargeToClass = (chargeId, classId, createdBy) => {
  // Get all students in the class
  const students = StudentModel.getAllStudents({ classId });
  
  // Get the charge to get the amount
  const charge = StudentChargeModel.getStudentChargeById(chargeId);
  if (!charge) {
    throw new Error(`Charge with ID ${chargeId} not found`);
  }

  // Create assignments for each student
  const assignments = [];
  for (const student of students) {
    const assignment = StudentChargeAssignmentModel.createStudentChargeAssignment({
      charge_id: chargeId,
      student_id: student.id,
      amount: charge.amount,
      notes: `Auto-assigned to class ${classId}`
    });
    assignments.push(assignment);
  }

  return assignments;
};

/**
 * Assign a charge to all students in the school
 * @param {number} chargeId - Charge ID
 * @param {number} createdBy - User ID who created the assignments
 * @returns {Array<Object>} - Array of created assignments
 */
export const assignChargeToAllStudents = (chargeId, createdBy) => {
  // Get all active students
  const students = StudentModel.getAllStudents({ status: 'Active' });
  
  // Get the charge to get the amount
  const charge = StudentChargeModel.getStudentChargeById(chargeId);
  if (!charge) {
    throw new Error(`Charge with ID ${chargeId} not found`);
  }

  // Create assignments for each student
  const assignments = [];
  for (const student of students) {
    const assignment = StudentChargeAssignmentModel.createStudentChargeAssignment({
      charge_id: chargeId,
      student_id: student.id,
      amount: charge.amount,
      notes: `Auto-assigned to all students`
    });
    assignments.push(assignment);
  }

  return assignments;
};

/**
 * Update an existing student charge assignment
 * @param {number} id - Student charge assignment ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} - Updated student charge assignment or null if not found
 */
export const updateStudentChargeAssignment = (id, updates) => {
  return StudentChargeAssignmentModel.updateStudentChargeAssignment(id, updates);
};

/**
 * Delete a student charge assignment
 * @param {number} id - Student charge assignment ID
 * @returns {boolean} - True if deleted, false if not found
 */
export const deleteStudentChargeAssignment = (id) => {
  return StudentChargeAssignmentModel.deleteStudentChargeAssignment(id);
};

/**
 * Delete all assignments for a specific charge
 * @param {number} chargeId - Charge ID
 * @returns {number} - Number of assignments deleted
 */
export const deleteStudentChargeAssignmentsByChargeId = (chargeId) => {
  return StudentChargeAssignmentModel.deleteStudentChargeAssignmentsByChargeId(chargeId);
};

/**
 * Get student charge assignment statistics
 * @returns {Object} - Statistics object
 */
export const getStudentChargeAssignmentStatistics = () => {
  return StudentChargeAssignmentModel.getStudentChargeAssignmentStatistics();
};

/**
 * Check if a student has been assigned a specific charge
 * @param {number} chargeId - Charge ID
 * @param {number} studentId - Student ID
 * @returns {boolean} - True if assigned, false otherwise
 */
export const isStudentAssignedToCharge = (chargeId, studentId) => {
  return StudentChargeAssignmentModel.isStudentAssignedToCharge(chargeId, studentId);
};

/**
 * Get the total amount assigned to a student for a specific charge
 * @param {number} chargeId - Charge ID
 * @param {number} studentId - Student ID
 * @returns {number} - Total amount assigned
 */
export const getStudentChargeAssignmentAmount = (chargeId, studentId) => {
  return StudentChargeAssignmentModel.getStudentChargeAssignmentAmount(chargeId, studentId);
};

/**
 * Record a payment for a student charge assignment
 * @param {number} assignmentId - Assignment ID
 * @param {number} amount - Payment amount
 * @param {string} paymentDate - Payment date (YYYY-MM-DD)
 * @param {number} paymentMethodId - Payment method ID
 * @param {number} createdBy - User ID who created the record
 * @returns {Object} - Payment transaction
 */
export const recordStudentChargePayment = (assignmentId, amount, paymentDate, paymentMethodId, createdBy) => {
  // Get the assignment
  const assignment = StudentChargeAssignmentModel.getStudentChargeAssignmentById(assignmentId);
  if (!assignment) {
    throw new Error(`Assignment with ID ${assignmentId} not found`);
  }

  // Generate receipt number
  const receiptNumber = generateReceiptNumber();

  // Create transaction
  const transaction = TransactionModel.createTransaction({
    receipt_number: receiptNumber,
    transaction_type: 'student_charge',
    amount,
    transaction_date: paymentDate,
    payment_method_id: paymentMethodId,
    student_id: assignment.student_id,
    description: `Payment for charge: ${assignment.charge_name || 'Student Charge'}`,
    reference: `assignment-${assignmentId}`,
    notes: `Payment for student charge assignment #${assignmentId}`,
    created_by: createdBy
  });

  return {
    transaction,
    receiptNumber,
    assignment
  };
};

/**
 * Get student charge summary for a student
 * @param {number} studentId - Student ID
 * @returns {Object} - Summary of charges and payments for the student
 */
export const getStudentChargeSummary = (studentId) => {
  const assignments = StudentChargeAssignmentModel.getStudentChargeAssignmentsByStudentId(studentId);
  
  let totalAssigned = 0;
  let totalPaid = 0;
  let paidCount = 0;
  let unpaidCount = 0;

  for (const assignment of assignments) {
    totalAssigned += parseFloat(assignment.amount) || 0;
    
    // Check if this assignment has been paid (has a transaction)
    // This is a simplified check - in production, you'd need to query transactions
    if (assignment.notes && assignment.notes.includes('Paid')) {
      totalPaid += parseFloat(assignment.amount) || 0;
      paidCount++;
    } else {
      unpaidCount++;
    }
  }

  return {
    studentId,
    totalAssigned,
    totalPaid,
    balance: totalAssigned - totalPaid,
    paidCount,
    unpaidCount,
    assignments
  };
};

export default {
  // Student Charge Services
  getPaginatedStudentCharges,
  getAllStudentCharges,
  getStudentChargeById,
  getStudentChargesByClassId,
  getActiveStudentCharges,
  getUpcomingStudentCharges,
  getOverdueStudentCharges,
  createStudentCharge,
  createStudentChargeWithAssignments,
  updateStudentCharge,
  deleteStudentCharge,
  getStudentChargeStatistics,
  
  // Student Charge Assignment Services
  getPaginatedStudentChargeAssignments,
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
  deleteStudentChargeAssignmentsByChargeId,
  getStudentChargeAssignmentStatistics,
  isStudentAssignedToCharge,
  getStudentChargeAssignmentAmount,
  
  // Payment Services
  recordStudentChargePayment,
  getStudentChargeSummary
};
