import * as StudentChargeAssignmentModel from '../models/StudentChargeAssignment.js';
import * as StudentChargeModel from '../models/StudentCharge.js';
import * as StudentModel from '../models/Student.js';
import * as TransactionModel from '../models/Transaction.js';
import { generateReceiptNumber } from '../utils/receiptGenerator.js';

/**
 * Student Charge Assignment Service
 * Business logic layer for student charge assignment management
 * 
 * Handles:
 * - Assignment creation and management
 * - Payment processing
 * - Transaction integration
 * - Statistics and summaries
 * - Business rule validation
 */

/**
 * Get paginated list of student charge assignments
 * @param {Object} options - Filter and pagination options
 * @param {number} options.chargeId - Filter by charge ID
 * @param {number} options.studentId - Filter by student ID
 * @param {boolean} options.paid - Filter by payment status
 * @param {number} options.classId - Filter by student's class
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
    paid,
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
    paid,
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
    paid,
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
 * @returns {Array} - Array of assignment objects
 */
export const getAllStudentChargeAssignments = (options = {}) => {
  return StudentChargeAssignmentModel.getAllStudentChargeAssignments(options);
};

/**
 * Get a single assignment by ID with enhanced data
 * @param {number} id - Assignment ID
 * @returns {Object|null} - Assignment with computed fields
 */
export const getStudentChargeAssignmentById = (id) => {
  const assignment = StudentChargeAssignmentModel.getStudentChargeAssignmentById(id);
  if (!assignment) {
    return null;
  }

  // Enhance with charge details
  const charge = StudentChargeModel.getStudentChargeById(assignment.charge_id);
  
  return {
    ...assignment,
    charge: charge || null
  };
};

/**
 * Get assignments by charge ID
 * @param {number} chargeId - Charge ID
 * @param {Object} options - Additional filter options
 * @returns {Array} - Array of assignment objects
 */
export const getStudentChargeAssignmentsByCharge = (chargeId, options = {}) => {
  return StudentChargeAssignmentModel.getStudentChargeAssignmentsByCharge(chargeId, options);
};

/**
 * Get assignments by student ID
 * @param {number} studentId - Student ID
 * @param {Object} options - Additional filter options
 * @returns {Array} - Array of assignment objects
 */
export const getStudentChargeAssignmentsByStudent = (studentId, options = {}) => {
  return StudentChargeAssignmentModel.getStudentChargeAssignmentsByStudent(studentId, options);
};

/**
 * Get unpaid assignments for a student
 * @param {number} studentId - Student ID
 * @returns {Array} - Array of unpaid assignment objects
 */
export const getUnpaidStudentChargeAssignmentsByStudent = (studentId) => {
  return StudentChargeAssignmentModel.getUnpaidStudentChargeAssignmentsByStudent(studentId);
};

/**
 * Get unpaid assignments by charge ID
 * @param {number} chargeId - Charge ID
 * @returns {Array} - Array of unpaid assignment objects
 */
export const getUnpaidStudentChargeAssignmentsByCharge = (chargeId) => {
  return StudentChargeAssignmentModel.getUnpaidStudentChargeAssignmentsByCharge(chargeId);
};

/**
 * Create a new student charge assignment
 * @param {Object} assignmentData - Assignment data
 * @param {number} assignedBy - User ID who created the assignment
 * @returns {Object} - Created assignment object
 */
export const createStudentChargeAssignment = (assignmentData, assignedBy) => {
  // Validate required fields
  if (!assignmentData.chargeId) {
    throw new Error('chargeId is required');
  }
  if (!assignmentData.studentId) {
    throw new Error('studentId is required');
  }

  // Validate charge exists
  const charge = StudentChargeModel.getStudentChargeById(assignmentData.chargeId);
  if (!charge) {
    throw new Error(`Charge with ID ${assignmentData.chargeId} not found`);
  }

  // Validate student exists
  const student = StudentModel.getStudentById(assignmentData.studentId);
  if (!student) {
    throw new Error(`Student with ID ${assignmentData.studentId} not found`);
  }

  // Check for duplicate assignment
  const existing = StudentChargeAssignmentModel.isStudentAssignedToCharge(
    assignmentData.chargeId,
    assignmentData.studentId
  );
  if (existing) {
    throw new Error(`Student ${assignmentData.studentId} is already assigned to charge ${assignmentData.chargeId}`);
  }

  // Set default amount if not provided
  const finalData = {
    ...assignmentData,
    amount: assignmentData.amount || charge.amount
  };

  return StudentChargeAssignmentModel.createStudentChargeAssignment(finalData);
};

