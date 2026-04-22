from typing import Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
 
from .. import models, schemas
from ..core.auth import get_current_user
from ..database import get_db
 
router = APIRouter(prefix="/rides", tags=["Safe Rides"])
 
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
 
 
async def geocode(address: str) -> Optional[tuple[float, float]]:
    try:
        async with httpx.AsyncClient(timeout=6) as client:
            r = await client.get(
                NOMINATIM_URL,
                params={"q": address, "format": "json", "limit": 1},
                headers={"User-Agent": "TravelAI/1.0"},
            )
            data = r.json()
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception:
        pass
    return None
 
 
def build_platform_options(
    pickup_addr: str,
    dropoff_addr: str,
    pickup_lat: Optional[float],
    pickup_lon: Optional[float],
    dropoff_lat: Optional[float],
    dropoff_lon: Optional[float],
) -> list[dict]:
    """
    Return a list of ride-hailing platform booking links.
    When coordinates are available, deep links pre-fill pickup/drop.
    """
    platforms = []
 
    # ── Uber ──────────────────────────────────────────────────────────────────
    if pickup_lat and dropoff_lat:
        uber_url = (
            f"https://m.uber.com/ul/?"
            f"action=setPickup"
            f"&pickup[latitude]={pickup_lat}&pickup[longitude]={pickup_lon}"
            f"&pickup[formatted_address]={pickup_addr.replace(' ', '+')}"
            f"&dropoff[latitude]={dropoff_lat}&dropoff[longitude]={dropoff_lon}"
            f"&dropoff[formatted_address]={dropoff_addr.replace(' ', '+')}"
        )
    else:
        uber_url = "https://www.uber.com/"
    platforms.append({
        "id": "uber",
        "name": "Uber",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png",
        "color": "#000000",
        "description": "Rideshare with real-time tracking & SOS button",
        "safety_features": ["In-app emergency SOS", "Real-time trip sharing", "Driver verified ID"],
        "booking_url": uber_url,
        "available": True,
    })
 
    # ── Ola ───────────────────────────────────────────────────────────────────
    if pickup_lat and dropoff_lat:
        ola_url = (
            f"https://book.olacabs.com/?"
            f"pickup_lat={pickup_lat}&pickup_lng={pickup_lon}"
            f"&pickup_name={pickup_addr.replace(' ', '+')}"
            f"&drop_lat={dropoff_lat}&drop_lng={dropoff_lon}"
            f"&drop_name={dropoff_addr.replace(' ', '+')}"
        )
    else:
        ola_url = "https://www.olacabs.com/"
    platforms.append({
        "id": "ola",
        "name": "Ola",
        "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Ola_cabs_logo.svg/200px-Ola_cabs_logo.svg.png",
        "color": "#3cba54",
        "description": "India's leading ride app with women's safety initiatives",
        "safety_features": ["Share My Ride", "24/7 Safety helpline", "Panic button"],
        "booking_url": ola_url,
        "available": True,
    })
 
    # ── Rapido ────────────────────────────────────────────────────────────────
    platforms.append({
        "id": "rapido",
        "name": "Rapido",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Rapido_logo.svg/200px-Rapido_logo.svg.png",
        "color": "#FFD700",
        "description": "Affordable bike & auto rides across India",
        "safety_features": ["Live tracking", "Emergency SOS", "Verified captains"],
        "booking_url": "https://rapido.bike/",
        "available": True,
    })
 
    # ── inDrive ───────────────────────────────────────────────────────────────
    platforms.append({
        "id": "indrive",
        "name": "inDrive",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/InDrive_logo.svg/200px-InDrive_logo.svg.png",
        "color": "#1ED760",
        "description": "Negotiate your fare — transparent pricing",
        "safety_features": ["Driver profile check", "In-app chat", "24/7 support"],
        "booking_url": "https://indrive.com/",
        "available": True,
    })
 
    return platforms
 
 
@router.get("/platforms")
async def get_ride_platforms(
    pickup: str,
    dropoff: str,
    _: models.User = Depends(get_current_user),
):
    """
    Geocode pickup & dropoff, return platform booking links.
    """
    pickup_coords = await geocode(pickup)
    dropoff_coords = await geocode(dropoff)
 
    platforms = build_platform_options(
        pickup_addr=pickup,
        dropoff_addr=dropoff,
        pickup_lat=pickup_coords[0] if pickup_coords else None,
        pickup_lon=pickup_coords[1] if pickup_coords else None,
        dropoff_lat=dropoff_coords[0] if dropoff_coords else None,
        dropoff_lon=dropoff_coords[1] if dropoff_coords else None,
    )
 
    return {
        "pickup": pickup,
        "dropoff": dropoff,
        "pickup_geocoded": pickup_coords is not None,
        "dropoff_geocoded": dropoff_coords is not None,
        "platforms": platforms,
    }
 
 
@router.post("/log", response_model=schemas.RideBookingOut, status_code=201)
def log_ride_booking(
    booking: schemas.RideBookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Log which platform the user actually booked through."""
    new_booking = models.RideBooking(
        user_id=current_user.id,
        driver_id=None,
        pickup=booking.pickup,
        dropoff=booking.dropoff,
        platform=booking.platform,
        status="confirmed",
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking
 
 
@router.get("/my-bookings", response_model=list[schemas.RideBookingOut])
def my_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.RideBooking)
        .filter(models.RideBooking.user_id == current_user.id)
        .order_by(models.RideBooking.booked_at.desc())
        .all()
    )
