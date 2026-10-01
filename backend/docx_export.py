import re
from io import BytesIO
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml.shared import OxmlElement
from docx.oxml.ns import qn
from models import ResumeData

def add_bottom_border(paragraph):
    p = paragraph._p
    pPr = p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '4')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), '000000')
    pBdr.append(bottom)
    pPr.append(pBdr)

def generate_resume_docx(resume: ResumeData) -> BytesIO:
    doc = Document()
    
    # --- PAGE SETUP ---
    for section in doc.sections:
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)
        section.top_margin = Inches(0.4)
        section.bottom_margin = Inches(0.4)
        section.left_margin = Inches(0.5)
        section.right_margin = Inches(0.5)
    
    # --- STYLES ---
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = Pt(10.5)
    style.paragraph_format.space_after = Pt(0)
    style.paragraph_format.space_before = Pt(0)
    style.paragraph_format.line_spacing = 1.15

    list_style = doc.styles['List Bullet']
    list_style.font.name = 'Calibri'
    list_style.font.size = Pt(10.5)
    list_style.paragraph_format.space_after = Pt(0)
    list_style.paragraph_format.space_before = Pt(0)
    list_style.paragraph_format.line_spacing = 1.15
    list_style.paragraph_format.left_indent = Inches(0.25)
    
    def add_split_paragraph(left_text_bold, left_text_normal, right_text):
        p = doc.add_paragraph()
        tab_stops = p.paragraph_format.tab_stops
        # 8.5" width - 1" margins = 7.5"
        tab_stops.add_tab_stop(Inches(7.5), WD_TAB_ALIGNMENT.RIGHT)
            
        if left_text_bold:
            p.add_run(left_text_bold).bold = True
        if left_text_normal:
            p.add_run(left_text_normal)
            
        if right_text:
            p.add_run(f"\t{right_text}")
        return p

    def add_section_header(title: str):
        p = doc.add_paragraph()
        run = p.add_run(title.upper())
        run.bold = True
        run.font.size = Pt(11)
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        add_bottom_border(p)

    def add_bullets(description: str):
        last_p = None
        if description:
            for line in description.split('\n'):
                if line.strip():
                    clean_line = re.sub(r'^[\s\u2022\u00B7\u25E6\u2043\u2219\u25AA\u25AB\u25CF\u25CB\u2013\u2014\-\*\.]+\s*', '', line.strip()).strip()
                    if clean_line:
                        last_p = doc.add_paragraph(clean_line, style='List Bullet')
        return last_p

    # --- HEADER ---
    name_para = doc.add_paragraph()
    name_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    name_run = name_para.add_run(resume.full_name.upper() if resume.full_name else "")
    name_run.bold = True
    name_run.font.size = Pt(16)
    name_para.paragraph_format.space_after = Pt(2)
    
    contact_para = doc.add_paragraph()
    contact_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    contact_para.add_run(resume.contact_info if resume.contact_info else "")
    contact_para.paragraph_format.space_after = Pt(4)
    
    # --- PROFESSIONAL SUMMARY ---
    if resume.professional_summary:
        add_section_header("PROFESSIONAL SUMMARY")
        p = doc.add_paragraph(resume.professional_summary)
        p.paragraph_format.space_after = Pt(4)
        
    # --- TECHNICAL SKILLS ---
    if resume.technical_skills:
        add_section_header("TECHNICAL SKILLS")
        skills_lines = [line.strip() for line in resume.technical_skills.split('\n') if line.strip()]
        for i, line in enumerate(skills_lines):
            p = doc.add_paragraph(line)
            if i == len(skills_lines) - 1:
                p.paragraph_format.space_after = Pt(4)
        
    # --- EXPERIENCE ---
    if resume.experience:
        add_section_header("PROFESSIONAL EXPERIENCE")
        for i, exp in enumerate(resume.experience):
            add_split_paragraph(exp.job_title, "", exp.date_range)
            
            p2 = doc.add_paragraph()
            p2.add_run(exp.company).bold = True
            if exp.location:
                p2.add_run(f", {exp.location}").italic = True
            
            last_bullet = add_bullets(exp.description)
            if last_bullet and i < len(resume.experience) - 1:
                last_bullet.paragraph_format.space_after = Pt(8)
            elif not last_bullet and i < len(resume.experience) - 1:
                p2.paragraph_format.space_after = Pt(8)

    # --- PROJECTS ---
    if resume.projects:
        add_section_header("PROJECTS")
        for i, proj in enumerate(resume.projects):
            left_normal = f" | {proj.tech_stack}" if proj.tech_stack else ""
            add_split_paragraph(proj.name, left_normal, proj.link)
            
            last_bullet = add_bullets(proj.description)
            if last_bullet and i < len(resume.projects) - 1:
                last_bullet.paragraph_format.space_after = Pt(8)
            elif not last_bullet and i < len(resume.projects) - 1:
                pass

    # --- EDUCATION ---
    if resume.education:
        add_section_header("EDUCATION")
        for i, edu in enumerate(resume.education):
            deg_inst = f"{edu.degree} — {edu.institution}" if edu.institution else edu.degree
            right_side = edu.date_range or ""
            if edu.gpa:
                right_side = f"{right_side} | GPA: {edu.gpa}" if right_side else f"GPA: {edu.gpa}"
            p = add_split_paragraph(deg_inst, "", right_side)
            p.paragraph_format.space_after = Pt(2)

    # --- CERTIFICATIONS & TRAINING ---
    if resume.certifications:
        add_section_header("CERTIFICATIONS & TRAINING")
        cert_items = [
            re.sub(r'^[\s\u2022\u00B7\u25E6\u2043\u2219\u25AA\u25AB\u25CF\u25CB\u2013\u2014\-\*\.]+\s*', '', c.strip()).strip()
            for c in re.split(r'[\n|•·]+', resume.certifications)
            if c.strip()
        ]
        if cert_items:
            # Join certifications with middle dot for ultra-compact single-line or two-line fit
            cert_text = "   •   ".join(cert_items)
            p = doc.add_paragraph(cert_text)
            p.paragraph_format.space_after = Pt(3)

    # --- KEY ACHIEVEMENTS & HIGHLIGHTS ---
    if resume.achievements:
        add_section_header("KEY ACHIEVEMENTS & HIGHLIGHTS")
        last_bullet = add_bullets(resume.achievements)
        if last_bullet:
            last_bullet.paragraph_format.space_after = Pt(4)

    # Save to memory stream
    file_stream = BytesIO()
    doc.save(file_stream)
    file_stream.seek(0)
    
    return file_stream
