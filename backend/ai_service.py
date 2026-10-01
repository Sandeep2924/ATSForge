import os
import json
import re
from google import genai
from google.genai import types
from models import ResumeData
from dotenv import load_dotenv

load_dotenv()

# Initialize official Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODELS_TO_TRY = ["gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemini-3.7-flash", "gemini-3.8-flash"]

def _generate_with_retry(prompt: str, temperature: float = 0.1) -> str:
    """Calls Gemini with primary model and falls back automatically if needed."""
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        temperature=temperature,
    )
    
    last_err = None
    for model_name in MODELS_TO_TRY:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )
            if response and response.text:
                return response.text
        except Exception as e:
            last_err = e
            print(f"Model {model_name} failed: {e}")
            continue
            
    raise RuntimeError(f"All configured Gemini models failed. Last error: {last_err}")

def _clean_json_response(text: str) -> dict:
    """Strips markdown code fences and safely parses JSON."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)

def optimize_resume_with_ai(resume: ResumeData) -> ResumeData:
    """Uses Agentic AI to tailor skills, summary, and experience/project bullets to target JD."""
    if not resume.target_job_description:
        return resume
        
    system_prompt = (
        "You are an elite ATS resume writer and executive career coach. "
        "Your goal is to tailor the candidate's resume so it achieves a 95+ match score against the Target Job Description.\n"
        "OPTIMIZATION STRATEGY & STRICT CONSTRAINTS:\n"
        "1. SINGLE-PAGE BULLET BUDGET: Limit each experience role and project to 3-4 high-impact bullet points maximum. Never exceed 4 bullets to prevent 2nd page spillover.\n"
        "2. In 'professional_summary': Craft a compelling 3-4 sentence summary seamlessly integrating the job's core title, domain, and primary skills.\n"
        "3. In 'technical_skills': Naturally infuse high-value keywords and required tools from the job description without hallucinating unverified technologies.\n"
        "4. In 'experience': Rewrite every role's bullet points using strong action verbs (Engineered, Architected, Spearheaded, Optimized) and quantifiable metrics (%, $, latency, throughput, scale). DO NOT modify company names, dates, or titles.\n"
        "5. In 'projects': Rewrite project bullet points highlighting relevant technologies, system architecture, and measurable outcomes. DO NOT modify project names.\n"
        "6. STRICT ZERO-HALLUCINATION: Preserve truthful relevance without fabricating degrees, employers, or unverified skills.\n\n"
        "Output strictly as a JSON object matching this schema:\n"
        "{\n"
        '  "professional_summary": "string",\n'
        '  "technical_skills": "string",\n'
        '  "experience": [{"company": "string", "description": "string"}],\n'
        '  "projects": [{"name": "string", "description": "string"}]\n'
        "}"
    )
    
    user_prompt = f"Target Job Description:\n{resume.target_job_description}\n\n"
    user_prompt += f"Current Summary:\n{resume.professional_summary}\n\n"
    user_prompt += f"Current Skills:\n{resume.technical_skills}\n\n"
    
    user_prompt += "Current Experience:\n"
    for exp in resume.experience:
        user_prompt += f"- Company: {exp.company}, Title: {exp.job_title}\n  Description: {exp.description}\n\n"
        
    user_prompt += "Current Projects:\n"
    for proj in resume.projects:
        user_prompt += f"- Project: {proj.name}\n  Description: {proj.description}\n\n"
        
    try:
        raw_response = _generate_with_retry(system_prompt + "\n\n" + user_prompt, temperature=0.3)
        result_json = _clean_json_response(raw_response)
        
        if "professional_summary" in result_json:
            resume.professional_summary = result_json["professional_summary"]
            
        if "technical_skills" in result_json:
            resume.technical_skills = result_json["technical_skills"]
            
        optimized_experiences = result_json.get("experience", [])
        for i, new_exp in enumerate(optimized_experiences):
            if i < len(resume.experience):
                resume.experience[i].description = new_exp.get("description", resume.experience[i].description).strip()
                
        optimized_projects = result_json.get("projects", [])
        for i, new_proj in enumerate(optimized_projects):
            if i < len(resume.projects):
                resume.projects[i].description = new_proj.get("description", resume.projects[i].description).strip()
                
    except Exception as e:
        print(f"Error optimizing resume: {e}")
        
    return resume

def tailor_skills_with_ai(resume: ResumeData, target_jd: str = None) -> dict:
    """Extracts core tech requirements from JD, reorders skill categories by domain relevance,
    and places exact verified skill matches first, strictly with ZERO hallucination.
    """
    jd = target_jd or resume.target_job_description
    if not jd:
        return {
            "status": "error",
            "message": "No Target Job Description provided to perform skill tailoring.",
            "technical_skills": resume.technical_skills
        }
        
    verified_context = f"Candidate Stated Skills:\n{resume.technical_skills}\n\n"
    verified_context += "Candidate Projects & Technologies:\n"
    for p in resume.projects:
        verified_context += f"- {p.name}: {p.tech_stack} | Description: {p.description}\n"
    for e in resume.experience:
        verified_context += f"- {e.job_title} at {e.company}: {e.description}\n"
        
    system_prompt = (
        "You are a strict technical recruiter and ATS skill taxonomist.\n"
        "MISSION: Reorder and highlight the candidate's verified skills to match the Target Job Description.\n\n"
        "STRICT ZERO-HALLUCINATION POLICY:\n"
        "1. You are strictly FORBIDDEN from fabricating, inventing, or assuming technologies, languages, cloud tools, or libraries that the candidate has not listed in the verified context.\n"
        "2. Only extract and reorder skills that the candidate legitimately knows or used in their projects.\n\n"
        "DYNAMIC REORDERING RULES:\n"
        "1. Semantic Role Classification: Determine the primary target role (e.g., DevOps Engineer, AI/ML Engineer, Full-Stack Developer, Backend Engineer, Data Engineer, Frontend Developer).\n"
        "2. Category Priority Reordering: Elevate the most critical category to row 1.\n"
        "   - For DevOps: 'Cloud & Infrastructure' or 'DevOps & Containers' MUST be row 1.\n"
        "   - For AI/ML: 'AI & Machine Learning' or 'NLP & LLMs' MUST be row 1.\n"
        "   - For Backend: 'Languages' or 'Backend & APIs' MUST be row 1.\n"
        "   - For Frontend: 'Frontend & UI Frameworks' MUST be row 1.\n"
        "3. Exact Match Placement: Within each category row, place exact keyword matches from the JD FIRST in the list.\n\n"
        "Output strictly as a JSON object matching this schema:\n"
        "{\n"
        '  "role_category": "string",\n'
        '  "elevated_categories": ["string"],\n'
        '  "matched_skills": ["string"],\n'
        '  "categories": [\n'
        '    {"category_name": "string", "skills": ["string"]}\n'
        '  ]\n'
        "}"
    )
    
    user_prompt = f"Target Job Description:\n{jd}\n\nCandidate Verified Profile:\n{verified_context}"
    
    try:
        raw_response = _generate_with_retry(system_prompt + "\n\n" + user_prompt, temperature=0.1)
        result = _clean_json_response(raw_response)
        
        categories = result.get("categories", [])
        formatted_lines = []
        for cat in categories:
            c_name = cat.get("category_name", "").strip()
            skills = cat.get("skills", [])
            if c_name and skills:
                formatted_lines.append(f"{c_name}: {', '.join(skills)}")
                
        tailored_text = "\n".join(formatted_lines) if formatted_lines else resume.technical_skills
        
        return {
            "status": "success",
            "role_category": result.get("role_category", "Software Engineering"),
            "elevated_categories": result.get("elevated_categories", []),
            "matched_skills": result.get("matched_skills", []),
            "technical_skills": tailored_text
        }
    except Exception as e:
        print(f"Error in dynamic skill tailoring: {e}")
        return {
            "status": "error",
            "message": str(e),
            "technical_skills": resume.technical_skills
        }

def calculate_ats_score(resume: ResumeData) -> dict:
    """Calculates an accurate, transparent ATS score out of 100 with sub-scores, matched keywords, missing keywords, and actionable recommendations."""
    if not resume.target_job_description:
        return {
            "score": 0,
            "sub_scores": {
                "keyword_match": 0,
                "quantifiable_impact": 0,
                "experience_relevance": 0,
                "completeness": 0
            },
            "matched_keywords": [],
            "missing_keywords": [],
            "feedback": ["Please paste a Target Job Description in the editor to evaluate your ATS match score."]
        }
        
    system_prompt = (
        "You are an enterprise-grade Applicant Tracking System (ATS) parsing engine and talent acquisition auditor. "
        "Evaluate the candidate's resume comprehensively against the target job description across four objective dimensions:\n"
        "1. 'keyword_match' (0-100): Exact and semantic match of required and preferred technical skills, tools, frameworks, and domain concepts.\n"
        "2. 'quantifiable_impact' (0-100): Proportion of experience and project bullets that demonstrate measurable outcomes (%, numbers, $, volume, speed).\n"
        "3. 'experience_relevance' (0-100): Relevance of the candidate's past roles, responsibilities, projects, and tech stack to the job requirements.\n"
        "4. 'completeness' (0-100): Structural completeness including contact information, clear summary, education, skills, and professional formatting.\n\n"
        "Overall 'score' (0-100) MUST be calculated as:\n"
        "score = round(0.40 * keyword_match + 0.25 * quantifiable_impact + 0.25 * experience_relevance + 0.10 * completeness)\n\n"
        "Also extract:\n"
        "- 'matched_keywords': Array of key technical skills and qualifications from the JD that ARE found in the resume.\n"
        "- 'missing_keywords': Array of critical skills, tools, and keywords demanded by the JD that are MISSING or weakly represented in the resume.\n"
        "- 'feedback': Array of 3-4 specific, high-priority, actionable tips to improve this resume for this exact role.\n\n"
        "Output STRICTLY as a JSON object matching this schema:\n"
        "{\n"
        '  "score": int,\n'
        '  "sub_scores": {\n'
        '    "keyword_match": int,\n'
        '    "quantifiable_impact": int,\n'
        '    "experience_relevance": int,\n'
        '    "completeness": int\n'
        '  },\n'
        '  "matched_keywords": ["string"],\n'
        '  "missing_keywords": ["string"],\n'
        '  "feedback": ["string"]\n'
        "}"
    )
    
    # Comprehensive prompt including all resume components
    user_prompt = f"Target Job Description:\n{resume.target_job_description}\n\n"
    user_prompt += f"Full Name: {resume.full_name}\n"
    user_prompt += f"Contact Info: {resume.contact_info}\n"
    user_prompt += f"Professional Summary: {resume.professional_summary}\n"
    user_prompt += f"Technical Skills: {resume.technical_skills}\n\n"
    
    user_prompt += "Experience:\n"
    if resume.experience:
        for exp in resume.experience:
            user_prompt += f"- Title: {exp.job_title} | Company: {exp.company} | Dates: {exp.date_range} | Location: {exp.location}\n  Bullets: {exp.description}\n\n"
    else:
        user_prompt += "None listed\n\n"
        
    user_prompt += "Projects:\n"
    if resume.projects:
        for proj in resume.projects:
            user_prompt += f"- Project: {proj.name} | Tech: {proj.tech_stack} | Link: {proj.link}\n  Bullets: {proj.description}\n\n"
    else:
        user_prompt += "None listed\n\n"
        
    user_prompt += "Education:\n"
    if resume.education:
        for edu in resume.education:
            user_prompt += f"- Degree: {edu.degree} | School: {edu.institution} | Dates: {edu.date_range} | GPA: {edu.gpa}\n"
    else:
        user_prompt += "None listed\n\n"
        
    if resume.certifications:
        user_prompt += f"\nCertifications: {resume.certifications}\n"
    if resume.achievements:
        user_prompt += f"Achievements: {resume.achievements}\n"
        
    try:
        raw_response = _generate_with_retry(system_prompt + "\n\n" + user_prompt, temperature=0.1)
        result = _clean_json_response(raw_response)
        
        # Ensure fallback defaults if LLM omitted subkeys
        if "score" not in result:
            result["score"] = 50
        if "sub_scores" not in result:
            result["sub_scores"] = {
                "keyword_match": result.get("score", 50),
                "quantifiable_impact": 50,
                "experience_relevance": 50,
                "completeness": 80
            }
        if "matched_keywords" not in result:
            result["matched_keywords"] = []
        if "missing_keywords" not in result:
            result["missing_keywords"] = []
        if "feedback" not in result:
            result["feedback"] = ["Optimize your bullet points to match the target job description."]
            
        return result
    except Exception as e:
        print(f"Error calculating ATS score: {e}")
        return {
            "score": 50,
            "sub_scores": {
                "keyword_match": 50,
                "quantifiable_impact": 50,
                "experience_relevance": 50,
                "completeness": 50
            },
            "matched_keywords": [],
            "missing_keywords": [],
            "feedback": ["Failed to calculate ATS score. Please check your Gemini API key or try again."]
        }

def parse_resume_from_text(raw_text: str) -> dict:
    """Faithfully parses raw text from a PDF or DOCX into structured ResumeData JSON.
    Preserves all user details, experiences, bullets, and projects accurately without loss.
    """
    system_prompt = (
        "You are an expert AI resume parser. Your job is to extract all information from the resume text accurately and losslessly into the JSON schema.\n"
        "CRITICAL RULES:\n"
        "1. PRESERVE ALL EXPERIENCES, PROJECTS, AND EDUCATION. Do NOT truncate, skip, or aggressively summarize.\n"
        "2. Keep all bullet points, technologies, links, dates, and metrics as written in the resume.\n"
        "3. In 'experience' and 'projects', preserve multiple bullet points as newline-separated strings in 'description'.\n"
        "4. Extract technical skills comprehensively into categories (Languages, Frameworks, Tools, etc.) if present.\n"
        "5. If a section is missing from the resume, leave it as an empty string/list.\n"
        "Return STRICTLY a JSON object matching this schema:\n"
        "{\n"
        '  "full_name": "string",\n'
        '  "contact_info": "string",\n'
        '  "professional_summary": "string",\n'
        '  "technical_skills": "string",\n'
        '  "experience": [{"company": "string", "location": "string", "job_title": "string", "date_range": "string", "description": "string"}],\n'
        '  "projects": [{"name": "string", "tech_stack": "string", "link": "string", "description": "string"}],\n'
        '  "education": [{"degree": "string", "institution": "string", "date_range": "string", "gpa": "string"}],\n'
        '  "certifications": "string",\n'
        '  "achievements": "string"\n'
        "}"
    )
    
    user_prompt = f"Raw Resume Text to Parse:\n\n{raw_text[:20000]}"
    
    try:
        raw_response = _generate_with_retry(system_prompt + "\n\n" + user_prompt, temperature=0.0)
        return _clean_json_response(raw_response)
    except Exception as e:
        print(f"Error parsing uploaded resume: {e}")
        return {}
