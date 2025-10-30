from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class AuditLog(Base):
    """
    HIPAA-compliant audit logging
    Tracks all PHI access: who, what, when, where, why
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    # WHO: User performing the action
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # WHAT: Action performed
    action = Column(String(100), nullable=False, index=True)
    """
    Examples: VIEW_PATIENT, UPDATE_APPOINTMENT, CREATE_PRESCRIPTION, EXPORT_RECORDS
    """

    # WHAT: Resource accessed
    resource_type = Column(String(100), nullable=False)
    """
    Examples: Patient, Appointment, MedicationEducation, Referral
    """
    resource_id = Column(Integer, nullable=False, index=True)

    # WHERE: Network information
    ip_address = Column(String(45), nullable=True)  # IPv6 support
    user_agent = Column(String(500), nullable=True)

    # WHY: Context (optional)
    reason = Column(Text, nullable=True)

    # Additional metadata
    changes = Column(Text, nullable=True)  # JSON string of what changed

    # WHEN: Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationship
    user = relationship("User", foreign_keys=[user_id], backref="audit_logs")

    def __repr__(self):
        return f"<AuditLog(id={self.id}, user_id={self.user_id}, action={self.action}, resource={self.resource_type}:{self.resource_id})>"
