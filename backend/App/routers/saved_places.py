from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..core.auth import get_current_user

router = APIRouter(prefix="/saved-places", tags=["Saved Places"])

@router.get("/", response_model=List[schemas.SavedPlace])
def list_saved_places(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.SavedPlace).filter(
        models.SavedPlace.user_id == current_user.id
    ).order_by(models.SavedPlace.created_at.desc()).all()

@router.post("/", response_model=schemas.SavedPlace)
def save_place(
    place: schemas.SavedPlaceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_place = models.SavedPlace(**place.dict(), user_id=current_user.id)
    db.add(new_place)
    db.commit()
    db.refresh(new_place)
    return new_place

@router.delete("/{place_id}")
def delete_saved_place(
    place_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    place = db.query(models.SavedPlace).filter(
        models.SavedPlace.id == place_id,
        models.SavedPlace.user_id == current_user.id
    ).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    db.delete(place)
    db.commit()
    return {"detail": "Deleted"}
