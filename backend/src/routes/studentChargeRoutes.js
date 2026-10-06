import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import * as studentChargeController from '../controllers/studentChargeController.js';

/**
 * Student Charge Routes
 * RESTful API endpoints for student charge management
 * 
 * All routes are prefixed with /api/charges
 */

const router = Router();

// GET /api/charges - Get paginated list of student charges
router.get('/', requirePermission('charges.read'), studentChargeController.getStudentCharges);

// GET /api/charges/all - Get all student charges (no pagination)
router.get('/all', requirePermission('charges.read'), studentChargeController.getAllStudentCharges);

// GET /api/charges/:id - Get a single student charge by ID
router.get('/:id', requirePermission('charges.read'), studentChargeController.getStudentChargeById);

// GET /api/charges/class/:classId - Get student charges by class
router.get('/class/:classId', requirePermission('charges.read'), studentChargeController.getStudentChargesByClass);

// GET /api/charges/active - Get active student charges
router.get('/active', requirePermission('charges.read'), studentChargeController.getActiveStudentCharges);

// GET /api/charges/statistics - Get student charge statistics
router.get('/statistics', requirePermission('charges.read'), studentChargeController.getStudentChargeStatistics);

// GET /api/charges/student/:studentId - Get charges for a specific student
router.get('/student/:studentId', requirePermission('charges.read'), studentChargeController.getChargesForStudent);

// GET /api/charges/student/:studentId/unpaid - Get unpaid charges for a specific student
router.get('/student/:studentId/unpaid', requirePermission('charges.read'), studentChargeController.getUnpaidChargesForStudent);

// GET /api/charges/student/:studentId/outstanding - Get total outstanding charge amount for a student
router.get('/student/:studentId/outstanding', requirePermission('charges.read'), studentChargeController.getStudentOutstandingChargeAmount);

// POST /api/charges - Create a new student charge
router.post('/', requirePermission('charges.create'), studentChargeController.createStudentCharge);

// POST /api/charges/:id/assign - Assign a charge to specific students
router.post('/:id/assign', requirePermission('charges.create'), studentChargeController.assignChargeToStudents);

// PUT /api/charges/:id - Update a student charge
router.put('/:id', requirePermission('charges.update'), studentChargeController.updateStudentCharge);

// DELETE /api/charges/:id - Delete a student charge
router.delete('/:id', requirePermission('charges.delete'), studentChargeController.deleteStudentCharge);

// DELETE /api/charges/:id/force - Force delete a student charge and all its assignments
router.delete('/:id/force', requirePermission('charges.delete'), studentChargeController.forceDeleteStudentCharge);

export default router;
