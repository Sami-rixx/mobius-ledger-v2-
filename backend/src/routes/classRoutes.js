import { Router } from 'express';
import * as ClassController from '../controllers/classController.js';

/**
 * Class Routes
 * API endpoints for class management
 * 
 * Base Path: /api/classes
 */

const router = Router();

// GET /api/classes - Get paginated list of classes
router.get('/', ClassController.getClasses);

// GET /api/classes/all - Get all classes without pagination
router.get('/all', ClassController.getAllClasses);

// GET /api/classes/name/:name - Get a class by name
router.get('/name/:name', ClassController.getClassByName);

// GET /api/classes/active - Get all active classes
router.get('/active', ClassController.getActiveClasses);

// GET /api/classes/search - Search classes
router.get('/search', ClassController.searchClasses);

// GET /api/classes/statistics - Get class statistics
router.get('/statistics', ClassController.getClassStatistics);

// GET /api/classes/with-students - Get classes with student counts
router.get('/with-students', ClassController.getClassesWithStudentCounts);

// GET /api/classes/check-name/:name - Check class name availability
router.get('/check-name/:name', ClassController.checkClassName);

// GET /api/classes/:id - Get a single class by ID (must come AFTER all specific routes)
router.get('/:id', ClassController.getClassById);

// POST /api/classes - Create a new class
router.post('/', ClassController.createClass);

// PUT /api/classes/:id - Update a class (full update)
router.put('/:id', ClassController.updateClass);

// PATCH /api/classes/:id - Partially update a class
router.patch('/:id', ClassController.patchClass);

// DELETE /api/classes/:id - Delete a class
router.delete('/:id', ClassController.deleteClass);

/**
 * API Documentation for Class Routes
 * 
 * @typedef {Object} Class
 * @property {number} id - Class ID
 * @property {string} name - Class name
 * @property {string} description - Class description
 * @property {boolean} is_active - Active status
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 * @property {number} created_by - User ID who created the record
 * @property {number} updated_by - User ID who last updated the record
 * @property {number} student_count - Number of students in the class (when requested)
 * 
 * @typedef {Object} PaginatedResponse
 * @property {boolean} success - Success status
 * @property {Class[]} data - Array of classes
 * @property {Object} pagination - Pagination metadata
 * @property {number} pagination.page - Current page
 * @property {number} pagination.pageSize - Items per page
 * @property {number} pagination.total - Total items
 * @property {number} pagination.totalPages - Total pages
 * @property {boolean} pagination.hasNextPage - Has next page
 * @property {boolean} pagination.hasPreviousPage - Has previous page
 */

/**
 * Class Routes Summary:
 * 
 * GET    /api/classes                    - List classes (paginated)
 * GET    /api/classes/all                - List all classes
 * GET    /api/classes/:id                - Get class by ID
 * GET    /api/classes/name/:name         - Get class by name
 * POST   /api/classes                    - Create class
 * PUT    /api/classes/:id                - Update class (full)
 * PATCH  /api/classes/:id                - Update class (partial)
 * DELETE /api/classes/:id                - Delete class
 * GET    /api/classes/active              - Get active classes
 * GET    /api/classes/search              - Search classes
 * GET    /api/classes/statistics          - Get statistics
 * GET    /api/classes/with-students      - Get classes with student counts
 * GET    /api/classes/check-name/:name   - Check class name availability
 */

export default router;
