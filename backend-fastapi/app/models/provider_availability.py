from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Time, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class ProviderAvailability(Base):
    """
    Provider weekly availability schedule
    Used for appointment booking
    """
    __tablename__ = "provider_availability"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False, index=True)

    # Day of week (0=Monday, 6=Sunday)
    day_of_week = Column(Integer, nullable=False, index=True)

    # Time slots
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    # Timezone
    timezone = Column(String(50), nullable=False, default="America/New_York")

    # Status
    is_available = Column(Boolean, default=True)

    # Recurring pattern
    is_recurring = Column(Boolean, default=True)
    effective_date = Column(DateTime, nullable=True)  # When this schedule starts
    end_date = Column(DateTime, nullable=True)  # When this schedule ends (null = indefinite)

    # Override for specific dates
    override_date = Column(DateTime, nullable=True, index=True)  # Specific date override

    # Appointment types allowed during this slot
    allowed_appointment_types = Column(JSON, nullable=True)  # ["initial_consultation", "follow_up", etc.]

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationship
    provider = relationship("Provider", backref="availability_slots")

    def __repr__(self):
        return f"<ProviderAvailability(id={self.id}, provider_id={self.provider_id}, day={self.day_of_week})>"


class ProviderTimeOff(Base):
    """
    Provider time off / blocked dates
    Overrides regular availability
    """
    __tablename__ = "provider_time_off"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False, index=True)

    start_date = Column(DateTime, nullable=False, index=True)
    end_date = Column(DateTime, nullable=False, index=True)

    reason = Column(String(255), nullable=True)
    is_all_day = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    provider = relationship("Provider", backref="time_off")

    def __repr__(self):
        return f"<ProviderTimeOff(id={self.id}, provider_id={self.provider_id})>"
