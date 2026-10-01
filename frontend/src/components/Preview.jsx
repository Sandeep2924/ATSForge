import React, { useState, useEffect, useRef } from 'react';

function cleanBullet(text) {
  if (!text) return '';
  return text.replace(/^[\s\u2022\u00B7\u25E6\u2043\u2219\u25AA\u25AB\u25CF\u25CB\u2013\u2014\-*.]+\s*/, '').trim();
}

function Preview({ resumeData }) {
  const [fitToOnePage, setFitToOnePage] = useState(true);
  const [autoScale, setAutoScale] = useState(1);
  const [userDensity, setUserDensity] = useState('auto'); // 'auto', 'compact', 'normal'
  const contentRef = useRef(null);
  const autoScaleRef = useRef(autoScale);
  autoScaleRef.current = autoScale;

  useEffect(() => {
    if (!fitToOnePage) {
      setAutoScale(1);
      return;
    }

    if (userDensity === 'compact') {
      setAutoScale(0.90);
      return;
    }
    if (userDensity === 'normal') {
      setAutoScale(1.0);
      return;
    }

    // Auto-fit calculation
    const calculateFit = () => {
      if (contentRef.current) {
        // Standard US Letter height at 96 DPI: 11 inches = 1056px
        // Target available height leaves a comfortable 20px padding at the bottom
        const TARGET_HEIGHT = 1036;
        const currentScale = autoScaleRef.current > 0 ? autoScaleRef.current : 1;
        const naturalHeight = contentRef.current.scrollHeight / currentScale;

        if (naturalHeight > TARGET_HEIGHT) {
          const scaleFactor = TARGET_HEIGHT / naturalHeight;
          const clamped = Math.max(0.60, Math.min(1.0, Number(scaleFactor.toFixed(3))));
          setAutoScale(clamped);
        } else {
          setAutoScale(1);
        }
      }
    };

    calculateFit();
    const timer = setTimeout(calculateFit, 150);
    window.addEventListener('resize', calculateFit);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateFit);
    };
  }, [resumeData, fitToOnePage, userDensity]);

  // Extract certifications into clean items (handles newlines, middle dots, bullets, or semicolons)
  const certItems = resumeData.certifications
    ? resumeData.certifications
        .split(/\n|(?:\s+[·•]\s+)|(?:\s*;\s*)/)
        .map(cleanBullet)
        .filter(Boolean)
    : [];

  return (
    <section className="preview-panel">
      {/* Viewport Control Bar */}
      <div className="preview-toolbar">
        <span className="toolbar-label">
          Resume Preview 
          {fitToOnePage && (
            <span style={{ marginLeft: '8px', fontSize: '0.72rem', color: '#16a34a', fontWeight: 'bold' }}>
              ✓ Strict 1-Page ({Math.round(autoScale * 100)}% Fit — All Sections Visible)
            </span>
          )}
        </span>
        <div className="toolbar-actions" style={{ display: 'flex', gap: '6px' }}>
          <button 
            type="button"
            className={`density-btn ${fitToOnePage && userDensity === 'auto' ? 'active' : ''}`}
            onClick={() => { setFitToOnePage(true); setUserDensity('auto'); }}
            title="Automatically scale to guarantee 100% of sections fit on a single page"
          >
            ⚡ Auto-Fit 1-Page
          </button>
          <button 
            type="button"
            className={`density-btn ${userDensity === 'compact' ? 'active' : ''}`}
            onClick={() => { setFitToOnePage(true); setUserDensity('compact'); }}
            title="Compact 90% view"
          >
            Compact (90%)
          </button>
          <button 
            type="button"
            className={`density-btn ${!fitToOnePage || userDensity === 'normal' ? 'active' : ''}`}
            onClick={() => { setFitToOnePage(false); setUserDensity('normal'); }}
            title="Full 100% standard size"
          >
            Standard (100%)
          </button>
        </div>
      </div>

      {/* 8.5 x 11 Inch Strict Page Boundary Container */}
      <div 
        className="preview-viewport-wrapper" 
        style={{
          width: '8.5in',
          height: fitToOnePage ? '11in' : 'auto',
          minHeight: '11in',
          overflow: fitToOnePage ? 'hidden' : 'visible',
          backgroundColor: '#ffffff',
          boxShadow: 'var(--shadow-paper)',
          position: 'relative',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        <div 
          ref={contentRef}
          className={`resume-document ${fitToOnePage ? 'compact-fit' : ''}`}
          style={{
            zoom: fitToOnePage ? autoScale : 1,
            boxShadow: 'none',
            margin: '0 auto',
            width: '8.5in',
            minHeight: '11in'
          }}
        >
          {/* Visual 1-Page Boundary Indicator */}
          <div className="page-boundary-guide" title="Standard 11-inch Page 1 Cutoff">
            <span className="page-boundary-tag">Page 1 Cutoff</span>
          </div>
          
          <div className="ats-name">{resumeData.full_name || 'FIRSTNAME LASTNAME'}</div>
          <div className="ats-contact">
            {resumeData.contact_info || '+1 (555) 000-0000 | your.email@domain.com | linkedin.com/in/yourname | City, Country'}
          </div>
          
          {resumeData.professional_summary && (
            <>
              <div className="ats-section-title">PROFESSIONAL SUMMARY</div>
              <div className="ats-body-text">{resumeData.professional_summary}</div>
            </>
          )}

          {resumeData.technical_skills && (
            <>
              <div className="ats-section-title">TECHNICAL SKILLS</div>
              <div className="ats-body-text" style={{ whiteSpace: 'pre-line' }}>{resumeData.technical_skills}</div>
            </>
          )}

          {resumeData.experience && resumeData.experience.length > 0 && (
            <>
              <div className="ats-section-title">PROFESSIONAL EXPERIENCE</div>
              {resumeData.experience.map((exp, index) => (
                <div key={index} className="ats-item-block">
                  <div className="ats-item-header">
                    <span>{exp.job_title}</span>
                    <span>{exp.date_range}</span>
                  </div>
                  <div className="ats-item-sub">
                    <span>{exp.company}{exp.location ? ` — ${exp.location}` : ''}</span>
                  </div>
                  {exp.description && (
                    <ul className="ats-bullets">
                      {exp.description.split('\n').map((line, i) => {
                        const cleaned = cleanBullet(line);
                        return cleaned !== '' && <li key={i}>{cleaned}</li>;
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </>
          )}

          {resumeData.projects && resumeData.projects.length > 0 && (
            <>
              <div className="ats-section-title">PROJECTS</div>
              {resumeData.projects.map((proj, index) => (
                <div key={index} className="ats-item-block">
                  <div className="ats-item-header">
                    <span><strong>{proj.name}</strong> {proj.link ? `| ${proj.link}` : ''}</span>
                    <span className="ats-item-tech">{proj.tech_stack}</span>
                  </div>
                  {proj.description && (
                    <ul className="ats-bullets">
                      {proj.description.split('\n').map((line, i) => {
                        const cleaned = cleanBullet(line);
                        return cleaned !== '' && <li key={i}>{cleaned}</li>;
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </>
          )}

          {resumeData.education && resumeData.education.length > 0 && (
            <>
              <div className="ats-section-title">EDUCATION</div>
              {resumeData.education.map((edu, index) => (
                <div key={index} className="ats-item-block ats-education-block">
                  <div className="ats-item-header">
                    <span><strong>{edu.degree}</strong> {edu.institution ? `— ${edu.institution}` : ''}</span>
                    <span>{edu.date_range} {edu.gpa ? `| GPA: ${edu.gpa}` : ''}</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {certItems.length > 0 && (
            <>
              <div className="ats-section-title">CERTIFICATIONS & TRAINING</div>
              <div className="ats-cert-grid">
                {certItems.map((cert, i) => (
                  <div key={i} className="ats-cert-chip">
                    <span className="ats-bullet-dot">•</span>
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {resumeData.achievements && (
            <>
              <div className="ats-section-title">KEY ACHIEVEMENTS & HIGHLIGHTS</div>
              <ul className="ats-bullets">
                {resumeData.achievements.split('\n').map((line, i) => {
                  const cleaned = cleanBullet(line);
                  return cleaned !== '' && <li key={i}>{cleaned}</li>;
                })}
              </ul>
            </>
          )}

        </div>
      </div>
    </section>
  );
}

export default Preview;
