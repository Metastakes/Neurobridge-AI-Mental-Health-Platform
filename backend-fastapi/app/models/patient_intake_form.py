from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from enum import Enum as PyEnum


class IntakeFormStatus(str, PyEnum):
    DRAFT = "DRAFT"
    COMPLETED = "COMPLETED"
    REVIEWED = "REVIEWED"


class PatientIntakeForm(Base):
    """
    Comprehensive patient intake form
    Collected during patient registration or first appointment
    """
    __tablename__ = "patient_intake_forms"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)

    # Form status
    status = Column(String(20), nullable=False, default="DRAFT", index=True)

    # Demographics (already in User table, but collected here for confirmation)
    preferred_name = Column(String(100), nullable=True)
    preferred_pronouns = Column(String(50), nullable=True)

    # Contact Information
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    emergency_contact_relationship = Column(String(100), nullable=True)

    # Insurance Information
    insurance_provider = Column(String(255), nullable=True)
    insurance_policy_number = Column(String(100), nullable=True)
    insurance_group_number = Column(String(100), nullable=True)
    insurance_subscriber_name = Column(String(255), nullable=True)
    insurance_subscriber_relationship = Column(String(50), nullable=True)
    insurance_subscriber_dob = Column(DateTime, nullable=True)

    # Medical History
    primary_care_physician = Column(String(255), nullable=True)
    pcp_phone = Column(String(20), nullable=True)

    current_medications = Column(JSON, nullable=True)  # Array of {name, dosage, frequency}
    medication_allergies = Column(Text, nullable=True)

    # Mental Health History
    previous_mental_health_treatment = Column(Boolean, nullable=True)
    previous_therapist_name = Column(String(255), nullable=True)
    previous_treatment_dates = Column(String(100), nullable=True)

    previous_psychiatric_medications = Column(Text, nullable=True)
    previous_hospitalizations = Column(Text, nullable=True)

    family_mental_health_history = Column(Text, nullable=True)

    # Current Symptoms (checkboxes + details)
    primary_concerns = Column(JSON, nullable=True)  # Array of concern categories
    symptom_duration = Column(String(100), nullable=True)
    symptom_severity = Column(Integer, nullable=True)  # 1-10 scale

    # Behavioral Health Screening
    phq9_score = Column(Integer, nullable=True)  # Depression screening (0-27)
    gad7_score = Column(Integer, nullable=True)  # Anxiety screening (0-21)

    # Safety Assessment
    current_suicidal_ideation = Column(Boolean, nullable=False, default=False)
    suicide_plan = Column(Boolean, nullable=False, default=False)
    suicide_attempt_history = Column(Boolean, nullable=False, default=False)
    suicide_attempt_details = Column(Text, nullable=True)

    self_harm_history = Column(Boolean, nullable=False, default=False)
    self_harm_details = Column(Text, nullable=True)

    # Substance Use
    alcohol_use = Column(String(50), nullable=True)  # Never, Occasionally, Regularly, Daily
    substance_use = Column(Text, nullable=True)
    tobacco_use = Column(Boolean, nullable=True)

    # Goals & Preferences
    treatment_goals = Column(Text, nullable=True)
    preferred_appointment_times = Column(JSON, nullable=True)  # Array of day/time preferences
    session_frequency_preference = Column(String(50), nullable=True)  # Weekly, Bi-weekly, Monthly

    # Legal & Administrative
    consent_to_treatment = Column(Boolean, nullable=False, default=False)
    consent_to_telehealth = Column(Boolean, nullable=False, default=False)
    hipaa_acknowledgment = Column(Boolean, nullable=False, default=False)

    # Metadata
    completed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    provider_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="intake_forms")
