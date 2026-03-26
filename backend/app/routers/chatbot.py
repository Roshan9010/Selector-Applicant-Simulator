import os
import json
import urllib.request
import urllib.error
import httpx
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from app import models, database
from app.dependencies import get_current_candidate

load_dotenv()

router = APIRouter()

@router.post("/mock-interview")
async def mock_interview(
    payload: dict,
    candidate: models.User = Depends(get_current_candidate),
    db: Session = Depends(database.get_db)
):
    """
    AI Mock Interview endpoint - processes conversation history and returns AI response
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    if not gemini_key:
        return {
            "reply": "I apologize, but the AI interview system is currently unavailable due to missing API configuration. Please contact the administrator."
        }
    
    # Get conversation history from payload
    history = payload.get("history", [])
    
    # Build prompt for Gemini
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
    
    headers = {'Content-Type': 'application/json'}
    
    # Create system instruction for interview context
    system_instruction = """You are conducting a professional job interview as an AI interviewer. 
Your role is to:
1. Ask thoughtful technical and behavioral questions
2. Listen carefully to the candidate's responses
3. Ask follow-up questions based on their answers
4. Maintain a friendly but professional tone
5. Keep questions concise and focused
6. Evaluate responses naturally through conversation

Remember this is a MOCK INTERVIEW for practice. Be encouraging but also challenging."""
    
    # Format messages for Gemini API
    contents = []
    for msg in history:
        role = msg.get('role', 'user')
        parts = msg.get('parts', [])
        text_content = parts[0].get('text', '') if parts else ''
        
        # Convert roles to Gemini format
        gemini_role = 'user' if role == 'user' else 'model'
        contents.append({
            "role": gemini_role,
            "parts": [{"text": text_content}]
        })
    
    data = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": contents
    }
    
    # Use async HTTP client for better performance
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(url, json=data, headers=headers)
            
            if response.status_code == 429:
                print("Gemini API Rate Limit Exceeded (HTTP 429)")
                return {
                    "reply": "I apologize, but I've reached my API usage limit for this minute. This is a limitation of the free Gemini API tier. Please wait about 10-15 seconds before continuing, or try again in a minute. The conversation will resume where we left off."
                }
            
            if response.status_code != 200:
                print(f"Gemini API Error {response.status_code}: {response.text}")
                return {
                    "reply": "I apologize, I'm experiencing a connection issue. Could you please repeat that?"
                }
            
            result = response.json()
            
            if 'candidates' not in result or not result['candidates']:
                return {
                    "reply": "I'm having trouble processing that. Could you say more about it?"
                }
            
            reply_text = result['candidates'][0]['content']['parts'][0]['text']
            return {"reply": reply_text}
            
        except httpx.HTTPStatusError as e:
            print(f"HTTP Error: {e}")
            if e.response.status_code == 429:
                return {
                    "reply": "I apologize, but I've reached my API usage limit for this minute. This is a limitation of the free Gemini API tier. Please wait about 10-15 seconds before continuing. The conversation will resume where we left off."
                }
            return {
                "reply": "Sorry, I encountered a network error. Please continue with your response."
            }
        except Exception as e:
            print(f"Mock Interview Error: {e}")
            return {
                "reply": "I apologize, I'm experiencing technical difficulties. Let's move on to the next question."
            }


@router.post("/mock-interview-report")
async def generate_mock_interview_report(
    payload: dict,
    candidate: models.User = Depends(get_current_candidate),
    db: Session = Depends(database.get_db)
):
    """
    Generate detailed performance report for completed mock interview
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    if not gemini_key:
        raise HTTPException(status_code=503, detail="AI service unavailable")
    
    history = payload.get("history", [])
    duration = payload.get("duration", 0)
    
    # Convert history to readable format
    conversation = "\n\n".join([
        f"{'Interviewer' if msg['role'] == 'model' else 'Candidate'}: {msg['parts'][0]['text']}"
        for msg in history
    ])
    
    # Create analysis prompt
    analysis_prompt = f"""Analyze this mock interview conversation and provide a detailed performance report.

INTERVIEW DURATION: {duration} seconds

CONVERSATION:
{conversation[:8000]}  # Limit to avoid token limits

Provide your analysis in EXACT JSON format with these fields:
{{
    "overall_score": (integer 0-100),
    "communication_score": (integer 0-100),
    "technical_score": (integer 0-100),
    "problem_solving_score": (integer 0-100),
    "behavioral_score": (integer 0-100),
    "detailed_feedback": (string - comprehensive overall assessment),
    "communication_feedback": (string - communication skills analysis),
    "technical_feedback": (string - technical knowledge evaluation),
    "strengths": ["array of strings - candidate's strengths"],
    "areas_for_improvement": ["array of strings - areas needing work"],
    "recommendations": ["array of strings - actionable next steps"]
}}

Be honest but constructive. Focus on both technical accuracy and soft skills."""
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
    
    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [{
            "parts": [{"text": analysis_prompt}]
        }]
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(url, json=data, headers=headers)
            
            if response.status_code == 429:
                print("Gemini API Rate Limit Exceeded (HTTP 429) while generating report")
                raise HTTPException(status_code=429, detail="AI rate limit exceeded. Please wait a moment and try again.")
            
            if response.status_code != 200:
                print(f"Report Generation Error {response.status_code}: {response.text}")
                raise HTTPException(status_code=503, detail="Failed to generate report")
            
            result = response.json()
            
            if 'candidates' not in result or not result['candidates']:
                raise HTTPException(status_code=500, detail="Invalid AI response")
            
            reply_text = result['candidates'][0]['content']['parts'][0]['text']
            
            # Clean up the response (remove markdown code blocks if present)
            cleaned_text = reply_text.strip()
            if cleaned_text.startswith("```"):
                cleaned_text = "\n".join(cleaned_text.split("\n")[1:-1]).strip()
            if cleaned_text.startswith("json"):
                cleaned_text = cleaned_text[4:].strip()
            
            # Parse JSON response
            report_data = json.loads(cleaned_text)
            return report_data
            
        except httpx.HTTPStatusError as e:
            print(f"HTTP Error generating report: {e}")
            if e.response.status_code == 429:
                raise HTTPException(status_code=429, detail="AI rate limit exceeded. Please wait 10-15 seconds and try again.")
            raise HTTPException(status_code=503, detail="Service unavailable")
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to parse AI response")
        except Exception as e:
            print(f"Report Generation Error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/chat")
