import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Target.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Target = () => {
  const [budget, setBudget] = useState({
    monthlyLimit: 0,
    categories: []
  });
  const [budgetStats, setBudgetStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newCategory, setNewCategory] = useState({ category: '', limit: '' });

  useEffect(() => {
    fetchBudget();
    fetchBudgetStats();
  }, []);

  const fetchBudget = async () => {
    try {
      const response = await axios.get(`${API_URL}/budget`);
      setBudget(response.data);
    } catch (error) {
      console.error('Error fetching budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/budget/stats`);
      setBudgetStats(response.data);
    } catch (error) {
      console.error('Error fetching budget stats:', error);
    }
  };

  const handleMonthlyLimitChange = (e) => {
    setBudget({
      ...budget,
      monthlyLimit: parseFloat(e.target.value) || 0
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.put(`${API_URL}/budget`, budget);
      setMessage({ type: 'success', text: 'Budget settings saved successfully!' });
      fetchBudgetStats();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save budget settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.category || !newCategory.limit) {
      setMessage({ type: 'error', text: 'Please fill in both category name and limit' });
      return;
    }

    const categoryExists = budget.categories.some(
      cat => cat.category.toLowerCase() === newCategory.category.toLowerCase()
    );

    if (categoryExists) {
      setMessage({ type: 'error', text: 'Category already exists' });
      return;
    }

    setBudget({
      ...budget,
      categories: [
        ...budget.categories,
        {
          category: newCategory.category,
          limit: parseFloat(newCategory.limit)
        }
      ]
    });

    setNewCategory({ category: '', limit: '' });
    setMessage({ type: 'success', text: 'Category added. Don\'t forget to save!' });
  };

  const handleRemoveCategory = (index) => {
    setBudget({
      ...budget,
      categories: budget.categories.filter((_, i) => i !== index)
    });
  };

  const handleUpdateCategoryLimit = (index, limit) => {
    const updatedCategories = [...budget.categories];
    updatedCategories[index].limit = parseFloat(limit) || 0;
    setBudget({
      ...budget,
      categories: updatedCategories
    });
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all budget settings? This cannot be undone.')) {
      return;
    }

    try {
      await axios.post(`${API_URL}/budget/reset`);
      setMessage({ type: 'success', text: 'Budget reset successfully!' });
      fetchBudget();
      fetchBudgetStats();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset budget' });
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="target-header">
        <h1>Target</h1>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <h2>Monthly Budget Limit</h2>
        <div className="form-group">
          <label htmlFor="monthlyLimit">Monthly Expense Limit ($)</label>
          <input
            type="number"
            id="monthlyLimit"
            value={budget.monthlyLimit === 0 ? '' : budget.monthlyLimit}
            onChange={handleMonthlyLimitChange}
            min="0"
            step="0.01"
            placeholder="Enter your monthly budget"
          />
          {budgetStats && budget.monthlyLimit > 0 && (
            <div className="budget-progress">
              <div className="progress-bar-container">
                <div
                  className={`progress-bar ${budgetStats.percentageUsed > 100 ? 'over-budget' : ''}`}
                  style={{ width: `${Math.min(budgetStats.percentageUsed, 100)}%` }}
                ></div>
              </div>
              <div className="progress-info">
                <span>Used: ${budgetStats.totalExpenses.toFixed(2)} / ${budget.monthlyLimit.toFixed(2)}</span>
                <span>{budgetStats.percentageUsed.toFixed(1)}%</span>
              </div>
              <div className="progress-remaining">
                {budgetStats.remaining >= 0 ? (
                  <span className="remaining-positive">Remaining: ${budgetStats.remaining.toFixed(2)}</span>
                ) : (
                  <span className="remaining-negative">Over budget by: ${Math.abs(budgetStats.remaining).toFixed(2)}</span>
                )}
              </div>
              {budgetStats.percentageUsed > 100 && (
                <div className="budget-alert">
                  You have exceeded your monthly budget limit. Consider reviewing your expenses.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Category Budget Limits</h2>
        <div className="category-budget-form">
          <div className="form-group">
            <label htmlFor="categoryName">Category Name</label>
            <input
              type="text"
              id="categoryName"
              value={newCategory.category}
              onChange={(e) => setNewCategory({ ...newCategory, category: e.target.value })}
              placeholder="e.g., Groceries"
            />
          </div>
          <div className="form-group">
            <label htmlFor="categoryLimit">Monthly Limit ($)</label>
            <input
              type="number"
              id="categoryLimit"
              value={newCategory.limit}
              onChange={(e) => setNewCategory({ ...newCategory, limit: e.target.value })}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <button onClick={handleAddCategory} className="btn btn-primary">
            Add Category
          </button>
        </div>

        {budget.categories.length > 0 && (
          <div className="category-list">
            {budget.categories.map((cat, index) => {
              const stats = budgetStats?.categoryStats?.[cat.category];
              return (
                <div key={index} className="category-budget-item">
                  <div className="category-budget-header">
                    <span className="category-budget-name">{cat.category}</span>
                    <button
                      onClick={() => handleRemoveCategory(index)}
                      className="btn btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Monthly Limit ($)</label>
                    <input
                      type="number"
                      value={cat.limit}
                      onChange={(e) => handleUpdateCategoryLimit(index, e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {stats && (
                    <div className="category-progress">
                      <div className="progress-bar-container">
                        <div
                          className={`progress-bar ${stats.percentageUsed > 100 ? 'over-budget' : ''}`}
                          style={{ width: `${Math.min(stats.percentageUsed, 100)}%` }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <span>Spent: ${stats.spent.toFixed(2)} / ${stats.limit.toFixed(2)}</span>
                        <span>{stats.percentageUsed.toFixed(1)}%</span>
                      </div>
                      {stats.percentageUsed > 100 && (
                        <div className="budget-alert">
                          You have exceeded your {cat.category} budget limit.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="settings-actions">
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save '}
          </button>
          <button
            onClick={handleReset}
            className="btn btn-danger"
          >
            Reset All Budgets
          </button>
        </div>
      </div>
    </div>
  );
};

export default Target;
