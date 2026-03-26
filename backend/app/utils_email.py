import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

load_dotenv()

def send_interview_invite(to_email: str, candidate_name: str, interview_link: str = None):
    """
    Send interview invitation email to candidate
    
    Args:
        to_email: Candidate's email address
        candidate_name: Candidate's name
        interview_link: Link to the interview/exam room (optional, uses default from env if not provided)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Get email configuration from environment
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_email = os.getenv("SMTP_EMAIL")
        smtp_password = os.getenv("SMTP_PASSWORD")
        default_interview_link = os.getenv("INTERVIEW_LINK", "https://your-app-domain.com/exam-room")
        
        # Use provided link or default
        interview_url = interview_link if interview_link else default_interview_link
        
        if not smtp_email or not smtp_password:
            print("Email credentials not configured. Please update .env file.")
            return False
        
        # Create email message
        msg = MIMEMultipart()
        msg['From'] = smtp_email
        msg['To'] = to_email
        msg['Subject'] = "Interview Invitation - Applicant Selector Simulator"
        
        # Email body
        body = f"""
Dear {candidate_name},

Congratulations! You have been shortlisted for the next round of our recruitment process.

We are pleased to invite you to participate in our AI-powered mock interview assessment. This interview will help us evaluate your skills and qualifications.

**Interview Details:**
- Platform: Applicant Selector Simulator
- Format: Online Mock Interview with AI Analysis
- Access Link: {interview_url}

**Instructions:**
1. Click on the link above to access the interview platform
2. Ensure you have a stable internet connection
3. Find a quiet environment for the interview
4. The interview will be recorded and analyzed by our AI system
5. Results will be shared with our HR team for further processing

If you have any questions or face any technical issues, please don't hesitate to contact us.

Best of luck with your interview!

Best regards,
HR Team
AI Applicant Selector
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # Secure the connection
        server.login(smtp_email, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_email, to_email, text)
        server.quit()
        
        print(f"Interview invite sent successfully to {to_email}")
        return True
        
    except Exception as e:
        print(f"Error sending email to {to_email}: {str(e)}")
        return False


def send_bulk_interview_invites(candidates: list):
    """
    Send interview invites to multiple candidates
    
    Args:
        candidates: List of dictionaries with 'email' and 'name' keys
    
    Returns:
        dict: Summary with 'success_count', 'failed_count', and 'failed_emails'
    """
    success_count = 0
    failed_count = 0
    failed_emails = []
    
    for candidate in candidates:
        email = candidate.get('email')
        name = candidate.get('name', 'Candidate')
        
        if send_interview_invite(email, name):
            success_count += 1
        else:
            failed_count += 1
            failed_emails.append(email)
    
    return {
        "success_count": success_count,
        "failed_count": failed_count,
        "failed_emails": failed_emails
    }
