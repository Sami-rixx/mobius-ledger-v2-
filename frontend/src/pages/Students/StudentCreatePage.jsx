import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentForm, Card } from '../../components/index.js';
import { createStudent } from '../../services/studentService.js';

/**
 * StudentCreatePage Component
 * Page for creating a new student
 */
function StudentCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      await createStudent(formData);
      navigate('/students', { state: { message: 'Student created successfully!' } });
    } catch (err) {
      setError(err.message || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/students');
  };

  return (
    <div className="page student-create-page">
      <header className="header">
        <h1>Add New Student</h1>
        <p>Create a new student record</p>
      </header>

      <main className="main-content">
        {error && (
          <Card className="error-card">
            <p className="text-error">{error}</p>
          </Card>
        )}

        <StudentForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </main>
    </div>
  );
}

export default StudentCreatePage;
