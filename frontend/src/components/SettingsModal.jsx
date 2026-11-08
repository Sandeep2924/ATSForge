import React, { useState } from 'react';

function SettingsModal({ isOpen, onClose, onSave, onResetData }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('atsforge_custom_api_key') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('atsforge_custom_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('atsforge_custom_api_key');
    }
    onSave?.(apiKey.trim());
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚙️ Settings & Configuration</h3>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>

        <div className="modal-body">
          {/* Feature 13: Password visibility toggle */}
          <div className="form-group">
            <label htmlFor="custom-api-key">Custom Google Gemini API Key (Optional)</label>
            <p className="field-hint">
              By default, ATSForge uses server-configured Gemini models. You can optionally supply your personal key.
            </p>
            <div className="password-input-wrapper">
              <input
                id="custom-api-key"
                type={showPassword ? 'text' : 'password'}
                className="input-field password-input"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide API Key" : "Show API Key"}
                aria-label={showPassword ? "Hide API Key" : "Show API Key"}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Feature 17: Confirmation Modal within Settings */}
          <div className="settings-danger-zone">
            <h4>Sample & Default Profile</h4>
            <p className="field-hint">Reset all fields back to standard sample data.</p>
            {!showConfirmReset ? (
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => setShowConfirmReset(true)}
              >
                🔄 Reset to Sample Data
              </button>
            ) : (
              <div className="confirm-box">
                <p>⚠️ <strong>Are you sure?</strong> Any unsaved changes in your resume will be overwritten.</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      onResetData();
                      setShowConfirmReset(false);
                      onClose();
                    }}
                  >
                    Yes, Reset Resume
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowConfirmReset(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