def chat(payload: dict):
    user_message = payload.get("message", "")
    
    # We look for GEMINI_API_KEY in the environment
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    if not gemini_key:
        # Fallback offline mode if API key is missing
        lower_msg = user_message.lower()
        if "apply" in lower_msg:
            return {"reply": "To apply for a job, go to the Candidate Dashboard and follow the registration steps!"}
        if "exam" in lower_msg:
            return {"reply": "Once shortlisted, you will receive an exam link on your dashboard."}
        if "admin" in lower_msg:
            return {"reply": "Admins can create job requirements and view shortlisted candidates directly on their dashboard."}
        
        return {"reply": "Hello! I am the AI assistant. I am currently running in offline fallback mode. To enable the smart AI, please add your Gemini Free Plan API Key as GEMINI_API_KEY in the backend `.env` file."}

    # If the key is present, we use Gemini REST API (gemini-2.5-flash for free, fast responses)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
    
    headers = {'Content-Type': 'application/json'}
    data = {
        "system_instruction": {
            "parts": [{"text": "You are a helpful recruitment assistant helping admins and candidates in the Applicant Selector Simulator web app. Provide concise, friendly, and helpful answers. Format any line breaks cleanly."}]
        },
        "contents": [
            {
                "parts": [{"text": user_message}]
            }
        ]
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            reply_text = result['candidates'][0]['content']['parts'][0]['text']
            return {"reply": reply_text}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        if e.code == 429:
            return {"reply": "I apologize, but I've reached my API usage limit for this minute. This is a limitation of the free Gemini API tier. Please wait about 10-15 seconds before continuing. The conversation will resume where we left off."}
        return {"reply": f"AI Error: API request failed with status {e.code}. Make sure your GEMINI_API_KEY is valid. Details: {error_body}"}
    except Exception as e:
        return {"reply": f"AI Error: {str(e)}"}
