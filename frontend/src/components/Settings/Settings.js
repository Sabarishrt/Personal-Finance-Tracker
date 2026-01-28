import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [feedback, setFeedback] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  const handleFeedbackSubmit = () => {
    if (!feedback.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Please enter your feedback' });
      return;
    }
    setFeedbackMessage({ type: 'success', text: 'Thank you for your feedback!' });
    setFeedback('');
    setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 3000);
  };

  const handleEditProfile = () => {
    alert('Profile editing feature coming soon!');
  };

  const handleOpenSupportTicket = () => {
    alert('Support ticket system coming soon!');
  };

  return (
    <div className="container">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      {feedbackMessage.text && (
        <div className={`message ${feedbackMessage.type}`}>
          {feedbackMessage.text}
        </div>
      )}

      <div className="card">
        <h2>Profile Update</h2>
        <div className="form-group">
          <p className="section-description">Update your personal profile information including name, email, and preferences.</p>
          <button onClick={handleEditProfile} className="btn btn-primary">
            Edit Profile
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Feedback</h2>
        <div className="form-group">
          <label htmlFor="feedback">Send us your feedback</label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your thoughts, suggestions, or report issues..."
            rows="4"
            className="feedback-textarea"
          ></textarea>
          <button onClick={handleFeedbackSubmit} className="btn btn-primary">
            Submit Feedback
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Other Information</h2>
        <div className="form-group">
          <label htmlFor="appVersion">App Version</label>
          <input
            type="text"
            id="appVersion"
            value="1.0.0"
            disabled
            readOnly
            className="readonly-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastUpdated">Last Updated</label>
          <input
            type="text"
            id="lastUpdated"
            value={new Date().toLocaleDateString()}
            disabled
            readOnly
            className="readonly-input"
          />
        </div>
        <div className="form-group">
          <label>Privacy & Terms</label>
          <div className="privacy-links">
            <a href="#privacy" className="link">Privacy Policy</a>
            <span className="separator">|</span>
            <a href="#terms" className="link">Terms of Service</a>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Helpdesk</h2>
        <div className="form-group">
          <p className="section-description">Need help? Contact our support team for assistance.</p>
          <div className="helpdesk-info">
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">support@budgetapp.com</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone:</span>
              <span className="info-value">1-800-BUDGET-1</span>
            </div>
            <div className="info-item">
              <span className="info-label">Available:</span>
              <span className="info-value">Monday - Friday, 9AM - 6PM EST</span>
            </div>
          </div>
          <button onClick={handleOpenSupportTicket} className="btn btn-primary">
            Open Support Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
