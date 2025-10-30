from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)

    # Insurance information
    insurance_provider = Column(String(255), nullable=True)
    insurance_policy_number = Column(String(100), nullable=True)

    # GUARANTEE: Payment method required to book appointments
    default_payment_method_id = Column(String(255), nullable=True)  # Stripe payment method ID

    # Assigned provider
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    diagnosis = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # FIX #1 APPLIED: Correct relationships to User model
    user = relationship("User", backref="patient_profile", foreign_keys=[user_id])
    assigned_provider = relationship("User", backref="assigned_patients", foreign_keys=[provider_id])

    def __repr__(self):
        return f"<Patient(id={self.id}, user_id={self.user_id})>"
