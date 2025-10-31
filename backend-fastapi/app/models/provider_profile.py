from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, JSON, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class ProviderProfile(Base):
    """
    Extended provider profile for search and matching
    Complements the Provider table with searchable metadata
    """
    __tablename__ = "provider_profiles"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False, unique=True, index=True)

    # Professional Details
    years_experience = Column(Integer, nullable=True)
    languages_spoken = Column(JSON, nullable=True)  # Array of language codes
    education = Column(JSON, nullable=True)  # Array of {degree, institution, year}
    certifications = Column(JSON, nullable=True)  # Array of certification names

    # Practice Details
    accepts_new_patients = Column(Boolean, nullable=False, default=True, index=True)
    min_age = Column(Integer, nullable=True)  # Minimum patient age
    max_age = Column(Integer, nullable=True)  # Maximum patient age

    # Specialties & Conditions Treated
    specialty_ids = Column(JSON, nullable=True)  # Array of specialty IDs
    conditions_treated = Column(JSON, nullable=True)  # Array of condition tags
    treatment_modalities = Column(JSON, nullable=True)  # Array of therapy types (CBT, DBT, EMDR, etc.)

    # Insurance
    insurance_plan_ids = Column(JSON, nullable=True)  # Array of insurance plan IDs
    accepts_medicare = Column(Boolean, nullable=False, default=False, index=True)
    accepts_medicaid = Column(Boolean, nullable=False, default=False, index=True)
    accepts_self_pay = Column(Boolean, nullable=False, default=True)

    # Availability & Scheduling
    average_response_time_hours = Column(Integer, nullable=True)
    earliest_availability_date = Column(String(10), nullable=True)  # YYYY-MM-DD
    session_duration_minutes = Column(Integer, nullable=False, default=50)

    # Ratings & Reviews
    rating_average = Column(Numeric(3, 2), nullable=True)  # 0.00 - 5.00
    rating_count = Column(Integer, nullable=False, default=0)

    # Profile Completeness
    profile_photo_url = Column(String(500), nullable=True)
    video_intro_url = Column(String(500), nullable=True)
    bio_long = Column(Text, nullable=True)  # Extended bio for profile page

    # SEO & Search
    search_keywords = Column(Text, nullable=True)  # Computed field for full-text search
    is_featured = Column(Boolean, nullable=False, default=False, index=True)
    display_order = Column(Integer, nullable=True)

    # Metadata
    last_profile_update = Column(String(10), nullable=True)  # YYYY-MM-DD
    is_verified = Column(Boolean, nullable=False, default=False, index=True)

    # Relationships
    provider = relationship("Provider", back_populates="profile")
