import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import TransactionForm from '../Transactions/TransactionForm';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    expensesByCategory: {},
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(null);
  const [filterType, setFilterType] = useState('monthly'); // 'monthly' or 'yearly'
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchStats();
  }, [filterType, selectedDate]);

  const fetchStats = async () => {
    try {
      let startDate, endDate;
      
      if (filterType === 'monthly') {
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
      } else {
        startDate = startOfYear(selectedDate);
        endDate = endOfYear(selectedDate);
      }

      const response = await axios.get(`${API_URL}/stats`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAdded = () => {
    fetchStats();
    setShowForm(false);
    setFormType(null);
  };

  const handleAddIncome = () => {
    setFormType('income');
    setShowForm(true);
  };

  const handleAddExpense = () => {
    setFormType('expense');
    setShowForm(true);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    const pageTitle = filterType === 'monthly' 
      ? `Expenses Report - ${format(selectedDate, 'MMMM yyyy')}`
      : `Expenses Report - ${format(selectedDate, 'yyyy')}`;
    
    doc.setFontSize(18);
    doc.text(pageTitle, 20, 20);
    
    // Summary section
    doc.setFontSize(12);
    doc.text('Summary', 20, 35);
    
    const summaryData = [
      ['Total Income', `$${stats.totalIncome.toFixed(2)}`],
      ['Total Expense', `$${stats.totalExpense.toFixed(2)}`],
      ['Balance', `$${stats.balance.toFixed(2)}`]
    ];
    
    doc.autoTable({
      startY: 40,
      head: [['Description', 'Amount']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: [124, 93, 255],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: [0, 0, 0]
      },
      margin: { left: 20, right: 20 }
    });
    
    // Expenses by category
    if (Object.keys(stats.expensesByCategory).length > 0) {
      const categoryData = Object.entries(stats.expensesByCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => [category, `$${amount.toFixed(2)}`]);
      
      doc.setFontSize(12);
      doc.text('Expenses by Category', 20, doc.lastAutoTable.finalY + 15);
      
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Category', 'Amount']],
        body: categoryData,
        theme: 'striped',
        headStyles: {
          fillColor: [220, 53, 69],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: [0, 0, 0]
        },
        margin: { left: 20, right: 20 }
      });
    }
    
    // Recent transactions
    if (stats.recentTransactions && stats.recentTransactions.length > 0) {
      const expenseTransactions = stats.recentTransactions
        .filter(t => t.type === 'expense')
        .map(t => [
          t.category,
          t.description || '-',
          format(new Date(t.date), 'MMM dd, yyyy'),
          `$${t.amount.toFixed(2)}`
        ]);
      
      if (expenseTransactions.length > 0) {
        doc.setFontSize(12);
        doc.text('Recent Expense Transactions', 20, doc.lastAutoTable.finalY + 15);
        
        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 20,
          head: [['Category', 'Description', 'Date', 'Amount']],
          body: expenseTransactions,
          theme: 'striped',
          headStyles: {
            fillColor: [52, 232, 158],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
          },
          bodyStyles: {
            textColor: [0, 0, 0]
          },
          margin: { left: 20, right: 20 }
        });
      }
    }
    
    // Footer
    doc.setFontSize(10);
    doc.text(
      `Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}`,
      20,
      doc.internal.pageSize.height - 10
    );
    
    // Save the PDF
    doc.save(`expenses-${filterType === 'monthly' ? format(selectedDate, 'MMM-yyyy') : format(selectedDate, 'yyyy')}.pdf`);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <div className="dashboard-filters">
            <div className="filter-group">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <input 
                type={filterType === 'monthly' ? 'month' : 'number'}
                value={filterType === 'monthly' ? format(selectedDate, 'yyyy-MM') : format(selectedDate, 'yyyy')}
                onChange={(e) => {
                  if (filterType === 'monthly') {
                    setSelectedDate(new Date(`${e.target.value}-01`));
                  } else {
                    setSelectedDate(new Date(`${e.target.value}-01-01`));
                  }
                }}
                className="filter-input"
              />
              <span className="filter-label">
                {filterType === 'monthly' ? format(selectedDate, 'MMMM yyyy') : format(selectedDate, 'yyyy')}
              </span>
            </div>
          </div>
        </div>
        <div className="dashboard-actions">
          <button
            onClick={handleAddIncome}
            className="btn btn-success"
          >
            + Add Income
          </button>
          <button
            onClick={handleAddExpense}
            className="btn btn-danger"
            disabled={stats.balance < 0}
            title={stats.balance < 0 ? 'Cannot add expenses: Income is insufficient' : ''}
          >
            + Add Expense
          </button>
          <button
            onClick={handleExportPDF}
            className="btn btn-primary"
            title="Export expenses to PDF"
          >
            📥 Export to PDF
          </button>
          {stats.balance < 0 && (
            <span className="expense-warning">Cannot add expenses - insufficient income</span>
          )}
        </div>
      </div>

      {showForm && (
        <TransactionForm
          defaultType={formType}
          onTransactionAdded={handleTransactionAdded}
          onCancel={() => {
            setShowForm(false);
            setFormType(null);
          }}
        />
      )}

      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Income</h3>
            <p className="stat-amount">${stats.totalIncome.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card expense">
          <div className="stat-icon">💸</div>
          <div className="stat-content">
            <h3>Total Expense</h3>
            <p className="stat-amount">${stats.totalExpense.toFixed(2)}</p>
          </div>
        </div>

        <div className={`stat-card balance ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <h3>Balance</h3>
            <p className="stat-amount">${stats.balance.toFixed(2)}</p>
            {stats.balance < 0 && (
              <p className="balance-warning">⚠️ Low Income for Expense</p>
            )}
          </div>
        </div>
      </div>

      {Object.keys(stats.expensesByCategory).length > 0 && (
        <div className="card">
          <h2>Expenses by Category</h2>
          <div className="category-list">
            {Object.entries(stats.expensesByCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount]) => (
                <div key={category} className="category-item">
                  <span className="category-name">{category}</span>
                  <span className="category-amount">${amount.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {stats.recentTransactions.length > 0 && (
        <div className="card">
          <h2>Recent Transactions</h2>
          <div className="transactions-list">
            {stats.recentTransactions.map((transaction) => (
              <div key={transaction._id} className="transaction-item">
                <div className="transaction-info">
                  <span className={`transaction-type ${transaction.type}`}>
                    {transaction.type === 'income' ? '📈' : '📉'}
                  </span>
                  <div>
                    <div className="transaction-category">{transaction.category}</div>
                    {transaction.description && (
                      <div className="transaction-description">{transaction.description}</div>
                    )}
                    <div className="transaction-date">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
