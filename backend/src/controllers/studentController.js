import * as StudentService from '../services/studentService.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';

/**
 * Student Controller
 * Route handlers for student API endpoints
 * 
 * Handles HTTP requests and responses for student management
 */

/**
 * GET /api/students
 * Get paginated list of students with optional filtering
 * 
 * Query Parameters:
 * - search: Search term for name or admission number
 * - classId: Filter by class ID
 * - status: Filter by status (Active, Inactive, Graduated, Transferred)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20)
 * - orderBy: Field to order by (default: last_name, first_name)
 * - orderDir: Order direction (ASC/DESC, default: ASC)
 * 
 * Response: 200 OK with paginated student list
 */
export const getStudents = (req, res, next) => {
  try {
    const {
      search,
      classId,
      status,
      page = 1,
      pageSize = 20,
      orderBy = 'last_name, first_name',
      orderDir = 'ASC'
    } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new ValidationError('Invalid page number. Must be a positive integer.');
    }

    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
      throw new ValidationError('Invalid page size. Must be between 1 and 100.');
    }

    // Validate classId if provided
    if (classId && isNaN(parseInt(classId))) {
      throw new ValidationError('Invalid class ID. Must be a number.');
    }

    // Validate status if provided
    const validStatuses = ['Active', 'Inactive', 'Graduated', 'Transferred'];
    if (status && !validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const result = StudentService.getPaginatedStudents({
      search,
      classId: classId ? parseInt(classId) : undefined,
      status,
      page: pageNum,
      pageSize: pageSizeNum,
      orderBy,
      orderDir
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/all
 * Get all students without pagination (use with caution)
 * 
 * Query Parameters:
 * - search: Search term
 * - classId: Filter by class ID
 * - status: Filter by status
 * - orderBy: Field to order by
 * - orderDir: Order direction
 * 
 * Response: 200 OK with all matching students
 */
export const getAllStudents = (req, res, next) => {
  try {
    const { search, classId, status, orderBy, orderDir } = req.query;

    // Validate classId if provided
    if (classId && isNaN(parseInt(classId))) {
      throw new ValidationError('Invalid class ID. Must be a number.');
    }

    // Validate status if provided
    const validStatuses = ['Active', 'Inactive', 'Graduated', 'Transferred'];
    if (status && !validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const students = StudentService.getAllStudents({
      search,
      classId: classId ? parseInt(classId) : undefined,
      status,
      orderBy,
      orderDir
    });

    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/:id
 * Get a single student by ID
 * 
 * URL Parameters:
 * - id: Student ID
 * 
 * Response: 200 OK with student data or 404 if not found
 */
export const getStudentById = (req, res, next) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      throw new ValidationError('Invalid student ID. Must be a number.');
    }

    const student = StudentService.getStudentById(parseInt(id));

    if (!student) {
      throw new NotFoundError(`Student not found with ID: ${id}`);
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/admission/:admissionNumber
 * Get a student by admission number
 * 
 * URL Parameters:
 * - admissionNumber: Student admission number
 * 
 * Response: 200 OK with student data or 404 if not found
 */
export const getStudentByAdmissionNumber = (req, res, next) => {
  try {
    const { admissionNumber } = req.params;

    if (!admissionNumber || admissionNumber.trim() === '') {
      throw new ValidationError('Admission number is required.');
    }

    const student = StudentService.getStudentByAdmissionNumber(admissionNumber.trim().toUpperCase());

    if (!student) {
      throw new NotFoundError(`Student not found with admission number: ${admissionNumber}`);
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/students
 * Create a new student
 * 
 * Request Body:
 * {
 *   "admission_number": "ML-2026-001",
 *   "first_name": "John",
 *   "last_name": "Doe",
 *   "gender": "Male",
 *   "date_of_birth": "2015-01-15",
 *   "class_id": 1,
 *   "parent_name": "Jane Doe",
 *   "parent_phone": "0712345678",
 *   "parent_email": "jane@example.com",
 *   "address": "123 Main St",
 *   "status": "Active",
 *   "notes": "Some notes"
 * }
 * 
 * Response: 201 Created with created student data
 */
export const createStudent = (req, res, next) => {
  try {
    const studentData = req.body;

    // Validate required fields
    const requiredFields = ['admission_number', 'first_name', 'last_name', 'parent_name', 'parent_phone'];
    const missingFields = requiredFields.filter(field => !studentData[field]);

    if (missingFields.length > 0) {
      throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Extract created_by from request (future: from authenticated user)
    // For now, use system user (ID 1) or null
    const createdBy = req.user?.id || null;

    const student = StudentService.createStudent(studentData, createdBy);

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/students/:id
 * Update a student
 * 
 * URL Parameters:
 * - id: Student ID
 * 
 * Request Body: Same as POST /api/students
 * 
 * Response: 200 OK with updated student data
 */
export const updateStudent = (req, res, next) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      throw new ValidationError('Invalid student ID. Must be a number.');
    }

    const studentData = req.body;

    // Check if trying to update with empty required fields
    const requiredFields = ['first_name', 'last_name', 'parent_name', 'parent_phone'];
    for (const field of requiredFields) {
      if (studentData[field] === '') {
        throw new ValidationError(`Field ${field} cannot be empty`);
      }
    }

    // Extract updated_by from request
    const updatedBy = req.user?.id || null;

    const student = StudentService.updateStudent(parseInt(id), studentData, updatedBy);

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/students/:id
 * Partially update a student
 * 
 * URL Parameters:
 * - id: Student ID
 * 
 * Request Body: Partial student data
 * 
 * Response: 200 OK with updated student data
 */
export const patchStudent = (req, res, next) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      throw new ValidationError('Invalid student ID. Must be a number.');
    }

    const studentData = req.body;

    // Extract updated_by from request
    const updatedBy = req.user?.id || null;

    const student = StudentService.updateStudent(parseInt(id), studentData, updatedBy);

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/students/:id
 * Delete a student
 * 
 * URL Parameters:
 * - id: Student ID
 * 
 * Response: 200 OK with success message or 400 if cannot delete
 */
export const deleteStudent = (req, res, next) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      throw new ValidationError('Invalid student ID. Must be a number.');
    }

    // Extract deleted_by from request
    const deletedBy = req.user?.id || null;

    const deleted = StudentService.deleteStudent(parseInt(id), deletedBy);

    if (!deleted) {
      throw new NotFoundError(`Student not found with ID: ${id}`);
    }

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/class/:classId
 * Get students by class
 * 
 * URL Parameters:
 * - classId: Class ID
 * 
 * Response: 200 OK with array of students in the class
 */
export const getStudentsByClass = (req, res, next) => {
  try {
    const { classId } = req.params;

    if (isNaN(parseInt(classId))) {
      throw new ValidationError('Invalid class ID. Must be a number.');
    }

    const students = StudentService.getStudentsByClass(parseInt(classId));

    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/search
 * Search students by name or admission number
 * 
 * Query Parameters:
 * - q: Search term (minimum 2 characters)
 * 
 * Response: 200 OK with matching students
 */
export const searchStudents = (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      throw new ValidationError('Search term must be at least 2 characters long.');
    }

    const students = StudentService.searchStudents(q.trim());

    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/statistics
 * Get student statistics
 * 
 * Response: 200 OK with statistics
 */
export const getStudentStatistics = (req, res, next) => {
  try {
    const stats = StudentService.getStudentStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/summary
 * Get student summary for dashboard
 * 
 * Response: 200 OK with summary data
 */
export const getStudentSummary = (req, res, next) => {
  try {
    const summary = StudentService.getStudentSummary();

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/check-admission/:admissionNumber
 * Check if admission number is available
 * 
 * URL Parameters:
 * - admissionNumber: Admission number to check
 * 
 * Query Parameters:
 * - excludeId: Student ID to exclude from check (for updates)
 * 
 * Response: 200 OK with availability status
 */
export const checkAdmissionNumber = (req, res, next) => {
  try {
    const { admissionNumber } = req.params;
    const { excludeId } = req.query;

    if (!admissionNumber || admissionNumber.trim() === '') {
      throw new ValidationError('Admission number is required.');
    }

    const available = StudentService.isAdmissionNumberAvailable(
      admissionNumber.trim(),
      excludeId ? parseInt(excludeId) : undefined
    );

    res.json({
      success: true,
      available,
      admission_number: admissionNumber.trim().toUpperCase()
    });
  } catch (error) {
    next(error);
  }
};

// Export all controller functions
export default {
  getStudents,
  getAllStudents,
  getStudentById,
  getStudentByAdmissionNumber,
  createStudent,
  updateStudent,
  patchStudent,
  deleteStudent,
  getStudentsByClass,
  searchStudents,
  getStudentStatistics,
  getStudentSummary,
  checkAdmissionNumber
};
