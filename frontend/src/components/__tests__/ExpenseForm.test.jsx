import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseForm from '../ExpenseForm.jsx';
import { getAllExpenseCategories } from '../../services/expenseCategoryService.js';

// ExpenseForm loads its category dropdown options from the expense category
// API on mount; mock that service call so this test exercises the form's
// own validation/submission logic in isolation, independent of a running
// backend or production data (per the project's testing requirements).
vi.mock('../../services/expenseCategoryService.js', () => ({
  getAllExpenseCategories: vi.fn(),
}));

const CATEGORIES = [
  { id: 1, name: 'Utilities' },
  { id: 2, name: 'Stationery' },
];

describe('ExpenseForm (critical financial workflow: recording an expense)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllExpenseCategories.mockResolvedValue({ data: CATEGORIES });
  });

  async function fillValidExpense(user) {
    await user.selectOptions(screen.getByLabelText(/category/i), '1');
    await user.type(screen.getByLabelText(/amount/i), '1500.50');
    await user.type(screen.getByLabelText(/vendor name/i), 'Acme Supplies');
    await user.clear(screen.getByLabelText(/^date/i));
    await user.type(screen.getByLabelText(/^date/i), '2026-03-15');
  }

  it('loads and renders expense categories from the service', async () => {
    render(<ExpenseForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Utilities' })).toBeInTheDocument();
    });
    expect(screen.getByRole('option', { name: 'Stationery' })).toBeInTheDocument();
    expect(getAllExpenseCategories).toHaveBeenCalledTimes(1);
  });

  it('submits a correctly-typed payload (amount parsed as a number) when all required fields are valid', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<ExpenseForm onSubmit={handleSubmit} onCancel={vi.fn()} />);

    await waitFor(() => screen.getByRole('option', { name: 'Utilities' }));
    await fillValidExpense(user);

    await user.click(screen.getByRole('button', { name: /create expense/i }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const submitted = handleSubmit.mock.calls[0][0];
    expect(submitted.amount).toBe(1500.5);
    expect(typeof submitted.amount).toBe('number');
    expect(submitted.vendor_name).toBe('Acme Supplies');
    expect(submitted.expense_category_id).toBe('1');
  });

  it('blocks submission and shows a validation error when the amount is missing', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<ExpenseForm onSubmit={handleSubmit} onCancel={vi.fn()} />);

    await waitFor(() => screen.getByRole('option', { name: 'Utilities' }));
    await user.selectOptions(screen.getByLabelText(/category/i), '1');
    await user.type(screen.getByLabelText(/vendor name/i), 'Acme Supplies');
    await user.clear(screen.getByLabelText(/^date/i));
    await user.type(screen.getByLabelText(/^date/i), '2026-03-15');
    // Deliberately leave amount blank.

    await user.click(screen.getByRole('button', { name: /create expense/i }));

    expect(await screen.findByText('Valid amount is required')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('blocks submission when the amount is zero (not a positive charge)', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<ExpenseForm onSubmit={handleSubmit} onCancel={vi.fn()} />);

    await waitFor(() => screen.getByRole('option', { name: 'Utilities' }));
    await user.selectOptions(screen.getByLabelText(/category/i), '1');
    // Deliberately "0" rather than a negative number: the amount field's
    // native `min="0"` HTML attribute makes a browser (and jsdom, which
    // implements the same constraint-validation API) block the `submit`
    // event entirely for an out-of-range value like "-50" before any of
    // this form's own JavaScript ever runs - that would only be testing
    // the browser's built-in validation, not this component's `validate()`
    // logic. "0" passes the native `min` constraint but is still rejected
    // by the component's own `parseFloat(amount) <= 0` business rule,
    // which is the actual behaviour this test is meant to cover.
    await user.type(screen.getByLabelText(/amount/i), '0');
    await user.type(screen.getByLabelText(/vendor name/i), 'Acme Supplies');
    await user.clear(screen.getByLabelText(/^date/i));
    await user.type(screen.getByLabelText(/^date/i), '2026-03-15');

    await user.click(screen.getByRole('button', { name: /create expense/i }));

    expect(await screen.findByText('Valid amount is required')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });


  it('blocks submission and reports every missing required field at once', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<ExpenseForm onSubmit={handleSubmit} onCancel={vi.fn()} />);

    await waitFor(() => screen.getByRole('option', { name: 'Utilities' }));
    // Submit completely empty.
    await user.click(screen.getByRole('button', { name: /create expense/i }));

    expect(await screen.findByText('Category is required')).toBeInTheDocument();
    expect(screen.getByText('Valid amount is required')).toBeInTheDocument();
    expect(screen.getByText('Vendor name is required')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('clears a field error as soon as the user edits that field', async () => {
    const user = userEvent.setup();
    render(<ExpenseForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    await waitFor(() => screen.getByRole('option', { name: 'Utilities' }));
    await user.click(screen.getByRole('button', { name: /create expense/i }));
    expect(await screen.findByText('Vendor name is required')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/vendor name/i), 'A');
    expect(screen.queryByText('Vendor name is required')).not.toBeInTheDocument();
  });

  it('pre-fills the form when editing an existing expense', async () => {
    const existingExpense = {
      id: 42,
      expense_category_id: 2,
      amount: 300,
      description: 'Printer paper',
      vendor_name: 'Office Mart',
      vendor_contact: '0712345678',
      expense_date: '2026-02-01T00:00:00.000Z',
      receipt_number: 'ML-2026-000042',
      notes: '',
      is_verified: true,
    };
    render(<ExpenseForm expense={existingExpense} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    await waitFor(() => screen.getByRole('option', { name: 'Stationery' }));
    expect(screen.getByLabelText(/amount/i)).toHaveValue(300);
    expect(screen.getByLabelText(/vendor name/i)).toHaveValue('Office Mart');
    expect(screen.getByRole('button', { name: /update expense/i })).toBeInTheDocument();
  });

  it('calls onCancel when the Cancel button is clicked, without submitting', async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();
    const handleSubmit = vi.fn();
    render(<ExpenseForm onSubmit={handleSubmit} onCancel={handleCancel} />);

    await waitFor(() => screen.getByRole('option', { name: 'Utilities' }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(handleCancel).toHaveBeenCalledTimes(1);
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
