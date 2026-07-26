import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card } from './index.js';
import { getAllStudents } from '../services/studentService.js';
import { getIncomeCategories } from '../services/incomeCategoryService.js';
import { getExpenseCategories } from '../services/expenseCategoryService.js';
import { TRANSACTION_TYPES } from '../services/transactionService.js';

/**
 * TransactionForm Component
 * Reusable form for creating and editing transactions
 * 
 * @param {Object} props - Component props
 * @param {Object} props.transaction - Transaction data to edit (null for new transaction)
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 */
function TransactionForm({ transaction, onSubmit, onCancel, loading = false }) {
  // Form state
  const [formData, setFormData] = useState({
    transactionType: 'income',
    amount: '',
    description: '',
    receiptNumber: '',
    studentId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    transactionTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
    paymentMethodId: '1',
    incomeCategoryId: '',
    expenseCategoryId: '',
    categoryId: '',
    reference: '',
    notes: '',
    isVerified: false
  });

  // Validation and state
  const [errors, setErrors] = useState({});
  const [students, setStudents] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, name: 'Cash' },
    { id: 2, name: 'M-Pesa' },
    { id: 3, name: 'Bank Transfer' },
    { id: 4, name: 'Cheque' },
    { id: 5, name: 'Other' }
  ]);

  // Load students
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await getAllStudents();
        setStudents(response.data || response);
      } catch (error) {
        console.error('Failed to load students:', error);
      }
    };
    loadStudents();
  }, []);

  // Load income categories
  useEffect(() => {
    const loadIncomeCategories = async () => {
      try {
        const response = await getIncomeCategories({ all: true });
        setIncomeCategories(response.data || response);
      } catch (error) {
        console.error('Failed to load income categories:', error);
      }
    };
    loadIncomeCategories();
  }, []);

  // Load expense categories
  useEffect(() => {
    const loadExpenseCategories = async () => {
      try {
        const response = await getExpenseCategories({ all: true });
        setExpenseCategories(response.data || response);
      } catch (error) {
        console.error('Failed to load expense categories:', error);
      }
    };
    loadExpenseCategories();
  }, []);

  // Initialize form with transaction data
  useEffect(() => {
    if (transaction) {
      setFormData({
        transactionType: transaction.transaction_type || 'income',
        amount: transaction.amount || '',
        description: transaction.description || '',
        receiptNumber: transaction.receipt_number || '',
        studentId: transaction.student_id || '',
        transactionDate: transaction.transaction_date || new Date().toISOString().split('T')[0],
        transactionTime: transaction.transaction_time || new Date().toTimeString().split(' ')[0].substring(0, 5),
        paymentMethodId: transaction.payment_method_id || '1',
        incomeCategoryId: transaction.income_category_id || '',
        expenseCategoryId: transaction.expense_category_id || '',
        categoryId: transaction.category_id || '',
        reference: transaction.reference || '',
        notes: transaction.notes || '',
        isVerified: transaction.is_verified !== undefined ? transaction.is_verified : false
      });
    }
  }, [transaction]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.transactionType) {
      newErrors.transactionType = 'Transaction type is required';
    }

    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required (must be positive)';
    }

    if (!formData.transactionDate) {
      newErrors.transactionDate = 'Transaction date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount),
      studentId: formData.studentId ? parseInt(formData.studentId) : undefined,
      paymentMethodId: parseInt(formData.paymentMethodId),
      incomeCategoryId: formData.incomeCategoryId ? parseInt(formData.incomeCategoryId) : undefined,
      expenseCategoryId: formData.expenseCategoryId ? parseInt(formData.expenseCategoryId) : undefined,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
      isVerified: formData.isVerified ? 1 : 0
    };

    // Remove undefined values
    Object.keys(submitData).forEach(key => {
      if (submitData[key] === undefined) {
        delete submitData[key];
      }
    });

    onSubmit(submitData);
  };

  // Transaction type options
  const transactionTypeOptions = [
    { value: TRANSACTION_TYPES.INCOME, label: 'Income' },
    { value: TRANSACTION_TYPES.EXPENSE, label: 'Expense' },
    { value: TRANSACTION_TYPES.SCHOOL_FEE, label: 'School Fee' },
    { value: TRANSACTION_TYPES.LUNCH_FEE, label: 'Lunch Fee' },
    { value: TRANSACTION_TYPES.STUDENT_CHARGE, label: 'Student Charge' },
    { value: TRANSACTION_TYPES.DIRECTOR_WITHDRAWAL, label: 'Director Withdrawal' }
  ];

  // Filter categories based on transaction type
  const getCategoryOptions = () => {
    if (formData.transactionType === 'income') {
      return incomeCategories.map(cat => ({ value: cat.id, label: cat.name }));
    } else if (formData.transactionType === 'expense') {
      return expenseCategories.map(cat => ({ value: cat.id, label: cat.name }));
    }
    return [];
  };

  return (
    <Card title={transaction ? 'Edit Transaction' : 'Create Transaction'} className="transaction-form">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Transaction Type */}
          <div className="form-group">
            <label htmlFor="transactionType">Transaction Type *</label>
            <select
              id="transactionType"
              name="transactionType"
              value={formData.transactionType}
              onChange={handleChange}
              className={errors.transactionType ? 'error' : ''}
              disabled={loading}
            >
              {transactionTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.transactionType && (
              <span className="error-message">{errors.transactionType}</span>
            )}
          </div>

          {/* Amount */}
          <div className="form-group">
            <label htmlFor="amount">Amount (KES) *</label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={handleChange}
              className={errors.amount ? 'error' : ''}
              disabled={loading}
            />
            {errors.amount && (
              <span className="error-message">{errors.amount}</span>
            )}
          </div>

          {/* Receipt Number */}
          <div className="form-group">
            <label htmlFor="receiptNumber">Receipt Number</label>
            <Input
              id="receiptNumber"
              name="receiptNumber"
              value={formData.receiptNumber}
              onChange={handleChange}
              placeholder="Auto-generated if empty"
              disabled={loading}
            />
          </div>

          {/* Student ID */}
          <div className="form-group">
            <label htmlFor="studentId">Student ID</label>
            <select
              id="studentId"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select Student</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.admission_number} - {student.first_name} {student.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Date */}
          <div className="form-group">
            <label htmlFor="transactionDate">Date *</label>
            <Input
              id="transactionDate"
              name="transactionDate"
              type="date"
              value={formData.transactionDate}
              onChange={handleChange}
              className={errors.transactionDate ? 'error' : ''}
              disabled={loading}
            />
            {errors.transactionDate && (
              <span className="error-message">{errors.transactionDate}</span>
            )}
          </div>

          {/* Transaction Time */}
          <div className="form-group">
            <label htmlFor="transactionTime">Time</label>
            <Input
              id="transactionTime"
              name="transactionTime"
              type="time"
              value={formData.transactionTime}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Category (based on type) */}
          {getCategoryOptions().length > 0 && (
            <div className="form-group">
              <label htmlFor="categoryId">Category</label>
              <select
                id="categoryId"
                name={formData.transactionType === 'income' ? 'incomeCategoryId' : 'expenseCategoryId'}
                value={formData.transactionType === 'income' ? formData.incomeCategoryId : formData.expenseCategoryId}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select Category</option>
                {getCategoryOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Method */}
          <div className="form-group">
            <label htmlFor="paymentMethodId">Payment Method</label>
            <select
              id="paymentMethodId"
              name="paymentMethodId"
              value={formData.paymentMethodId}
              onChange={handleChange}
              disabled={loading}
            >
              {paymentMethods.map(method => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="form-group full-width">
            <label htmlFor="description">Description</label>
            <Input
              id="description"
              name="description"
              type="text"
              value={formData.description}
              onChange={handleChange}
              placeholder="Transaction description"
              disabled={loading}
            />
          </div>

          {/* Reference */}
          <div className="form-group full-width">
            <label htmlFor="reference">Reference</label>
            <Input
              id="reference"
              name="reference"
              type="text"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Optional reference"
              disabled={loading}
            />
          </div>

          {/* Notes */}
          <div className="form-group full-width">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes"
              disabled={loading}
              className="form-textarea"
            />
          </div>

          {/* Verified */}
          <div className="form-group">
            <label>
              <Input
                type="checkbox"
                name="isVerified"
                checked={formData.isVerified}
                onChange={handleChange}
                disabled={loading}
              />
              Verified
            </label>
          </div>
        </div>

        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : transaction ? 'Update Transaction' : 'Create Transaction'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

TransactionForm.propTypes = {
  transaction: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default TransactionForm;
