import math
from typing import List, Optional
 
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, text
from sqlalchemy.orm import Session
 
from .. import models, schemas
from ..core.auth import get_current_user
from ..database import get_db
from ..ai.stay_searcher import search_safe_stays

router = APIRouter(prefix="/stays", tags=["Safe Stays"])
 
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
SEARCH_RADIUS_KM = 50  # km
 
 
async def geocode_location(location: str) -> Optional[tuple[float, float]]:
    """Return (lat, lon) for a free-text location, or None on failure."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                NOMINATIM_URL,
                params={"q": location, "format": "json", "limit": 1},
                headers={"User-Agent": "TravelAI/1.0"},
            )
            data = resp.json()
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception:
        pass
    return None
 
 
def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
 
 
@router.get("/", response_model=List[schemas.SafeStayOut])
async def list_safe_stays(
    stay_type: Optional[str] = Query(None, description="Women-only | Women-preferred"),
    location: Optional[str] = Query(None, description="City/address to search near"),
    check_in: Optional[str] = Query(None),
    check_out: Optional[str] = Query(None),
    radius_km: int = Query(SEARCH_RADIUS_KM, description="Search radius in km"),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    q = db.query(models.SafeStay)
    if stay_type:
        q = q.filter(models.SafeStay.stay_type == stay_type)
 
    if location:
        # 1. Try text match first (fast)
        local_results = q.filter(
            models.SafeStay.location.ilike(f"%{location}%")
        ).order_by(models.SafeStay.rating.desc()).all()
 
        if local_results:
            return local_results
 
        # 2. Use AI to fetch 'real' stays if nothing in DB
        ai_stays = await search_safe_stays(location, "safe for women", check_in, check_out)
        # Ensure only high rated ones are returned
        ai_stays.sort(key=lambda x: x.get("rating", 0), reverse=True)
        return ai_stays
 
    return q.order_by(models.SafeStay.rating.desc()).all()
 
 
@router.post("/", response_model=schemas.SafeStayOut, status_code=201)
def create_safe_stay(
    stay: schemas.SafeStayCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    """Register a new safe stay (admin / data-entry use)."""
    new_stay = models.SafeStay(**stay.dict())
    db.add(new_stay)
    db.commit()
    db.refresh(new_stay)
    return new_stay
 
 
@router.delete("/{stay_id}", status_code=204)
def delete_safe_stay(
    stay_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    stay = db.query(models.SafeStay).filter(models.SafeStay.id == stay_id).first()
    if not stay:
        raise HTTPException(status_code=404, detail="Stay not found")
    db.delete(stay)
    db.commit()
