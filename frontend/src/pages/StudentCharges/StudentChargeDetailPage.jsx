import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, StudentChargeCard } from '../../components/index.js';
import { getStudentChargeById, deleteStudentCharge } from '../../services/studentChargeService.js';

/**
 * StudentChargeDetailPage Component
 * Page for viewing detailed student charge information
 */
function StudentChargeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [charge, setCharge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load charge data
  useEffect(() => {
    const loadCharge = async () => {
      try {
        const data = await getStudentChargeById(parseInt(id));
        setCharge(data);
      } catch (err) {
        setError(err.message || 'Failed to load charge');
      } finally {
        setLoading(false);
      }
    };

    loadCharge();
  }, [id]);

  // Handle edit
  const handleEdit = () => {
    navigate(`/student-charges/edit/${id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete charge "${charge?.name}"?`)) {
      try {
        await deleteStudentCharge(parseInt(id));
        navigate('/student-charges', { state: { message: 'Charge deleted successfully!' } });
      } catch (err) {
        setError(err.message || 'Failed to delete charge');
      }
    }
  };

  // Handle back
  const handleBack = () => {
    navigate('/student-charges');
  };

  // Handle assign
  const handleAssign = () => {
    navigate(`/student-charges/${id}/assign`);
  };

  // View assignments for this charge
  const handleViewAssignments = () => {
    navigate(`/student-charges/${id}/assignments`);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="page student-charge-detail-page">
        <header className="header">
          <h1>Charge Details</h1>
          <p>Loading charge data...</p>
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
      <div className="page student-charge-detail-page">
        <header className="header">
          <h1>Charge Details</h1>
          <p>View charge information</p>
        </header>
        <main className="main-content">
          <Card className="error-card">
            <p className="text-error">{error}</p>
            <Button onClick={() => navigate('/student-charges')} variant="primary">
              Back to Charges
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  // Show charge details
  return (
    <div className="page student-charge-detail-page">
      <header className="header">
        <h1>Charge Details</h1>
        <p>View information for charge: {charge?.name}</p>
      </header>

      <main className="main-content">
        <div className="detail-layout">
          {/* Charge Card */}
          <div className="detail-main">
            <StudentChargeCard
              charge={charge}
              showActions={false}
            />
          </div>

          {/* Action Panel */}
          <div className="detail-sidebar">
            <Card title="Actions">
              <div className="action-list">
                <Button variant="primary" onClick={handleEdit} block>
                  Edit Charge
                </Button>
                <Button variant="info" onClick={handleAssign} block>
                  Assign to Students
                </Button>
                <Button variant="secondary" onClick={handleViewAssignments} block>
                  View Assignments
                </Button>
                <Button variant="danger" onClick={handleDelete} block>
                  Delete Charge
                </Button>
                <Button variant="outline" onClick={handleBack} block>
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

export default StudentChargeDetailPage;
