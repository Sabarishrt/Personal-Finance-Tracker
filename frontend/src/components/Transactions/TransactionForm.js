import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TransactionForm.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TransactionForm = ({ transaction, defaultType, onTransactionAdded, onCancel }) => {
  const [formData, setFormData] = useState({
    type: defaultType || 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    month: new Date().toISOString().slice(0, 7) // YYYY-MM format for income
  });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (transaction) {
      setFormData({
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount.toString(),
        description: transaction.description || '',
        date: new Date(transaction.date).toISOString().split('T')[0],
        month: new Date(transaction.date).toISOString().slice(0, 7)
      });
    } else if (defaultType) {
      setFormData(prev => ({
        ...prev,
        type: defaultType
      }));
    }
  }, [transaction, defaultType]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let payload = {
        type: formData.type,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description
      };

      // For income, use the first day of the selected month
      if (formData.type === 'income') {
        payload.date = new Date(`${formData.month}-01`).toISOString().split('T')[0];
      } else {
        payload.date = formData.date;
      }

      if (transaction) {
        await axios.put(`${API_URL}/transactions/${transaction._id}`, payload);
      } else {
        await axios.post(`${API_URL}/transactions`, payload);
      }

      onTransactionAdded();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card transaction-form-card">
      <h2>{transaction ? 'Edit Transaction' : 'Add New Transaction'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            list="categories"
            required
          />
          <datalist id="categories">
            {categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (Optional)</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
          />
        </div>

        {formData.type === 'income' && (
          <div className="form-group">
            <label htmlFor="month">Month</label>
            <input
              type="month"
              id="month"
              name="month"
              value={formData.month}
              onChange={handleChange}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        {error && <div className="error">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : transaction ? 'Update' : 'Add'} Transaction
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
