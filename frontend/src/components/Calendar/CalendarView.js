import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import './CalendarView.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [currentDate]);

  const fetchTransactions = async () => {
    try {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      
      const response = await axios.get(`${API_URL}/transactions`, {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTransactionsForDate = (date) => {
    return transactions.filter(t => {
      const transactionDate = parseISO(t.date);
      return isSameDay(transactionDate, date);
    });
  };

  const getDayTotal = (date) => {
    const dayTransactions = getTransactionsForDate(date);
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, net: income - expense };
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="calendar-header">
        <h1>Calendar View</h1>
        <div className="calendar-controls">
          <button onClick={goToPreviousMonth} className="btn btn-secondary">← Previous</button>
          <button onClick={goToToday} className="btn btn-secondary">Today</button>
          <button onClick={goToNextMonth} className="btn btn-secondary">Next →</button>
        </div>
      </div>

      <div className="calendar-month-header">
        <h2>{format(currentDate, 'MMMM yyyy')}</h2>
      </div>

      <div className="calendar-grid">
        <div className="calendar-day-header">Sun</div>
        <div className="calendar-day-header">Mon</div>
        <div className="calendar-day-header">Tue</div>
        <div className="calendar-day-header">Wed</div>
        <div className="calendar-day-header">Thu</div>
        <div className="calendar-day-header">Fri</div>
        <div className="calendar-day-header">Sat</div>

        {/* Empty cells for days before month starts */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-day empty"></div>
        ))}

        {/* Days of the month */}
        {daysInMonth.map((day) => {
          const totals = getDayTotal(day);
          const isToday = isSameDay(day, new Date());
          const dayTransactions = getTransactionsForDate(day);
          
          return (
            <div
              key={day.toISOString()}
              className={`calendar-day ${isToday ? 'today' : ''} ${selectedDate && isSameDay(day, selectedDate) ? 'selected' : ''}`}
              onClick={() => setSelectedDate(day)}
            >
              <div className="calendar-day-number">{format(day, 'd')}</div>
              {totals.income > 0 && (
                <div className="calendar-day-income">+${totals.income.toFixed(0)}</div>
              )}
              {totals.expense > 0 && (
                <div className="calendar-day-expense">-${totals.expense.toFixed(0)}</div>
              )}
              {dayTransactions.length > 0 && (
                <div className="calendar-day-count">{dayTransactions.length} transaction{dayTransactions.length > 1 ? 's' : ''}</div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className="card calendar-details">
          <h3>Transactions for {format(selectedDate, 'MMMM dd, yyyy')}</h3>
          {getTransactionsForDate(selectedDate).length === 0 ? (
            <p className="no-transactions">No transactions on this day</p>
          ) : (
            <div className="calendar-transactions-list">
              {getTransactionsForDate(selectedDate).map((transaction) => (
                <div key={transaction._id} className="calendar-transaction-item">
                  <div className="calendar-transaction-info">
                    <span className={`calendar-transaction-type ${transaction.type}`}>
                      {transaction.type === 'income' ? '📈' : '📉'}
                    </span>
                    <div>
                      <div className="calendar-transaction-category">{transaction.category}</div>
                      {transaction.description && (
                        <div className="calendar-transaction-description">{transaction.description}</div>
                      )}
                    </div>
                  </div>
                  <div className={`calendar-transaction-amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
