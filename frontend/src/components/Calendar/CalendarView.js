import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import './CalendarView.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'date',
    date: format(new Date(), 'yyyy-MM-dd'),
    month: format(new Date(), 'yyyy-MM')
  });

  useEffect(() => {
    fetchTransactions();
    fetchEvents();
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
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/events`, {
        params: {
          startDate: startOfMonth(currentDate).toISOString(),
          endDate: endOfMonth(currentDate).toISOString(),
          month: format(currentDate, 'yyyy-MM')
        }
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
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

  const getEventsForDate = (date) => {
    return events.filter(e => e.type === 'date' && isSameDay(parseISO(e.date), date));
  };

  const getEventsForMonth = () => {
    return events.filter(e => e.type === 'month' && format(currentDate, 'yyyy-MM') === e.month);
  };

  const handleAddEvent = async () => {
    try {
      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        type: newEvent.type,
        ...(newEvent.type === 'date' && { date: newEvent.date }),
        ...(newEvent.type === 'month' && { month: newEvent.month })
      };

      const response = await axios.post(`${API_URL}/events`, eventData);
      setEvents([...events, response.data]);
      setNewEvent({
        title: '',
        description: '',
        type: 'date',
        date: format(new Date(), 'yyyy-MM-dd'),
        month: format(new Date(), 'yyyy-MM')
      });
      setShowAddEvent(false);
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Failed to add event');
    }
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
          <button onClick={() => setShowAddEvent(!showAddEvent)} className="btn btn-primary">Add Event</button>
          <button onClick={goToPreviousMonth} className="btn btn-secondary">← Previous</button>
          <button onClick={goToToday} className="btn btn-secondary">Today</button>
          <button onClick={goToNextMonth} className="btn btn-secondary">Next →</button>
        </div>
      </div>

      {showAddEvent && (
        <div className="card add-event-form">
          <h3>Add New Event</h3>
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Event title"
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="Event description"
            />
          </div>
          <div className="form-group">
            <label>Type:</label>
            <select
              value={newEvent.type}
              onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
            >
              <option value="date">Specific Date</option>
              <option value="month">Whole Month</option>
            </select>
          </div>
          {newEvent.type === 'date' && (
            <div className="form-group">
              <label>Date:</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>
          )}
          {newEvent.type === 'month' && (
            <div className="form-group">
              <label>Month:</label>
              <input
                type="month"
                value={newEvent.month}
                onChange={(e) => setNewEvent({ ...newEvent, month: e.target.value })}
              />
            </div>
          )}
          <div className="form-actions">
            <button onClick={handleAddEvent} className="btn btn-primary">Add Event</button>
            <button onClick={() => setShowAddEvent(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="calendar-month-header">
        <h2>{format(currentDate, 'MMMM yyyy')}</h2>
      </div>

      {getEventsForMonth().length > 0 && (
        <div className="card month-events">
          <h3>Month Events</h3>
          <div className="month-events-list">
            {getEventsForMonth().map((event) => (
              <div key={event._id} className="month-event-item">
                <div className="month-event-title">{event.title}</div>
                {event.description && <div className="month-event-description">{event.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

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
          const dayEvents = getEventsForDate(day);
          
          return (
            <div
              key={day.toISOString()}
              className={`calendar-day ${isToday ? 'today' : ''} ${selectedDate && isSameDay(day, selectedDate) ? 'selected' : ''}`}
              onClick={() => setSelectedDate(day)}
            >
              <div className="calendar-day-number">{format(day, 'd')}</div>
              {dayEvents.map((event) => (
                <div key={event._id} className="calendar-day-event">
                  📅 {event.title}
                </div>
              ))}
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
          <h3>Details for {format(selectedDate, 'MMMM dd, yyyy')}</h3>
          {getEventsForDate(selectedDate).length > 0 && (
            <div className="calendar-events-section">
              <h4>Events:</h4>
              <div className="calendar-events-list">
                {getEventsForDate(selectedDate).map((event) => (
                  <div key={event._id} className="calendar-event-item">
                    <div className="calendar-event-title">{event.title}</div>
                    {event.description && <div className="calendar-event-description">{event.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="calendar-transactions-section">
            <h4>Transactions:</h4>
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
        </div>
      )}
    </div>
  );
};

export default CalendarView;
