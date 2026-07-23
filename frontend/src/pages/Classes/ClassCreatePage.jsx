import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClassForm, Card } from '../../components/index.js';
import { createClass } from '../../services/classService.js';

/**
 * ClassCreatePage Component
 * Page for creating a new class
 */
function ClassCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      await createClass(formData);
      navigate('/classes', { state: { message: 'Class created successfully!' } });
    } catch (err) {
      setError(err.message || 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/classes');
  };

  return (
    <div className="page class-create-page">
      <header className="header">
        <h1>Add New Class</h1>
        <p>Create a new class record</p>
      </header>

      <main className="main-content">
        {error && (
          <Card className="error-card">
            <p className="text-error">{error}</p>
          </Card>
        )}

        <ClassForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </main>
    </div>
  );
}

export default ClassCreatePage;
