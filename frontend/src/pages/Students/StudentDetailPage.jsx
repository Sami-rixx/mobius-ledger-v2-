import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, StudentCard } from '../../components/index.js';
import { getStudentById, deleteStudent } from '../../services/studentService.js';

/**
 * StudentDetailPage Component
 * Page for viewing detailed student information
 */
function StudentDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Handle edit
  const handleEdit = () => {
    navigate(`/students/edit/${id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${student?.first_name} ${student?.last_name}?`)) {
      try {
        await deleteStudent(parseInt(id));
        navigate('/students', { state: { message: 'Student deleted successfully!' } });
      } catch (err) {
        setError(err.message || 'Failed to delete student');
      }
    }
  };

  // Handle back
  const handleBack = () => {
    navigate('/students');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="page student-detail-page">
        <header className="header">
          <h1>Student Details</h1>
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
      <div className="page student-detail-page">
        <header className="header">
          <h1>Student Details</h1>
          <p>View student information</p>
        </header>
        <main className="main-content">
          <Card className="error-card">
            <p className="text-error">{error}</p>
            <Button onClick={() => navigate('/students')} variant="primary">
              Back to Students
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  // Show student details
  return (
    <div className="page student-detail-page">
      <header className="header">
        <h1>Student Details</h1>
        <p>View information for {student?.first_name} {student?.last_name}</p>
      </header>

      <main className="main-content">
        <div className="detail-layout">
          <div className="detail-main">
            <StudentCard
              student={student}
              showActions={false}
            />

            {/* Additional Information Card */}
            <Card title="Additional Information">
              <div className="additional-info">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Admission Date:</span>
                    <span className="info-value">{student?.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Updated:</span>
                    <span className="info-value">{student?.updated_at ? new Date(student.updated_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Created By:</span>
                    <span className="info-value">{student?.created_by || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Updated By:</span>
                    <span className="info-value">{student?.updated_by || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="detail-sidebar">
            <Card title="Actions">
              <div className="action-list">
                <Button variant="primary" onClick={handleEdit} className="action-button">
                  Edit Student
                </Button>
                <Button variant="danger" onClick={handleDelete} className="action-button">
                  Delete Student
                </Button>
                <Button variant="secondary" onClick={handleBack} className="action-button">
                  Back to List
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentDetailPage;
