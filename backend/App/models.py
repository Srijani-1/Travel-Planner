from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime
 
class User(Base):
    __tablename__ = "users"
 
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone = Column(String(16))
    is_google = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ride_bookings = relationship("RideBooking", back_populates="user")
    # Relationships
    trips = relationship("Trip", back_populates="user")
    saved_places = relationship("SavedPlace", back_populates="user")
    reviews = relationship("Review", back_populates="user")
 
 
class PendingUser(Base):
    __tablename__ = "pending_users"
 
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone = Column(String(16), nullable=True)
    otp_code = Column(String(6), nullable=False)
    otp_expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
 
 
class Trip(Base):
    __tablename__ = "trips"
 
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    destination_name = Column(String, nullable=False)
    destination_lat = Column(Float)
    destination_lon = Column(Float)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    budget = Column(Integer)
    travel_style = Column(String)  # Solo, Friends, Family
    preferences = Column(JSON)  # List of interests
    stay_type = Column(String)
    rating_min = Column(Integer)
    safety_mode = Column(Boolean, default=False)
    women_prefs = Column(JSON) # Detailed safety toggles
    accommodation_prefs = Column(JSON) # e.g. ["Sea-side view", "Pool"]
    dietary_pref = Column(String) # e.g. "Veg", "Non-Veg", "Vegan"
    safety_score = Column(Integer)
    status = Column(String, default="planned") # planned | next | completed
 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
 
    # Relationships
    user = relationship("User", back_populates="trips")
    itinerary = relationship("Itinerary", back_populates="trip", uselist=False, cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="trip", cascade="all, delete-orphan")
 
 
class Itinerary(Base):
    __tablename__ = "itineraries"
 
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    content = Column(JSON, nullable=False)  # Structured itinerary data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
 
    # Relationships
    trip = relationship("Trip", back_populates="itinerary")
 
 
class SavedPlace(Base):
    __tablename__ = "saved_places"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    category = Column(String)          # "restaurant" | "hotel" | "attraction"
    notes = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
 
    user = relationship("User", back_populates="saved_places")
 
 
class SafeStay(Base):
    __tablename__ = "safe_stays"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    stay_type = Column(String, nullable=False)   # "Women-only" | "Women-preferred"
    price_per_night = Column(String)
    currency = Column(String, default="USD")
    rating = Column(Float)
    review_count = Column(Integer, default=0)
    badges = Column(JSON, default=list)           # ["CCTV", "24/7 Staff", ...]
    image_url = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    booking_url = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
 
 
class RideBooking(Base):
    __tablename__ = "ride_bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    driver_id = Column(Integer, ForeignKey("safe_drivers.id"), nullable=True)  # nullable now
    pickup = Column(String)
    dropoff = Column(String)
    platform = Column(String, nullable=True)  # "uber" | "ola" | "rapido" | "indrive"
    status = Column(String, default="pending")   # pending | confirmed | completed | cancelled
    booked_at = Column(DateTime, default=datetime.utcnow)
 
    user = relationship("User", back_populates="ride_bookings")
    driver = relationship("SafeDriver", foreign_keys=[driver_id])
 
 
class SafeDriver(Base):
    __tablename__ = "safe_drivers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    rating = Column(Float)
    total_trips = Column(Integer, default=0)
    vehicle = Column(String)
    plate = Column(String)
    available = Column(Boolean, default=True)
    verified = Column(Boolean, default=True)
    city = Column(String)
    price_min = Column(Integer)
    price_max = Column(Integer)
    eta_minutes = Column(Integer)
    phone = Column(String, nullable=True)
 
 
class SOSAlert(Base):
    __tablename__ = "sos_alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    lat = Column(Float)
    lon = Column(Float)
    message = Column(String, nullable=True)
    contacts_notified = Column(JSON, default=list)
    triggered_at = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)
 
 
class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    relation = Column(String)
    is_verified = Column(Boolean, default=False)
    verification_code = Column(String(6), nullable=True)
 
 
class Review(Base):
    __tablename__ = "reviews"
 
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
 
    # Relationships
    trip = relationship("Trip", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
