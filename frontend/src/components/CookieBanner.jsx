import React, { useState, useEffect } from 'react';

function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('atsforge_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('atsforge_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside className="cookie-banner" role="region" aria-label="Privacy and cookies">
      <div className="cookie-content">
        <span className="cookie-icon" aria-hidden="true">🔒</span>
        <p className="cookie-text">
          <strong>Privacy First:</strong> ATSForge processes your resumes securely in-memory. We never store, track, or sell your personal career data.
        </p>
      </div>
      <div className="cookie-actions">
        <button 
          type="button" 
          className="btn btn-primary cookie-btn" 
          onClick={handleAccept}
        >
          Got it
        </button>
      </div>
    </aside>
  );
}

export default CookieBanner;
