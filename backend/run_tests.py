from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

def run_tests():
    print("--- STARTING TESTS ---")
    
    print("\n1. Testing Root Endpoint (GET /)")
    response = client.get("/")
    assert response.status_code == 200
    print("Response:", response.json())
    print("SUCCESS: Root Endpoint Passed")

    payload = {
        "full_name": "Test User",
        "contact_info": "test@example.com",
        "professional_summary": "I am a basic developer.",
        "technical_skills": "Python",
        "experience": [],
        "projects": [],
        "education": [],
        "certifications": "",
        "achievements": "",
        "target_job_description": "We need a rockstar Senior Python Developer with 10 years of experience in AI."
    }

    print("\n2. Testing ATS Score Endpoint (POST /api/ats-score)")
    response = client.post("/api/ats-score", json=payload)
    assert response.status_code == 200
    print("Response:", response.json())
    print("SUCCESS: ATS Score Endpoint Passed")

    print("\n3. Testing Resume Optimization Endpoint (POST /api/optimize)")
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200
    print("Response:", response.json())
    print("SUCCESS: Optimize Endpoint Passed")
    
    print("\n4. Testing LaTeX Export Endpoint (POST /api/export-latex)")
    response = client.post("/api/export-latex", json=payload)
    assert response.status_code == 200
    latex_data = response.json()
    assert "latex" in latex_data
    assert r"\documentclass[]{kyvernitis-resume}" in latex_data["latex"]
    print("SUCCESS: LaTeX Export Endpoint Passed")

    print("\n5. Testing LaTeX ZIP Package Endpoint (POST /api/export-latex-zip)")
    response = client.post("/api/export-latex-zip", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    print("SUCCESS: LaTeX ZIP Package Passed")

    print("\n6. Testing Smart Skill Tailoring Endpoint (POST /api/tailor-skills)")
    response = client.post("/api/tailor-skills", json=payload)
    assert response.status_code == 200
    print("Response:", response.json())
    print("SUCCESS: Smart Skill Tailoring Passed")

    print("\n--- ALL API TESTS PASSED SUCCESSFULLY ---")

if __name__ == "__main__":
    run_tests()
