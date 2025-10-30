from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.enums import AppointmentStatus, PaymentType


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)

    # FIX #1 APPLIED: Foreign keys reference users.id (not separate patient/provider tables)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    appointment_type = Column(String(100), nullable=False, default="therapy_session")
    status = Column(Enum(AppointmentStatus), nullable=False, default=AppointmentStatus.SCHEDULED, index=True)
    payment_type = Column(Enum(PaymentType), nullable=False)

    starts_at = Column(DateTime(timezone=True), nullable=False, index=True)
    ends_at = Column(DateTime(timezone=True), nullable=False)

    # Billing tracking
    amount_cents = Column(Integer, nullable=False)
    no_show_fee_charged_cents = Column(Integer, nullable=True, default=0)
    admin_fee_cents = Column(Integer, nullable=True, default=0)

    # Clinical notes (encrypted at rest by application layer)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # FIX #1 APPLIED: Correct relationships to User model (not Patient/Provider models)
    patient_user = relationship("User", foreign_keys=[patient_id], backref="patient_appointments")
    provider_user = relationship("User", foreign_keys=[provider_id], backref="provider_appointments")

    def __repr__(self):
        return f"<Appointment(id={self.id}, patient_id={self.patient_id}, provider_id={self.provider_id}, status={self.status})>"
