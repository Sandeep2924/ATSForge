import React, { useState, useEffect } from 'react';
import './index.css';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Toast from './components/Toast';
import SettingsModal from './components/SettingsModal';
import FaqModal from './components/FaqModal';
import { DEFAULT_RESUME_DATA } from './defaultResume';

function App() {
  const [isUploading, setIsUploading] = useState(false);
  const [resumeData, setResumeData] = useState(() => {
    try {
      const saved = localStorage.getItem('atsforge_resume_data');
      return saved ? JSON.parse(saved) : DEFAULT_RESUME_DATA;
    } catch {
      return DEFAULT_RESUME_DATA;
    }
  });

  // Feature 5: Mobile View Switcher ('editor' | 'preview')
  const [mobileTab, setMobileTab] = useState('editor');

  // Feature 8: Scroll progress bar
  const [scrollProgress, setScrollProgress] = useState(0);

  // Feature 14: UTM Tracking
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const utmObj = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'].forEach(key => {
        if (params.get(key)) utmObj[key] = params.get(key);
      });
      if (Object.keys(utmObj).length > 0) {
        sessionStorage.setItem('atsforge_utm_tracking', JSON.stringify(utmObj));
      }
    } catch {
      // ignore
    }
  }, []);

  // Feature 15 & 16: Toast notification system (success/error/info)
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Feature 18: Last updated timestamp
  const [lastSaved, setLastSaved] = useState('Just now');
  useEffect(() => {
    try {
      localStorage.setItem('atsforge_resume_data', JSON.stringify(resumeData));
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSaved(`Today at ${timeStr}`);
    } catch {
      // ignore
    }
  }, [resumeData]);

  // Modal visibility states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  // Feature 8: Track editor scroll progress
  const handleScroll = (e) => {
    const target = e.target;
    const progress = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
    setScrollProgress(Math.min(100, Math.max(0, progress || 0)));
  };

  // Feature 9: Copy LaTeX directly to clipboard
  const handleCopyLatex = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/export-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resumeData)
      });
      const result = await response.json();
      if (result.status === 'success' && result.latex) {
        await navigator.clipboard.writeText(result.latex);
        showToast("Complete Kyvernitis LaTeX source copied to clipboard!", "success");
      } else {
        showToast("Could not generate LaTeX.", "error");
      }
    } catch {
      showToast("Error connecting to LaTeX backend.", "error");
    }
  };

  // Word docx export
  const handleDownloadDocx = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resumeData)
      });
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(resumeData.full_name || 'Resume').replace(/\s+/g, '_')}_ATSForge.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Word document (.docx) downloaded successfully!", "success");
    } catch (error) {
      console.error("Error downloading docx:", error);
      showToast("Failed to download Word document.", "error");
    }
  };

  // LaTeX zip package export
  const handleDownloadLatexZip = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/export-latex-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resumeData)
      });
      if (!response.ok) throw new Error("LaTeX zip export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(resumeData.full_name || 'Resume').replace(/\s+/g, '_')}_Kyvernitis_LaTeX.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("LaTeX (.zip) bundle downloaded! Ready for Overleaf.", "success");
    } catch (error) {
      console.error("Error downloading LaTeX zip:", error);
      showToast("Failed to download LaTeX package.", "error");
    }
  };

  // LaTeX .tex download
  const handleDownloadLatexTex = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/export-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resumeData)
      });
      const result = await response.json();
      if (result.status === 'success' && result.latex) {
        const blob = new Blob([result.latex], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(resumeData.full_name || 'Resume').replace(/\s+/g, '_')}.tex`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast("LaTeX (.tex) file downloaded successfully!", "success");
      } else {
        showToast("Failed to generate LaTeX source.", "error");
      }
    } catch (error) {
      console.error("Error downloading LaTeX .tex:", error);
      showToast("Failed to download LaTeX file.", "error");
    }
  };

  // Resume Ingestion / Upload
  const handleUploadResume = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    e.target.value = null;

    try {
      const response = await fetch('http://localhost:8000/api/upload-resume', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        setResumeData(prev => ({
          ...prev,
          ...result.data,
          experience: Array.isArray(result.data.experience) ? result.data.experience : [],
          projects: Array.isArray(result.data.projects) ? result.data.projects : [],
          education: Array.isArray(result.data.education) ? result.data.education : []
        }));
        showToast("Resume parsed and ingested losslessly!", "success");
      } else {
        showToast(result.message || "Could not parse resume file.", "error");
      }
    } catch (error) {
      console.error("Upload error:", error);
      showToast("Failed to upload document to backend.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Reset to default sample
  const handleResetData = () => {
    setResumeData(DEFAULT_RESUME_DATA);
    showToast("Resume restored to sample profile.", "info");
  };

  return (
    <div className="app-layout">
      {/* Feature 12: Skip to Content (Accessibility) */}
      <a href="#editor-panel" className="skip-link">Skip to editor content</a>

      {/* Feature 8: Scroll progress bar */}
      <div 
        className="top-progress-bar" 
        style={{ width: `${scrollProgress}%` }} 
        aria-hidden="true"
      />

      {/* Feature 11: Sticky Header */}
      <header className="header">
        <div className="header-brand-group">
          <div className="logo">
            <span className="logo-badge">⚡</span> ATSForge
          </div>
          {/* Feature 18: Last updated date */}
          <span className="last-saved-badge" title="Changes are automatically saved to your browser session">
            ● Saved ({lastSaved})
          </span>
        </div>

        {/* Feature 5: Mobile View Switcher */}
        <div className="mobile-view-tabs" role="tablist" aria-label="Mobile View Switcher">
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'editor'}
            className={`tab-btn ${mobileTab === 'editor' ? 'active' : ''}`}
            onClick={() => setMobileTab('editor')}
          >
            ✏️ Editor
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'preview'}
            className={`tab-btn ${mobileTab === 'preview' ? 'active' : ''}`}
            onClick={() => setMobileTab('preview')}
          >
            📄 Preview
          </button>
        </div>

        <nav className="header-nav">
          <label className="btn header-btn" style={{cursor: isUploading ? 'wait' : 'pointer', opacity: isUploading ? 0.7 : 1}}>
            {isUploading ? "Scanning..." : "Upload Resume"}
            <input type="file" accept=".pdf,.docx" style={{display: 'none'}} onChange={handleUploadResume} disabled={isUploading} />
          </label>
          <button type="button" className="btn header-btn" onClick={handleDownloadDocx}>.docx</button>
          <button type="button" className="btn header-btn" onClick={handleDownloadLatexTex} title="Download pure LaTeX (.tex)">.tex</button>
          
          {/* Feature 9: Copy LaTeX button */}
          <button type="button" className="btn header-btn" onClick={handleCopyLatex} title="Copy complete LaTeX code to clipboard">
            📋 Copy .tex
          </button>

          <button type="button" className="btn btn-primary header-btn" onClick={handleDownloadLatexZip} title="Download ready-to-compile Kyvernitis LaTeX package (.zip for Overleaf)">
            ⚡ LaTeX (.zip)
          </button>

          {/* Feature 19: FAQ Modal Trigger */}
          <button 
            type="button" 
            className="btn-icon theme-toggle-btn" 
            onClick={() => setIsFaqOpen(true)}
            title="Frequently Asked Questions & Help"
            aria-label="FAQ and Help"
          >
            ❓
          </button>

          {/* Feature 13 & 17: Settings Modal Trigger */}
          <button 
            type="button" 
            className="btn-icon theme-toggle-btn" 
            onClick={() => setIsSettingsOpen(true)}
            title="Settings, Custom API Key & Reset"
            aria-label="Settings"
          >
            ⚙️
          </button>
        </nav>
      </header>

      {/* Main Workspace with mobile tab responsiveness */}
      <main className="workspace">
        <div 
          className={`workspace-pane editor-pane ${mobileTab === 'editor' ? 'pane-active' : 'pane-hidden-mobile'}`}
          onScroll={handleScroll}
        >
          <Editor 
            resumeData={resumeData} 
            setResumeData={setResumeData} 
            onNotify={showToast} 
          />
        </div>
        <div className={`workspace-pane preview-pane ${mobileTab === 'preview' ? 'pane-active' : 'pane-hidden-mobile'}`}>
          <Preview 
            resumeData={resumeData} 
            onNotify={showToast} 
          />
        </div>
      </main>

      {/* Feature 15 & 16: Toast Feedback Notifications */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Feature 13 & 17: Settings & Confirmation Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={() => showToast("Settings updated successfully!", "success")}
        onResetData={handleResetData}
      />

      {/* Feature 19: Expandable FAQ Accordion Modal */}
      <FaqModal 
        isOpen={isFaqOpen} 
        onClose={() => setIsFaqOpen(false)} 
      />

      {/* Feature 20: Floating Feedback / Contact Button */}
      <a 
        href="https://github.com/Sandeep2924/ATSForge/issues" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="floating-feedback-btn"
        title="Report an issue or suggest a feature on GitHub"
        aria-label="Feedback and GitHub"
      >
        💬 Feedback
      </a>
    </div>
  );
}

export default App;
