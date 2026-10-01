import React, { useState } from 'react';

function Editor({ resumeData, setResumeData }) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isTailoringSkills, setIsTailoringSkills] = useState(false);
  const [tailorResultInfo, setTailorResultInfo] = useState(null);
  const [atsScoreResult, setAtsScoreResult] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setResumeData(prev => ({ ...prev, [name]: value }));
  };

  const handleTailorSkills = async () => {
    if (!resumeData.target_job_description) {
      alert("Please paste a Target Job Description in the optimizer section first.");
      return;
    }
    setIsTailoringSkills(true);
    setTailorResultInfo(null);
    try {
      const response = await fetch('http://localhost:8000/api/tailor-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resumeData)
      });
      const result = await response.json();
      if (result.status === 'success') {
        setResumeData(prev => ({
          ...prev,
          technical_skills: result.technical_skills
        }));
        setTailorResultInfo({
          role: result.role_category,
          elevated: result.elevated_categories,
          matched: result.matched_skills
        });
      } else {
        alert(result.message || "Failed to tailor skills.");
      }
    } catch (err) {
      console.error("Error tailoring skills:", err);
      alert("Failed to connect to backend for skill tailoring.");
    } finally {
      setIsTailoringSkills(false);
    }
  };

  const handleArrayChange = (field, index, subField, value) => {
    const newArray = [...resumeData[field]];
    newArray[index][subField] = value;
    setResumeData({ ...resumeData, [field]: newArray });
  };

  const addItem = (field, defaultObj) => {
    setResumeData({ ...resumeData, [field]: [...resumeData[field], defaultObj] });
  };

  const removeItem = (field, index) => {
    const newArray = [...resumeData[field]];
    newArray.splice(index, 1);
    setResumeData({ ...resumeData, [field]: newArray });
  };

  const handleOptimizeAI = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch('http://localhost:8000/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resumeData)
      });
      const result = await response.json();
      if (result.status === 'success') {
        setResumeData(result.data);
      }
    } catch (error) {
      console.error("Error optimizing resume:", error);
      alert("Failed to connect to AI Server.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const cleanBullet = (text) => {
    if (!text) return '';
    return text.replace(/^[\s\u2022\u00B7\u25E6\u2043\u2219\u25AA\u25AB\u25CF\u25CB\u2013\u2014\-*.]+\s*/, '').trim();
  };

  const handleBudgetOnePage = () => {
    const updatedProjects = (resumeData.projects || []).map(p => {
      const bullets = (p.description || '').split('\n').map(cleanBullet).filter(Boolean);
      return {
        ...p,
        description: bullets.slice(0, 3).join('\n')
      };
    });
    const updatedExperience = (resumeData.experience || []).map(e => {
      const bullets = (e.description || '').split('\n').map(cleanBullet).filter(Boolean);
      return {
        ...e,
        description: bullets.slice(0, 3).join('\n')
      };
    });
    setResumeData({
      ...resumeData,
      projects: updatedProjects,
      experience: updatedExperience
    });
  };

  const handleCalculateScore = async () => {
    setIsScoring(true);
    try {
      const response = await fetch('http://localhost:8000/api/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resumeData)
      });
      const result = await response.json();
      if (result.status === 'success') {
        setAtsScoreResult(result.data);
      }
    } catch (error) {
      console.error("Error calculating ATS score:", error);
      alert("Failed to calculate ATS score.");
    } finally {
      setIsScoring(false);
    }
  };

  return (
    <section className="editor-panel">
      
      <div className="editor-section" style={{ animationDelay: '0.1s' }}>
        <h2 className="section-title">✨ AI ATS Optimizer</h2>
        <div className="form-group">
          <label>Target Job Description</label>
          <textarea 
            name="target_job_description"
            className="input-field" 
            placeholder="Paste job description here to tailor your resume..."
            value={resumeData.target_job_description || ''}
            onChange={handleChange}
          ></textarea>
        </div>
        <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap'}}>
          <button className="btn btn-primary" onClick={handleOptimizeAI} disabled={isOptimizing || isScoring} style={{ flex: '1 1 45%' }}>
            {isOptimizing ? "Optimizing..." : "⚡ Optimize with AI"}
          </button>
          <button className="btn btn-outline" onClick={handleCalculateScore} disabled={isOptimizing || isScoring} style={{ flex: '1 1 45%', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}>
            {isScoring ? "Scanning..." : "🎯 ATS Score"}
          </button>
          <button className="btn btn-outline" onClick={handleBudgetOnePage} style={{ flex: '1 1 100%', borderColor: '#16a34a', color: '#16a34a', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} title="Trims project & experience bullets to 3 max to guarantee strict single-page layout">
            📐 Auto-Budget Bullets for 1-Page Fit
          </button>
        </div>

        {atsScoreResult && (
          <div className="ats-score-card">
            <div className="score-header-row">
              <div className="score-circle" style={{ borderColor: atsScoreResult.score >= 80 ? '#22c55e' : atsScoreResult.score >= 60 ? '#eab308' : '#ef4444' }}>
                <span className="score-number">{atsScoreResult.score}</span>
                <span className="score-label">/ 100</span>
              </div>
              <div className="score-headline">
                <span className="score-badge" style={{
                  backgroundColor: atsScoreResult.score >= 80 ? '#dcfce7' : atsScoreResult.score >= 60 ? '#fef9c3' : '#fee2e2',
                  color: atsScoreResult.score >= 80 ? '#15803d' : atsScoreResult.score >= 60 ? '#854d0e' : '#b91c1c'
                }}>
                  {atsScoreResult.score >= 80 ? '✓ High ATS Compatibility' : atsScoreResult.score >= 60 ? '⚠️ Moderate Match' : '❗ Needs Tailoring'}
                </span>
                <p className="score-subtitle">
                  {atsScoreResult.score >= 80 
                    ? 'Great match! Resume is primed to pass automated ATS filters.' 
                    : atsScoreResult.score >= 60 
                    ? 'Good foundation. Adding missing keywords will push you above 80.'
                    : 'Significant keyword and metric gaps detected for this role.'}
                </p>
              </div>
            </div>

            {/* Sub-Scores Metric Bars */}
            {atsScoreResult.sub_scores && (
              <div className="sub-scores-grid">
                <div className="sub-score-item">
                  <div className="sub-score-info">
                    <span>Keywords Match</span>
                    <strong>{atsScoreResult.sub_scores.keyword_match || 0}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${atsScoreResult.sub_scores.keyword_match || 0}%`, backgroundColor: '#3b82f6' }}></div>
                  </div>
                </div>

                <div className="sub-score-item">
                  <div className="sub-score-info">
                    <span>Quantifiable Impact</span>
                    <strong>{atsScoreResult.sub_scores.quantifiable_impact || 0}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${atsScoreResult.sub_scores.quantifiable_impact || 0}%`, backgroundColor: '#10b981' }}></div>
                  </div>
                </div>

                <div className="sub-score-item">
                  <div className="sub-score-info">
                    <span>Experience Relevance</span>
                    <strong>{atsScoreResult.sub_scores.experience_relevance || 0}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${atsScoreResult.sub_scores.experience_relevance || 0}%`, backgroundColor: '#8b5cf6' }}></div>
                  </div>
                </div>

                <div className="sub-score-item">
                  <div className="sub-score-info">
                    <span>Structure & Completeness</span>
                    <strong>{atsScoreResult.sub_scores.completeness || 0}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${atsScoreResult.sub_scores.completeness || 0}%`, backgroundColor: '#f59e0b' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Keywords Section: Matched & Missing */}
            <div className="keywords-section">
              {atsScoreResult.matched_keywords && atsScoreResult.matched_keywords.length > 0 && (
                <div>
                  <h4 style={{ color: '#16a34a' }}>✓ Matched Keywords ({atsScoreResult.matched_keywords.length})</h4>
                  <div className="keyword-tags">
                    {atsScoreResult.matched_keywords.map((kw, i) => (
                      <span key={i} className="tag tag-matched">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {atsScoreResult.missing_keywords && atsScoreResult.missing_keywords.length > 0 && (
                <div>
                  <h4 style={{ color: '#dc2626' }}>+ Missing Keywords ({atsScoreResult.missing_keywords.length})</h4>
                  <div className="keyword-tags">
                    {atsScoreResult.missing_keywords.map((kw, i) => (
                      <span key={i} className="tag tag-missing">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actionable Feedback */}
            {atsScoreResult.feedback && atsScoreResult.feedback.length > 0 && (
              <div className="score-details">
                <h4>Actionable Recommendations</h4>
                <ul>
                  {atsScoreResult.feedback.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
              </div>
            )}
              
            <button 
              className="btn btn-primary" 
              style={{marginTop: '0.5rem', width: '100%', backgroundColor: '#2563eb', borderColor: '#2563eb'}}
              onClick={handleOptimizeAI}
              disabled={isOptimizing}
            >
              {isOptimizing ? "Auto-Fixing & Injecting Keywords..." : "⚡ Auto-Fix ATS Issues & Align Resume"}
            </button>
          </div>
        )}
      </div>

      <div className="editor-section" style={{ animationDelay: '0.2s' }}>
        <h2 className="section-title">Profile & Skills</h2>
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" name="full_name" className="input-field" value={resumeData.full_name || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Contact Details (Phone | Email | LinkedIn | Location)</label>
          <input type="text" name="contact_info" className="input-field" value={resumeData.contact_info || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Professional Summary</label>
          <textarea name="professional_summary" className="input-field" value={resumeData.professional_summary || ''} onChange={handleChange}></textarea>
        </div>
        <div className="form-group">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem'}}>
            <label style={{margin: 0}}>Technical Skills</label>
            <button 
              type="button" 
              className="btn" 
              style={{fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderColor: '#8b5cf6', color: '#6d28d9', backgroundColor: '#f5f3ff'}}
              onClick={handleTailorSkills}
              disabled={isTailoringSkills}
            >
              {isTailoringSkills ? "Analyzing & Reordering..." : "🎯 Smart Tailor (Zero-Hallucination)"}
            </button>
          </div>

          {tailorResultInfo && (
            <div style={{fontSize: '0.78rem', padding: '0.5rem 0.75rem', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', color: '#5b21b6', lineHeight: 1.4}}>
              <strong>Target Role:</strong> {tailorResultInfo.role}.<br/>
              {tailorResultInfo.elevated && tailorResultInfo.elevated.length > 0 && (
                <span><strong>Priority Elevated:</strong> {tailorResultInfo.elevated.join(', ')} moved to top.<br/></span>
              )}
              <span style={{color: '#4c1d95'}}>✓ <strong>Zero-Hallucination Guard:</strong> Only candidate's verified skills were reordered and highlighted.</span>
            </div>
          )}

          <textarea name="technical_skills" className="input-field" value={resumeData.technical_skills || ''} onChange={handleChange}></textarea>
        </div>
      </div>

      <div className="editor-section" style={{ animationDelay: '0.3s' }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
          <h2 className="section-title" style={{margin: 0}}>Experience</h2>
          <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '0.2rem 0.5rem', borderRadius: '4px'}}>
            📄 3–4 bullets/role budget
          </span>
        </div>
        {(resumeData.experience || []).map((exp, index) => (
          <div className="dynamic-card" key={index}>
            <div className="card-header">
              <label style={{margin:0}}>Role {index + 1}</label>
              <button className="btn btn-icon" onClick={() => removeItem('experience', index)}>🗑️</button>
            </div>
            <div className="form-group"><input type="text" className="input-field" placeholder="Job Title" value={exp.job_title || ''} onChange={(e) => handleArrayChange('experience', index, 'job_title', e.target.value)} /></div>
            <div className="form-group"><input type="text" className="input-field" placeholder="Company" value={exp.company || ''} onChange={(e) => handleArrayChange('experience', index, 'company', e.target.value)} /></div>
            <div className="form-group"><input type="text" className="input-field" placeholder="Location" value={exp.location || ''} onChange={(e) => handleArrayChange('experience', index, 'location', e.target.value)} /></div>
            <div className="form-group"><input type="text" className="input-field" placeholder="Date Range" value={exp.date_range || ''} onChange={(e) => handleArrayChange('experience', index, 'date_range', e.target.value)} /></div>
            <div className="form-group">
              <textarea className="input-field" placeholder="Achievements (bullet points)" value={exp.description || ''} onChange={(e) => handleArrayChange('experience', index, 'description', e.target.value)}></textarea>
            </div>
          </div>
        ))}
        <button className="btn btn-outline" onClick={() => addItem('experience', { company: '', location: '', job_title: '', description: '', date_range: '' })}>+ Add Experience</button>
      </div>

      <div className="editor-section" style={{ animationDelay: '0.4s' }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
          <h2 className="section-title" style={{margin: 0}}>Projects</h2>
          <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '0.2rem 0.5rem', borderRadius: '4px'}}>
            📄 3–4 bullets/project budget
          </span>
        </div>
        {(resumeData.projects || []).map((proj, index) => (
          <div className="dynamic-card" key={index}>
            <div className="card-header">
              <label style={{margin:0}}>Project {index + 1}</label>
              <button className="btn btn-icon" onClick={() => removeItem('projects', index)}>🗑️</button>
            </div>
            <div className="form-group"><input type="text" className="input-field" placeholder="Project Name" value={proj.name || ''} onChange={(e) => handleArrayChange('projects', index, 'name', e.target.value)} /></div>
            <div className="form-group"><input type="text" className="input-field" placeholder="Tech Stack" value={proj.tech_stack || ''} onChange={(e) => handleArrayChange('projects', index, 'tech_stack', e.target.value)} /></div>
            <div className="form-group"><input type="text" className="input-field" placeholder="Link (e.g., GitHub)" value={proj.link || ''} onChange={(e) => handleArrayChange('projects', index, 'link', e.target.value)} /></div>
            <div className="form-group">
              <textarea className="input-field" placeholder="Project Description (bullet points)" value={proj.description || ''} onChange={(e) => handleArrayChange('projects', index, 'description', e.target.value)}></textarea>
            </div>
          </div>
        ))}
        <button className="btn btn-outline" onClick={() => addItem('projects', { name: '', tech_stack: '', link: '', description: '' })}>+ Add Project</button>
      </div>

      <div className="editor-section" style={{ animationDelay: '0.5s' }}>
        <h2 className="section-title">Education</h2>
        {(resumeData.education || []).map((edu, index) => (
          <div className="dynamic-card" key={index}>
            <div className="card-header">
              <label style={{margin:0}}>Education {index + 1}</label>
              <button className="btn btn-icon" onClick={() => removeItem('education', index)}>🗑️</button>
            </div>
            <div className="form-group"><input type="text" className="input-field" placeholder="Degree" value={edu.degree || ''} onChange={(e) => handleArrayChange('education', index, 'degree', e.target.value)} /></div>
            <div className="form-group"><input type="text" className="input-field" placeholder="Institution" value={edu.institution || ''} onChange={(e) => handleArrayChange('education', index, 'institution', e.target.value)} /></div>
            <div className="form-group"><input type="text" className="input-field" placeholder="Date Range" value={edu.date_range || ''} onChange={(e) => handleArrayChange('education', index, 'date_range', e.target.value)} /></div>
            <div className="form-group"><input type="text" className="input-field" placeholder="GPA (Optional)" value={edu.gpa || ''} onChange={(e) => handleArrayChange('education', index, 'gpa', e.target.value)} /></div>
          </div>
        ))}
        <button className="btn btn-outline" onClick={() => addItem('education', { degree: '', institution: '', date_range: '', gpa: '' })}>+ Add Education</button>
      </div>

      <div className="editor-section" style={{ animationDelay: '0.6s' }}>
        <h2 className="section-title">Additional Info</h2>
        <div className="form-group">
          <label>Certifications & Training</label>
          <textarea name="certifications" className="input-field" value={resumeData.certifications || ''} onChange={handleChange}></textarea>
        </div>
        <div className="form-group">
          <label>Key Achievements & Highlights</label>
          <textarea name="achievements" className="input-field" value={resumeData.achievements || ''} onChange={handleChange}></textarea>
        </div>
      </div>
      
    </section>
  );
}

export default Editor;
