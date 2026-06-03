from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
import random
import string
from datetime import datetime, timedelta, timezone
from .. import models
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "your_gmail@gmail.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "your_app_password"),
    MAIL_FROM=os.getenv("MAIL_FROM", "your_gmail@gmail.com"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)

def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))

async def send_otp_email(email: EmailStr, otp: str, full_name: str):
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #6366f1; margin: 0;">Travel AI ✈️</h1>
        </div>
        <h2 style="color: #1e293b;">Hi {full_name}!</h2>
        <p style="color: #64748b;">Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
            <span style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #6366f1; background: #eef2ff; padding: 16px 28px; border-radius: 12px;">
                {otp}
            </span>
        </div>
        <p style="color: #94a3b8; font-size: 13px; text-align: center;">
            If you didn't request this, you can safely ignore this email.
        </p>
    </div>
    """
    
    # Log the OTP directly to the terminal / Render logs so the developer can retrieve it
    print("\n" + "="*60, flush=True)
    print(f"  [DEMO OTP CODE] Verification code for {email} is: {otp}", flush=True)
    print("="*60 + "\n", flush=True)

    try:
        username = os.getenv("MAIL_USERNAME", "your_gmail@gmail.com")
        password = os.getenv("MAIL_PASSWORD", "your_app_password")
        
        if username == "your_gmail@gmail.com" or password == "your_app_password" or not username or not password:
            print("[EMAIL] Using demo mode (SMTP credentials not configured). Skipping email dispatch.", flush=True)
            return

        message = MessageSchema(
            subject="Your Travel AI verification code",
            recipients=[email],
            body=html,
            subtype=MessageType.html,
        )
        fm = FastMail(conf)
        await fm.send_message(message)
        print(f"[EMAIL] Successfully sent email to {email}.", flush=True)
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {email}: {e}", flush=True)

