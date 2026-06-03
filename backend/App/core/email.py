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
    MAIL_FROM_NAME="Explorger Team",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)

def log_email_event(message: str):
    log_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'email_logs.txt')
    timestamp = datetime.now().isoformat()
    try:
        with open(log_file_path, 'a', encoding='utf-8') as f:
            f.write(f"[{timestamp}] {message}\n")
    except Exception as e:
        print(f"Failed to write email log: {e}", flush=True)


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


async def send_otp_email(email: EmailStr, otp: str, full_name: str):
    log_email_event(f"send_otp_email invoked for {email} with OTP={otp}, full_name={full_name}")
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #6366f1; margin: 0;">Explorger ✈️</h1>
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
            msg = "[EMAIL] Using demo mode (SMTP credentials not configured). Skipping email dispatch."
            print(msg, flush=True)
            log_email_event(msg)
            return

        message = MessageSchema(
            subject="Explorger Email Verification Code",
            recipients=[email],
            body=html,
            subtype=MessageType.html,
            alternative_body=(
                f"Hi {full_name},\n\n"
                f"Your Explorger verification code is: {otp}\n\n"
                f"It expires in 10 minutes.\n\n"
                f"If you didn't request this, ignore this email."
            ),
        )
        fm = FastMail(conf)
        await fm.send_message(message)
        msg = f"[EMAIL] Successfully sent email to {email}."
        print(msg, flush=True)
        log_email_event(msg)
    except Exception as e:
        msg = f"[EMAIL ERROR] Failed to send email to {email}: {e}"
        print(msg, flush=True)
        log_email_event(msg)


async def send_welcome_email(email: EmailStr, full_name: str):
    log_email_event(f"send_welcome_email invoked for {email}, full_name={full_name}")
    html = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0"
                       style="background:#ffffff;border-radius:12px;padding:40px;">

                    <tr>
                        <td align="center">
                            <h1 style="margin:0;color:#4f46e5;">
                                Explorger ✈️
                            </h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding-top:30px;">
                            <h2 style="color:#111827;">
                                Verify Your Email Address
                            </h2>

                            <p style="color:#4b5563;font-size:15px;line-height:1.7;">
                                Hello {full_name},
                            </p>

                            <p style="color:#4b5563;font-size:15px;line-height:1.7;">
                                Thank you for signing up for Explorger.
                                To complete your account registration and
                                secure your account, please use the
                                verification code below.
                            </p>

                            <div style="
                                text-align:center;
                                margin:35px 0;
                                padding:20px;
                                background:#eef2ff;
                                border-radius:10px;
                            ">
                                <span style="
                                    font-size:36px;
                                    font-weight:bold;
                                    letter-spacing:8px;
                                    color:#4f46e5;
                                ">
                                    {otp}
                                </span>
                            </div>

                            <p style="color:#4b5563;font-size:15px;">
                                This verification code will expire in
                                <strong>10 minutes</strong>.
                            </p>

                            <p style="color:#4b5563;font-size:15px;">
                                If you did not create an Explorger account,
                                you can safely ignore this email.
                            </p>

                            <hr style="margin:30px 0;border:none;border-top:1px solid #e5e7eb;">

                            <p style="font-size:13px;color:#6b7280;">
                                This is an automated email from Explorger.
                                Please do not reply to this message.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    
    print("\n" + "="*60, flush=True)
    print(f"  [WELCOME EMAIL] Dispatching welcome email to {email}", flush=True)
    print("="*60 + "\n", flush=True)

    try:
        username = os.getenv("MAIL_USERNAME", "your_gmail@gmail.com")
        password = os.getenv("MAIL_PASSWORD", "your_app_password")
        
        if username == "your_gmail@gmail.com" or password == "your_app_password" or not username or not password:
            msg = "[EMAIL] Using demo mode (SMTP credentials not configured). Skipping welcome email dispatch."
            print(msg, flush=True)
            log_email_event(msg)
            return

        message = MessageSchema(
            subject="Welcome to Explorger!",
            recipients=[email],
            body=html,
            subtype=MessageType.html,
        )
        fm = FastMail(conf)
        await fm.send_message(message)
        msg = f"[EMAIL] Successfully sent welcome email to {email}."
        print(msg, flush=True)
        log_email_event(msg)
    except Exception as e:
        msg = f"[EMAIL ERROR] Failed to send welcome email to {email}: {e}"
        print(msg, flush=True)
        log_email_event(msg)
