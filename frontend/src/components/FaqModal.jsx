import React, { useState } from 'react';

const FAQS = [
  {
    q: "How does the ATS Score calculation work?",
    a: "ATSForge evaluates your resume against a weighted 4-dimensional model: Keywords & Hard Skills match (40%), Quantifiable Impact & Metrics (25%), Role Relevance (25%), and Structural Completeness (10%)."
  },
  {
    q: "How is the Strict 1-Page Layout guaranteed?",
    a: "ATSForge dynamically limits project & work bullets to 2-3 high-impact lines, combines education on compact single-line blocks, uses an inline wrapping grid for certifications, and computes dynamic vertical spacing so content never spills onto page 2."
  },
  {
    q: "How do I compile the downloaded Kyvernitis LaTeX package?",
    a: "Download the '⚡ LaTeX (Kyvernitis .zip)' file, go to Overleaf.com, click 'New Project' -> 'Upload Project', and upload the .zip. In Overleaf Settings, set compiler to XeLaTeX."
  },
  {
    q: "Does ATSForge fabricate or hallucinate resume skills?",
    a: "No. ATSForge uses strict zero-hallucination prompting: when tailoring to a Job Description, it only reorders, highlights, and matches skills verified in your existing resume profile."
  },
  {
    q: "Is my personal resume data private and secure?",
    a: "Yes. ATSForge parses files in-memory on the backend and sends ephemeral requests to Gemini AI. Your resumes are never permanently saved to a database or shared."
  }
];

function FaqModal({ isOpen, onClose }) {
  const [openIndex, setOpenIndex] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card faq-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>❓ Frequently Asked Questions</h3>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close FAQ">✕</button>
        </div>

        <div className="modal-body faq-body">
          {FAQS.map((item, idx) => {
            const isOpenItem = openIndex === idx;
            return (
              <div key={idx} className={`faq-item ${isOpenItem ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenIndex(isOpenItem ? -1 : idx)}
                  aria-expanded={isOpenItem}
                >
                  <span>{item.q}</span>
                  <span className="faq-chevron">{isOpenItem ? '−' : '+'}</span>
                </button>
                {isOpenItem && (
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default FaqModal;
