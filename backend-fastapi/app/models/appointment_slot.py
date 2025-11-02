from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class AppointmentSlot(Base):
    """
    Available appointment time slots for booking
    Generated from provider availability
    """
    __tablename__ = "appointment_slots"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False, index=True)

    # Slot timing
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    timezone = Column(String(50), nullable=False, default="America/New_York")

    # Booking status
    is_booked = Column(Boolean, nullable=False, default=False, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True, index=True)

    # Slot metadata
    slot_type = Column(String(50), nullable=True)  # initial_consultation, follow_up, therapy, etc.
    is_telehealth = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())

    # Relationships
    provider = relationship("Provider")
    appointment = relationship("Appointment")

    # Composite index for efficient queries
    __table_args__ = (
        Index('ix_provider_slots_available', 'provider_id', 'start_time', 'is_booked'),
    )
