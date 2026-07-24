import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StudentChargeForm, Card } from '../../components/index.js';
import {
  getStudentChargeById,
  updateStudentCharge
} from '../../services/studentChargeService.js';

/**
 * StudentChargeEditPage Component
 * Page for editing an existing student charge
 */
function StudentChargeEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [charge, setCharge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

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

  // Handle form submission
  const handleSubmit = async (formData) => {
    setFormLoading(true);
    setError(null);

    try {
      await updateStudentCharge(parseInt(id), formData);
      navigate(`/student-charges/${id}`, { state: { message: 'Charge updated successfully!' } });
    } catch (err) {
      setError(err.message || 'Failed to update charge');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/student-charges/${id}`);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="page student-charge-edit-page">
        <header className="header">
          <h1>Edit Charge</h1>
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
      <div className="page student-charge-edit-page">
        <header className="header">
          <h1>Edit Charge</h1>
          <p>Edit student charge information</p>
        </header>
        <main className="main-content">
          <Card className="error-card">
            <p className="text-error">{error}</p>
            <button onClick={() => navigate('/student-charges')} className="btn btn-primary">
              Back to Charges
            </button>
          </Card>
        </main>
      </div>
    );
  }

  // Show edit form
  return (
    <div className="page student-charge-edit-page">
      <header className="header">
        <h1>Edit Charge</h1>
        <p>Edit information for charge: {charge?.name}</p>
      </header>

      <main className="main-content">
        {error && (
          <Card className="error-card">
            <p className="text-error">{error}</p>
          </Card>
        )}

        <StudentChargeForm
          charge={charge}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={formLoading}
        />
      </main>
    </div>
  );
}

export default StudentChargeEditPage;
