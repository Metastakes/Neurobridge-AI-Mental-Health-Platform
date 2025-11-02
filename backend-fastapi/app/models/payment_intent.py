from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class PaymentIntent(Base):
    """
    Tracks Stripe payment intents for appointments and fees
    """
    __tablename__ = "payment_intents"

    id = Column(Integer, primary_key=True, index=True)
    stripe_payment_intent_id = Column(String(255), unique=True, nullable=False, index=True)

    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True, index=True)

    amount_cents = Column(Integer, nullable=False)
    currency = Column(String(3), nullable=False, default="usd")

    status = Column(String(50), nullable=False)  # succeeded, failed, pending, etc.
    payment_method_id = Column(String(255), nullable=True)

    # Metadata
    description = Column(String(500), nullable=True)
    failure_message = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    patient = relationship("User", foreign_keys=[patient_id], backref="payment_intents")
    appointment = relationship("Appointment", backref="payment_intents")

    def __repr__(self):
        return f"<PaymentIntent(id={self.id}, stripe_id={self.stripe_payment_intent_id}, status={self.status})>"
