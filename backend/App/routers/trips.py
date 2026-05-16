from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..core.auth import get_current_user
from ..ai.itinerary import generate_itinerary

router = APIRouter(prefix="/trips", tags=["Trips"])


@router.get("/", response_model=List[schemas.Trip])
def list_trips(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Trip)
        .filter(models.Trip.user_id == current_user.id)
        .order_by(models.Trip.start_date)
        .all()
    )


@router.post("/", response_model=schemas.Trip)
def create_trip(
    trip: schemas.TripCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    new_trip = models.Trip(**trip.dict(), user_id=current_user.id)
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return new_trip


@router.post("/plan", response_model=schemas.Trip)
async def plan_trip(
    trip: schemas.TripCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    new_trip = models.Trip(**trip.dict(), user_id=current_user.id)
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    
    try:
        itinerary_data = await generate_itinerary(new_trip, current_user)
        new_itinerary = models.Itinerary(
            trip_id=new_trip.id,
            content=itinerary_data
        )
        db.add(new_itinerary)
        db.commit()
        db.refresh(new_trip)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate itinerary: {str(e)}")

    return new_trip


@router.get("/{trip_id}", response_model=schemas.Trip)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    trip = (
        db.query(models.Trip)
        .filter(models.Trip.id == trip_id, models.Trip.user_id == current_user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.patch("/{trip_id}", response_model=schemas.Trip)
def update_trip(
    trip_id: int,
    trip_data: schemas.TripBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    trip = (
        db.query(models.Trip)
        .filter(models.Trip.id == trip_id, models.Trip.user_id == current_user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    for field, value in trip_data.dict(exclude_unset=True).items():
        setattr(trip, field, value)
    db.commit()
    db.refresh(trip)
    return trip


# ── FIX: This endpoint was missing – "Mark Visited" / "Set as Next" were silently failing ──
@router.patch("/{trip_id}/status", response_model=schemas.Trip)
def update_trip_status(
    trip_id: int,
    status: str,                               # passed as ?status=next or ?status=completed
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    allowed = {"planned", "next", "completed"}
    if status not in allowed:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status '{status}'. Must be one of: {allowed}",
        )

    trip = (
        db.query(models.Trip)
        .filter(models.Trip.id == trip_id, models.Trip.user_id == current_user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Only one trip can be "next" at a time – demote any existing one
    if status == "next":
        db.query(models.Trip).filter(
            models.Trip.user_id == current_user.id,
            models.Trip.status == "next",
            models.Trip.id != trip_id,
        ).update({"status": "planned"})

    trip.status = status
    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}")
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    trip = (
        db.query(models.Trip)
        .filter(models.Trip.id == trip_id, models.Trip.user_id == current_user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(trip)
    db.commit()
    return {"detail": "Trip deleted"}


# ── Save a place directly from a trip's itinerary ──
@router.post("/{trip_id}/save-place", response_model=schemas.SavedPlace)
def save_place_from_trip(
    trip_id: int,
    place: schemas.SavedPlaceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Bookmark a place discovered while viewing a trip itinerary."""
    trip = (
        db.query(models.Trip)
        .filter(models.Trip.id == trip_id, models.Trip.user_id == current_user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Avoid duplicates by (user_id, name, lat, lon)
    existing = (
        db.query(models.SavedPlace)
        .filter(
            models.SavedPlace.user_id == current_user.id,
            models.SavedPlace.name == place.name,
            models.SavedPlace.lat == place.lat,
            models.SavedPlace.lon == place.lon,
        )
        .first()
    )
    if existing:
        return existing

    new_place = models.SavedPlace(**place.dict(), user_id=current_user.id)
    db.add(new_place)
    db.commit()
    db.refresh(new_place)
    return new_place
