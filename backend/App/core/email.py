import aiosmtplib
import random, string, os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASS = os.getenv("GMAIL_APP_PASS")

def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))

async def _send_email(to: str, subject: str, html: str, text: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Explorger <{GMAIL_USER}>"
    msg["To"] = to
    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        msg,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=GMAIL_USER,
        password=GMAIL_APP_PASS,
    )

async def send_otp_email(email: str, otp: str, full_name: str):
    print(f"[OTP] {email} → {otp}", flush=True)
    try:
        await _send_email(
            to=email,
            subject="Your Explorger verification code",
            html=f"<p>Hi {full_name}, your code is <strong>{otp}</strong>. Expires in 10 minutes.</p>",
            text=f"Hi {full_name}, your code is: {otp}. Expires in 10 minutes.",
        )
        print(f"[EMAIL] Sent to {email}", flush=True)
    except Exception as e:
        print(f"[EMAIL ERROR] {e}", flush=True)

async def send_welcome_email(email: str, full_name: str):
    try:
        await _send_email(
            to=email,
            subject="Welcome to Explorger!",
            html=f"<p>Welcome {full_name}! Your account is verified.</p>",
            text=f"Welcome {full_name}! Your account is verified.",
        )
        print(f"[WELCOME EMAIL] Sent to {email}", flush=True)
    except Exception as e:
        print(f"[WELCOME EMAIL ERROR] {e}", flush=True)
