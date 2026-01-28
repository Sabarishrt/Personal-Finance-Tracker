import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import './ExpenseAnalytics.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ExpenseAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    expensesByCategory: {},
    monthlyTrends: [],
    topCategories: []
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMonth]);

  const fetchAnalytics = async () => {
    try {
      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);
      
      const response = await axios.get(`${API_URL}/transactions`, {
        params: {
          type: 'expense',
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      });

      const expenses = response.data;
      
      // Calculate expenses by category
      const expensesByCategory = {};
      expenses.forEach(expense => {
        expensesByCategory[expense.category] = 
          (expensesByCategory[expense.category] || 0) + expense.amount;
      });

      // Get top categories
      const topCategories = Object.entries(expensesByCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      // Fetch all transactions (both income and expense) for monthly trends
      const allTransactionsResponse = await axios.get(`${API_URL}/transactions`, {
        params: {
          startDate: subMonths(selectedMonth, 5).toISOString(),
          endDate: endOfMonth(selectedMonth).toISOString()
        }
      });
      
      const allTransactions = allTransactionsResponse.data;

      // Calculate monthly trends (last 6 months) - showing expenses
      const monthlyTrends = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(selectedMonth, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const monthExpenses = allTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return t.type === 'expense' && transactionDate >= monthStart && transactionDate <= monthEnd;
        });
        
        const total = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
        monthlyTrends.push({
          month: format(monthDate, 'MMM yyyy'),
          total
        });
      }

      setAnalytics({
        expensesByCategory,
        monthlyTrends,
        topCategories
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalExpenses = () => {
    return Object.values(analytics.expensesByCategory).reduce((sum, amount) => sum + amount, 0);
  };

  const getCategoryPercentage = (amount) => {
    const total = getTotalExpenses();
    return total > 0 ? (amount / total) * 100 : 0;
  };

  const getMaxTrendValue = () => {
    return Math.max(...analytics.monthlyTrends.map(t => t.total), 1);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const totalExpenses = getTotalExpenses();
  const maxTrend = getMaxTrendValue();

  return (
    <div className="container">
      <div className="analytics-header">
        <h1>Expense Analytics</h1>
        <div className="month-selector">
          <label htmlFor="month">Select Month:</label>
          <input
            type="month"
            id="month"
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
            className="month-input"
          />
        </div>
      </div>

      <div className="analytics-summary">
        <div className="summary-card">
          <h3>Total Expenses</h3>
          <p className="summary-amount">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Categories</h3>
          <p className="summary-amount">{Object.keys(analytics.expensesByCategory).length}</p>
        </div>
        <div className="summary-card">
          <h3>Top Category</h3>
          <p className="summary-amount">
            {analytics.topCategories.length > 0 
              ? analytics.topCategories[0].category 
              : 'N/A'}
          </p>
        </div>
      </div>

      {analytics.topCategories.length > 0 && (
        <div className="card">
          <h2>Expenses by Category</h2>
          <div className="category-breakdown">
            {analytics.topCategories.map(({ category, amount }) => {
              const percentage = getCategoryPercentage(amount);
              return (
                <div key={category} className="category-item">
                  <div className="category-header">
                    <span className="category-name">{category}</span>
                    <span className="category-amount">${amount.toFixed(2)}</span>
                  </div>
                  <div className="category-bar-container">
                    <div
                      className="category-bar"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="category-percentage">{percentage.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {analytics.monthlyTrends.length > 0 && (
        <div className="card">
          <h2>Monthly Income Raised</h2>
          <div className="trend-chart">
            {analytics.monthlyTrends.map((trend, index) => {
              const height = maxTrend > 0 ? (trend.total / maxTrend) * 100 : 0;
              return (
                <div key={index} className="trend-bar-container">
                  <div className="trend-bar-wrapper">
                    <div
                      className="trend-bar"
                      style={{ height: `${height}%` }}
                      title={`${trend.month}: $${trend.total.toFixed(2)}`}
                    ></div>
                  </div>
                  <div className="trend-label">{trend.month}</div>
                  <div className="trend-value">${trend.total.toFixed(0)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalExpenses === 0 && (
        <div className="card">
          <p className="no-data">No expense data available for this month.</p>
        </div>
      )}
    </div>
  );
};

export default ExpenseAnalytics;
