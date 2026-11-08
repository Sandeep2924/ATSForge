import React from 'react';

function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  return (
    <div className={`toast-notification toast-${type}`} role="alert">
      <span className="toast-icon">
        {type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️'}
      </span>
      <span className="toast-message">{message}</span>
      <button 
        type="button" 
        className="toast-close" 
        onClick={onClose} 
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

export default Toast;
