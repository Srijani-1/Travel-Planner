import resend
import random, string, os
from dotenv import load_dotenv

load_dotenv()
resend.api_key = os.getenv("RESEND_API_KEY")

def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))

async def send_otp_email(email: str, otp: str, full_name: str):
    print(f"[OTP] {email} → {otp}", flush=True)
    try:
        resend.Emails.send({
            "from": "Explorger <onboarding@resend.dev>",  # use this for testing, no domain needed
            "to": email,
            "subject": "Your Explorger verification code",
            "html": f"<p>Hi {full_name}, your code is <strong>{otp}</strong>. Expires in 10 minutes.</p>",
            "text": f"Hi {full_name}, your code is: {otp}. Expires in 10 minutes.",
        })
        print(f"[EMAIL] Sent to {email}", flush=True)
    except Exception as e:
        print(f"[EMAIL ERROR] {e}", flush=True)

async def send_welcome_email(email: str, full_name: str):
    try:
        resend.Emails.send({
            "from": "Explorger <onboarding@resend.dev>",
            "to": email,
            "subject": "Welcome to Explorger!",
            "html": f"<p>Welcome {full_name}! Your account is verified.</p>",
            "text": f"Welcome {full_name}! Your account is verified.",
        })
    except Exception as e:
        print(f"[WELCOME EMAIL ERROR] {e}", flush=True)
