import sib_api_v3_sdk
from sib_api_v3_sdk.configuration import Configuration
from sib_api_v3_sdk.api.transactional_emails_api import TransactionalEmailsApi
from sib_api_v3_sdk.models.send_smtp_email import SendSmtpEmail
import random, string, os
from dotenv import load_dotenv

load_dotenv()

config = Configuration()
config.api_key["api-key"] = os.getenv("BREVO_API_KEY")
SENDER = {"name": os.getenv("SENDER_NAME", "Explorger"), "email": os.getenv("SENDER_EMAIL")}

def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))

async def send_otp_email(email: str, otp: str, full_name: str):
    print(f"[OTP] {email} → {otp}", flush=True)
    try:
        api = TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(config))
        api.send_transac_email(SendSmtpEmail(
            to=[{"email": email, "name": full_name}],
            sender=SENDER,
            subject="Your Explorger verification code",
            html_content=f"<p>Hi {full_name}, your code is <strong>{otp}</strong>. Expires in 10 minutes.</p>",
            text_content=f"Hi {full_name}, your code is: {otp}. Expires in 10 minutes.",
        ))
        print(f"[EMAIL] Sent to {email}", flush=True)
    except Exception as e:
        print(f"[EMAIL ERROR] {e}", flush=True)

async def send_welcome_email(email: str, full_name: str):
    try:
        api = TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(config))
        api.send_transac_email(SendSmtpEmail(
            to=[{"email": email, "name": full_name}],
            sender=SENDER,
            subject="Welcome to Explorger!",
            html_content=f"<p>Welcome {full_name}! Your account is verified.</p>",
            text_content=f"Welcome {full_name}! Your account is verified.",
        ))
        print(f"[WELCOME EMAIL] Sent to {email}", flush=True)
    except Exception as e:
        print(f"[WELCOME EMAIL ERROR] {e}", flush=True)
