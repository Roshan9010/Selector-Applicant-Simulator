# 🚨 AI API Rate Limiting - Important Information

## What is HTTP 429 Error?

**HTTP 429 - Too Many Requests** means you've exceeded the Gemini API rate limit for the current time window.

## Why Does This Happen?

The free tier of Google's Gemini API has usage limits:
- **Requests per minute**: Limited (varies by model)
- **Tokens per minute**: Limited based on model
- **Requests per day**: Limited quota

For `gemini-2.5-flash` (the model we're using), the free tier allows:
- ✅ Up to 100 requests per minute (shared across all users)
- ✅ Up to 1 million tokens per minute
- ✅ Generous daily quota

## What to Do When You See Rate Limit Error

### During Mock Interview:
1. **Don't panic!** The conversation state is preserved
2. **Wait 10-15 seconds** - you'll see an amber warning banner at the top
3. **Continue speaking** - the AI will respond once the limit resets
4. **The interview continues seamlessly** from where it left off

### Tips to Avoid Rate Limits:
- ⏱️ **Pause between questions** - Wait a few seconds after AI finishes speaking
- 🗣️ **Speak clearly and concisely** - Shorter responses = fewer API calls
- ⚡ **Don't rapid-fire questions** - Give the system time to process

## Technical Implementation

### Backend Changes Made:
```python
# chatbot.py now handles 429 errors gracefully
if response.status_code == 429:
    return {
        "reply": "I apologize, but I've reached my API usage limit for this minute..."
    }
```

### Frontend Changes Made:
```javascript
// MockInterview.jsx shows visual warning
{rateLimited && (
  <div className="amber-warning-banner">
    API Rate Limit - Please wait ~10 seconds
  </div>
)}
```

## For Production Use

If you plan to use this system heavily (multiple candidates simultaneously):

### Option 1: Upgrade Gemini API
- Move to **Gemini API paid tier** for higher limits
- Visit: https://ai.google.dev/pricing
- Update `.env` file with new key

### Option 2: Implement Request Queue
- Add rate limiting middleware
- Queue requests and process them sequentially
- Add retry logic with exponential backoff

### Option 3: Cache Common Responses
- Cache frequently asked questions
- Reduce API calls for repetitive queries

## Monitoring API Usage

Check your Gemini API usage:
1. Go to Google Cloud Console
2. Navigate to APIs & Services > Dashboard
3. Look for "Generative Language API"
4. View quota usage and limits

## Current Configuration

**Model**: `gemini-2.5-flash`  
**API Key Location**: `backend/.env` → `GEMINI_API_KEY`  
**Rate Limit Handling**: Automatic with user-friendly messaging  
**Retry Strategy**: Manual (user waits 10-15 seconds)  

## Debugging

If you see frequent 429 errors:

1. **Check backend logs**:
   ```bash
   # In backend directory
   Get-Content server_log.txt -Tail 50
   ```

2. **Verify API key is valid**:
   ```bash
   # Test API directly
   curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY"
   ```

3. **Monitor request frequency**:
   - Check timestamps in backend logs
   - Identify patterns of rapid requests

## Example Error Messages

**User-Friendly Message (Frontend)**:
> "I apologize, but I've reached my API usage limit for this minute. This is a limitation of the free Gemini API tier. Please wait about 10-15 seconds before continuing - our conversation will resume right where we left off!"

**Backend Log**:
```
Gemini API Rate Limit Exceeded (HTTP 429)
```

**Frontend Visual Indicator**:
- Amber pulsing banner at top of interview screen
- Warning icon with clear messaging
- Auto-dismisses after 15 seconds

## Questions?

If you continue experiencing rate limit issues:
1. Check if multiple people are using the same API key
2. Verify no background processes are making excessive requests
3. Consider upgrading to paid Gemini API tier
4. Review backend logs for unusual patterns

---

**Remember**: Rate limiting is a feature that protects the API from abuse. The system is designed to handle it gracefully and continue your interview seamlessly! 🎯
