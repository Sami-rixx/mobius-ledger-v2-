import { Router } from 'express';
import * as studentChargeController from '../controllers/studentChargeController.js';

/**
 * Student Charge Routes
 * RESTful API endpoints for student charge management
 * 
 * All routes are prefixed with /api/student-charges
 */

const router = Router();

// ============================================
// Student Charge Routes
// ============================================

// GET /api/student-charges - Get paginated list of student charges
router.get('/', studentChargeController.getStudentCharges);

// GET /api/student-charges/all - Get all student charges (no pagination)
router.get('/all', studentChargeController.getAllStudentCharges);

// GET /api/student-charges/:id - Get a single student charge by ID
router.get('/:id', studentChargeController.getStudentChargeById);

// GET /api/student-charges/class/:classId - Get student charges by class ID
router.get('/class/:classId', studentChargeController.getStudentChargesByClassId);

// GET /api/student-charges/active - Get active student charges
router.get('/active', studentChargeController.getActiveStudentCharges);

// GET /api/student-charges/upcoming - Get upcoming student charges
router.get('/upcoming', studentChargeController.getUpcomingStudentCharges);

// GET /api/student-charges/overdue - Get overdue student charges
router.get('/overdue', studentChargeController.getOverdueStudentCharges);

// GET /api/student-charges/statistics - Get student charge statistics
router.get('/statistics', studentChargeController.getStudentChargeStatistics);

// POST /api/student-charges - Create a new student charge
router.post('/', studentChargeController.createStudentCharge);

// POST /api/student-charges/with-assignments - Create a student charge with assignments
router.post('/with-assignments', studentChargeController.createStudentChargeWithAssignments);

// PUT /api/student-charges/:id - Update a student charge
router.put('/:id', studentChargeController.updateStudentCharge);

// DELETE /api/student-charges/:id - Delete a student charge
router.delete('/:id', studentChargeController.deleteStudentCharge);

// ============================================
// Student Charge Assignment Routes
// ============================================

// GET /api/student-charges/assignments - Get paginated list of student charge assignments
router.get('/assignments', studentChargeController.getStudentChargeAssignments);

// GET /api/student-charges/assignments/all - Get all student charge assignments (no pagination)
router.get('/assignments/all', studentChargeController.getAllStudentChargeAssignments);

// GET /api/student-charges/assignments/:id - Get a single student charge assignment by ID
router.get('/assignments/:id', studentChargeController.getStudentChargeAssignmentById);

// GET /api/student-charges/assignments/charge/:chargeId - Get assignments by charge ID
router.get('/assignments/charge/:chargeId', studentChargeController.getStudentChargeAssignmentsByChargeId);

// GET /api/student-charges/assignments/student/:studentId - Get assignments by student ID
router.get('/assignments/student/:studentId', studentChargeController.getStudentChargeAssignmentsByStudentId);

// GET /api/student-charges/assignments/class/:classId - Get assignments by class ID
router.get('/assignments/class/:classId', studentChargeController.getStudentChargeAssignmentsByClassId);

// GET /api/student-charges/assignments/unpaid - Get unpaid assignments
router.get('/assignments/unpaid', studentChargeController.getUnpaidStudentChargeAssignments);

// GET /api/student-charges/assignments/statistics - Get assignment statistics
router.get('/assignments/statistics', studentChargeController.getStudentChargeAssignmentStatistics);

// GET /api/student-charges/assignments/check/:chargeId/:studentId - Check if student is assigned
router.get('/assignments/check/:chargeId/:studentId', studentChargeController.isStudentAssignedToCharge);

// POST /api/student-charges/assignments - Create a new student charge assignment
router.post('/assignments', studentChargeController.createStudentChargeAssignment);

// POST /api/student-charges/assignments/bulk - Create multiple assignments
router.post('/assignments/bulk', studentChargeController.createBulkStudentChargeAssignments);

// POST /api/student-charges/assignments/assign-to-class - Assign charge to all students in a class
router.post('/assignments/assign-to-class', studentChargeController.assignChargeToClass);

// POST /api/student-charges/assignments/assign-to-all - Assign charge to all students
router.post('/assignments/assign-to-all', studentChargeController.assignChargeToAllStudents);

// POST /api/student-charges/assignments/:id/pay - Record payment for an assignment
router.post('/assignments/:id/pay', studentChargeController.recordStudentChargePayment);

// PUT /api/student-charges/assignments/:id - Update a student charge assignment
router.put('/assignments/:id', studentChargeController.updateStudentChargeAssignment);

// DELETE /api/student-charges/assignments/:id - Delete a student charge assignment
router.delete('/assignments/:id', studentChargeController.deleteStudentChargeAssignment);

// ============================================
// Summary Routes
// ============================================

// GET /api/student-charges/summary/:studentId - Get charge summary for a student
router.get('/summary/:studentId', studentChargeController.getStudentChargeSummary);

export default router;
