import React, { useState, useEffect } from 'react';
import './BackendStatus.css';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const BackendStatus = () => {
  const [backendDown, setBackendDown] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const checkBackend = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const healthUrl = apiUrl.replace('/api', '/api/health');
      const response = await fetch(healthUrl);
      if (response.ok) {
        setBackendDown(false);
        setChecking(false);
      } else {
        setBackendDown(true);
        setChecking(false);
      }
    } catch (error) {
      setBackendDown(true);
      setChecking(false);
    }
  };

  if (checking || !backendDown || dismissed) {
    return null;
  }

  return (
    <div className="backend-status-banner">
      <div className="backend-status-content">
        <FaExclamationTriangle className="warning-icon" />
        <div className="backend-status-text">
          <strong>Backend Server Not Running</strong>
          <p>Start the backend: Open terminal → cd backend → npm run dev</p>
        </div>
        <button className="backend-status-close" onClick={() => setDismissed(true)}>
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default BackendStatus;
