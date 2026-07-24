import { Router } from 'express';
import * as studentChargeController from '../controllers/studentChargeController.js';

/**
 * Student Charge Routes
 * RESTful API endpoints for student charge management
 * 
 * All routes are prefixed with /api/charges
 */

const router = Router();

// GET /api/charges - Get paginated list of student charges
router.get('/', studentChargeController.getStudentCharges);

// GET /api/charges/all - Get all student charges (no pagination)
router.get('/all', studentChargeController.getAllStudentCharges);

// GET /api/charges/:id - Get a single student charge by ID
router.get('/:id', studentChargeController.getStudentChargeById);

// GET /api/charges/class/:classId - Get student charges by class
router.get('/class/:classId', studentChargeController.getStudentChargesByClass);

// GET /api/charges/active - Get active student charges
router.get('/active', studentChargeController.getActiveStudentCharges);

// GET /api/charges/statistics - Get student charge statistics
router.get('/statistics', studentChargeController.getStudentChargeStatistics);

// GET /api/charges/student/:studentId - Get charges for a specific student
router.get('/student/:studentId', studentChargeController.getChargesForStudent);

// GET /api/charges/student/:studentId/unpaid - Get unpaid charges for a specific student
router.get('/student/:studentId/unpaid', studentChargeController.getUnpaidChargesForStudent);

// GET /api/charges/student/:studentId/outstanding - Get total outstanding charge amount for a student
router.get('/student/:studentId/outstanding', studentChargeController.getStudentOutstandingChargeAmount);

// POST /api/charges - Create a new student charge
router.post('/', studentChargeController.createStudentCharge);

// POST /api/charges/:id/assign - Assign a charge to specific students
router.post('/:id/assign', studentChargeController.assignChargeToStudents);

// PUT /api/charges/:id - Update a student charge
router.put('/:id', studentChargeController.updateStudentCharge);

// DELETE /api/charges/:id - Delete a student charge
router.delete('/:id', studentChargeController.deleteStudentCharge);

// DELETE /api/charges/:id/force - Force delete a student charge and all its assignments
router.delete('/:id/force', studentChargeController.forceDeleteStudentCharge);

export default router;
