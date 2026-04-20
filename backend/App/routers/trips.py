from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from .. import models, schemas
from ..database import get_db
from ..core.auth import get_current_user
from ..ai.itinerary import generate_itinerary

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.post("/plan", response_model=schemas.Trip)
async def plan_trip(
    trip_data: schemas.TripCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.Trip).filter(
        models.Trip.user_id == current_user.id,
        models.Trip.destination_name == trip_data.destination_name,
        models.Trip.start_date == trip_data.start_date,
        models.Trip.end_date == trip_data.end_date
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=409, 
            detail=f"An itinerary for {trip_data.destination_name} on these dates already exists in your trips."
        )
    
    # Creating the trip record
    new_trip = models.Trip(
        user_id=current_user.id,
        destination_name=trip_data.destination_name,
        destination_lat=trip_data.destination_lat,
        destination_lon=trip_data.destination_lon,
        start_date=trip_data.start_date,
        end_date=trip_data.end_date,
        budget=trip_data.budget,
        travel_style=trip_data.travel_style,
        preferences=trip_data.preferences,
        stay_type=trip_data.stay_type,
        safety_mode=trip_data.safety_mode,
        women_prefs=trip_data.women_prefs,
        accommodation_prefs=trip_data.accommodation_prefs,
        dietary_pref=trip_data.dietary_pref,
    )
    
    try:
        db.add(new_trip)
        db.commit()
        db.refresh(new_trip)
        
        # Generating the itinerary 
        itinerary_json = await generate_itinerary(new_trip, current_user)
        
        # Saving the itinerary record
        new_itinerary = models.Itinerary(
            trip_id=new_trip.id,
            content=itinerary_json
        )
        db.add(new_itinerary)
        db.commit()
        db.refresh(new_trip) 
        
    except Exception as e:
        db.rollback()
        raise e
        
    return new_trip

@router.get("/{trip_id}", response_model=schemas.Trip)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    trip = db.query(models.Trip).options(joinedload(models.Trip.itinerary)).filter(
        models.Trip.id == trip_id,
        models.Trip.user_id == current_user.id
    ).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@router.get("/", response_model=List[schemas.Trip])
def get_user_trips(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    trips = db.query(models.Trip).options(joinedload(models.Trip.itinerary)).filter(
        models.Trip.user_id == current_user.id
    ).all()
    return trips

@router.delete("/{trip_id}")
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    trip = db.query(models.Trip).filter(
        models.Trip.id == trip_id,
        models.Trip.user_id == current_user.id
    ).first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    try:
        db.delete(trip)
        db.commit()
        return {"detail": "Trip deleted successfully"}
    except Exception as e:
        db.rollback()
        raise e
