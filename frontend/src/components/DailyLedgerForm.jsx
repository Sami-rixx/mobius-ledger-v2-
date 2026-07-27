/**
 * DailyLedgerForm Component
 * Form for creating and editing daily ledger records
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, Input } from './index.js';
import { formatCurrency, formatDate } from '../services/dailyLedgerService.js';
import './DailyLedgerForm.scss';

/**
 * DailyLedgerForm Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.ledger - Existing ledger data for editing
 * @param {Function} props.onSubmit - Form submission handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Whether the form is submitting
 * @param {boolean} props.disabled - Whether the form is disabled
 */
function DailyLedgerForm({
  ledger,
  onSubmit,
  onCancel,
  loading = false,
  disabled = false
}) {
  // Form state
  const [formData, setFormData] = useState({
    date: ledger?.date || formatDate(new Date()) || '',
    opening_balance: ledger?.opening_balance || '',
    total_income: ledger?.total_income || '',
    total_expenses: ledger?.total_expenses || '',
    closing_balance: ledger?.closing_balance || '',
    net_movement: ledger?.net_movement || '',
    transaction_count: ledger?.transaction_count || '',
    notes: ledger?.notes || ''
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Parse numeric values
    let parsedValue = value;
    if (['opening_balance', 'total_income', 'total_expenses', 'closing_balance', 'net_movement', 'transaction_count'].includes(name)) {
      parsedValue = value === '' ? '' : parseFloat(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  // Calculate closing balance when other values change
  useEffect(() => {
    const opening = parseFloat(formData.opening_balance) || 0;
    const income = parseFloat(formData.total_income) || 0;
    const expenses = parseFloat(formData.total_expenses) || 0;
    const closing = opening + income - expenses;
    const netMovement = income - expenses;
    
    if (!ledger) {
      // Only auto-calculate if creating new (not editing existing)
      setFormData(prev => ({
        ...prev,
        closing_balance: closing,
        net_movement: netMovement
      }));
    }
  }, [formData.opening_balance, formData.total_income, formData.total_expenses, ledger]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!onSubmit) return;
    
    // Validate required fields
    if (!formData.date) {
      alert('Please enter a date');
      return;
    }
    
    // Calculate derived fields
    const opening = parseFloat(formData.opening_balance) || 0;
    const income = parseFloat(formData.total_income) || 0;
    const expenses = parseFloat(formData.total_expenses) || 0;
    const transactionCount = parseInt(formData.transaction_count) || 0;
    
    const data = {
      date: formData.date,
      opening_balance: opening,
      total_income: income,
      total_expenses: expenses,
      closing_balance: opening + income - expenses,
      net_movement: income - expenses,
      transaction_count: transactionCount,
      notes: formData.notes
    };
    
    onSubmit(data);
  };

  // Check if form is valid
  const isValid = formData.date && formData.opening_balance !== '';

  return (
    <Card className="daily-ledger-form">
      <form onSubmit={handleSubmit}>
        <div className="daily-ledger-form__fields">
          {/* Date */}
          <div className="daily-ledger-form__field">
            <label htmlFor="date">Date *</label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              disabled={disabled || loading}
              required
            />
          </div>

          {/* Opening Balance */}
          <div className="daily-ledger-form__field">
            <label htmlFor="opening_balance">Opening Balance *</label>
            <Input
              id="opening_balance"
              name="opening_balance"
              type="number"
              value={formData.opening_balance}
              onChange={handleChange}
              disabled={disabled || loading}
              required
              step="0.01"
              min="0"
            />
          </div>

          {/* Total Income */}
          <div className="daily-ledger-form__field">
            <label htmlFor="total_income">Total Income (KES)</label>
            <Input
              id="total_income"
              name="total_income"
              type="number"
              value={formData.total_income}
              onChange={handleChange}
              disabled={disabled || loading}
              step="0.01"
              min="0"
            />
          </div>

          {/* Total Expenses */}
          <div className="daily-ledger-form__field">
            <label htmlFor="total_expenses">Total Expenses (KES)</label>
            <Input
              id="total_expenses"
              name="total_expenses"
              type="number"
              value={formData.total_expenses}
              onChange={handleChange}
              disabled={disabled || loading}
              step="0.01"
              min="0"
            />
          </div>

          {/* Closing Balance (read-only if calculated) */}
          <div className="daily-ledger-form__field">
            <label htmlFor="closing_balance">Closing Balance (KES)</label>
            <Input
              id="closing_balance"
              name="closing_balance"
              type="number"
              value={formData.closing_balance}
              onChange={handleChange}
              disabled={disabled || loading || !ledger}
              readOnly={!ledger}
              step="0.01"
            />
          </div>

          {/* Net Movement (read-only if calculated) */}
          <div className="daily-ledger-form__field">
            <label htmlFor="net_movement">Net Movement (KES)</label>
            <Input
              id="net_movement"
              name="net_movement"
              type="number"
              value={formData.net_movement}
              onChange={handleChange}
              disabled={disabled || loading || !ledger}
              readOnly={!ledger}
              step="0.01"
            />
          </div>

          {/* Transaction Count */}
          <div className="daily-ledger-form__field">
            <label htmlFor="transaction_count">Transaction Count</label>
            <Input
              id="transaction_count"
              name="transaction_count"
              type="number"
              value={formData.transaction_count}
              onChange={handleChange}
              disabled={disabled || loading}
              min="0"
            />
          </div>

          {/* Notes */}
          <div className="daily-ledger-form__field daily-ledger-form__field--full">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={disabled || loading}
              rows={3}
              className="daily-ledger-form__textarea"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="daily-ledger-form__summary">
          <div className="daily-ledger-form__summary-row">
            <span>Calculated Closing Balance:</span>
            <strong>{formatCurrency((parseFloat(formData.opening_balance) || 0) + (parseFloat(formData.total_income) || 0) - (parseFloat(formData.total_expenses) || 0))}</strong>
          </div>
          <div className="daily-ledger-form__summary-row">
            <span>Calculated Net Movement:</span>
            <strong>{formatCurrency((parseFloat(formData.total_income) || 0) - (parseFloat(formData.total_expenses) || 0))}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="daily-ledger-form__actions">
          <Button type="submit" variant="primary" disabled={!isValid || loading}>
            {loading ? (
              <>
                <i className="fa fa-spinner fa-spin" />
                Saving...
              </>
            ) : ledger ? (
              'Update Ledger'
            ) : (
              'Create Ledger'
            )}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

DailyLedgerForm.propTypes = {
  ledger: PropTypes.shape({
    id: PropTypes.number,
    date: PropTypes.string,
    opening_balance: PropTypes.number,
    total_income: PropTypes.number,
    total_expenses: PropTypes.number,
    closing_balance: PropTypes.number,
    net_movement: PropTypes.number,
    transaction_count: PropTypes.number,
    notes: PropTypes.string
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool
};

DailyLedgerForm.defaultProps = {
  ledger: null,
  loading: false,
  disabled: false
};

export default DailyLedgerForm;
