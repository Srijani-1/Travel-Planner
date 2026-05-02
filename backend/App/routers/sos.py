import httpx, os, random, string
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from dotenv import load_dotenv
from .. import models, schemas
from ..database import get_db
from ..core.auth import get_current_user

load_dotenv()

_otp_store: dict = {}

OTP_TTL_MINUTES = 10

# ─── Twilio helper ────────────────────────────────────────────────────────────
async def send_sms(to_phone: str, body: str) -> bool:
    sid   = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    from_ = os.getenv("TWILIO_PHONE")

    if not all([sid, token, from_]):
        raise HTTPException(
            status_code=503,
            detail="SMS service not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE in .env"
        )

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
            auth=(sid, token),
            data={"From": from_, "To": to_phone, "Body": body},
            timeout=10,
        )

    if resp.status_code not in (200, 201):
        error = resp.json().get("message", "Unknown Twilio error")
        raise HTTPException(status_code=502, detail=f"SMS failed: {error}")

    return True


# ─── Schemas ──────────────────────────────────────────────────────────────────
class SendOTPRequest(BaseModel):
    name: str
    phone: str
    relation: str = ""

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str


# ─── Endpoints ────────────────────────────────────────────────────────────────
router = APIRouter(prefix="/sos", tags=["SOS"])


@router.post("/contacts/send-otp")
async def send_contact_otp(
    req: SendOTPRequest,
    current_user: models.User = Depends(get_current_user),
):
    """Generate a 6-digit OTP and send it via Twilio SMS to the contact's number."""
    otp_code = "".join(random.choices(string.digits, k=6))
    store_key = f"{current_user.id}:{req.phone}"

    _otp_store[store_key] = {
        "otp": otp_code,
        "expires": datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES),
        "contact_data": {"name": req.name, "phone": req.phone, "relation": req.relation},
    }

    message = (
        f"TravelAI Safety Verification\n"
        f"{current_user.full_name} wants to add you as an emergency contact.\n"
        f"Your OTP: {otp_code}\n"
        f"Valid for {OTP_TTL_MINUTES} minutes."
    )

    await send_sms(req.phone, message)
    return {"detail": f"OTP sent to {req.phone}"}


@router.post("/contacts/verify-otp", response_model=schemas.EmergencyContactOut)
async def verify_contact_otp(
    req: VerifyOTPRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Verify OTP and save the emergency contact."""
    store_key = f"{current_user.id}:{req.phone}"
    entry = _otp_store.get(store_key)

    if not entry:
        raise HTTPException(status_code=400, detail="No pending OTP for this number. Please request a new one.")

    if datetime.utcnow() > entry["expires"]:
        del _otp_store[store_key]
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if entry["otp"] != req.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    # OTP verified — save contact
    del _otp_store[store_key]
    contact_data = entry["contact_data"]

    # Prevent duplicates
    existing = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.user_id == current_user.id,
        models.EmergencyContact.phone == contact_data["phone"],
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="This number is already in your contacts.")

    new_contact = models.EmergencyContact(
        user_id=current_user.id,
        name=contact_data["name"],
        phone=contact_data["phone"],
        relation=contact_data["relation"],
        is_verified=True,
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact

@router.post("/trigger", response_model=schemas.SOSOut)
async def trigger_sos(
    alert: schemas.SOSCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    contacts = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.user_id == current_user.id,
        models.EmergencyContact.is_verified == True,    # only send to verified
    ).all()

    notified = []
    maps_link = f"https://maps.google.com/?q={alert.lat},{alert.lon}"
    sms_body = (
        f"🚨 EMERGENCY SOS from {current_user.full_name}!\n"
        f"📍 Location: {maps_link}\n"
        f"💬 {alert.message or 'Please help immediately!'}"
    )

    sid   = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    from_ = os.getenv("TWILIO_PHONE")

    async with httpx.AsyncClient() as client:
        for contact in contacts:
            if sid and token and from_:
                # ── Real Twilio SMS ───────────────────────────────────────
                try:
                    resp = await client.post(
                        f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
                        auth=(sid, token),
                        data={"From": from_, "To": contact.phone, "Body": sms_body},
                        timeout=10,
                    )
                    if resp.status_code in (200, 201):
                        notified.append(contact.phone)
                    else:
                        print(f"[SOS] Twilio error for {contact.phone}: {resp.text}")
                except Exception as e:
                    print(f"[SOS] SMS failed for {contact.phone}: {e}")
            else:
                # ── Dev mode: just log ────────────────────────────────────
                print(f"[SOS DEV] Would SMS {contact.name} ({contact.phone}):\n{sms_body}\n")
                notified.append(contact.phone)

    sos = models.SOSAlert(
        user_id=current_user.id,
        lat=alert.lat,
        lon=alert.lon,
        message=alert.message,
        contacts_notified=notified,
    )
    db.add(sos)
    db.commit()
    db.refresh(sos)
    return sos

# ─── Keep existing contacts CRUD endpoints below ─────────────────────────────
@router.get("/contacts", response_model=list[schemas.EmergencyContactOut])
def list_contacts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.EmergencyContact).filter(
        models.EmergencyContact.user_id == current_user.id
    ).all()


@router.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    c = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.id == contact_id,
        models.EmergencyContact.user_id == current_user.id
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(c)
    db.commit()
    return {"detail": "Deleted"}
