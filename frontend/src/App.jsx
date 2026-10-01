import React, { useState } from 'react';
import './index.css';
import Editor from './components/Editor';
import Preview from './components/Preview';

function App() {
  const [isUploading, setIsUploading] = useState(false);
  const [resumeData, setResumeData] = useState({
    full_name: 'ALEX MORGAN',
    contact_info: '+1 (555) 234-5678 | alex.morgan@email.com | linkedin.com/in/alex-morgan | San Francisco, CA',
    professional_summary: 'Results-driven Full-Stack & AI Software Engineer with 4+ years of experience designing scalable web architectures and high-performance cloud applications. Proven track record in orchestrating distributed microservices, building real-time data pipelines, and optimizing LLM-powered systems for production reliability.',
    technical_skills: 'Programming Languages: Python, TypeScript, JavaScript, Go, SQL\nFrontend & UI: React.js, Next.js, Tailwind CSS, Redux, WebSockets\nBackend & Cloud: Node.js, FastAPI, PostgreSQL, Redis, Docker, AWS (ECS, S3, Lambda), CI/CD\nAI & Machine Learning: PyTorch, Hugging Face, LangChain, RAG Architectures, Vector Databases',
    experience: [
      {
        company: 'CloudScale Technologies',
        location: 'San Francisco, CA',
        job_title: 'Full-Stack Software Engineer',
        date_range: '2022 – Present',
        description: 'Architected an event-driven data streaming pipeline processing 2M+ daily events using FastAPI, Kafka, and PostgreSQL, reducing latency by 45%.\nEngineered a real-time collaborative analytics dashboard with React and WebSockets, supporting 10,000+ concurrent enterprise users.\nLed migration of monolithic backend services to containerized Docker microservices deployed on AWS ECS with automated CI/CD.'
      },
      {
        company: 'Apex Labs',
        location: 'New York, NY',
        job_title: 'Software Engineering Intern',
        date_range: '2021 – 2022',
        description: 'Built customer-facing web modules using Next.js and Tailwind CSS, increasing page load speed by 35%.\nImplemented automated test suites and end-to-end integration workflows achieving 92% code coverage.'
      }
    ],
    projects: [
      {
        name: 'PulseAI — Intelligent Search Engine',
        tech_stack: 'Next.js 14 • Python • FastAPI • PostgreSQL • Pinecone • OpenAI',
        link: 'github.com/alexmorgan/pulse-ai',
        description: 'Engineered an AI-powered semantic search engine utilizing hybrid retrieval (BM25 + dense embeddings) and Groq LLaMA-3.\nOptimized vector similarity querying and implemented chunk-level semantic caching, reducing API overhead by 50%.'
      },
      {
        name: 'OmniFlow — Distributed Task Orchestrator',
        tech_stack: 'Go • React • Redis • Docker • gRPC',
        link: 'github.com/alexmorgan/omniflow',
        description: 'Designed a high-throughput job queue and workflow scheduler handling 500+ tasks/sec with fault-tolerant workers and state persistence in Redis.'
      }
    ],
    education: [
      {
        degree: 'B.S. in Computer Science',
        institution: 'University of California, Berkeley',
        date_range: '2018 – 2022',
        gpa: '3.85 / 4.0'
      }
    ],
    certifications: 'AWS Certified Solutions Architect – Associate (2024) · Deep Learning Specialization — DeepLearning.AI (2023)',
    achievements: 'First Place Winner at Global Cloud Hackathon (out of 350+ international engineering teams).\nPublished research on Efficient Transformer Inference at ACM International Conference on Intelligent Computing (2023).',
    target_job_description: ''
  });

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
      a.download = `${resumeData.full_name.replace(/\s+/g, '_')}_Resume.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading docx:", error);
      alert("Failed to download document.");
    }
  };

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
      a.download = `${resumeData.full_name.replace(/\s+/g, '_') || 'Resume'}_Kyvernitis_LaTeX.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading LaTeX zip:", error);
      alert("Failed to download LaTeX package.");
    }
  };

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
        a.download = `${resumeData.full_name.replace(/\s+/g, '_') || 'Resume'}.tex`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to generate LaTeX.");
      }
    } catch (error) {
      console.error("Error downloading LaTeX .tex:", error);
      alert("Failed to download LaTeX file.");
    }
  };

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
      } else {
        alert("Could not parse resume.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Navbar / Header */}
      <header className="header">
        <div className="logo">ATSForge</div>
        <nav style={{display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap'}}>
          <label className="btn" style={{cursor: isUploading ? 'wait' : 'pointer', opacity: isUploading ? 0.7 : 1}}>
            {isUploading ? "Scanning Resume..." : "Upload Resume"}
            <input type="file" accept=".pdf,.docx" style={{display: 'none'}} onChange={handleUploadResume} disabled={isUploading} />
          </label>
          <button className="btn" onClick={handleDownloadDocx}>Download .docx</button>
          <button className="btn" onClick={handleDownloadLatexTex} title="Download pure LaTeX source file (.tex)">Download .tex</button>
          <button className="btn btn-primary" onClick={handleDownloadLatexZip} title="Download ready-to-compile Kyvernitis LaTeX package (.zip for Overleaf or local TeX)">
            ⚡ LaTeX (Kyvernitis .zip)
          </button>
        </nav>
      </header>

      {/* Main Workspace */}
      <main className="workspace">
        <Editor resumeData={resumeData} setResumeData={setResumeData} />
        <Preview resumeData={resumeData} />
      </main>
    </div>
  );
}

export default App;
