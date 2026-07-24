import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, StudentChargeAssignmentTable } from '../../components/index.js';
import { useApi } from '../../hooks/index.js';
import {
  getStudentChargeAssignments,
  deleteStudentChargeAssignment,
  markAssignmentAsPaid,
  markAssignmentAsUnpaid
} from '../../services/studentChargeService.js';
import { getAllStudents } from '../../services/studentService.js';
import { getAllClasses } from '../../services/classService.js';
import { useNavigate } from 'react-router-dom';

/**
 * StudentChargeAssignmentListPage Component
 * Displays a paginated list of student charge assignments with search and filter capabilities
 */
function StudentChargeAssignmentListPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [studentFilter, setStudentFilter] = useState('');
  const [chargeFilter, setChargeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [paidFilter, setPaidFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [charges, setCharges] = useState([]);
  const [classes, setClasses] = useState([]);

  // Load students, charges, and classes
  const { data: studentsData } = useApi(async () => {
    const response = await getAllStudents();
    return response;
  });

  const { data: chargesData } = useApi(async () => {
    const response = await fetch('/api/charges/all');
    return response.json();
  });

  const { data: classesData } = useApi(async () => {
    const response = await getAllClasses();
    return response;
  });

  // Load assignments
  const loadAssignments = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        pageSize: 20,
        studentId: studentFilter || undefined,
        chargeId: chargeFilter || undefined,
        classId: classFilter || undefined,
        paid: paidFilter === 'paid' ? true : paidFilter === 'unpaid' ? false : undefined
      };

      const result = await getStudentChargeAssignments(params);
      setAssignments(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [studentFilter, chargeFilter, classFilter, paidFilter]);

  // Load data
  useEffect(() => {
    if (studentsData) {
      setStudents(studentsData.data || studentsData);
    }
    if (chargesData) {
      setCharges(chargesData.data || chargesData);
    }
    if (classesData) {
      setClasses(classesData.data || classesData);
    }
  }, [studentsData, chargesData, classesData]);

  // Initial load
  useEffect(() => {
    loadAssignments(1);
  }, [loadAssignments]);

  // Handle page change
  const handlePageChange = (page) => {
    loadAssignments(page);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'studentFilter') {
      setStudentFilter(value);
    } else if (name === 'chargeFilter') {
      setChargeFilter(value);
    } else if (name === 'classFilter') {
      setClassFilter(value);
    } else if (name === 'paidFilter') {
      setPaidFilter(value);
    }
  };

  // Handle delete
  const handleDelete = async (assignment) => {
    if (window.confirm(`Are you sure you want to delete this assignment?`)) {
      try {
        await deleteStudentChargeAssignment(assignment.id);
        // Refresh the list
        loadAssignments(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to delete assignment');
      }
    }
  };

  // Handle mark as paid
  const handleMarkPaid = async (assignment) => {
    if (window.confirm(`Are you sure you want to mark this assignment as paid?`)) {
      try {
        await markAssignmentAsPaid(assignment.id, {
          amount: assignment.amount,
          paymentMethod: 'Cash',
          reference: '',
          notes: ''
        });
        // Refresh the list
        loadAssignments(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to mark as paid');
      }
    }
  };

  // Handle mark as unpaid
  const handleMarkUnpaid = async (assignment) => {
    if (window.confirm(`Are you sure you want to mark this assignment as unpaid?`)) {
      try {
        await markAssignmentAsUnpaid(assignment.id);
        // Refresh the list
        loadAssignments(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to mark as unpaid');
      }
    }
  };

  // Handle view
  const handleView = (assignment) => {
    // For now, just navigate to the charge detail
    navigate(`/student-charges/${assignment.charge_id || assignment.chargeId}`);
  };

  // Handle edit
  const handleEdit = (assignment) => {
    // Navigate to charge edit for now
    navigate(`/student-charges/edit/${assignment.charge_id || assignment.chargeId}`);
  };

  // Handle back
  const handleBack = () => {
    navigate('/student-charges');
  };

  // Clear filters
  const clearFilters = () => {
    setStudentFilter('');
    setChargeFilter('');
    setClassFilter('');
    setPaidFilter('');
    loadAssignments(1);
  };

  // Paid filter options
  const paidOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' }
  ];

  return (
    <div className="page student-charge-assignment-list-page">
      <header className="header">
        <h1>Student Charge Assignments</h1>
        <p>View and manage all student charge assignments</p>
      </header>

      <main className="main-content">
        <Card title="Assignments">
          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="filter-controls">
              <select
                name="studentFilter"
                value={studentFilter}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Students</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.last_name}, {student.first_name} ({student.admission_number})
                  </option>
                ))}
              </select>

              <select
                name="chargeFilter"
                value={chargeFilter}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Charges</option>
                {charges.map(charge => (
                  <option key={charge.id} value={charge.id}>{charge.name}</option>
                ))}
              </select>

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
                name="paidFilter"
                value={paidFilter}
                onChange={handleFilterChange}
                className="filter-select"
              >
                {paidOptions.map(option => (
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
            <Button variant="outline" onClick={handleBack}>
              Back to Charges
            </Button>
          </div>

          {/* Assignment Table */}
          <StudentChargeAssignmentTable
            assignments={assignments}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onMarkPaid={handleMarkPaid}
            onMarkUnpaid={handleMarkUnpaid}
            onPageChange={handlePageChange}
            pagination={pagination}
          />
        </Card>
      </main>
    </div>
  );
}

export default StudentChargeAssignmentListPage;
