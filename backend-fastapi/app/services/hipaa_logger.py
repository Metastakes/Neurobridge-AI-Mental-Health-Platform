from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class HIPAALogger:
    """
    HIPAA-compliant audit logging service
    Tracks all PHI access: who, what, when, where, why
    """

    @staticmethod
    def log_phi_access(
        db: Session,
        user_id: int,
        action: str,
        resource_type: str,
        resource_id: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        reason: Optional[str] = None,
        changes: Optional[str] = None,
    ):
        """
        Log PHI access for HIPAA compliance
        Required audit trail elements:
        - WHO: user_id
        - WHAT: action, resource_type, resource_id
        - WHEN: created_at (automatic timestamp)
        - WHERE: ip_address, user_agent
        - WHY: reason (optional)
        """
        try:
            audit_log = AuditLog(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                ip_address=ip_address,
                user_agent=user_agent,
                reason=reason,
                changes=changes,
            )
            db.add(audit_log)
            db.commit()

            logger.info(
                f"HIPAA Audit: User {user_id} performed '{action}' on {resource_type}:{resource_id}"
            )
        except Exception as e:
            logger.error(f"Failed to create audit log: {str(e)}")
            # Don't raise exception - audit logging failure shouldn't block operations
            # But log it for investigation

    @staticmethod
    def log_appointment_access(
        db: Session, user_id: int, appointment_id: int, action: str, ip_address: str = None
    ):
        """Convenience method for logging appointment access"""
        HIPAALogger.log_phi_access(
            db=db,
            user_id=user_id,
            action=action,
            resource_type="Appointment",
            resource_id=appointment_id,
            ip_address=ip_address,
        )

    @staticmethod
    def log_patient_access(
        db: Session, user_id: int, patient_id: int, action: str, ip_address: str = None
    ):
        """Convenience method for logging patient record access"""
        HIPAALogger.log_phi_access(
            db=db,
            user_id=user_id,
            action=action,
            resource_type="Patient",
            resource_id=patient_id,
            ip_address=ip_address,
        )

    @staticmethod
    def log_medication_access(
        db: Session,
        user_id: int,
        medication_id: int,
        action: str,
        ip_address: str = None,
    ):
        """Convenience method for logging medication education access"""
        HIPAALogger.log_phi_access(
            db=db,
            user_id=user_id,
            action=action,
            resource_type="MedicationEducation",
            resource_id=medication_id,
            ip_address=ip_address,
        )
