import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import TransactionForm from './TransactionForm';
import './Transactions.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filter, setFilter] = useState({
    type: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      const params = {};
      if (filter.type) params.type = filter.type;
      if (filter.startDate) params.startDate = filter.startDate;
      if (filter.endDate) params.endDate = filter.endDate;

      const response = await axios.get(`${API_URL}/transactions`, { params });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`${API_URL}/transactions/${id}`);
        fetchTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction');
      }
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleTransactionAdded = () => {
    fetchTransactions();
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleFilterChange = (e) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="transactions-header">
        <h1>Transactions</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingTransaction(null);
          }}
          className="btn btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Transaction'}
        </button>
      </div>

      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          onTransactionAdded={handleTransactionAdded}
          onCancel={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
        />
      )}

      <div className="card">
        <h2>Filters</h2>
        <div className="filters">
          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={filter.type}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filter.endDate}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>All Transactions ({transactions.length})</h2>
        {transactions.length === 0 ? (
          <p className="no-transactions">No transactions found. Add your first transaction!</p>
        ) : (
          <div className="transactions-table">
            {transactions.map((transaction) => (
              <div key={transaction._id} className="transaction-row">
                <div className="transaction-main">
                  <span className={`transaction-type-badge ${transaction.type}`}>
                    {transaction.type === 'income' ? '📈 Income' : '📉 Expense'}
                  </span>
                  <div className="transaction-details">
                    <div className="transaction-category">{transaction.category}</div>
                    {transaction.description && (
                      <div className="transaction-description">{transaction.description}</div>
                    )}
                    <div className="transaction-date">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="transaction-actions">
                  <div className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </div>
                  <button
                    onClick={() => handleEdit(transaction)}
                    className="btn btn-secondary btn-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(transaction._id)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
