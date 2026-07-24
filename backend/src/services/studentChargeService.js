import * as StudentChargeModel from '../models/StudentCharge.js';
import * as StudentChargeAssignmentModel from '../models/StudentChargeAssignment.js';
import * as StudentModel from '../models/Student.js';
import * as ClassModel from '../models/Class.js';
import db from '../config/database.js';

/**
 * Student Charge Service
 * Business logic layer for student charge management
 * 
 * Handles:
 * - Business rule validation
 * - Data transformation
 * - Complex queries
 * - Assignment management
 * - Statistics and summaries
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
 * @returns {Object} - Paginated result with charges and metadata
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

  // Get charges
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
 * @returns {Array} - Array of student charge objects
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

  // Enhance with assignment details
  const assignments = StudentChargeAssignmentModel.getStudentChargeAssignmentsByCharge(id);
  
  return {
    ...charge,
    assignments,
    paidCount: assignments.filter(a => a.paid).length,
    unpaidCount: assignments.filter(a => !a.paid).length,
    totalAssigned: assignments.reduce((sum, a) => sum + a.amount, 0),
    totalPaid: assignments.filter(a => a.paid).reduce((sum, a) => sum + a.amount, 0),
    totalOutstanding: assignments.filter(a => !a.paid).reduce((sum, a) => sum + a.amount, 0)
  };
};

/**
 * Create a new student charge
 * @param {Object} chargeData - Student charge data
 * @param {number} createdBy - User ID who created the charge
 * @returns {Object} - Created student charge object
 */
export const createStudentCharge = (chargeData, createdBy) => {
  // Validate required fields
  if (!chargeData.name) {
    throw new Error('Charge name is required');
  }
  if (!chargeData.amount || chargeData.amount <= 0) {
    throw new Error('Charge amount must be a positive number');
  }

  // Set defaults
  const finalData = {
    ...chargeData,
    chargeType: chargeData.chargeType || 'individual',
    isActive: chargeData.isActive !== false, // Default to true
    createdBy
  };

  // Create the charge
  const charge = StudentChargeModel.createStudentCharge(finalData);

  // If this is a class-wide charge, automatically assign to all students in the class
  if (chargeData.chargeType === 'class' && chargeData.classId) {
    const students = StudentModel.getStudentsByClass(chargeData.classId);
    const assignments = students.map(student => ({
      chargeId: charge.id,
      studentId: student.id,
      amount: charge.amount,
      notes: `Auto-assigned from class charge: ${charge.name}`
    }));
    
    if (assignments.length > 0) {
      StudentChargeAssignmentModel.createMultipleStudentChargeAssignments(assignments);
    }
  }

  // If this is an "all" charge, assign to all active students
  if (chargeData.chargeType === 'all') {
    const students = StudentModel.getAllStudents({ isActive: true });
    const assignments = students.map(student => ({
      chargeId: charge.id,
      studentId: student.id,
      amount: charge.amount,
      notes: `Auto-assigned from all-students charge: ${charge.name}`
    }));
    
    if (assignments.length > 0) {
      StudentChargeAssignmentModel.createMultipleStudentChargeAssignments(assignments);
    }
  }

  // Return the enhanced charge
  return getStudentChargeById(charge.id);
};

/**
 * Update a student charge
 * @param {number} id - Student charge ID
 * @param {Object} chargeData - Updated student charge data
 * @param {number} updatedBy - User ID who updated the charge
 * @returns {Object} - Updated student charge object
 */
export const updateStudentCharge = (id, chargeData, updatedBy) => {
  const existingCharge = StudentChargeModel.getStudentChargeById(id);
  if (!existingCharge) {
    throw new Error(`Student charge with ID ${id} not found`);
  }

  // Validate amount if provided
  if (chargeData.amount !== undefined && chargeData.amount <= 0) {
    throw new Error('Charge amount must be a positive number');
  }

  const updatedCharge = StudentChargeModel.updateStudentCharge(id, chargeData, updatedBy);
  
  return getStudentChargeById(updatedCharge.id);
};

/**
 * Delete a student charge
 * @param {number} id - Student charge ID
 * @param {number} deletedBy - User ID who deleted the charge
 * @returns {boolean} - True if deleted
 */
export const deleteStudentCharge = (id, deletedBy) => {
  const existingCharge = StudentChargeModel.getStudentChargeById(id);
  if (!existingCharge) {
    throw new Error(`Student charge with ID ${id} not found`);
  }

  // Check for existing assignments
  const assignmentCount = StudentChargeModel.getStudentChargeAssignmentCount(id);
  if (assignmentCount > 0) {
    throw new Error('Cannot delete charge with existing assignments. Delete assignments first or use force delete.');
  }

  return StudentChargeModel.deleteStudentCharge(id);
};

/**
 * Force delete a student charge and all its assignments
 * @param {number} id - Student charge ID
 * @param {number} deletedBy - User ID who deleted the charge
 * @returns {boolean} - True if deleted
 */
