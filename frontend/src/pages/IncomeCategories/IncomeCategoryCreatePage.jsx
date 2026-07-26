import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IncomeCategoryForm, Card } from '../../components/index.js';
import { createIncomeCategory } from '../../services/index.js';

/**
 * IncomeCategoryCreatePage Component
 * Form for creating a new income category
 */
function IncomeCategoryCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      await createIncomeCategory(formData);
      // Redirect to list page after successful creation
      navigate('/income-categories');
    } catch (err) {
      setError(err.message || 'Failed to create category');
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/income-categories');
  };

  return (
    <div className="page income-category-create-page">
      <header className="page-header">
        <h1>Create Income Category</h1>
        <p>Add a new income category to the system</p>
      </header>

      {error && (
        <Card className="error-card">
          <p className="error-message">{error}</p>
        </Card>
      )}

      <IncomeCategoryForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}

export default IncomeCategoryCreatePage;
