import React, { useState, useRef } from 'react';
import { submitFeedback } from '../services/api';
import './Feedback.css';

const Feedback = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'general',
    message: ''
  });
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Screenshot must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.message.trim()) {
      setError('Please enter your feedback message');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitFeedback({
        ...formData,
        screenshot: screenshot
      });

      setSubmitSuccess(true);
      setFormData({ name: '', email: '', category: 'general', message: '' });
      setScreenshot(null);
      setScreenshotPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-page">
      <div className="page-header">
        <h1>Feedback & Suggestions</h1>
        <p className="page-subtitle">
          Help us improve ProteinPro! Share your thoughts, suggestions, or report issues.
        </p>
      </div>

      {submitSuccess && (
        <div className="success-banner">
          <span className="success-icon">✓</span>
          Thank you for your feedback! We'll review it soon.
        </div>
      )}

      <div className="feedback-card">
        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name (Optional)</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                placeholder="Your name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email (Optional)</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              className="form-select"
              value={formData.category}
              onChange={handleInputChange}
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="design">Design Suggestion</option>
              <option value="usability">Usability Issue</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="message">
              Your Feedback <span className="required">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              className="form-textarea"
              placeholder="Tell us what you think... What can we improve? What features would you like to see?"
              rows="6"
              value={formData.message}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="screenshot">Attach Screenshot (Optional)</label>
            <div className="screenshot-upload">
              <input
                type="file"
                id="screenshot"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleScreenshotChange}
                className="file-input"
              />
              <label htmlFor="screenshot" className="file-upload-label">
                <span className="upload-icon">📸</span>
                <span className="upload-text">
                  {screenshot ? 'Change Screenshot' : 'Upload Screenshot'}
                </span>
                <span className="upload-hint">PNG, JPG up to 5MB</span>
              </label>
            </div>

            {screenshotPreview && (
              <div className="screenshot-preview">
                <img src={screenshotPreview} alt="Screenshot preview" />
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="remove-screenshot-btn"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-submit-feedback"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>

      <div className="feedback-info">
        <h3>What happens next?</h3>
        <ul>
          <li>Your feedback is reviewed by our team</li>
          <li>We prioritize suggestions based on user needs</li>
          <li>Bug reports are investigated and fixed in future updates</li>
          <li>If you provided an email, we may reach out for clarification</li>
        </ul>
      </div>
    </div>
  );
};

export default Feedback;
