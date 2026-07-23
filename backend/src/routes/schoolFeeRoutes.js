import { Router } from 'express';
import * as schoolFeeController from '../controllers/schoolFeeController.js';

/**
 * School Fee Routes
 * RESTful API endpoints for school fee management
 * 
 * All routes are prefixed with /api/school-fees
 */

const router = Router();

// GET /api/school-fees - Get paginated list of school fee payments
router.get('/', schoolFeeController.getSchoolFeePayments);

// GET /api/school-fees/all - Get all school fee payments (no pagination)
router.get('/all', schoolFeeController.getAllSchoolFeePayments);

// GET /api/school-fees/:id - Get a single school fee payment by ID
router.get('/:id', schoolFeeController.getSchoolFeePaymentById);

// GET /api/school-fees/student/:studentId - Get school fee payments by student ID
router.get('/student/:studentId', schoolFeeController.getSchoolFeePaymentsByStudent);

// GET /api/school-fees/balance/:studentId - Get a student's current school fee balance
router.get('/balance/:studentId', schoolFeeController.getStudentSchoolFeeBalance);

// GET /api/school-fees/arrears - Get all students in arrears
router.get('/arrears', schoolFeeController.getStudentsInArrears);

// GET /api/school-fees/statistics - Get school fee statistics
router.get('/statistics', schoolFeeController.getSchoolFeeStatistics);

// GET /api/school-fees/summary - Get school fee summary for dashboard
router.get('/summary', schoolFeeController.getSchoolFeeSummary);

// POST /api/school-fees - Create a new school fee payment
router.post('/', schoolFeeController.createSchoolFeePayment);

// PUT /api/school-fees/:id - Update a school fee payment
router.put('/:id', schoolFeeController.updateSchoolFeePayment);

// DELETE /api/school-fees/:id - Delete a school fee payment
router.delete('/:id', schoolFeeController.deleteSchoolFeePayment);

export default router;
