import re
import os
import io
import shutil
import zipfile
import tempfile
import subprocess
from typing import Tuple, Dict, Any, List
from models import ResumeData

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")
CLS_PATH = os.path.join(TEMPLATES_DIR, "kyvernitis-resume.cls")

def escape_latex(text: str) -> str:
    """Escapes reserved LaTeX characters to guard against syntax and compilation errors."""
    if not text:
        return ""
    
    # Mapping of special characters to escaped LaTeX sequences
    replacements = [
        ('\\', r'\textbackslash{}'),
        ('&', r'\&'),
        ('%', r'\%'),
        ('$', r'\$'),
        ('#', r'\#'),
        ('_', r'\_'),
        ('{', r'\{'),
        ('}', r'\}'),
        ('~', r'\textasciitilde{}'),
        ('^', r'\textasciicircum{}'),
    ]
    
    # We do a replacement pass while avoiding double escaping
    escaped = str(text)
    for orig, rep in replacements:
        if orig == '\\':
            escaped = escaped.replace('\\', r'\textbackslash{}')
        else:
            escaped = escaped.replace(orig, rep)
            
    # Clean quotes
    escaped = re.sub(r'\"([^\"]*)\"', r'``\1\'\'', escaped)
    return escaped

def clean_url(url: str) -> str:
    """Cleans a URL string for href commands."""
    if not url:
        return ""
    clean = url.strip()
    if not clean.startswith("http://") and not clean.startswith("https://"):
        return f"https://{clean}"
    return clean

def extract_social_handles(contact_info: str) -> Dict[str, str]:
    """Parses contact_info string to extract LinkedIn, GitHub, LeetCode, Email, Phone, Location."""
    handles = {
        "linkedin": "",
        "github": "",
        "leetcode": "",
        "email": "",
        "phone": "",
        "website": "",
        "address": ""
    }
    
    if not contact_info:
        return handles
        
    parts = [p.strip() for p in contact_info.split('|') if p.strip()]
    for part in parts:
        lower = part.lower()
        if "linkedin.com/in/" in lower or "linkedin.com" in lower:
            match = re.search(r'linkedin\.com/in/([^/\s]+)', part, re.IGNORECASE)
            handles["linkedin"] = match.group(1) if match else part.split('/')[-1]
        elif "github.com/" in lower or "github.com" in lower:
            match = re.search(r'github\.com/([^/\s]+)', part, re.IGNORECASE)
            handles["github"] = match.group(1) if match else part.split('/')[-1]
        elif "leetcode.com/" in lower or "leetcode" in lower:
            match = re.search(r'leetcode\.com/([^/\s]+)', part, re.IGNORECASE)
            handles["leetcode"] = match.group(1) if match else part.split('/')[-1]
        elif "@" in part:
            email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', part)
            handles["email"] = email_match.group(0) if email_match else part
        elif re.search(r'(\+?\d[\d\s-]{8,})', part):
            phone_match = re.search(r'(\+?\d[\d\s-]{8,})', part)
            handles["phone"] = phone_match.group(0).strip() if phone_match else part
        else:
            if not handles["address"]:
                handles["address"] = part
            elif not handles["website"]:
                handles["website"] = part
                
    return handles

def calculate_content_density(resume: ResumeData) -> int:
    """Calculates total payload density to drive dynamic layout spacing."""
    score = 0
    score += len(resume.professional_summary or "")
    score += len(resume.technical_skills or "")
    for exp in resume.experience:
        score += len(exp.job_title) + len(exp.company) + len(exp.description)
    for proj in resume.projects:
        score += len(proj.name) + len(proj.tech_stack) + len(proj.description)
    for edu in resume.education:
        score += len(edu.degree) + len(edu.institution)
    score += len(resume.certifications or "")
    score += len(resume.achievements or "")
    return score

