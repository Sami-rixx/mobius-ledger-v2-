import { Router } from 'express';
import * as lunchController from '../controllers/lunchController.js';

/**
 * Lunch Routes
 * RESTful API endpoints for lunch management
 * 
 * All routes are prefixed with /api/lunch
 */

const router = Router();

// ============================================
// Lunch Payment Routes
// ============================================

// GET /api/lunch/payments - Get paginated list of lunch payments
router.get('/payments', lunchController.getLunchPayments);

// GET /api/lunch/payments/all - Get all lunch payments (no pagination)
router.get('/payments/all', lunchController.getAllLunchPayments);

// GET /api/lunch/payments/:id - Get a single lunch payment by ID
router.get('/payments/:id', lunchController.getLunchPaymentById);

// GET /api/lunch/payments/student/:studentId - Get lunch payments by student ID
router.get('/payments/student/:studentId', lunchController.getLunchPaymentsByStudentId);

// GET /api/lunch/payments/date-range - Get lunch payments by date range
router.get('/payments/date-range', lunchController.getLunchPaymentsByDateRange);

// GET /api/lunch/payments/statistics - Get lunch payment statistics
router.get('/payments/statistics', lunchController.getLunchPaymentStatistics);

// GET /api/lunch/payments/summary/:date - Get lunch payment summary for a specific date
router.get('/payments/summary/:date', lunchController.getLunchPaymentSummaryByDate);

// POST /api/lunch/payments - Create a new lunch payment
router.post('/payments', lunchController.createLunchPayment);

// PUT /api/lunch/payments/:id - Update a lunch payment
router.put('/payments/:id', lunchController.updateLunchPayment);

// DELETE /api/lunch/payments/:id - Delete a lunch payment
router.delete('/payments/:id', lunchController.deleteLunchPayment);

// ============================================
// Lunch Attendance Routes
// ============================================

// GET /api/lunch/attendance - Get paginated list of lunch attendance records
router.get('/attendance', lunchController.getLunchAttendance);

// GET /api/lunch/attendance/all - Get all lunch attendance records (no pagination)
router.get('/attendance/all', lunchController.getAllLunchAttendance);

// GET /api/lunch/attendance/:id - Get a single lunch attendance record by ID
router.get('/attendance/:id', lunchController.getLunchAttendanceById);

// GET /api/lunch/attendance/date/:date - Get lunch attendance for a specific date
router.get('/attendance/date/:date', lunchController.getLunchAttendanceByDate);

// GET /api/lunch/attendance/student/:studentId - Get lunch attendance for a student
router.get('/attendance/student/:studentId', lunchController.getLunchAttendanceByStudentId);

// GET /api/lunch/attendance/statistics - Get lunch attendance statistics
router.get('/attendance/statistics', lunchController.getLunchAttendanceStatistics);

// GET /api/lunch/attendance/summary/:date - Get lunch attendance summary for a specific date
router.get('/attendance/summary/:date', lunchController.getLunchAttendanceSummaryByDate);

// GET /api/lunch/attendance/arrears - Get students with unpaid lunch attendance
router.get('/attendance/arrears', lunchController.getLunchArrears);

// POST /api/lunch/attendance - Create a new lunch attendance record
router.post('/attendance', lunchController.createLunchAttendance);

// POST /api/lunch/attendance/bulk - Record lunch attendance for multiple students
router.post('/attendance/bulk', lunchController.recordBulkLunchAttendance);

// POST /api/lunch/attendance/mark-paid - Mark lunch attendance as paid
router.post('/attendance/mark-paid', lunchController.markLunchAttendanceAsPaid);

// PUT /api/lunch/attendance/:id - Update a lunch attendance record
router.put('/attendance/:id', lunchController.updateLunchAttendance);

// DELETE /api/lunch/attendance/:id - Delete a lunch attendance record
router.delete('/attendance/:id', lunchController.deleteLunchAttendance);

export default router;
