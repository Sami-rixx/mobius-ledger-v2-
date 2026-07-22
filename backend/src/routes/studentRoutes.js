import { Router } from 'express';
import * as StudentController from '../controllers/studentController.js';

/**
 * Student Routes
 * API endpoints for student management
 * 
 * Base Path: /api/students
 */

const router = Router();

// GET /api/students - Get paginated list of students
router.get('/', StudentController.getStudents);

// GET /api/students/all - Get all students without pagination
router.get('/all', StudentController.getAllStudents);

// GET /api/students/:id - Get a single student by ID
router.get('/:id', StudentController.getStudentById);

// GET /api/students/admission/:admissionNumber - Get a student by admission number
router.get('/admission/:admissionNumber', StudentController.getStudentByAdmissionNumber);

// POST /api/students - Create a new student
router.post('/', StudentController.createStudent);

// PUT /api/students/:id - Update a student (full update)
router.put('/:id', StudentController.updateStudent);

// PATCH /api/students/:id - Partially update a student
router.patch('/:id', StudentController.patchStudent);

// DELETE /api/students/:id - Delete a student
router.delete('/:id', StudentController.deleteStudent);

// GET /api/students/class/:classId - Get students by class
router.get('/class/:classId', StudentController.getStudentsByClass);

// GET /api/students/search - Search students
router.get('/search', StudentController.searchStudents);

// GET /api/students/statistics - Get student statistics
router.get('/statistics', StudentController.getStudentStatistics);

// GET /api/students/summary - Get student summary for dashboard
router.get('/summary', StudentController.getStudentSummary);

// GET /api/students/check-admission/:admissionNumber - Check admission number availability
router.get('/check-admission/:admissionNumber', StudentController.checkAdmissionNumber);

/**
 * API Documentation for Student Routes
 * 
 * @typedef {Object} Student
 * @property {number} id - Student ID
 * @property {string} admission_number - Unique admission number
 * @property {string} first_name - First name
 * @property {string} last_name - Last name
 * @property {string} gender - Gender (Male, Female, Other)
 * @property {string} date_of_birth - Date of birth (YYYY-MM-DD)
 * @property {number} class_id - Class ID
 * @property {string} class_name - Class name
 * @property {string} parent_name - Parent/guardian name
 * @property {string} parent_phone - Parent phone number
 * @property {string} parent_email - Parent email
 * @property {string} address - Address
 * @property {string} status - Status (Active, Inactive, Graduated, Transferred)
 * @property {string} notes - Additional notes
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 * @property {number} created_by - User ID who created the record
 * @property {number} updated_by - User ID who last updated the record
 * 
 * @typedef {Object} PaginatedResponse
 * @property {boolean} success - Success status
 * @property {Student[]} data - Array of students
 * @property {Object} pagination - Pagination metadata
 * @property {number} pagination.page - Current page
 * @property {number} pagination.pageSize - Items per page
 * @property {number} pagination.total - Total items
 * @property {number} pagination.totalPages - Total pages
 * @property {boolean} pagination.hasNextPage - Has next page
 * @property {boolean} pagination.hasPreviousPage - Has previous page
 */

/**
 * Student Routes Summary:
 * 
 * GET    /api/students                    - List students (paginated)
 * GET    /api/students/all                - List all students
 * GET    /api/students/:id                - Get student by ID
 * GET    /api/students/admission/:admissionNumber - Get by admission number
 * POST   /api/students                    - Create student
 * PUT    /api/students/:id                - Update student (full)
 * PATCH  /api/students/:id                - Update student (partial)
 * DELETE /api/students/:id                - Delete student
 * GET    /api/students/class/:classId     - Get students by class
 * GET    /api/students/search              - Search students
 * GET    /api/students/statistics          - Get statistics
 * GET    /api/students/summary             - Get summary for dashboard
 * GET    /api/students/check-admission/:admissionNumber - Check admission number
 */

export default router;