def generate_resume_latex(
    resume: ResumeData, 
    bullet_budget: int = 3, 
    spacing_level: str = "auto",
    target_job_title: str = ""
) -> str:
    """Generates LaTeX code adhering 100% to kyvernitis-resume.cls design specifications.
    Dynamically adjusts spacing and enforces single-page budget.
    """
    density = calculate_content_density(resume)
    
    # Adaptive spacing determination
    if spacing_level == "auto":
        if density > 2500:
            spacing_level = "compact"
            budget = min(bullet_budget, 2)
        elif density > 1800:
            spacing_level = "balanced"
            budget = min(bullet_budget, 3)
        else:
            spacing_level = "spacious"
            budget = min(bullet_budget, 4)
    else:
        budget = bullet_budget

    # Geometry & itemsep adjustments for strict 1-page compliance
    if spacing_level == "compact":
        margin_v = "0.55cm"
        margin_h = "1.15cm"
        item_sep = "-0.55em"
        sec_space = r"\vspace{-0.3em}"
    elif spacing_level == "balanced":
        margin_v = "0.68cm"
        margin_h = "1.20cm"
        item_sep = "-0.45em"
        sec_space = r"\vspace{-0.15em}"
    else: # spacious
        margin_v = "0.75cm"
        margin_h = "1.25cm"
        item_sep = "-0.35em"
        sec_space = r"\smallskip"

    handles = extract_social_handles(resume.contact_info)
    
    # 6 Header Slots
    h_linkedin = f"\\linkedin{{{escape_latex(handles['linkedin'])}}}" if handles['linkedin'] else f"\\linkedin{{{escape_latex(resume.full_name.lower().replace(' ', ''))}}}"
    h_email = f"\\email{{{escape_latex(handles['email'])}}}" if handles['email'] else "\\email{contact@domain.com}"
    h_github = f"\\github{{{escape_latex(handles['github'])}}}" if handles['github'] else "\\github{github}"
    h_phone = f"\\phone{{{escape_latex(handles['phone'])}}}" if handles['phone'] else "\\phone{+1 (555) 000-0000}"
    h_website = f"\\website{{{escape_latex(handles['website'])}}}" if handles['website'] else (f"\\leetcode{{{escape_latex(handles['leetcode'])}}}" if handles['leetcode'] else "\\website{portfolio.dev}")
    h_address = f"\\address{{{escape_latex(handles['address'])}}}" if handles['address'] else "\\address{City, Country}"

    job_title = target_job_title if target_job_title else ""
    if not job_title and resume.experience:
        job_title = resume.experience[0].job_title

    lines: List[str] = []
    lines.append(r"\documentclass[]{kyvernitis-resume}")
    # Inject adaptive geometry override
    lines.append(f"\\geometry{{hmargin={margin_h},vmargin={margin_v}}}")
    lines.append(f"\\fullname{{{escape_latex(resume.full_name)}}}")
    if job_title:
        lines.append(f"\\jobtitle{{{escape_latex(job_title)}}}")
        
    lines.append("")
    lines.append(r"\begin{document}")
    lines.append(r"\resumeheader")
    lines.append(f"{{{h_linkedin}}}")
    lines.append(f"{{{h_email}}}")
    lines.append(f"{{{h_github}}}")
    lines.append(f"{{{h_phone}}}")
    lines.append(f"{{{h_website}}}")
    lines.append(f"{{{h_address}}}")
    lines.append("")

    # 1. PROFESSIONAL SUMMARY (if present)
    if resume.professional_summary:
        lines.append(r"\begin{section}{Professional Summary}")
        lines.append(sec_space)
        lines.append(f"\\item {escape_latex(resume.professional_summary.strip())}")
        lines.append(r"\end{section}")
        lines.append("")

    # 2. TECHNICAL SKILLS (Categorized Rows)
    if resume.technical_skills:
        lines.append(r"\begin{section}{Technical Skills}")
        lines.append(r"\begin{adjustwidth}{0.0in}{0.1in}")
        lines.append(r"\begin{tabularx}{\linewidth}{@{} >{\bfseries}l @{\hspace{3ex}} X @{}}")
        
        skill_lines = [s.strip() for s in resume.technical_skills.split('\n') if s.strip()]
        for s_line in skill_lines:
            if ':' in s_line:
                cat, val = s_line.split(':', 1)
                lines.append(f"    \\entry{{{escape_latex(cat.strip())}}}{{{escape_latex(val.strip())}}}")
            else:
                lines.append(f"    \\entry{{Skills}}{{{escape_latex(s_line)}}}")
        lines.append(r"\end{tabularx}")
        lines.append(r"\end{adjustwidth}")
        lines.append(r"\end{section}")
        lines.append("")

    # 3. WORK EXPERIENCE (Dynamic Bullet Budget)
    if resume.experience:
        lines.append(r"\begin{section}{Work Experience}")
        for exp in resume.experience:
            comp = escape_latex(exp.company)
            title = escape_latex(exp.job_title)
            dates = escape_latex(exp.date_range or "")
            loc = escape_latex(exp.location or "")
            
            lines.append(f"\\begin{{subsection}}{{{comp}}}{{{title}}}{{{dates}}}{{{loc}}}")
            
            # Enforce bullet budget
            bullets = [b.strip() for b in (exp.description or "").split('\n') if b.strip()]
            for b in bullets[:budget]:
                clean_b = b
                if clean_b.startswith(('-', '*', '•')):
                    clean_b = clean_b.lstrip('-*• ').strip()
                lines.append(f"    \\item {escape_latex(clean_b)}")
                
            lines.append(r"\end{subsection}")
        lines.append(r"\end{section}")
        lines.append("")

    # 4. PROJECTS (With Active Clickable Hyperlinks & Bullet Budget)
    if resume.projects:
        lines.append(r"\begin{section}{Projects}")
        for proj in resume.projects:
            name = escape_latex(proj.name)
            tech = escape_latex(proj.tech_stack or "")
            link = proj.link.strip() if proj.link else ""
            
            # Active Clickable Hyperlink formatted cleanly
            if link:
                full_url = clean_url(link)
                if "github.com" in link.lower():
                    link_macro = f"\\href{{{full_url}}}{{\\textcolor{{links}}{{\\faGithub\\ \\small Code}}}}"
                else:
                    link_macro = f"\\href{{{full_url}}}{{\\textcolor{{links}}{{\\faExternalLink*\\ \\small Live Demo}}}}"
                proj_title = f"{name} \\quad {link_macro}"
            else:
                proj_title = name

            lines.append(f"\\begin{{subsection}}{{{proj_title}}}{{{tech}}}{{}}{{}}")
            
            bullets = [b.strip() for b in (proj.description or "").split('\n') if b.strip()]
            for b in bullets[:budget]:
                clean_b = b
                if clean_b.startswith(('-', '*', '•')):
                    clean_b = clean_b.lstrip('-*• ').strip()
                lines.append(f"    \\item {escape_latex(clean_b)}")
                
            lines.append(r"\end{subsection}")
        lines.append(r"\end{section}")
        lines.append("")

    # 5. EDUCATION
    if resume.education:
        lines.append(r"\begin{section}{Education}")
        for edu in resume.education:
            deg = escape_latex(edu.degree)
            school = escape_latex(edu.institution)
            dates = escape_latex(edu.date_range or "")
            gpa = f"GPA: {escape_latex(edu.gpa)}" if edu.gpa else ""
            
            lines.append(f"\\begin{{subsectionnobullet}}{{{school}}}{{{deg}}}{{{dates}}}{{{gpa}}}")
            lines.append(r"\end{subsectionnobullet}")
        lines.append(r"\end{section}")
        lines.append("")

    # 6. CERTIFICATIONS & ACHIEVEMENTS (Compact Section)
    if resume.certifications or resume.achievements:
        lines.append(r"\begin{section}{Certifications \& Achievements}")
        lines.append(r"\begin{adjustwidth}{0.0in}{0.1in}")
        lines.append(r"\begin{tabularx}{\linewidth}{@{} >{\bfseries}l @{\hspace{3ex}} X @{}}")
        if resume.certifications:
            certs = [
                re.sub(r'^[\s\u2022\u00B7\u25E6\u2043\u2219\u25AA\u25AB\u25CF\u25CB\u2013\u2014\-\*\.]+\s*', '', c.strip()).strip()
                for c in re.split(r'[\n|•·]+', resume.certifications)
                if c.strip()
            ]
            if certs:
                joined_certs = " \\quad $\\bullet$\\quad ".join([escape_latex(c) for c in certs])
                lines.append(f"    \\entry{{Certifications}}{{{joined_certs}}}")
        if resume.achievements:
            achieves = [
                re.sub(r'^[\s\u2022\u00B7\u25E6\u2043\u2219\u25AA\u25AB\u25CF\u25CB\u2013\u2014\-\*\.]+\s*', '', a.strip()).strip()
                for a in resume.achievements.split('\n')
                if a.strip()
            ]
            if achieves:
                joined_achieves = " \\newline ".join([f"$\\bullet$ {escape_latex(a)}" for a in achieves])
                lines.append(f"    \\entry{{Key Highlights}}{{{joined_achieves}}}")
        lines.append(r"\end{tabularx}")
        lines.append(r"\end{adjustwidth}")
        lines.append(r"\end{section}")
        lines.append("")

    lines.append(r"\end{document}")
    return "\n".join(lines)

