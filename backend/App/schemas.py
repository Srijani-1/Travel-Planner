from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime

# --- User Schemas --- #
class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None

class UserLogin(BaseModel):
    identifier : str
    password: str

class User(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Trip Schemas --- #
class TripBase(BaseModel):
    destination_name: str
    destination_lat: Optional[float] = None
    destination_lon: Optional[float] = None
    start_date: datetime
    end_date: datetime
    budget: Optional[int] = None
    travel_style: Optional[str] = None  # Solo, Friends, Family
    preferences: Optional[List[str]] = []
    stay_type: Optional[str] = None
    safety_mode: bool = False
    women_prefs: Optional[Dict[str, bool]] = {}
    accommodation_prefs: Optional[List[str]] = []
    dietary_pref: Optional[str] = "None"

class TripCreate(TripBase):
    pass

class Trip(TripBase):
    id: int
    user_id: int
    safety_score: Optional[int] = None
    created_at: datetime
    itinerary: Optional["Itinerary"] = None
    model_config = ConfigDict(from_attributes=True)


# --- Itinerary Schemas --- #
class ItineraryBase(BaseModel):
    content: Any  # Structured JSON content from front-end or AI

class ItineraryCreate(ItineraryBase):
    trip_id: int

class Itinerary(ItineraryBase):
    id: int
    trip_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- SavedPlace Schemas --- #
class SavedPlaceBase(BaseModel):
    place_id: str
    place_name: str
    place_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class SavedPlaceCreate(SavedPlaceBase):
    pass

class SavedPlace(SavedPlaceBase):
    id: int
    user_id: int
    saved_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Review Schemas --- #
class ReviewBase(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    trip_id: int

class Review(ReviewBase):
    id: int
    user_id: int
    trip_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Auth Schemas --- #
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

Trip.model_rebuild()
class UserProfile(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class OTPVerify(BaseModel):
    user_id: int
    otp: str = Field(min_length=6, max_length=6)

class OTPResend(BaseModel):
    user_id: int

class GoogleAuth(BaseModel):
    token: str   # Google ID token from frontend
