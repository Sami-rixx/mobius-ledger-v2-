import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IncomeCategoryForm, Card } from '../../components/index.js';
import { getIncomeCategoryById, updateIncomeCategory } from '../../services/index.js';

/**
 * IncomeCategoryEditPage Component
 * Form for editing an existing income category
 */
function IncomeCategoryEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Load category
  useEffect(() => {
    const loadCategory = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getIncomeCategoryById(id);
        setCategory(result.data || result);
      } catch (err) {
        setError(err.message || 'Failed to load category');
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setFormLoading(true);
    setError(null);

    try {
      await updateIncomeCategory(id, formData);
      // Redirect to detail page after successful update
      navigate(`/income-categories/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to update category');
      setFormLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/income-categories/${id}`);
  };

  if (loading) {
    return (
      <div className="page income-category-edit-page">
        <Card className="loading-card">
          <p>Loading...</p>
        </Card>
      </div>
    );
  }

  if (error && !category) {
    return (
      <div className="page income-category-edit-page">
        <Card className="error-card">
          <p className="error-message">{error}</p>
          <button onClick={() => navigate('/income-categories')}>Back to Categories List</button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page income-category-edit-page">
      <header className="page-header">
        <h1>Edit Income Category</h1>
        <p>Update category "{category?.name || id}"</p>
      </header>

      {error && (
        <Card className="error-card">
          <p className="error-message">{error}</p>
        </Card>
      )}

      <IncomeCategoryForm
        category={category}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={formLoading}
      />
    </div>
  );
}

export default IncomeCategoryEditPage;