export const forceDeleteStudentCharge = (id, deletedBy) => {
  const existingCharge = StudentChargeModel.getStudentChargeById(id);
  if (!existingCharge) {
    throw new Error(`Student charge with ID ${id} not found`);
  }

  // Delete all assignments first
  StudentChargeAssignmentModel.deleteStudentChargeAssignmentsByCharge(id);
  
  // Then delete the charge
  return StudentChargeModel.deleteStudentCharge(id);
};

/**
 * Get student charges by class
 * @param {number} classId - Class ID
 * @param {Object} options - Additional options
 * @returns {Array} - Array of charges for the class
 */
export const getStudentChargesByClass = (classId, options = {}) => {
  return StudentChargeModel.getStudentChargesByClass(classId, options);
};

/**
 * Get active student charges
 * @param {Object} options - Filter options
 * @returns {Array} - Array of active charges
 */
export const getActiveStudentCharges = (options = {}) => {
  return StudentChargeModel.getActiveStudentCharges(options);
};

/**
 * Get statistics for student charges
 * @returns {Object} - Statistics object
 */
export const getStudentChargeStatistics = () => {
  return StudentChargeModel.getStudentChargeStatistics();
};

/**
 * Assign a charge to specific students
 * @param {number} chargeId - Charge ID
 * @param {Array<number>} studentIds - Array of student IDs
 * @param {number} amount - Amount to assign (defaults to charge amount)
 * @param {string} notes - Notes for the assignment
 * @param {number} assignedBy - User ID who made the assignment
 * @returns {Array} - Array of created assignments
 */
export const assignChargeToStudents = (chargeId, studentIds, amount, notes, assignedBy) => {
  const charge = StudentChargeModel.getStudentChargeById(chargeId);
  if (!charge) {
    throw new Error(`Charge with ID ${chargeId} not found`);
  }

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new Error('At least one student ID is required');
  }

  // Validate student IDs
  const validStudentIds = [];
  for (const studentId of studentIds) {
    const student = StudentModel.getStudentById(studentId);
    if (student) {
      validStudentIds.push(studentId);
    }
  }

  if (validStudentIds.length === 0) {
    throw new Error('No valid student IDs provided');
  }

  // Check for duplicates
  const existingAssignments = StudentChargeAssignmentModel.getStudentChargeAssignmentsByCharge(chargeId);
  const existingStudentIds = existingAssignments.map(a => a.student_id);
  const newStudentIds = validStudentIds.filter(id => !existingStudentIds.includes(id));

  if (newStudentIds.length === 0) {
    throw new Error('All specified students already have this charge assigned');
  }

  // Create assignments
  const finalAmount = amount || charge.amount;
  const assignments = newStudentIds.map(studentId => ({
    chargeId,
    studentId,
    amount: finalAmount,
    notes: notes || `Assigned by user ${assignedBy}`
  }));

  return StudentChargeAssignmentModel.createMultipleStudentChargeAssignments(assignments);
};

/**
 * Get charges for a specific student
 * @param {number} studentId - Student ID
 * @param {Object} options - Filter options
 * @returns {Array} - Array of charges assigned to the student
 */
export const getChargesForStudent = (studentId, options = {}) => {
  const assignments = StudentChargeAssignmentModel.getStudentChargeAssignmentsByStudent(studentId, options);
  
  // Group by charge and enhance with charge details
  const chargesMap = new Map();
  for (const assignment of assignments) {
    if (!chargesMap.has(assignment.charge_id)) {
      const charge = StudentChargeModel.getStudentChargeById(assignment.charge_id);
      if (charge) {
        chargesMap.set(assignment.charge_id, {
          ...charge,
          assignments: []
        });
      }
    }
    if (chargesMap.has(assignment.charge_id)) {
      chargesMap.get(assignment.charge_id).assignments.push(assignment);
    }
  }

  return Array.from(chargesMap.values());
};

/**
 * Get unpaid charges for a specific student
 * @param {number} studentId - Student ID
 * @returns {Array} - Array of unpaid charges
 */
export const getUnpaidChargesForStudent = (studentId) => {
  const assignments = StudentChargeAssignmentModel.getUnpaidStudentChargeAssignmentsByStudent(studentId);
  
  const chargesMap = new Map();
  for (const assignment of assignments) {
    if (!chargesMap.has(assignment.charge_id)) {
      const charge = StudentChargeModel.getStudentChargeById(assignment.charge_id);
      if (charge) {
        chargesMap.set(assignment.charge_id, {
          ...charge,
          assignments: []
        });
      }
    }
    if (chargesMap.has(assignment.charge_id)) {
      chargesMap.get(assignment.charge_id).assignments.push(assignment);
    }
  }

  return Array.from(chargesMap.values());
};

/**
 * Get the total outstanding charge amount for a student
 * @param {number} studentId - Student ID
 * @returns {number} - Total outstanding amount
 */
export const getStudentOutstandingChargeAmount = (studentId) => {
  return StudentChargeAssignmentModel.getStudentOutstandingChargeAmount(studentId);
};
