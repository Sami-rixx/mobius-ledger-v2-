import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, StudentChargeTable } from '../../components/index.js';
import { useApi } from '../../hooks/index.js';
import {
  getStudentCharges,
  deleteStudentCharge
} from '../../services/studentChargeService.js';
import { getAllClasses } from '../../services/classService.js';
import { useNavigate } from 'react-router-dom';

/**
 * StudentChargeListPage Component
 * Displays a paginated list of student charges with search and filter capabilities
 */
function StudentChargeListPage() {
  const navigate = useNavigate();
  const [charges, setCharges] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);

  // Load classes for filter
  const { data: classesData } = useApi(async () => {
    const response = await getAllClasses();
    return response;
  });

  // Load charges
  const loadCharges = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        pageSize: 20,
        search: searchQuery || undefined,
        classId: classFilter || undefined,
        chargeType: typeFilter || undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
      };

      const result = await getStudentCharges(params);
      setCharges(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load charges');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, classFilter, typeFilter, statusFilter]);

  // Load classes
  useEffect(() => {
    if (classesData) {
      setClasses(classesData.data || classesData);
    }
  }, [classesData]);

  // Initial load
  useEffect(() => {
    loadCharges(1);
  }, [loadCharges]);

  // Handle page change
  const handlePageChange = (page) => {
    loadCharges(page);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadCharges(1);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'classFilter') {
      setClassFilter(value);
    } else if (name === 'typeFilter') {
      setTypeFilter(value);
    } else if (name === 'statusFilter') {
      setStatusFilter(value);
    }
  };

  // Handle delete
  const handleDelete = async (charge) => {
    if (window.confirm(`Are you sure you want to delete charge "${charge.name}"?`)) {
      try {
        await deleteStudentCharge(charge.id);
        // Refresh the list
        loadCharges(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to delete charge');
      }
    }
  };

  // Handle edit
  const handleEdit = (charge) => {
    navigate(`/student-charges/edit/${charge.id}`);
  };

  // Handle view
  const handleView = (charge) => {
    navigate(`/student-charges/${charge.id}`);
  };

  // Handle assign
  const handleAssign = (charge) => {
    navigate(`/student-charges/${charge.id}/assign`);
  };

  // Handle create
  const handleCreate = () => {
    navigate('/student-charges/create');
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setClassFilter('');
    setTypeFilter('');
    setStatusFilter('');
    loadCharges(1);
  };

  // Charge type options
  const chargeTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'individual', label: 'Individual' },
    { value: 'all', label: 'All Students' },
    { value: 'class', label: 'Entire Class' },
    { value: 'grade', label: 'Grade Level' },
    { value: 'custom', label: 'Custom Group' }
  ];

  // Status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  // View assignments
  const handleViewAssignments = () => {
    navigate('/student-charges/assignments');
  };

  return (
    <div className="page student-charge-list-page">
      <header className="header">
        <h1>Student Charges Management</h1>
        <p>Manage custom charges for students (swimming, trips, sports, etc.)</p>
      </header>

      <main className="main-content">
        <Card title="Student Charges">
          {/* Search and Filter Bar */}
          <div className="filter-bar">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search by charge name or description..."
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
                name="typeFilter"
                value={typeFilter}
                onChange={handleFilterChange}
                className="filter-select"
              >
                {chargeTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                name="statusFilter"
                value={statusFilter}
                onChange={handleFilterChange}
                className="filter-select"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
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
              + Add New Charge
            </Button>
            <Button variant="info" onClick={handleViewAssignments}>
              View All Assignments
            </Button>
          </div>

          {/* Charge Table */}
          <StudentChargeTable
            charges={charges}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onAssign={handleAssign}
            onPageChange={handlePageChange}
            pagination={pagination}
          />
        </Card>
      </main>
    </div>
  );
}

export default StudentChargeListPage;
