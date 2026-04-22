from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models
from ..database import get_db
from ..core.auth import get_current_user
from ..ai.recommender import generate_recommendations
from datetime import datetime,timedelta

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

cache = {} 

@router.get("/")
async def get_recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_id = current_user.id
    if user_id in cache:
        data, timestamp = cache[user_id]
        if datetime.now() - timestamp < timedelta(hours=1):
            return data
    past_trips = db.query(models.Trip).filter(
        models.Trip.user_id == user_id
    ).order_by(models.Trip.start_date.desc()).limit(5).all()

    recs = await generate_recommendations(current_user, past_trips)

    # ✅ Save to cache
    cache[user_id] = (recs, datetime.now())

    return recs