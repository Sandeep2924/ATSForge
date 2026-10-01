# ⚡ ATSForge — AI-Powered ATS Resume Builder & Optimizer

> **Precision-engineered ATS resumes with guaranteed strict single-page layout, 4-dimensional scoring, semantic skill tailoring, and production-grade Kyvernitis LaTeX & Word exports.**

---

## ✨ Features

- **🎯 4-Dimensional ATS Scoring:** Real-time evaluation assessing Keywords (40%), Quantifiable Impact (25%), Role Relevance (25%), and Structural Completeness (10%).
- **📐 Guaranteed Strict 1-Page Layout:** Dynamic bullet budgeting and auto-fit scale engine that mathematically guarantees content fits on an 8.5" × 11" page without overflow.
- **🛡️ Zero-Hallucination Skill Tailoring:** Semantic keyword extraction from Job Descriptions that elevates matching verified skills without fabricating credentials.
- **📄 Production-Grade LaTeX Export:** Built on the executive `kyvernitis-resume.cls` template with active clickable hyperlinks, reserved character escaping, and downloadable ready-to-compile `.zip` bundles for Overleaf.
- **📝 Single-Page Word (.docx) Export:** Professional ATS-compliant Word documents with clean bullet points and custom tab stops.
- **🔍 Lossless Resume Ingestion:** Upload PDF or DOCX resumes with layout-aware text extraction and table deduplication.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Vanilla CSS Modules, Vitest, Oxlint
- **Backend:** FastAPI, Python 3.11, Uvicorn, Pydantic
- **AI Engine:** Google Gemini (`gemini-flash-lite-latest`, `gemini-3.1-flash-lite`, `gemini-3.7-flash`)
- **Document Processing:** `pdfplumber`, `python-docx`, `pypdfium2`
- **Typesetting:** `kyvernitis-resume.cls` (XeLaTeX / pdfLaTeX)

---

## 🚀 Quickstart

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Gemini API Key ([Get one free from Google AI Studio](https://aistudio.google.com/))

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and paste your GEMINI_API_KEY
```

Start the FastAPI server:
```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API runs at: `http://127.0.0.1:8000` (Docs: `http://127.0.0.1:8000/docs`)

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```
Frontend runs at: `http://localhost:3000`

---

## 🧪 Testing

```bash
# Run backend API test suite
cd backend
python run_tests.py

# Run frontend unit tests
cd frontend
npm run test

# Run frontend linter
npm run lint
```

---

## 📄 License

MIT License. Free to use for personal and commercial projects.
