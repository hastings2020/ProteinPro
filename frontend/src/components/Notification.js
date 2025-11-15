import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const Notification = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle style={{ color: '#4CAF50' }} />;
      case 'error':
        return <FaExclamationCircle style={{ color: '#f44336' }} />;
      default:
        return <FaInfoCircle style={{ color: '#2196F3' }} />;
    }
  };

  return (
    <div className={`notification notification-${type}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {getIcon()}
        <span>{message}</span>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          marginLeft: '12px'
        }}
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default Notification;
