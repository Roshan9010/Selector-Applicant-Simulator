import PyPDF2
import docx
import os
import json
import csv
import urllib.request
import urllib.error
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

def extract_text_from_pdf(file_path):
    text = ""
    try:
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text()
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
    return text

def extract_text_from_docx(file_path):
    text = ""
    try:
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error reading DOCX {file_path}: {e}")
    return text

def extract_text_from_file(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    print(f"DEBUG: Extracting text from {file_path} (ext: {ext})")
    if ext == ".pdf":
        return [extract_text_from_pdf(file_path)]
    elif ext in [".docx", ".doc"]:
        return [extract_text_from_docx(file_path)]
    elif ext == ".csv":
        return extract_resumes_from_csv(file_path)
    elif ext in [".xlsx", ".xls"]:
        return extract_resumes_from_excel(file_path)
    elif ext == ".txt":
        return [extract_text_from_txt(file_path)]
    
    # Fallback: Try PDF then TXT if no extension or unknown
    print(f"DEBUG: Unknown extension '{ext}'. Trying PDF fallback...")
    pdf_text = extract_text_from_pdf(file_path)
    if pdf_text.strip():
        return [pdf_text]
    
    print(f"DEBUG: PDF fallback failed. Trying TXT fallback...")
    txt_text = extract_text_from_txt(file_path)
    if txt_text.strip():
        return [txt_text]

    return []

def extract_text_from_txt(file_path):
    for encoding in ['utf-8', 'latin-1', 'utf-8-sig']:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                return f.read()
        except:
            continue
    return ""

def extract_resumes_from_excel(file_path):
    resumes = []
    try:
        import pandas as pd
        # Read all sheets
        dict_df = pd.read_excel(file_path, sheet_name=None)
        possible_cols = ['Resume_str', 'Resume_html', 'Resume', 'resume', 'Resume_text', 'content', 'text']
        
        for sheet_name, df in dict_df.items():
            target_col = None
            category_col = None
            
            # Identify columns
            for col in df.columns:
                if col in possible_cols:
                    target_col = col
                if str(col).lower() == 'category':
                    category_col = col
            
            if not target_col:
                # Fallback to any column with 'resume'
                for col in df.columns:
                    if 'resume' in str(col).lower():
                        target_col = col
                        break
            
            if not target_col:
                # If no clear resume column, skip or use the last one?
                # Let's use the last one if it has long text
                target_col = df.columns[-1]

            print(f"DEBUG: Excel Sheet '{sheet_name}' -> TargetCol: {target_col}")
            
            for _, row in df.iterrows():
                content = str(row[target_col]) if not pd.isna(row[target_col]) else ""
                if category_col and not pd.isna(row[category_col]):
                    content = f"Category: {row[category_col]}\n\n{content}"
                
                if content.strip():
                    resumes.append(content)
                    
    except Exception as e:
        print(f"DEBUG: Excel Extraction Error: {e}")
    return resumes

def extract_resumes_from_csv(file_path):
    resumes = []
    # Try multiple encodings
    for encoding in ['utf-8', 'latin-1', 'utf-8-sig']:
        try:
            with open(file_path, mode='r', encoding=encoding) as f:
                reader = csv.DictReader(f)
                # Find the best column name for resume content
                # Added Resume_str and Resume_html for Kaggle datasets
                possible_cols = ['Resume_str', 'Resume_html', 'Resume', 'resume', 'Resume_text', 'content', 'text']
                target_col = None
                category_col = None
                
                if reader.fieldnames:
                    for col in reader.fieldnames:
                        if col in possible_cols:
                            target_col = col
                        if col.lower() == 'category':
                            category_col = col
                            
                    if not target_col:
                        for col in reader.fieldnames:
                            if 'resume' in col.lower():
                                target_col = col
                                break
                    
                    if not target_col:
                        target_col = reader.fieldnames[-1]
                    
                    print(f"DEBUG: Processing CSV with TargetCol: {target_col}, CategoryCol: {category_col}")
                    
                    for row in reader:
                        content = row.get(target_col, "")
                        if category_col and row.get(category_col):
                            # Prepend category to help AI and keyword matching
                            content = f"Category: {row[category_col]}\n\n{content}"
                        
                        if content.strip():
                            resumes.append(content)
                    
                    if resumes:
                        print(f"DEBUG: Successfully extracted {len(resumes)} resumes from CSV")
                        return resumes
        except Exception as e:
            print(f"DEBUG: CSV Extraction Error with {encoding}: {e}")
            continue
    return resumes

def extract_basic_info_fallback(text):
    """
    Fallback function to extract basic info from resume when AI API fails.
    Uses simple regex and keyword matching.
    """
    import re
    
    result = {
        "name": "Unknown",
        "email": "N/A",
        "skills": [],
        "experience_years": 0,
        "evaluation_summary": "Basic extraction (AI unavailable)"
    }
    
    try:
        # Extract email
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = re.findall(email_pattern, text)
        if emails:
            result["email"] = emails[0]
        
        # Extract phone number (optional)
        phone_pattern = r'(?:\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}'
        phones = re.findall(phone_pattern, text)
        
        # Common tech skills to look for
        common_skills = [
            'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue',
            'Node.js', 'Node', 'Express', 'Django', 'Flask', 'FastAPI',
            'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins',
            'Git', 'Linux', 'Agile', 'Scrum', 'REST API', 'GraphQL',
            'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap',
            'C++', 'C#', '.NET', 'Spring Boot', 'Flutter', 'Android', 'iOS'
        ]
        
        # Find matching skills
        found_skills = []
        text_lower = text.lower()
        for skill in common_skills:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        
        result["skills"] = found_skills[:15]  # Limit to top 15
        
        # Estimate experience from text patterns
        exp_patterns = [
            r'(\d+)\s*(?:\+)?\s*years?\s*(?:of\s*)?(?:work\s*)?experience',
            r'(?:experience|exp)\s*:?\s*(\d+)\s*(?:\+)?\s*years?',
            r'(\d+)\s*yrs',
            r'(\d+)\s*years?\s*in'
        ]
        
        for pattern in exp_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                exp_years = int(max(matches))
                result["experience_years"] = min(exp_years, 30)  # Cap at 30 years
                break
        
        # Try to extract name (first capitalized words at start)
        lines = text.strip().split('\n')
        if lines:
            first_line = lines[0].strip()
            # If first line is short and capitalized, might be a name
            if 5 < len(first_line) < 50 and first_line[0].isupper():
                # Avoid common headers
                if not any(word in first_line.lower() for word in ['resume', 'curriculum', 'objective', 'summary']):
                    result["name"] = first_line
        
        # Create a basic summary
        if found_skills:
            skill_str = ', '.join(found_skills[:5])
            result["evaluation_summary"] = f"Skills identified: {skill_str}. Experience: {result['experience_years']} years."
        else:
            result["evaluation_summary"] = "Limited information extracted. Manual review recommended."
        
        print(f"DEBUG: Fallback extraction successful - Email: {result['email']}, Skills: {len(found_skills)}, Exp: {result['experience_years']}y")
        
    except Exception as e:
        print(f"DEBUG: Fallback extraction error: {e}")
    
    return result


def parse_resume_with_ai(text):
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return None
    
    prompt = f"""
    Extract the following information from the resume text provided below. 
    Return the result in STRICT JSON format with these keys:
    - name: (string)
    - email: (string)
    - skills: (list of strings)
    - experience_years: (integer, total years of work experience)
    - evaluation_summary: (string, a 1-sentence summary of the candidate's core expertise)

    Resume Text:
    {text[:5000]}
    """

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
    
    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            if 'candidates' not in result:
                print(f"DEBUG: Gemini API ERROR: {result}")
                return None
                
            reply_text = result['candidates'][0]['content']['parts'][0]['text']
            print(f"DEBUG: AI Raw Response: {reply_text[:200]}...")
            
            # Clean up the response to ensure it's valid JSON
            # Remove markdown code blocks if present
            cleaned_text = reply_text.strip()
            if cleaned_text.startswith("```"):
                cleaned_text = "\n".join(cleaned_text.split("\n")[1:-1]).strip()
            if cleaned_text.startswith("json"):
                cleaned_text = cleaned_text[4:].strip()
            
            return json.loads(cleaned_text)
    except Exception as e:
        print(f"AI Extraction Error: {e}")
        return None

async def parse_resume_with_ai_async(text):
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return extract_basic_info_fallback(text)
    
    prompt = f"""
    Extract the following information from the resume text provided below. 
    Return the result in STRICT JSON format with these keys:
    - name: (string)
    - email: (string)
    - skills: (list of strings)
    - experience_years: (integer, total years of work experience)
    - evaluation_summary: (string, a 1-sentence summary of the candidate's core expertise)

    Resume Text:
    {text[:5000]}
    """

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
    
    headers = {'Content-Type': 'application/json'}
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    
    # Retry logic with exponential backoff for rate limits
    max_retries = 3
    base_delay = 2  # seconds
    
    for attempt in range(max_retries):
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                
                if response.status_code == 429:  # Rate limit
                    if attempt < max_retries - 1:
                        delay = base_delay * (2 ** attempt)  # Exponential backoff
                        print(f"DEBUG: Rate limit hit. Retrying in {delay}s... (Attempt {attempt+1}/{max_retries})")
                        await asyncio.sleep(delay)
                        continue
                    else:
                        print(f"DEBUG: Max retries reached. Using fallback extraction.")
                        return extract_basic_info_fallback(text)
                        
                elif response.status_code != 200:
                    print(f"DEBUG: Gemini API ERROR {response.status_code}: {response.text}")
                    return extract_basic_info_fallback(text)
                
                result = response.json()
                if 'candidates' not in result or not result['candidates']:
                    print(f"DEBUG: Invalid API response: {result}")
                    return extract_basic_info_fallback(text)
                
                reply_text = result['candidates'][0]['content']['parts'][0]['text']
                print(f"DEBUG: AI Raw Response (Async): {reply_text[:200]}...")
                
                cleaned_text = reply_text.strip()
                if cleaned_text.startswith("```"):
                    cleaned_text = "\n".join(cleaned_text.split("\n")[1:-1]).strip()
                if cleaned_text.startswith("json"):
                    cleaned_text = cleaned_text[4:].strip()
                
                return json.loads(cleaned_text)
                
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429 and attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    print(f"DEBUG: HTTP 429 Error. Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                    continue
                else:
                    print(f"AI Async Extraction HTTP Error: {e}")
                    return extract_basic_info_fallback(text)
            except Exception as e:
                print(f"AI Async Extraction Error: {e}")
                return extract_basic_info_fallback(text)
    
    # Fallback if all retries exhausted
    return extract_basic_info_fallback(text)
