import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ClassForm, Card } from '../../components/index.js';
import { getClassById, updateClass } from '../../services/classService.js';

/**
 * ClassEditPage Component
 * Page for editing an existing class
 */
function ClassEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Load class data
  useEffect(() => {
    const loadClass = async () => {
      try {
        const data = await getClassById(parseInt(id));
        setClassData(data);
      } catch (err) {
        setError(err.message || 'Failed to load class');
      } finally {
        setLoading(false);
      }
    };

    loadClass();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setFormLoading(true);
    setError(null);

    try {
      await updateClass(parseInt(id), formData);
      navigate('/classes', { state: { message: 'Class updated successfully!' } });
    } catch (err) {
      setError(err.message || 'Failed to update class');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/classes');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="page class-edit-page">
        <header className="header">
          <h1>Edit Class</h1>
          <p>Loading class data...</p>
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
      <div className="page class-edit-page">
        <header className="header">
          <h1>Edit Class</h1>
          <p>Edit class record</p>
        </header>
        <main className="main-content">
          <Card className="error-card">
            <p className="text-error">{error}</p>
            <button onClick={() => navigate('/classes')} className="btn btn-primary">
              Back to Classes
            </button>
          </Card>
        </main>
      </div>
    );
  }

  // Show form
  return (
    <div className="page class-edit-page">
      <header className="header">
        <h1>Edit Class</h1>
        <p>Update class record for {classData?.name}</p>
      </header>

      <main className="main-content">
        <ClassForm
          classData={classData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={formLoading}
        />
      </main>
    </div>
  );
}

export default ClassEditPage;
