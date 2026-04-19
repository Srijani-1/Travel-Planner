from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas
from ..core.security import hash_password
from ..core.email import generate_otp, send_otp_email
from datetime import datetime, timedelta, timezone
from ..models import User, PendingUser

router = APIRouter()

@router.post("/register", status_code=201)
async def register_user(
    user: schemas.UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Check if user already exists
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    # Check if there's already a pending registration for this email
    pending = db.query(PendingUser).filter(PendingUser.email == user.email).first()
    if pending:
        db.delete(pending)
        db.commit()

    otp = generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    new_pending = PendingUser(
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        hashed_password=hash_password(user.password),
        otp_code=otp,
        otp_expires_at=expires,
    )
    try:
        db.add(new_pending)
        db.commit()
        db.refresh(new_pending)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.")

    # Send email in background
    background_tasks.add_task(send_otp_email, user.email, otp, user.full_name)

    return {
        "message": "Please check your email for a 6-digit verification code to complete registration.",
        "user_id": new_pending.id,
        "requires_verification": True,
    }

@router.post("/verify-otp")
def verify_otp(payload: schemas.OTPVerify, db: Session = Depends(get_db)):
    from ..core.auth import generate_token

    pending = db.query(PendingUser).filter(PendingUser.id == payload.user_id).first()
    if not pending:
        raise HTTPException(status_code=404, detail="Verification session not found")

    # Check OTP
    if pending.otp_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Verification code has expired")
    
    if pending.otp_code != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    # Create the actual User record
    new_user = User(
        full_name=pending.full_name,
        email=pending.email,
        phone=pending.phone,
        hashed_password=pending.hashed_password,
    )
    
    try:
        db.add(new_user)
        # Delete from pending
        db.delete(pending)
        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to finalize registration")

    token = generate_token(data={"sub": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": new_user.id, "full_name": new_user.full_name, "email": new_user.email, "phone": new_user.phone},
    }

@router.post("/resend-otp")
async def resend_otp(
    payload: schemas.OTPResend,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    pending = db.query(PendingUser).filter(PendingUser.id == payload.user_id).first()
    if not pending:
        raise HTTPException(status_code=404, detail="Verification session not found")

    otp = generate_otp()
    pending.otp_code = otp
    pending.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()

    background_tasks.add_task(send_otp_email, pending.email, otp, pending.full_name)
    return {"message": "New verification code sent to your email"}