/**
 * Create multiple student charge assignments
 * @param {Array} assignments - Array of assignment data objects
 * @param {number} assignedBy - User ID who created the assignments
 * @returns {Array} - Array of created assignment objects
 */
export const createMultipleStudentChargeAssignments = (assignments, assignedBy) => {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    throw new Error('Assignments must be a non-empty array');
  }

  const createdAssignments = [];
  const errors = [];

  for (const assignmentData of assignments) {
    try {
      const created = createStudentChargeAssignment(assignmentData, assignedBy);
      createdAssignments.push(created);
    } catch (error) {
      errors.push({
        assignment: assignmentData,
        error: error.message
      });
    }
  }

  if (errors.length > 0) {
    // Rollback: delete successfully created assignments
    for (const assignment of createdAssignments) {
      StudentChargeAssignmentModel.deleteStudentChargeAssignment(assignment.id);
    }
    
    throw new Error(`Failed to create some assignments: ${errors.map(e => e.error).join(', ')}`);
  }

  return createdAssignments;
};

/**
 * Update a student charge assignment
 * @param {number} id - Assignment ID
 * @param {Object} assignmentData - Updated assignment data
 * @param {number} updatedBy - User ID who updated the assignment
 * @returns {Object} - Updated assignment object
 */
export const updateStudentChargeAssignment = (id, assignmentData, updatedBy) => {
  const existingAssignment = StudentChargeAssignmentModel.getStudentChargeAssignmentById(id);
  if (!existingAssignment) {
    throw new Error(`Assignment with ID ${id} not found`);
  }

  // Validate amount if provided
  if (assignmentData.amount !== undefined && assignmentData.amount <= 0) {
    throw new Error('Assignment amount must be a positive number');
  }

  return StudentChargeAssignmentModel.updateStudentChargeAssignment(id, assignmentData);
};

/**
 * Mark an assignment as paid and create a transaction
 * @param {number} id - Assignment ID
 * @param {Object} paymentData - Payment data
 * @param {number} paymentData.amount - Amount paid
 * @param {string} paymentData.paymentMethod - Payment method
 * @param {number} paymentData.paymentMethodId - Payment method ID
 * @param {string} paymentData.reference - Payment reference
 * @param {string} paymentData.notes - Payment notes
 * @param {number} recordedBy - User ID who recorded the payment
 * @returns {Object} - Updated assignment with transaction
 */
export const markAssignmentAsPaid = async (id, paymentData, recordedBy) => {
  const existingAssignment = StudentChargeAssignmentModel.getStudentChargeAssignmentById(id);
  if (!existingAssignment) {
    throw new Error(`Assignment with ID ${id} not found`);
  }

  if (existingAssignment.paid) {
    throw new Error(`Assignment with ID ${id} is already paid`);
  }

  // Get charge details
  const charge = StudentChargeModel.getStudentChargeById(existingAssignment.charge_id);
  if (!charge) {
    throw new Error(`Charge with ID ${existingAssignment.charge_id} not found`);
  }

  // Get student details
  const student = StudentModel.getStudentById(existingAssignment.student_id);
  if (!student) {
    throw new Error(`Student with ID ${existingAssignment.student_id} not found`);
  }

  // Generate receipt number
  const receiptNumber = generateReceiptNumber();

  // Create transaction
  const transaction = TransactionModel.createTransaction({
    receiptNumber,
    transactionType: 'student_charge',
    amount: paymentData.amount || existingAssignment.amount,
    studentId: existingAssignment.student_id,
    description: `Payment for charge: ${charge.name}`,
    paymentMethodId: paymentData.paymentMethodId,
    transactionDate: new Date().toISOString().split('T')[0],
    reference: paymentData.reference || null,
    notes: paymentData.notes || `Payment for charge assignment ${id}`,
    createdBy: recordedBy
  });

  // Mark assignment as paid
  const updatedAssignment = StudentChargeAssignmentModel.markAssignmentAsPaid(
    id,
    transaction.id,
    new Date().toISOString()
  );

  return {
    assignment: updatedAssignment,
    transaction,
    receiptNumber
  };
};

