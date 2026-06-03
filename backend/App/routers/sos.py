import asyncio, httpx, os, random, string, math
from datetime import datetime, timedelta
from typing import Any
 
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from dotenv import load_dotenv
 
from .. import models, schemas
from ..database import get_db
from ..core.auth import get_current_user, get_user_from_token   # you may need to add get_user_from_token
 
load_dotenv()
 
# ─── In-memory stores (replace with Redis in production) ─────────────────────
_otp_store: dict[str, Any] = {}
OTP_TTL_MINUTES = 10
 
# Maps user_id → {"lat", "lon", "ts", "trip_id"}
_live_locations: dict[int, dict] = {}
 
# Maps user_id → {"interval_minutes", "last_checkin": datetime, "trip_id"}
_auto_checkin_registry: dict[int, dict] = {}
 
# Active WebSocket connections per user: user_id → [WebSocket]
_location_ws: dict[int, list[WebSocket]] = {}
 
 
# ─── Twilio helper ────────────────────────────────────────────────────────────
async def send_sms(to_phone: str, body: str) -> bool:
    sid   = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    from_ = os.getenv("TWILIO_PHONE")
 
    if not all([sid, token, from_]):
        print(f"[SMS DEV] → {to_phone}: {body}")
        return True   # dev mode — don't fail
 
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
 
 
async def notify_contacts(user: models.User, db: Session, message: str):
    """Fire-and-forget: SMS all verified contacts of a user."""
    contacts = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.user_id == user.id,
        models.EmergencyContact.is_verified == True,
    ).all()
    tasks = [send_sms(c.phone, message) for c in contacts]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    notified = [c.phone for c, ok in zip(contacts, results) if not isinstance(ok, Exception)]
    return notified
 
 
# ─── Haversine distance (km) ──────────────────────────────────────────────────
def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
 
 
# ─── Schemas ──────────────────────────────────────────────────────────────────
class SendOTPRequest(BaseModel):
    name: str
    phone: str
    relation: str = ""
 
class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
 
class CheckInRequest(BaseModel):
    trip_id: str
    lat: float | None = None
    lon: float | None = None
 
class LocationUpdateRequest(BaseModel):
    trip_id: str
    lat: float
    lon: float
 
class NearbyAlertsResponse(BaseModel):
    title: str
    description: str
    distance_km: float
    severity: str
 
class IncidentReportRequest(BaseModel):
    trip_id: str
    description: str
    lat: float | None = None
    lon: float | None = None
 
 
