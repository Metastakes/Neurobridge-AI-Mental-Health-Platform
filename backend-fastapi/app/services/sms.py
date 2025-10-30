import re
from twilio.rest import Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class SecureSMSService:
    """
    GUARANTEE: HIPAA-safe SMS with secure deep links (NO PHI in SMS body)
    All messages use templates with only secure links, no patient data
    """

    def __init__(self):
        self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        self.from_number = settings.TWILIO_PHONE_NUMBER

    def send_secure_sms(
        self, to_phone: str, message_type: str, secure_link: str
    ) -> bool:
        """
        Send HIPAA-safe SMS with secure deep link
        GUARANTEE: NO PHI (names, diagnoses, appointment details) in SMS body
        """
        # Message templates - ONLY generic text + secure links
        templates = {
            "APPOINTMENT_REMINDER": f"You have an upcoming appointment. View details securely: {secure_link}",
            "APPOINTMENT_CONFIRMED": f"Your appointment has been confirmed. View details: {secure_link}",
            "PRE_SESSION_REMINDER": f"Please complete your pre-session check-in: {secure_link}",
            "MEDICATION_EDUCATION": f"New medication education module available: {secure_link}",
            "REFERRAL_NOTIFICATION": f"You have a new referral. View details: {secure_link}",
            "APPOINTMENT_CANCELLED": f"An appointment has been cancelled. View details: {secure_link}",
        }

        message_body = templates.get(message_type)
        if not message_body:
            logger.error(f"Unknown message type: {message_type}")
            return False

        # GUARANTEE ENFORCEMENT: Block if PHI detected
        if self._contains_phi(message_body):
            logger.error(
                f"CRITICAL SECURITY VIOLATION: Attempted to send PHI in SMS - BLOCKED"
            )
            return False

        try:
            message = self.client.messages.create(
                body=message_body, from_=self.from_number, to=to_phone
            )
            logger.info(f"SMS sent successfully: {message.sid}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS to {to_phone}: {str(e)}")
            return False

    def _contains_phi(self, message: str) -> bool:
        """
        Detect potential PHI in message body
        GUARANTEE: Block messages containing common PHI patterns
        """
        # Check for common PHI patterns
        phi_patterns = [
            r"\b[A-Z][a-z]+ [A-Z][a-z]+\b",  # Names (capitalized words)
            r"\bdiagnosis\b",
            r"\bmedication\b",
            r"\btherapy\b",
            r"\bprescription\b",
            r"\bdepression\b",
            r"\banxiety\b",
            r"\bPTSD\b",
            r"\b\d{3}-\d{2}-\d{4}\b",  # SSN pattern
            r"\b[A-Z]{2}\d{6}\b",  # License number pattern
        ]

        message_lower = message.lower()
        for pattern in phi_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                return True

        return False
