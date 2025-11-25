import React, { useState, useEffect } from 'react';
import { FaSave, FaUser, FaBullseye, FaWeight, FaEnvelope, FaInfoCircle, FaCommentDots } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Settings.css';
import { updateUser } from '../services/api';
import Notification from './Notification';

const Settings = ({ user, updateUser: updateUserContext }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    daily_protein_target: 150,
    weight: ''
  });
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        daily_protein_target: user.daily_protein_target || 150,
        weight: user.weight || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updatedUser = await updateUser(user.id, {
        daily_protein_target: parseInt(formData.daily_protein_target),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        email: formData.email
      });

      updateUserContext(updatedUser);
      showNotification('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error updating settings:', error);
      showNotification('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const calculateProteinRecommendation = () => {
    if (!formData.weight) return null;

    const weight = parseFloat(formData.weight);
    const recommendations = {
      sedentary: Math.round(weight * 0.8),
      moderate: Math.round(weight * 1.2),
      active: Math.round(weight * 1.6),
      athlete: Math.round(weight * 2.0)
    };

    return recommendations;
  };

  const recommendations = calculateProteinRecommendation();

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Customize your ProteinPro experience</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Profile Settings */}
        <div className="card settings-card">
          <h2 className="settings-section-title">
            <FaUser /> Profile Information
          </h2>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              disabled
            />
            <small className="form-help">Username cannot be changed</small>
          </div>

          <div className="form-group">
            <label className="form-label">
              <FaEnvelope /> Email
            </label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <FaWeight /> Weight (kg)
            </label>
            <input
              type="number"
              name="weight"
              className="form-input"
              value={formData.weight}
              onChange={handleChange}
              placeholder="70"
              step="0.1"
            />
            <small className="form-help">Used to calculate protein recommendations</small>
          </div>
        </div>

        {/* Goal Settings */}
        <div className="card settings-card">
          <h2 className="settings-section-title">
            <FaBullseye /> Daily Protein Goal
          </h2>

          <div className="form-group">
            <label className="form-label">Daily Protein Target (grams)</label>
            <input
              type="number"
              name="daily_protein_target"
              className="form-input target-input"
              value={formData.daily_protein_target}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          {recommendations && (
            <div className="recommendations-box">
              <div className="recommendations-header">
                <FaInfoCircle />
                <span>Recommended daily protein based on your weight:</span>
              </div>
              <div className="recommendations-grid">
                <div
                  className="recommendation-item"
                  onClick={() => setFormData({ ...formData, daily_protein_target: recommendations.sedentary })}
                >
                  <div className="rec-label">Sedentary</div>
                  <div className="rec-value">{recommendations.sedentary}g</div>
                  <div className="rec-desc">0.8g per kg</div>
                </div>
                <div
                  className="recommendation-item"
                  onClick={() => setFormData({ ...formData, daily_protein_target: recommendations.moderate })}
                >
                  <div className="rec-label">Moderate</div>
                  <div className="rec-value">{recommendations.moderate}g</div>
                  <div className="rec-desc">1.2g per kg</div>
                </div>
                <div
                  className="recommendation-item"
                  onClick={() => setFormData({ ...formData, daily_protein_target: recommendations.active })}
                >
                  <div className="rec-label">Active</div>
                  <div className="rec-value">{recommendations.active}g</div>
                  <div className="rec-desc">1.6g per kg</div>
                </div>
                <div
                  className="recommendation-item"
                  onClick={() => setFormData({ ...formData, daily_protein_target: recommendations.athlete })}
                >
                  <div className="rec-label">Athlete</div>
                  <div className="rec-value">{recommendations.athlete}g</div>
                  <div className="rec-desc">2.0g per kg</div>
                </div>
              </div>
              <small className="form-help">Click on a recommendation to apply it</small>
            </div>
          )}
        </div>

        {/* Feedback Section */}
        <div className="card settings-card feedback-card">
          <h2 className="settings-section-title">
            <FaCommentDots /> Help Us Improve
          </h2>
          <p className="about-text">
            Have suggestions or found a bug? We'd love to hear from you!
            Your feedback helps us make ProteinPro better for everyone.
          </p>
          <Link to="/feedback" className="btn-feedback-link">
            Submit Feedback
          </Link>
        </div>

        {/* About Section */}
        <div className="card settings-card about-card">
          <h2 className="settings-section-title">About ProteinPro</h2>
          <p className="about-text">
            <strong>ProteinPro</strong> is your comprehensive protein tracking companion.
            Track your daily protein intake, scan nutrition labels with OCR, search from
            thousands of foods, and visualize your progress over time.
          </p>
          <div className="about-info">
            <div className="info-item">
              <strong>Version:</strong> 1.0.0
            </div>
            <div className="info-item">
              <strong>Food Database:</strong> USDA FoodData Central
            </div>
            <div className="info-item">
              <strong>Features:</strong> OCR Scanning, Analytics, Calendar View, Export Data
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button type="submit" className="btn btn-success save-btn" disabled={saving}>
          {saving ? (
            <>
              <span className="spinner-small"></span> Saving...
            </>
          ) : (
            <>
              <FaSave /> Save Settings
            </>
          )}
        </button>
      </form>

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Settings;