/**
 * Mark an assignment as unpaid (reverse payment)
 * @param {number} id - Assignment ID
 * @param {number} reversedBy - User ID who reversed the payment
 * @returns {Object} - Updated assignment object
 */
export const markAssignmentAsUnpaid = (id, reversedBy) => {
  const existingAssignment = StudentChargeAssignmentModel.getStudentChargeAssignmentById(id);
  if (!existingAssignment) {
    throw new Error(`Assignment with ID ${id} not found`);
  }

  if (!existingAssignment.paid) {
    throw new Error(`Assignment with ID ${id} is not paid`);
  }

  // Note: In a production system, you might want to create a credit note transaction
  // instead of just marking as unpaid. This is a simplified version.
  
  return StudentChargeAssignmentModel.markAssignmentAsUnpaid(id);
};

/**
 * Delete a student charge assignment
 * @param {number} id - Assignment ID
 * @param {number} deletedBy - User ID who deleted the assignment
 * @returns {boolean} - True if deleted
 */
export const deleteStudentChargeAssignment = (id, deletedBy) => {
  const existingAssignment = StudentChargeAssignmentModel.getStudentChargeAssignmentById(id);
  if (!existingAssignment) {
    throw new Error(`Assignment with ID ${id} not found`);
  }

  if (existingAssignment.paid) {
    throw new Error('Cannot delete a paid assignment. Use markAssignmentAsUnpaid first.');
  }

  return StudentChargeAssignmentModel.deleteStudentChargeAssignment(id);
};

/**
 * Delete all assignments for a charge
 * @param {number} chargeId - Charge ID
 * @param {number} deletedBy - User ID who deleted the assignments
 * @returns {number} - Number of assignments deleted
 */
export const deleteStudentChargeAssignmentsByCharge = (chargeId, deletedBy) => {
  const charge = StudentChargeModel.getStudentChargeById(chargeId);
  if (!charge) {
    throw new Error(`Charge with ID ${chargeId} not found`);
  }

  // Check for paid assignments
  const paidAssignments = StudentChargeAssignmentModel.getStudentChargeAssignmentsByCharge(
    chargeId,
    { paid: true }
  );

  if (paidAssignments.length > 0) {
    throw new Error('Cannot delete assignments for a charge with paid assignments. Reverse payments first.');
  }

  return StudentChargeAssignmentModel.deleteStudentChargeAssignmentsByCharge(chargeId);
};

/**
 * Get statistics for student charge assignments
 * @param {number} chargeId - Optional charge ID to filter by
 * @returns {Object} - Statistics object
 */
export const getStudentChargeAssignmentStatistics = (chargeId = null) => {
  return StudentChargeAssignmentModel.getStudentChargeAssignmentStatistics(chargeId);
};

/**
 * Check if a student has been assigned a specific charge
 * @param {number} chargeId - Charge ID
 * @param {number} studentId - Student ID
 * @returns {boolean} - True if assigned
 */
export const isStudentAssignedToCharge = (chargeId, studentId) => {
  return StudentChargeAssignmentModel.isStudentAssignedToCharge(chargeId, studentId);
};

/**
 * Get the total outstanding charge amount for a student
 * @param {number} studentId - Student ID
 * @returns {number} - Total outstanding amount
 */
export const getStudentOutstandingChargeAmount = (studentId) => {
  return StudentChargeAssignmentModel.getStudentOutstandingChargeAmount(studentId);
};

/**
 * Get summary of all outstanding student charges
 * @returns {Object} - Summary with total outstanding, count, etc.
 */
export const getOutstandingChargesSummary = () => {
  const allAssignments = StudentChargeAssignmentModel.getAllStudentChargeAssignments({ paid: false });
  
  const totalOutstanding = allAssignments.reduce((sum, a) => sum + a.amount, 0);
  const totalCount = allAssignments.length;
  
  // Group by charge
  const byCharge = {};
  for (const assignment of allAssignments) {
    if (!byCharge[assignment.charge_id]) {
      byCharge[assignment.charge_id] = {
        chargeId: assignment.charge_id,
        chargeName: assignment.charge_name,
        count: 0,
        amount: 0
      };
    }
    byCharge[assignment.charge_id].count++;
    byCharge[assignment.charge_id].amount += assignment.amount;
  }

  return {
    totalOutstanding,
    totalCount,
    byCharge: Object.values(byCharge)
  };
};
