import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, ReportCard } from '../../components/index.js';
import { getReportById, deleteReport, updateReport } from '../../services/index.js';

/**
 * ReportDetailPage Component
 * Displays detailed information about a single report
 */
function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Load report
  const loadReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getReportById(id);
      setReport(result);
      setEditData(result);
    } catch (err) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadReport();
  }, [id]);

  // Handle edit
  const handleEdit = () => {
    setEditing(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditing(false);
    setEditData(report);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // Handle save
  const handleSave = async () => {
    try {
      await updateReport(id, editData);
      setEditing(false);
      loadReport();
    } catch (err) {
      setError(err.message || 'Failed to update report');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete report "${report?.title || id}"?`)) {
      try {
        await deleteReport(id);
        navigate('/reports');
      } catch (err) {
        setError(err.message || 'Failed to delete report');
      }
    }
  };

  // Handle go back
  const handleGoBack = () => {
    navigate('/reports');
  };

  // Format JSON for display
  const formatJson = (data) => {
    if (!data) return '{}';
    return JSON.stringify(data, null, 2);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="page report-detail-page">
        <p>Loading report details...</p>
      </div>
    );
  }

  // Render error state
  if (error && !report) {
    return (
      <div className="page report-detail-page">
        <p>{error}</p>
        <Button onClick={loadReport}>Retry</Button>
        <Button onClick={handleGoBack}>Back to Reports</Button>
      </div>
    );
  }

  // Render not found state
  if (!report) {
    return (
      <div className="page report-detail-page">
        <p>Report not found</p>
        <Button onClick={handleGoBack}>Back to Reports</Button>
      </div>
    );
  }

  // Render edit mode
  if (editing) {
    return (
      <div className="page report-detail-page">
        <header className="page-header">
          <h1>Edit Report: {report.title}</h1>
        </header>

        <main className="page-main">
          <Card title="Edit Report" className="edit-card">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label htmlFor="title">Title:</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={editData.title || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <textarea
                  id="description"
                  name="description"
                  value={editData.description || ''}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="report_type">Report Type:</label>
                <select
                  id="report_type"
                  name="report_type"
                  value={editData.report_type || ''}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="daily_summary">Daily Summary</option>
                  <option value="monthly_summary">Monthly Summary</option>
                  <option value="yearly_summary">Yearly Summary</option>
                  <option value="income_expense">Income vs Expense</option>
                  <option value="category_summary">Category Summary</option>
                  <option value="student_balances">Student Balances</option>
                </select>
              </div>

              <div className="form-group">
                <label>Parameters:</label>
                <textarea
                  name="parameters"
                  value={formatJson(editData.parameters)}
                  onChange={(e) => setEditData(prev => ({ ...prev, parameters: JSON.parse(e.target.value || '{}') }))}
                  className="form-textarea"
                  rows={4}
                  placeholder="Enter JSON parameters"
                />
              </div>

              <div className="form-actions">
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </main>
      </div>
    );
  }

  // Render view mode
  return (
    <div className="page report-detail-page">
      <header className="page-header">
        <h1>Report: {report.title}</h1>
        <p>Detailed information about this report</p>
      </header>

      <main className="page-main">
        {/* Report Card */}
        <ReportCard
          report={report}
          showActions={true}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={() => {}}
        />

        {/* Report Data */}
        {report.report_data && (
          <Card title="Report Data" className="report-data-card">
            <pre className="report-data-content">
              {formatJson(report.report_data)}
            </pre>
          </Card>
        )}

        {/* Parameters */}
        {report.parameters && (
          <Card title="Report Parameters" className="report-parameters-card">
            <pre className="report-parameters-content">
              {formatJson(report.parameters)}
            </pre>
          </Card>
        )}

        {/* Action Buttons */}
        <Card title="Actions" className="actions-card">
          <div className="action-buttons">
            <Button variant="primary" onClick={handleEdit}>
              Edit Report
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Report
            </Button>
            <Button variant="outline" onClick={handleGoBack}>
              Back to Reports
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default ReportDetailPage;
