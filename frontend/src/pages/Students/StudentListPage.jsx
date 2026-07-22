import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, StudentTable } from '../../components/index.js';
import { useApi } from '../../hooks/index.js';
import { getStudents, deleteStudent, searchStudents } from '../../services/studentService.js';
import { useNavigate } from 'react-router-dom';

/**
 * StudentListPage Component
 * Displays a paginated list of students with search and filter capabilities
 */
function StudentListPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);

  // Load classes for filter
  const { data: classesData } = useApi(async () => {
    const response = await fetch('/api/classes');
    return response.json();
  });

  // Load students
  const loadStudents = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        pageSize: 20,
        search: searchQuery || undefined,
        classId: classFilter || undefined,
        status: statusFilter || undefined
      };

      const result = await getStudents(params);
      setStudents(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, classFilter, statusFilter]);

  // Load classes
  useEffect(() => {
    if (classesData) {
      setClasses(classesData.data || classesData);
    }
  }, [classesData]);

  // Initial load
  useEffect(() => {
    loadStudents(1);
  }, [loadStudents]);

  // Handle page change
  const handlePageChange = (page) => {
    loadStudents(page);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadStudents(1);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'classFilter') {
      setClassFilter(value);
    } else if (name === 'statusFilter') {
      setStatusFilter(value);
    }
  };

  // Handle delete
  const handleDelete = async (student) => {
    if (window.confirm(`Are you sure you want to delete ${student.first_name} ${student.last_name}?`)) {
      try {
        await deleteStudent(student.id);
        // Refresh the list
        loadStudents(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to delete student');
      }
    }
  };

  // Handle edit
  const handleEdit = (student) => {
    navigate(`/students/edit/${student.id}`);
  };

  // Handle view
  const handleView = (student) => {
    navigate(`/students/${student.id}`);
  };

  // Handle create
  const handleCreate = () => {
    navigate('/students/create');
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setClassFilter('');
    setStatusFilter('');
    loadStudents(1);
  };

  // Status options
  const statusOptions = ['', 'Active', 'Inactive', 'Graduated', 'Transferred'];

  return (
    <div className="page student-list-page">
      <header className="header">
        <h1>Student Management</h1>
        <p>Manage student records</p>
      </header>

      <main className="main-content">
        <Card title="Students">
          {/* Search and Filter Bar */}
          <div className="filter-bar">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search by name or admission number..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
              <Button type="submit" variant="primary">
                Search
              </Button>
            </form>

            <div className="filter-controls">
              <select
                name="classFilter"
                value={classFilter}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>

              <select
                name="statusFilter"
                value={statusFilter}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status || 'All'}</option>
                ))}
              </select>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <p className="text-error">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="page-actions">
            <Button variant="primary" onClick={handleCreate}>
              + Add New Student
            </Button>
          </div>

          {/* Student Table */}
          <StudentTable
            students={students}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onPageChange={handlePageChange}
            pagination={pagination}
          />
        </Card>
      </main>
    </div>
  );
}

export default StudentListPage;
