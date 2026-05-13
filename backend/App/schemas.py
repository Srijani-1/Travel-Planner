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
    status: Optional[str] = "planned"
 
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
class SavedPlaceCreate(BaseModel):
    name: str
    lat: float
    lon: float
    category: Optional[str] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None
 
class SavedPlace(SavedPlaceCreate):
    id: int
    created_at: datetime
    class Config: from_attributes = True
 
 
# --- SafeStay Schemas --- #
class SafeStayCreate(BaseModel):
    name: str
    location: str
    stay_type: str  # "Women-only" | "Women-preferred"
    price_per_night: Optional[str] = None
    currency: Optional[str] = "USD"
    rating: Optional[float] = None
    review_count: Optional[int] = 0
    badges: Optional[List[str]] = []
    image_url: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    booking_url: Optional[str] = None
    verified: Optional[bool] = False
 
class SafeStayOut(BaseModel):
    id: int
    name: str
    location: str
    stay_type: str
    price_per_night: Optional[str]
    rating: Optional[float]
    review_count: int
    badges: List[str]
    image_url: Optional[str]
    lat: Optional[float]
    lon: Optional[float]
    booking_url: Optional[str]
    verified: bool
    class Config: from_attributes = True
 
 
# --- Ride Schemas --- #
class SafeDriverOut(BaseModel):
    id: int
    name: str
    rating: float
    total_trips: int
    vehicle: str
    plate: str
    available: bool
    verified: bool
    city: str
    price_min: int
    price_max: int
    eta_minutes: int
    class Config: from_attributes = True
 
 
class RideBookingCreate(BaseModel):
    pickup: str
    dropoff: str
    platform: Optional[str] = None  # "uber" | "ola" | "rapido" | "indrive"
    driver_id: Optional[int] = None
 
class RideBookingOut(BaseModel):
    id: int
    pickup: str
    dropoff: str
    platform: Optional[str]
    status: str
    booked_at: datetime
    class Config: from_attributes = True
 
 
# --- SOS Schemas --- #
class SOSCreate(BaseModel):
    lat: float
    lon: float
    message: Optional[str] = None
 
class SOSOut(BaseModel):
    id: int
    triggered_at: datetime
    contacts_notified: List[str]
    class Config: from_attributes = True
 
 
class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    relation: Optional[str] = None
    is_verified: bool = False

class EmergencyContactOut(EmergencyContactCreate):
    id: int
    class Config: from_attributes = True
 
 
# --- Dashboard Stats --- #
class DashboardStats(BaseModel):
    trips_planned: int
    trips_completed: int
    saved_places: int
    countries_visited: int
    upcoming_trips: List[dict]
 
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
    token: str

# ── Community Groups ─────────────────────────────────────────────────────────

class CommunityGroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = "general"   # "safety" | "destination" | "solo" | "general"
    is_public: Optional[bool] = True

class CommunityGroupOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    member_count: int
    is_public: bool
    created_at: datetime
    is_member: Optional[bool] = False      # injected in the router

    class Config:
        from_attributes = True


# ── Community Posts / Reports ─────────────────────────────────────────────────

class CommunityPostCreate(BaseModel):
    group_id: Optional[int] = None
    post_type: Optional[str] = "general"   # "general" | "report" | "tip" | "review"
    title: str
    body: str
    location: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

class CommunityPostOut(BaseModel):
    id: int
    group_id: Optional[int]
    post_type: str
    title: str
    body: str
    location: Optional[str]
    upvotes: int
    is_resolved: bool
    created_at: datetime
    author_name: Optional[str] = None     # injected in the router

    class Config:
        from_attributes = True


# ── Post Comments ─────────────────────────────────────────────────────────────

class PostCommentCreate(BaseModel):
    body: str

class PostCommentOut(BaseModel):
    id: int
    post_id: int
    body: str
    created_at: datetime
    author_name: Optional[str] = None

    class Config:
        from_attributes = True


# ── Place Reviews ─────────────────────────────────────────────────────────────

class PlaceReviewCreate(BaseModel):
    place_name: str
    place_type: Optional[str] = None       # "restaurant" | "hotel" | "area" | "transport"
    location: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    rating: int                            # 1–5
    safety_rating: Optional[int] = None   # 1–5
    body: str
    tags: Optional[List[str]] = []

class PlaceReviewOut(BaseModel):
    id: int
    place_name: str
    place_type: Optional[str]
    location: Optional[str]
    rating: int
    safety_rating: Optional[int]
    body: str
    tags: List[str]
    upvotes: int
    created_at: datetime
    author_name: Optional[str] = None

    class Config:
        from_attributes = True
