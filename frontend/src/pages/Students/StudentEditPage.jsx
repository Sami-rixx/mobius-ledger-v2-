import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StudentForm, Card } from '../../components/index.js';
import { getStudentById, updateStudent } from '../../services/studentService.js';

/**
 * StudentEditPage Component
 * Page for editing an existing student
 */
function StudentEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Load student data
  useEffect(() => {
    const loadStudent = async () => {
      try {
        const data = await getStudentById(parseInt(id));
        setStudent(data);
      } catch (err) {
        setError(err.message || 'Failed to load student');
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setFormLoading(true);
    setError(null);

    try {
      await updateStudent(parseInt(id), formData);
      navigate('/students', { state: { message: 'Student updated successfully!' } });
    } catch (err) {
      setError(err.message || 'Failed to update student');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/students');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="page student-edit-page">
        <header className="header">
          <h1>Edit Student</h1>
          <p>Loading student data...</p>
        </header>
        <main className="main-content">
          <Card>
            <p>Loading...</p>
          </Card>
        </main>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="page student-edit-page">
        <header className="header">
          <h1>Edit Student</h1>
          <p>Edit student record</p>
        </header>
        <main className="main-content">
          <Card className="error-card">
            <p className="text-error">{error}</p>
            <button onClick={() => navigate('/students')} className="btn btn-primary">
              Back to Students
            </button>
          </Card>
        </main>
      </div>
    );
  }

  // Show form
  return (
    <div className="page student-edit-page">
      <header className="header">
        <h1>Edit Student</h1>
        <p>Update student record for {student?.first_name} {student?.last_name}</p>
      </header>

      <main className="main-content">
        <StudentForm
          student={student}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={formLoading}
        />
      </main>
    </div>
  );
}

export default StudentEditPage;