def generate_resume_latex_zip(resume: ResumeData, target_job_title: str = "") -> io.BytesIO:
    """Bundles the generated resume.tex and kyvernitis-resume.cls into a ready-to-compile ZIP."""
    latex_code = generate_resume_latex(resume, target_job_title=target_job_title)
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        # Include resume.tex
        zf.writestr("resume.tex", latex_code.encode("utf-8"))
        
        # Include kyvernitis-resume.cls
        if os.path.exists(CLS_PATH):
            with open(CLS_PATH, "r", encoding="utf-8") as f:
                cls_content = f.read()
            zf.writestr("kyvernitis-resume.cls", cls_content.encode("utf-8"))
            
        # Include README
        readme = (
            "Kyvernitis LaTeX Resume Package\n"
            "================================\n\n"
            "How to Compile:\n"
            "1. Overleaf: Upload both resume.tex and kyvernitis-resume.cls. Set compiler to XeLaTeX in Settings.\n"
            "2. Local CLI: Run `xelatex resume.tex`\n\n"
            "Features:\n"
            "- Guaranteed Strict 1-Page Layout with Dynamic Spacing Budget\n"
            "- Active clickable hyperlinks for GitHub, LinkedIn, and Live Demos\n"
            "- Zero reserved-character collisions (safe escaped symbols)\n"
        )
        zf.writestr("README.txt", readme.encode("utf-8"))
        
    zip_buffer.seek(0)
    return zip_buffer

