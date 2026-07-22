import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card } from './index.js';
import { useApi } from '../hooks/index.js';
import { checkAdmissionNumber, getAllStudents } from '../services/studentService.js';

/**
 * StudentForm Component
 * Reusable form for creating and editing students
 * 
 * @param {Object} props - Component props
 * @param {Object} props.student - Student data to edit (null for new student)
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 */
function StudentForm({ student, onSubmit, onCancel, loading = false }) {
  // Form state
  const [formData, setFormData] = useState({
    admission_number: '',
    first_name: '',
    last_name: '',
    gender: 'Male',
    date_of_birth: '',
    class_id: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    address: '',
    status: 'Active',
    notes: ''
  });

  // Validation and availability state
  const [errors, setErrors] = useState({});
  const [isAdmissionAvailable, setIsAdmissionAvailable] = useState(true);
  const [classes, setClasses] = useState([]);
  const [isCheckingAdmission, setIsCheckingAdmission] = useState(false);

  // Load classes for dropdown
  const { data: classesData } = useApi(async () => {
    const response = await fetch('/api/classes');
    return response.json();
  });

  // Initialize form with student data
  useEffect(() => {
    if (student) {
      setFormData({
        admission_number: student.admission_number || '',
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        gender: student.gender || 'Male',
        date_of_birth: student.date_of_birth || '',
        class_id: student.class_id || '',
        parent_name: student.parent_name || '',
        parent_phone: student.parent_phone || '',
        parent_email: student.parent_email || '',
        address: student.address || '',
        status: student.status || 'Active',
        notes: student.notes || ''
      });
    }
  }, [student]);

  // Load classes
  useEffect(() => {
    if (classesData) {
      setClasses(classesData.data || classesData);
    }
  }, [classesData]);

  // Check admission number availability
  useEffect(() => {
    const admissionNumber = formData.admission_number?.trim();
    if (!admissionNumber || admissionNumber === student?.admission_number) {
      setIsAdmissionAvailable(true);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      if (admissionNumber.length >= 3) {
        setIsCheckingAdmission(true);
        try {
          const result = await checkAdmissionNumber(admissionNumber);
          setIsAdmissionAvailable(result.available !== false);
        } catch (error) {
          setIsAdmissionAvailable(true);
        } finally {
          setIsCheckingAdmission(false);
        }
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [formData.admission_number, student?.admission_number]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.admission_number?.trim()) {
      newErrors.admission_number = 'Admission number is required';
    } else if (!isAdmissionAvailable && formData.admission_number !== student?.admission_number) {
      newErrors.admission_number = 'Admission number is already taken';
    }

    if (!formData.parent_phone?.trim()) {
      newErrors.parent_phone = 'Parent phone is required';
    } else {
      const phoneRegex = /^(\+254|0)[1-9]\d{8,9}$/;
      if (!phoneRegex.test(formData.parent_phone.replace(/\s/g, ''))) {
        newErrors.parent_phone = 'Invalid Kenyan phone number (e.g., 0712345678 or +254712345678)';
      }
    }

    if (formData.parent_email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent_email)) {
      newErrors.parent_email = 'Invalid email format';
    }

    if (formData.date_of_birth && new Date(formData.date_of_birth) > new Date()) {
      newErrors.date_of_birth = 'Date of birth cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    onSubmit(formData);
  };

  // Status options
  const statusOptions = ['Active', 'Inactive', 'Graduated', 'Transferred'];
  const genderOptions = ['Male', 'Female', 'Other'];

  return (
    <Card title={student ? 'Edit Student' : 'Add New Student'}>
      <form onSubmit={handleSubmit} className="student-form">
        <div className="form-grid">
          <div className="form-column">
            <Input
              name="admission_number"
              label="Admission Number"
              value={formData.admission_number}
              onChange={handleChange}
              error={errors.admission_number}
              required
              placeholder="e.g., ML-2026-001"
            />

            <Input
              name="first_name"
              label="First Name"
              value={formData.first_name}
              onChange={handleChange}
              error={errors.first_name}
              required
              placeholder="Student's first name"
            />

            <Input
              name="last_name"
              label="Last Name"
              value={formData.last_name}
              onChange={handleChange}
              error={errors.last_name}
              required
              placeholder="Student's last name"
            />

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={errors.gender ? 'input-error' : ''}
              >
                {genderOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.gender && <p className="input-error-message">{errors.gender}</p>}
            </div>

            <Input
              name="date_of_birth"
              type="date"
              label="Date of Birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              error={errors.date_of_birth}
              placeholder="YYYY-MM-DD"
            />
          </div>

          <div className="form-column">
            <div className="form-group">
              <label htmlFor="class_id">Class</label>
              <select
                id="class_id"
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
                className={errors.class_id ? 'input-error' : ''}
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              {errors.class_id && <p className="input-error-message">{errors.class_id}</p>}
            </div>

            <Input
              name="parent_name"
              label="Parent/Guardian Name"
              value={formData.parent_name}
              onChange={handleChange}
              error={errors.parent_name}
              placeholder="Parent or guardian's full name"
            />

            <Input
              name="parent_phone"
              type="tel"
              label="Parent Phone"
              value={formData.parent_phone}
              onChange={handleChange}
              error={errors.parent_phone}
              required
              placeholder="e.g., 0712345678 or +254712345678"
            />

            <Input
              name="parent_email"
              type="email"
              label="Parent Email"
              value={formData.parent_email}
              onChange={handleChange}
              error={errors.parent_email}
              placeholder="parent@example.com"
            />

            <Input
              name="address"
              label="Address"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
              placeholder="Student's residential address"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={errors.status ? 'input-error' : ''}
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {errors.status && <p className="input-error-message">{errors.status}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className={errors.notes ? 'input-error' : ''}
            placeholder="Additional notes about the student"
            rows="3"
          />
          {errors.notes && <p className="input-error-message">{errors.notes}</p>}
        </div>

        <div className="form-actions">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

StudentForm.propTypes = {
  student: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default StudentForm;
