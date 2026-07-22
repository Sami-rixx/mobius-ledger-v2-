import * as ClassService from '../services/classService.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';

/**
 * Class Controller
 * Route handlers for class API endpoints
 * 
 * Handles HTTP requests and responses for class management
 */

/**
 * GET /api/classes
 * Get paginated list of classes with optional filtering
 * 
 * Query Parameters:
 * - search: Search term for name or description
 * - isActive: Filter by active status (true/false)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20)
 * - orderBy: Field to order by (default: name)
 * - orderDir: Order direction (ASC/DESC, default: ASC)
 * 
 * Response: 200 OK with paginated class list
 */
export const getClasses = (req, res, next) => {
  try {
    const {
      search,
      isActive,
      page = 1,
      pageSize = 20,
      orderBy = 'name',
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

    // Validate isActive if provided
    if (isActive !== undefined && isActive !== 'true' && isActive !== 'false') {
      throw new ValidationError('Invalid isActive value. Must be true or false.');
    }

    const result = ClassService.getPaginatedClasses({
      search,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
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
 * GET /api/classes/all
 * Get all classes without pagination (use with caution)
 * 
 * Query Parameters:
 * - search: Search term
 * - isActive: Filter by active status
 * - orderBy: Field to order by
 * - orderDir: Order direction
 * 
 * Response: 200 OK with all matching classes
 */
export const getAllClasses = (req, res, next) => {
  try {
    const { search, isActive, orderBy, orderDir } = req.query;

    // Validate isActive if provided
    if (isActive !== undefined && isActive !== 'true' && isActive !== 'false') {
      throw new ValidationError('Invalid isActive value. Must be true or false.');
    }

    const classes = ClassService.getAllClasses({
      search,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      orderBy,
      orderDir
    });

    res.json({
      success: true,
      data: classes,
      count: classes.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/classes/:id
 * Get a single class by ID
 * 
 * URL Parameters:
 * - id: Class ID
 * 
 * Response: 200 OK with class data or 404 if not found
 */
export const getClassById = (req, res, next) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      throw new ValidationError('Invalid class ID. Must be a number.');
    }

    const cls = ClassService.getClassById(parseInt(id));

    if (!cls) {
      throw new NotFoundError(`Class not found with ID: ${id}`);
    }

    res.json({
      success: true,
      data: cls
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/classes/name/:name
 * Get a class by name
 * 
 * URL Parameters:
 * - name: Class name
 * 
 * Response: 200 OK with class data or 404 if not found
 */
export const getClassByName = (req, res, next) => {
  try {
    const { name } = req.params;

    if (!name || name.trim() === '') {
      throw new ValidationError('Class name is required.');
    }

    const cls = ClassService.getClassByName(name.trim());

    if (!cls) {
      throw new NotFoundError(`Class not found with name: ${name}`);
    }

    res.json({
      success: true,
      data: cls
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/classes
 * Create a new class
 * 
 * Request Body:
 * {
 *   "name": "Grade 1",
 *   "description": "First grade class",
 *   "is_active": true
 * }
 * 
 * Response: 201 Created with created class data
 */
export const createClass = (req, res, next) => {
  try {
    const classData = req.body;

    // Validate required fields
    if (!classData.name) {
      throw new ValidationError('Class name is required.');
    }

    // Extract created_by from request (future: from authenticated user)
    const createdBy = req.user?.id || null;

    const cls = ClassService.createClass(classData, createdBy);

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: cls
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/classes/:id
 * Update a class
 * 
 * URL Parameters:
 * - id: Class ID
 * 
 * Request Body: Same as POST /api/classes
 * 
 * Response: 200 OK with updated class data
 */
export const updateClass = (req, res, next) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      throw new ValidationError('Invalid class ID. Must be a number.');
    }

    const classData = req.body;

    // Check if trying to update with empty name
    if (classData.name === '') {
      throw new ValidationError('Class name cannot be empty');
    }

    // Extract updated_by from request
    const updatedBy = req.user?.id || null;

    const cls = ClassService.updateClass(parseInt(id), classData, updatedBy);

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: cls
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/classes/:id
 * Partially update a class
 * 
 * URL Parameters:
 * - id: Class ID
 * 
 * Request Body: Partial class data
 * 
 * Response: 200 OK with updated class data
 */
export const patchClass = (req, res, next) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      throw new ValidationError('Invalid class ID. Must be a number.');
    }

    const classData = req.body;

    // Extract updated_by from request
    const updatedBy = req.user?.id || null;

    const cls = ClassService.updateClass(parseInt(id), classData, updatedBy);

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: cls
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/classes/:id
 * Delete a class
 * 
 * URL Parameters:
 * - id: Class ID
 * 
 * Response: 200 OK with success message or 400 if cannot delete
 */
export const deleteClass = (req, res, next) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      throw new ValidationError('Invalid class ID. Must be a number.');
    }

    // Extract deleted_by from request
    const deletedBy = req.user?.id || null;

    const deleted = ClassService.deleteClass(parseInt(id), deletedBy);

    if (!deleted) {
      throw new NotFoundError(`Class not found with ID: ${id}`);
    }

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/classes/active
 * Get all active classes
 * 
 * Response: 200 OK with array of active classes
 */
export const getActiveClasses = (req, res, next) => {
  try {
    const classes = ClassService.getActiveClasses();

    res.json({
      success: true,
      data: classes,
      count: classes.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/classes/search
 * Search classes by name or description
 * 
 * Query Parameters:
 * - q: Search term (minimum 2 characters)
 * 
 * Response: 200 OK with matching classes
 */
export const searchClasses = (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      throw new ValidationError('Search term must be at least 2 characters long.');
    }

    const classes = ClassService.searchClasses(q.trim());

    res.json({
      success: true,
      data: classes,
      count: classes.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/classes/statistics
 * Get class statistics
 * 
 * Response: 200 OK with statistics
 */
export const getClassStatistics = (req, res, next) => {
  try {
    const stats = ClassService.getClassStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/classes/with-students
 * Get classes with student counts
 * 
 * Response: 200 OK with classes and student counts
 */
export const getClassesWithStudentCounts = (req, res, next) => {
  try {
    const classes = ClassService.getClassesWithStudentCounts();

    res.json({
      success: true,
      data: classes,
      count: classes.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/classes/check-name/:name
 * Check if class name is available
 * 
 * URL Parameters:
 * - name: Class name to check
 * 
 * Query Parameters:
 * - excludeId: Class ID to exclude from check (for updates)
 * 
 * Response: 200 OK with availability status
 */
export const checkClassName = (req, res, next) => {
  try {
    const { name } = req.params;
    const { excludeId } = req.query;

    if (!name || name.trim() === '') {
      throw new ValidationError('Class name is required.');
    }

    const available = ClassService.isClassNameAvailable(
      name.trim(),
      excludeId ? parseInt(excludeId) : undefined
    );

    res.json({
      success: true,
      available,
      class_name: name.trim()
    });
  } catch (error) {
    next(error);
  }
};

// Export all controller functions
export default {
  getClasses,
  getAllClasses,
  getClassById,
  getClassByName,
  createClass,
  updateClass,
  patchClass,
  deleteClass,
  getActiveClasses,
  searchClasses,
  getClassStatistics,
  getClassesWithStudentCounts,
  checkClassName
};