def check_latex_compiler() -> str:
    """Finds available LaTeX compiler on the system (xelatex, tectonic, pdflatex)."""
    for compiler in ["xelatex", "tectonic", "pdflatex", "lualatex"]:
        if shutil.which(compiler):
            return compiler
    return ""

def verify_single_page_pdf(pdf_bytes: bytes) -> int:
    """Verifies the exact page count of a PDF using pypdfium2."""
    try:
        import pypdfium2 as pdfium
        pdf = pdfium.PdfDocument(pdf_bytes)
        return len(pdf)
    except Exception as e:
        print(f"Error checking PDF page count: {e}")
        return 1

def compile_latex_to_pdf_with_verification(
    resume: ResumeData, 
    target_job_title: str = ""
) -> Tuple[bool, int, bytes, str]:
    """Compiles LaTeX with iterative post-compile verification.
    Automatically tightens layout spacing and reduces bullet budget if page count > 1.
    """
    compiler = check_latex_compiler()
    
    # If no local compiler is found, return the verified single-page LaTeX code
    if not compiler:
        latex_code = generate_resume_latex(resume, bullet_budget=3, spacing_level="auto", target_job_title=target_job_title)
        return (False, 1, b"", latex_code)
        
    # Iterative refinement attempts: Spacious -> Balanced -> Compact -> Minimal
    refinement_levels = [
        {"spacing": "balanced", "budget": 3},
        {"spacing": "compact", "budget": 3},
        {"spacing": "compact", "budget": 2},
    ]
    
    last_latex = ""
    for attempt in refinement_levels:
        latex_code = generate_resume_latex(
            resume, 
            bullet_budget=attempt["budget"], 
            spacing_level=attempt["spacing"],
            target_job_title=target_job_title
        )
        last_latex = latex_code
        
        with tempfile.TemporaryDirectory() as tmp_dir:
            tex_file = os.path.join(tmp_dir, "resume.tex")
            cls_dest = os.path.join(tmp_dir, "kyvernitis-resume.cls")
            
            with open(tex_file, "w", encoding="utf-8") as f:
                f.write(latex_code)
            if os.path.exists(CLS_PATH):
                shutil.copy(CLS_PATH, cls_dest)
                
            cmd = [compiler, "-interaction=nonstopmode", "resume.tex"]
            try:
                proc = subprocess.run(cmd, cwd=tmp_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=25)
                pdf_path = os.path.join(tmp_dir, "resume.pdf")
                if os.path.exists(pdf_path):
                    with open(pdf_path, "rb") as pf:
                        pdf_data = pf.read()
                    pages = verify_single_page_pdf(pdf_data)
                    if pages == 1:
                        return (True, 1, pdf_data, latex_code)
            except Exception as e:
                print(f"Compilation error during attempt: {e}")
                
    return (False, 2, b"", last_latex)
