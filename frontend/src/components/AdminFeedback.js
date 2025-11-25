import React, { useState, useEffect } from 'react';
import { fetchFeedbacks, deleteFeedback } from '../services/api';
import './AdminFeedback.css';

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simple authentication - you can change this code
  const ADMIN_CODE = 'admin2025';

  const handleAuthenticate = (e) => {
    e.preventDefault();
    if (accessCode === ADMIN_CODE) {
      setIsAuthenticated(true);
      setError('');
      loadFeedbacks();
    } else {
      setError('Invalid access code');
    }
  };

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await fetchFeedbacks();
      setFeedbacks(data);
      setError('');
    } catch (err) {
      setError('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFeedback(id);
      setFeedbacks(feedbacks.filter(f => f.id !== id));
      setShowDeleteConfirm(null);
      setSelectedFeedback(null);
    } catch (err) {
      setError('Failed to delete feedback');
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    if (filter === 'all') return true;
    return f.category === filter;
  });

  const getCategoryBadgeColor = (category) => {
    const colors = {
      bug: '#f44336',
      feature: '#2196f3',
      design: '#9c27b0',
      usability: '#ff9800',
      general: '#4caf50',
      other: '#757575'
    };
    return colors[category] || colors.general;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Admin Access</h1>
            <p>Enter the access code to view feedback submissions</p>
          </div>
          <form onSubmit={handleAuthenticate} className="auth-form">
            <input
              type="password"
              className="auth-input"
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              autoFocus
            />
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-btn">
              Access Feedbacks
            </button>
          </form>
          <div className="auth-hint">
            Hint: Default code is "admin2025"
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-feedback-page">
      <div className="admin-header">
        <div>
          <h1>Feedback Dashboard</h1>
          <p className="admin-subtitle">
            {feedbacks.length} total submission{feedbacks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={loadFeedbacks} className="btn-refresh">
          🔄 Refresh
        </button>
      </div>

      <div className="filter-bar">
        {['all', 'general', 'bug', 'feature', 'design', 'usability', 'other'].map(cat => (
          <button
            key={cat}
            className={`filter-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">Loading feedbacks...</div>
      ) : error && feedbacks.length === 0 ? (
        <div className="error-state">{error}</div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="empty-state">
          No feedbacks found for this category
        </div>
      ) : (
        <div className="feedbacks-grid">
          {filteredFeedbacks.map(feedback => (
            <div key={feedback.id} className="feedback-item">
              <div className="feedback-item-header">
                <div>
                  <span
                    className="category-badge"
                    style={{ backgroundColor: getCategoryBadgeColor(feedback.category) }}
                  >
                    {feedback.category}
                  </span>
                  <span className="feedback-date">{formatDate(feedback.created_at)}</span>
                </div>
                <button
                  className="btn-delete-feedback"
                  onClick={() => setShowDeleteConfirm(feedback.id)}
                >
                  🗑️
                </button>
              </div>

              <div className="feedback-item-body">
                <div className="feedback-meta">
                  <div className="meta-item">
                    <strong>Name:</strong> {feedback.name || 'Anonymous'}
                  </div>
                  {feedback.email && (
                    <div className="meta-item">
                      <strong>Email:</strong>{' '}
                      <a href={`mailto:${feedback.email}`}>{feedback.email}</a>
                    </div>
                  )}
                </div>

                <div className="feedback-message">
                  {feedback.message}
                </div>

                {feedback.screenshot_path && (
                  <div className="feedback-screenshot">
                    <img
                      src={`http://localhost:5001/uploads/${feedback.screenshot_path}`}
                      alt="Feedback screenshot"
                      onClick={() => setSelectedFeedback(feedback)}
                    />
                    <div className="screenshot-overlay">
                      Click to view full size
                    </div>
                  </div>
                )}
              </div>

              {showDeleteConfirm === feedback.id && (
                <div className="delete-confirm">
                  <p>Delete this feedback?</p>
                  <div className="delete-actions">
                    <button
                      className="btn-confirm-delete"
                      onClick={() => handleDelete(feedback.id)}
                    >
                      Yes, Delete
                    </button>
                    <button
                      className="btn-cancel-delete"
                      onClick={() => setShowDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedFeedback && (
        <div className="image-modal" onClick={() => setSelectedFeedback(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedFeedback(null)}
            >
              ✕
            </button>
            <img
              src={`http://localhost:5001/uploads/${selectedFeedback.screenshot_path}`}
              alt="Feedback screenshot full size"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
