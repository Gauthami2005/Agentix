import io
import re
import os
import json
import requests
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pypdf import PdfReader
from planner import llm

router = APIRouter(prefix="/api/resume", tags=["resume"])

CORE_COMPETENCIES = {
    "react", "typescript", "javascript", "nodejs", "node", "python", "mongodb", "aws", 
    "docker", "kubernetes", "golang", "java", "c++", "rust", "mysql", "postgresql", 
    "sqlite", "html", "css", "vue", "angular", "express", "fastapi", "django", "flask", 
    "git", "linux", "cloud", "serverless", "graphql", "redis", "jenkins", "cicd", "terraform"
}

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    if filename.lower().endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text
        except Exception as e:
            print(f"Error extracting PDF: {e}")
            
    try:
        return file_bytes.decode("utf-8", errors="ignore")
    except Exception:
        return ""

def compute_keyword_score(resume_text: str, job_desc: str) -> tuple[float, list[str], list[str]]:
    job_desc_clean = re.sub(r'[^\w\s+-]', ' ', job_desc.lower())
    resume_clean = re.sub(r'[^\w\s+-]', ' ', resume_text.lower())
    
    job_desc_words = set(re.findall(r'\b[a-zA-Z0-9+-]+\b', job_desc_clean))
    matched_job_keywords = job_desc_words.intersection(CORE_COMPETENCIES)
    
    if not matched_job_keywords:
        STOPWORDS = {"the", "and", "a", "of", "to", "in", "is", "for", "with", "on", "as", "by", "at", "an", "be", "this", "that", "from", "are", "we", "our", "you"}
        matched_job_keywords = {w for w in job_desc_words if w not in STOPWORDS and len(w) > 2}
        
    if not matched_job_keywords:
        return 100.0, [], []
        
    matched_keywords = []
    missing_keywords = []
    
    for kw in sorted(list(matched_job_keywords)):
        pattern = r'\b' + re.escape(kw) + r'\b'
        if re.search(pattern, resume_clean) or (not kw.isalnum() and kw in resume_clean):
            matched_keywords.append(kw)
        else:
            missing_keywords.append(kw)
            
    intersection_pct = (len(matched_keywords) / len(matched_job_keywords)) * 100.0 if matched_job_keywords else 100.0
    return intersection_pct, matched_keywords, missing_keywords

def compute_structural_score(resume_text: str) -> tuple[float, str]:
    sections = {
        "experience": ["experience", "employment", "work history", "professional experience"],
        "education": ["education", "academic", "university", "college"],
        "skills": ["skills", "technical skills", "skills & core competencies", "technologies"],
        "projects": ["projects", "personal projects", "key projects", "academic projects"]
    }
    
    resume_text_lower = resume_text.lower()
    missing_sections_count = 0
    
    for sec_key, sec_aliases in sections.items():
        found = False
        for alias in sec_aliases:
            if alias in resume_text_lower:
                found = True
                break
        if not found:
            missing_sections_count += 1
            
    structural_score = max(0.0, 100.0 - (missing_sections_count * 25.0))
    
    formatting_critique = ""
    tabular_matches = re.findall(r'\s{4,}', resume_text)
    bar_matches = re.findall(r'\|', resume_text)
    
    if len(tabular_matches) > 15 or len(bar_matches) > 10:
        formatting_critique = "Warning: Multi-column structure or excessive tabular layout fragments detected. This might disrupt parser readability."
    else:
        formatting_critique = "Structure looks solid. Single column layout preferred for maximum ATS compatibility."
        
    return structural_score, formatting_critique

@router.post("/ats-score")
async def ats_score(
    resume: UploadFile = File(...),
    jobDescription: str = Form(...)
):
    try:
        file_bytes = await resume.read()
        resume_text = extract_text_from_file(file_bytes, resume.filename)
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the resume file.")
            
        keyword_pct, math_matched, math_missing = compute_keyword_score(resume_text, jobDescription)
        
        structural_score, formatting_critique = compute_structural_score(resume_text)
        
        prompt = f"""
        Act as an elite corporate technical recruiter scanner. Evaluate the quality of the candidate's experience descriptions. Look for quantifiable metrics, action verbs, and core technical project execution depth.
        
        Job Description:
        {jobDescription}
        
        Resume Text:
        {resume_text}
        
        Output a semantic alignment score between 0 and 100, a string list of matchedKeywords, a string list of missingKeywords, and a clean array of actionableFixes.
        
        You MUST respond with a valid JSON object matching the following schema and nothing else:
        {{
          "semanticScore": 85,
          "matchedKeywords": ["react", "typescript"],
          "missingKeywords": ["aws", "docker"],
          "actionableFixes": [
            "Include quantifiable metrics showing the impact of React optimization.",
            "Add Docker containerization experience if applicable to the Projects section."
          ]
        }}
        
        Do not add any markdown blocks, introductory or concluding text. Output only the pure JSON.
        """
        
        llm_semantic_score = 70.0
        actionable_fixes = []
        
        try:
            response = llm.invoke(prompt)
            content = response.content.strip()
            if "```" in content:
                match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
                if match:
                    content = match.group(1).strip()
            data = json.loads(content)
            llm_semantic_score = float(data.get("semanticScore", 70.0))
            actionable_fixes = data.get("actionableFixes", [])
        except Exception as e:
            print(f"Error calling LLM for ATS scoring: {e}")
            
        final_score = int(round((keyword_pct * 0.50) + (structural_score * 0.20) + (llm_semantic_score * 0.30)))
        
        return {
            "finalScore": final_score,
            "score": final_score,
            "keywordMatchDensity": int(round(keyword_pct)),
            "structuralLayoutIntegrity": int(round(structural_score)),
            "semanticRecruiterImpact": int(round(llm_semantic_score)),
            "matchedKeywords": math_matched,
            "missingKeywords": math_missing,
            "formattingCritique": formatting_critique,
            "actionableFixes": actionable_fixes
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ATS Scoring pipeline error: {str(e)}")
