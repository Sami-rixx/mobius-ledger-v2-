import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, ClassCard } from '../../components/index.js';
import { getClassById, deleteClass } from '../../services/classService.js';

/**
 * ClassDetailPage Component
 * Page for viewing detailed class information
 */
function ClassDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Handle edit
  const handleEdit = () => {
    navigate(`/classes/edit/${id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete class "${classData?.name}"? This will not delete students in this class.`)) {
      try {
        await deleteClass(parseInt(id));
        navigate('/classes', { state: { message: 'Class deleted successfully!' } });
      } catch (err) {
        setError(err.message || 'Failed to delete class');
      }
    }
  };

  // Handle back
  const handleBack = () => {
    navigate('/classes');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="page class-detail-page">
        <header className="header">
          <h1>Class Details</h1>
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
      <div className="page class-detail-page">
        <header className="header">
          <h1>Class Details</h1>
          <p>View class information</p>
        </header>
        <main className="main-content">
          <Card className="error-card">
            <p className="text-error">{error}</p>
            <Button onClick={() => navigate('/classes')} variant="primary">
              Back to Classes
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  // Show class details
  return (
    <div className="page class-detail-page">
      <header className="header">
        <h1>Class Details</h1>
        <p>View information for {classData?.name}</p>
      </header>

      <main className="main-content">
        <div className="detail-layout">
          <div className="detail-main">
            <ClassCard
              classData={classData}
              showActions={false}
            />

            {/* Additional Information Card */}
            <Card title="Additional Information">
              <div className="additional-info">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Class ID:</span>
                    <span className="info-value">{classData?.id || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Created:</span>
                    <span className="info-value">
                      {classData?.created_at ? new Date(classData.created_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Updated:</span>
                    <span className="info-value">
                      {classData?.updated_at ? new Date(classData.updated_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Created By:</span>
                    <span className="info-value">{classData?.created_by || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Updated By:</span>
                    <span className="info-value">{classData?.updated_by || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="detail-sidebar">
            <Card title="Actions">
              <div className="action-list">
                <Button variant="primary" onClick={handleEdit} className="action-button">
                  Edit Class
                </Button>
                <Button variant="danger" onClick={handleDelete} className="action-button">
                  Delete Class
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

export default ClassDetailPage;
