import { Router } from 'express';
import * as studentChargeAssignmentController from '../controllers/studentChargeAssignmentController.js';

/**
 * Student Charge Assignment Routes
 * RESTful API endpoints for student charge assignment management
 * 
 * All routes are prefixed with /api/charges/assignments
 */

const router = Router();

// GET /api/charges/assignments - Get paginated list of assignments
router.get('/', studentChargeAssignmentController.getStudentChargeAssignments);

// GET /api/charges/assignments/all - Get all assignments (no pagination)
router.get('/all', studentChargeAssignmentController.getAllStudentChargeAssignments);

// GET /api/charges/assignments/:id - Get a single assignment by ID
router.get('/:id', studentChargeAssignmentController.getStudentChargeAssignmentById);

// GET /api/charges/assignments/charge/:chargeId - Get assignments by charge ID
router.get('/charge/:chargeId', studentChargeAssignmentController.getStudentChargeAssignmentsByCharge);

// GET /api/charges/assignments/charge/:chargeId/unpaid - Get unpaid assignments by charge ID
router.get('/charge/:chargeId/unpaid', studentChargeAssignmentController.getUnpaidStudentChargeAssignmentsByCharge);

// GET /api/charges/assignments/student/:studentId - Get assignments by student ID
router.get('/student/:studentId', studentChargeAssignmentController.getStudentChargeAssignmentsByStudent);

// GET /api/charges/assignments/student/:studentId/unpaid - Get unpaid assignments by student ID
router.get('/student/:studentId/unpaid', studentChargeAssignmentController.getUnpaidStudentChargeAssignmentsByStudent);

// GET /api/charges/assignments/student/:studentId/outstanding - Get outstanding amount for student
router.get('/student/:studentId/outstanding', studentChargeAssignmentController.getStudentOutstandingChargeAmount);

// GET /api/charges/assignments/statistics - Get assignment statistics
router.get('/statistics', studentChargeAssignmentController.getStudentChargeAssignmentStatistics);

// GET /api/charges/assignments/outstanding/summary - Get summary of all outstanding charges
router.get('/outstanding/summary', studentChargeAssignmentController.getOutstandingChargesSummary);

// GET /api/charges/assignments/check - Check if student is assigned to charge
router.get('/check', studentChargeAssignmentController.isStudentAssignedToCharge);

// POST /api/charges/assignments - Create a new assignment
router.post('/', studentChargeAssignmentController.createStudentChargeAssignment);

// POST /api/charges/assignments/bulk - Create multiple assignments
router.post('/bulk', studentChargeAssignmentController.createMultipleStudentChargeAssignments);

// POST /api/charges/assignments/:id/pay - Mark an assignment as paid
router.post('/:id/pay', studentChargeAssignmentController.markAssignmentAsPaid);

// POST /api/charges/assignments/:id/unpay - Mark an assignment as unpaid
router.post('/:id/unpay', studentChargeAssignmentController.markAssignmentAsUnpaid);

// PUT /api/charges/assignments/:id - Update an assignment
router.put('/:id', studentChargeAssignmentController.updateStudentChargeAssignment);

// DELETE /api/charges/assignments/:id - Delete an assignment
router.delete('/:id', studentChargeAssignmentController.deleteStudentChargeAssignment);

// DELETE /api/charges/assignments/charge/:chargeId - Delete all assignments for a charge
router.delete('/charge/:chargeId', studentChargeAssignmentController.deleteStudentChargeAssignmentsByCharge);

export default router;
