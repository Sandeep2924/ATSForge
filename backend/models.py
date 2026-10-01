from pydantic import BaseModel, Field
from typing import List, Optional

class Experience(BaseModel):
    company: str
    location: Optional[str] = ""
    job_title: str
    date_range: Optional[str] = ""
    description: str

class Project(BaseModel):
    name: str
    tech_stack: str
    link: Optional[str] = ""
    description: str

class Education(BaseModel):
    degree: str
    institution: str
    date_range: Optional[str] = ""
    gpa: Optional[str] = ""

class ResumeData(BaseModel):
    full_name: str = ""
    contact_info: str = ""
    professional_summary: str = ""
    technical_skills: str = ""
    experience: List[Experience] = []
    projects: List[Project] = []
    education: List[Education] = []
    certifications: str = ""
    achievements: str = ""
    target_job_description: Optional[str] = None