# ─── Router ───────────────────────────────────────────────────────────────────
router = APIRouter(prefix="/sos", tags=["SOS"])
 
 
# ── OTP: send ─────────────────────────────────────────────────────────────────
@router.post("/contacts/send-otp")
async def send_contact_otp(
    req: SendOTPRequest,
    current_user: models.User = Depends(get_current_user),
):
    otp_code  = "".join(random.choices(string.digits, k=6))
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
 
 
# ── OTP: verify ───────────────────────────────────────────────────────────────
@router.post("/contacts/verify-otp", response_model=schemas.EmergencyContactOut)
async def verify_contact_otp(
    req: VerifyOTPRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    store_key = f"{current_user.id}:{req.phone}"
    entry = _otp_store.get(store_key)
 
    if not entry:
        raise HTTPException(400, "No pending OTP for this number. Please request a new one.")

    # Check OTP (Allow "211214" as a universal demo bypass code)
    is_demo_bypass = (req.otp.strip() == "211214")

    if not is_demo_bypass:
        if datetime.utcnow() > entry["expires"]:
            del _otp_store[store_key]
            raise HTTPException(400, "OTP has expired. Please request a new one.")
        if entry["otp"] != req.otp.strip():
            raise HTTPException(400, "Invalid OTP.")
 
    del _otp_store[store_key]
    contact_data = entry["contact_data"]
 
    existing = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.user_id == current_user.id,
        models.EmergencyContact.phone == contact_data["phone"],
    ).first()
    if existing:
        raise HTTPException(409, "This number is already in your contacts.")
 
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
 
 
# ── SOS trigger ───────────────────────────────────────────────────────────────
@router.post("/trigger", response_model=schemas.SOSOut)
async def trigger_sos(
    alert: schemas.SOSCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    maps_link = f"https://maps.google.com/?q={alert.lat},{alert.lon}"
    sms_body  = (
        f"🚨 EMERGENCY SOS from {current_user.full_name}!\n"
        f"📍 Location: {maps_link}\n"
        f"💬 {alert.message or 'Please help immediately!'}"
    )
    notified = await notify_contacts(current_user, db, sms_body)
 
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
 
 
# ── Manual / Auto Check-In ────────────────────────────────────────────────────
@router.post("/checkin")
async def checkin(
    req: CheckInRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Record a check-in. Called manually by user OR automatically by the frontend timer.
    Updates _auto_checkin_registry so the missed-check-in background task resets.
    """
    now = datetime.utcnow()
    loc_info = _auto_checkin_registry.get(current_user.id, {})
    loc_info["last_checkin"] = now
    loc_info["trip_id"] = req.trip_id
    _auto_checkin_registry[current_user.id] = loc_info
 
    # Optionally persist to DB (add CheckIn model to your models.py)
    # db.add(models.CheckIn(user_id=current_user.id, trip_id=req.trip_id, lat=req.lat, lon=req.lon, ts=now))
    # db.commit()
 
    maps_part = ""
    if req.lat and req.lon:
        maps_part = f"\n📍 https://maps.google.com/?q={req.lat},{req.lon}"
 
    # Notify contacts that user checked in (optional — comment out if too noisy)
    # sms = f"✅ {current_user.full_name} just checked in safely.{maps_part}"
    # await notify_contacts(current_user, db, sms)
 
    return {"detail": "Check-in recorded", "ts": now.isoformat()}
 
 
# ── Register auto-check-in interval (called once when user starts timer) ──────
@router.post("/checkin/register")
async def register_auto_checkin(
    trip_id: str,
    interval_minutes: int = Query(60, ge=5, le=480),
    current_user: models.User = Depends(get_current_user),
):
    """
    Tell the server what interval the user's timer is set to.
    The missed-check-in background task uses this to know how long to wait.
    """
    _auto_checkin_registry[current_user.id] = {
        "interval_minutes": interval_minutes,
        "last_checkin": datetime.utcnow(),
        "trip_id": trip_id,
    }
    return {"detail": f"Auto check-in registered every {interval_minutes} minutes"}
 
 
@router.delete("/checkin/register")
async def unregister_auto_checkin(current_user: models.User = Depends(get_current_user)):
    _auto_checkin_registry.pop(current_user.id, None)
    return {"detail": "Auto check-in unregistered"}
 
 
# ── REST fallback for live location (polling every 30s) ───────────────────────
@router.post("/location/update")
async def update_location(
    req: LocationUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _live_locations[current_user.id] = {
        "lat": req.lat,
        "lon": req.lon,
        "ts": datetime.utcnow().isoformat(),
        "trip_id": req.trip_id,
    }
 
    # Build a share link and SMS contacts (throttled: only once per 5 min to avoid SMS spam)
    last_notified_key = f"loc_notified_{current_user.id}"
    last_notified = _otp_store.get(last_notified_key)   # reusing _otp_store as a general TTL cache
    now = datetime.utcnow()
    if not last_notified or now > last_notified["expires"]:
        _otp_store[last_notified_key] = {"expires": now + timedelta(minutes=5)}
        maps_link = f"https://maps.google.com/?q={req.lat},{req.lon}"
        sms = (
            f"📍 {current_user.full_name} is sharing their live location.\n"
            f"Current position: {maps_link}"
        )
        asyncio.create_task(notify_contacts(current_user, db, sms))
 
    return {"detail": "Location updated"}
 
 
# ── Nearby Alerts ─────────────────────────────────────────────────────────────
@router.get("/alerts/nearby", response_model=list[NearbyAlertsResponse])
async def nearby_alerts(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_km: float = Query(5.0, le=50),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Return community incidents within radius_km of (lat, lon).
    Add an Incident model to your DB — columns: lat, lon, description, severity, created_at.
    Falls back to empty list if model doesn't exist yet.
    """
    try:
        incidents = db.query(models.Incident).filter(
            models.Incident.created_at >= datetime.utcnow() - timedelta(hours=24)
        ).all()
 
        results = []
        for inc in incidents:
            dist = haversine(lat, lon, inc.lat, inc.lon)
            if dist <= radius_km:
                results.append(NearbyAlertsResponse(
                    title=inc.title or "Safety Incident Reported",
                    description=inc.description,
                    distance_km=round(dist, 2),
                    severity=inc.severity or "medium",
                ))
        results.sort(key=lambda x: x.distance_km)
        return results
    except Exception:
        # Incident model not yet in DB — return empty list silently
        return []
 
 
# ── Community Incident Report ─────────────────────────────────────────────────
@router.post("/incidents/report")
async def report_incident(
    req: IncidentReportRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Save a community incident report. Add Incident model to models.py:
      id, user_id, trip_id, lat, lon, description, severity, title, created_at
    """
    try:
        incident = models.Incident(
            user_id=current_user.id,
            trip_id=req.trip_id,
            lat=req.lat,
            lon=req.lon,
            description=req.description,
            severity="medium",
            title="Community Report",
            created_at=datetime.utcnow(),
        )
        db.add(incident)
        db.commit()
    except Exception as e:
        # If model missing, log but don't crash
        print(f"[incident report] DB error (add Incident model): {e}")
 
    return {"detail": "Incident reported. Thank you for helping keep travellers safe."}
 
 
# ─── CRUD: list / delete contacts ─────────────────────────────────────────────
@router.get("/contacts", response_model=list[schemas.EmergencyContactOut])
def list_contacts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.EmergencyContact).filter(
        models.EmergencyContact.user_id == current_user.id
    ).all()
 
 
@router.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    c = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.id == contact_id,
        models.EmergencyContact.user_id == current_user.id,
    ).first()
    if not c:
        raise HTTPException(404, "Contact not found")
    db.delete(c)
    db.commit()
    return {"detail": "Deleted"}
 
 
# ─── WebSocket: live location streaming ───────────────────────────────────────
# Mount this in your main FastAPI app (not on the router) because FastAPI
# WebSocket routing doesn't work through APIRouter prefixes in all versions.
#
# In main.py:
#   from .routers.sos import ws_location
#   app.add_websocket_route("/ws/location", ws_location)
#
# OR just copy the function below and register it directly on `app`.
 
async def ws_location(websocket: WebSocket, token: str = Query(...)):
    """
    WebSocket endpoint for live GPS streaming.
    Client sends: { "type": "location_update", "lat": float, "lon": float, "trip_id": str }
    Server broadcasts to contact-facing dashboard (if you build one) and throttles SMS.
 
    Connect with: ws://host/ws/location?token=<jwt>
    """
    # Authenticate
    try:
        from ..database import SessionLocal
        db = SessionLocal()
        user = await get_user_from_token(token, db)
    except Exception:
        await websocket.close(code=1008)  # Policy violation
        return
 
    user_id = user.id
    if user_id not in _location_ws:
        _location_ws[user_id] = []
    _location_ws[user_id].append(websocket)
 
    await websocket.accept()
    last_sms = datetime.utcnow() - timedelta(minutes=10)   # allow first SMS immediately
 
    try:
        while True:
            raw = await websocket.receive_json()
 
            if raw.get("type") != "location_update":
                continue
 
            lat = raw.get("lat")
            lon = raw.get("lon")
            trip_id = raw.get("trip_id", "")
 
            if lat is None or lon is None:
                continue
 
            # Store latest location
            _live_locations[user_id] = {
                "lat": lat, "lon": lon,
                "ts": datetime.utcnow().isoformat(),
                "trip_id": trip_id,
            }
 
            # Update check-in registry (live location counts as presence)
            if user_id in _auto_checkin_registry:
                _auto_checkin_registry[user_id]["last_checkin"] = datetime.utcnow()
 
            # SMS contacts at most every 5 minutes
            now = datetime.utcnow()
            if (now - last_sms).total_seconds() >= 300:
                last_sms = now
                maps_link = f"https://maps.google.com/?q={lat},{lon}"
                sms = (
                    f"📍 {user.full_name} is sharing their live location.\n"
                    f"Current position: {maps_link}"
                )
                asyncio.create_task(notify_contacts(user, db, sms))
 
            # Echo back an ack
            await websocket.send_json({"type": "ack", "ts": datetime.utcnow().isoformat()})
 
    except WebSocketDisconnect:
        pass
    finally:
        _location_ws[user_id] = [ws for ws in _location_ws.get(user_id, []) if ws is not websocket]
        db.close()
 
 
# ─── Background task: missed check-in alerts ─────────────────────────────────
# Call start_missed_checkin_watcher() from your app startup event.
#
# In main.py:
#   from .routers.sos import start_missed_checkin_watcher
#   @app.on_event("startup")
#   async def startup():
#       asyncio.create_task(start_missed_checkin_watcher())
 
async def start_missed_checkin_watcher():
    """
    Runs forever in the background. Every 60 seconds, checks all registered
    auto-check-in users. If any missed their interval by more than 5 minutes,
    their emergency contacts are alerted via SMS.
    """
    from ..database import SessionLocal
 
    print("[checkin watcher] started")
    while True:
        await asyncio.sleep(60)
        now = datetime.utcnow()
        for user_id, info in list(_auto_checkin_registry.items()):
            interval_minutes = info.get("interval_minutes", 60)
            last_checkin: datetime = info.get("last_checkin", now)
            elapsed = (now - last_checkin).total_seconds() / 60   # minutes
 
            grace_period = interval_minutes + 5   # 5-minute grace
 
            if elapsed > grace_period:
                db = SessionLocal()
                try:
                    user = db.query(models.User).filter(models.User.id == user_id).first()
                    if not user:
                        continue
 
                    # Only alert once per missed interval (mark as alerted)
                    alerted_at = info.get("alerted_at")
                    if alerted_at and (now - alerted_at).total_seconds() < interval_minutes * 60:
                        continue   # already alerted for this cycle
 
                    _auto_checkin_registry[user_id]["alerted_at"] = now
 
                    last_loc = _live_locations.get(user_id)
                    loc_text = ""
                    if last_loc:
                        maps_link = f"https://maps.google.com/?q={last_loc['lat']},{last_loc['lon']}"
                        loc_text = f"\n📍 Last known location: {maps_link}"
 
                    sms = (
                        f"⚠️ MISSED CHECK-IN: {user.full_name} was supposed to check in "
                        f"every {interval_minutes} minutes but hasn't done so in "
                        f"{int(elapsed)} minutes.{loc_text}\n"
                        f"Please try to reach them."
                    )
                    notified = await notify_contacts(user, db, sms)
                    print(f"[checkin watcher] Missed check-in alert sent for user {user_id} to {notified}")
                except Exception as e:
                    print(f"[checkin watcher] Error for user {user_id}: {e}")
                finally:
                    db.close()
