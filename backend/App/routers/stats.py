from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas
from ..database import get_db
from ..core.auth import get_current_user
from datetime import date

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    today = date.today()

    trips_planned = db.query(func.count(models.Trip.id)).filter(
        models.Trip.user_id == current_user.id
    ).scalar()

    trips_completed = db.query(func.count(models.Trip.id)).filter(
        models.Trip.user_id == current_user.id,
        models.Trip.status == "completed"
    ).scalar()

    saved_places = db.query(func.count(models.SavedPlace.id)).filter(
        models.SavedPlace.user_id == current_user.id
    ).scalar()

    # Distinct countries from destination_name (rough heuristic)
    all_destinations = db.query(models.Trip.destination_name).filter(
        models.Trip.user_id == current_user.id,
        models.Trip.status == "completed"
    ).all()
    countries = set()
    for (dest,) in all_destinations:
        if dest:
            countries.add(dest.split(",")[-1].strip())

    upcoming = db.query(models.Trip).filter(
        models.Trip.user_id == current_user.id,
        models.Trip.status != "completed"
    ).order_by((models.Trip.status == "next").desc(), models.Trip.start_date).limit(5).all()

    upcoming_list = [
        {
            "id": t.id,
            "name": t.destination_name,
            "date": f"{t.start_date.strftime('%b %d')} – {t.end_date.strftime('%b %d')}",
            "days_left": (t.start_date.date() - today).days,
            "status": t.status,
            "lat": t.destination_lat,
            "lon": t.destination_lon,
        }
        for t in upcoming
    ]

    return schemas.DashboardStats(
        trips_planned=trips_planned,
        trips_completed=trips_completed,
        saved_places=saved_places,
        countries_visited=len(countries),
        upcoming_trips=upcoming_list,
    )
