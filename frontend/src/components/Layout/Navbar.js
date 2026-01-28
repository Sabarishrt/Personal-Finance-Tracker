import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>
      <nav className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-brand">
          <Link to="/" className="brand-link" onClick={handleNavClick}>
            💰 Finance Tracker
          </Link>
        </div>
        
        <div className="sidebar-menu">
          <Link to="/" className="sidebar-link" onClick={handleNavClick}>
            <span className="sidebar-icon">📊</span>
            <span className="sidebar-text">Dashboard</span>
          </Link>
          <Link to="/transactions" className="sidebar-link" onClick={handleNavClick}>
            <span className="sidebar-icon">💳</span>
            <span className="sidebar-text">Transactions</span>
          </Link>
          <Link to="/calendar" className="sidebar-link" onClick={handleNavClick}>
            <span className="sidebar-icon">📅</span>
            <span className="sidebar-text">Calendar</span>
          </Link>
          <Link to="/analytics" className="sidebar-link" onClick={handleNavClick}>
            <span className="sidebar-icon">📈</span>
            <span className="sidebar-text">Analytics</span>
          </Link>
          <Link to="/target" className="sidebar-link" onClick={handleNavClick}>
            <span className="sidebar-icon">🎯</span>
            <span className="sidebar-text">Target</span>
          </Link>
          <Link to="/settings" className="sidebar-link" onClick={handleNavClick}>
            <span className="sidebar-icon">⚙️</span>
            <span className="sidebar-text">Settings</span>
          </Link>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-username">{user.name}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-logout">
            Logout
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
