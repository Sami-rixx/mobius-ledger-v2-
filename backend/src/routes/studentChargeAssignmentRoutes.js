import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import * as studentChargeAssignmentController from '../controllers/studentChargeAssignmentController.js';

/**
 * Student Charge Assignment Routes
 * RESTful API endpoints for student charge assignment management
 * 
 * All routes are prefixed with /api/charges/assignments
 */

const router = Router();

// GET /api/charges/assignments - Get paginated list of assignments
router.get('/', requirePermission('charges.read'), studentChargeAssignmentController.getStudentChargeAssignments);

// GET /api/charges/assignments/all - Get all assignments (no pagination)
router.get('/all', requirePermission('charges.read'), studentChargeAssignmentController.getAllStudentChargeAssignments);

// GET /api/charges/assignments/:id - Get a single assignment by ID
router.get('/:id', requirePermission('charges.read'), studentChargeAssignmentController.getStudentChargeAssignmentById);

// GET /api/charges/assignments/charge/:chargeId - Get assignments by charge ID
router.get('/charge/:chargeId', requirePermission('charges.read'), studentChargeAssignmentController.getStudentChargeAssignmentsByCharge);

// GET /api/charges/assignments/charge/:chargeId/unpaid - Get unpaid assignments by charge ID
router.get('/charge/:chargeId/unpaid', requirePermission('charges.read'), studentChargeAssignmentController.getUnpaidStudentChargeAssignmentsByCharge);

// GET /api/charges/assignments/student/:studentId - Get assignments by student ID
router.get('/student/:studentId', requirePermission('charges.read'), studentChargeAssignmentController.getStudentChargeAssignmentsByStudent);

// GET /api/charges/assignments/student/:studentId/unpaid - Get unpaid assignments by student ID
router.get('/student/:studentId/unpaid', requirePermission('charges.read'), studentChargeAssignmentController.getUnpaidStudentChargeAssignmentsByStudent);

// GET /api/charges/assignments/student/:studentId/outstanding - Get outstanding amount for student
router.get('/student/:studentId/outstanding', requirePermission('charges.read'), studentChargeAssignmentController.getStudentOutstandingChargeAmount);

// GET /api/charges/assignments/statistics - Get assignment statistics
router.get('/statistics', requirePermission('charges.read'), studentChargeAssignmentController.getStudentChargeAssignmentStatistics);

// GET /api/charges/assignments/outstanding/summary - Get summary of all outstanding charges
router.get('/outstanding/summary', requirePermission('charges.read'), studentChargeAssignmentController.getOutstandingChargesSummary);

// GET /api/charges/assignments/check - Check if student is assigned to charge
router.get('/check', requirePermission('charges.read'), studentChargeAssignmentController.isStudentAssignedToCharge);

// POST /api/charges/assignments - Create a new assignment
router.post('/', requirePermission('charges.create'), studentChargeAssignmentController.createStudentChargeAssignment);

// POST /api/charges/assignments/bulk - Create multiple assignments
router.post('/bulk', requirePermission('charges.create'), studentChargeAssignmentController.createMultipleStudentChargeAssignments);

// POST /api/charges/assignments/:id/pay - Mark an assignment as paid
router.post('/:id/pay', requirePermission('charges.update'), studentChargeAssignmentController.markAssignmentAsPaid);

// POST /api/charges/assignments/:id/unpay - Mark an assignment as unpaid
router.post('/:id/unpay', requirePermission('charges.update'), studentChargeAssignmentController.markAssignmentAsUnpaid);

// PUT /api/charges/assignments/:id - Update an assignment
router.put('/:id', requirePermission('charges.update'), studentChargeAssignmentController.updateStudentChargeAssignment);

// DELETE /api/charges/assignments/:id - Delete an assignment
router.delete('/:id', requirePermission('charges.delete'), studentChargeAssignmentController.deleteStudentChargeAssignment);

// DELETE /api/charges/assignments/charge/:chargeId - Delete all assignments for a charge
router.delete('/charge/:chargeId', requirePermission('charges.delete'), studentChargeAssignmentController.deleteStudentChargeAssignmentsByCharge);

export default router;
