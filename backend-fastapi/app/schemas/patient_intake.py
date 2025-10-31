from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


# Medication schema
class MedicationItem(BaseModel):
    name: str
    dosage: str
    frequency: str


# Intake form request/response schemas
class PatientIntakeFormCreate(BaseModel):
    """Create new intake form"""
    # Demographics
    preferred_name: Optional[str] = None
    preferred_pronouns: Optional[str] = None

    # Emergency Contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None

    # Insurance
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_group_number: Optional[str] = None
    insurance_subscriber_name: Optional[str] = None
    insurance_subscriber_relationship: Optional[str] = None
    insurance_subscriber_dob: Optional[datetime] = None

    # Medical History
    primary_care_physician: Optional[str] = None
    pcp_phone: Optional[str] = None
    current_medications: Optional[List[MedicationItem]] = None
    medication_allergies: Optional[str] = None

    # Mental Health History
    previous_mental_health_treatment: Optional[bool] = None
    previous_therapist_name: Optional[str] = None
    previous_treatment_dates: Optional[str] = None
    previous_psychiatric_medications: Optional[str] = None
    previous_hospitalizations: Optional[str] = None
    family_mental_health_history: Optional[str] = None

    # Current Symptoms
    primary_concerns: Optional[List[str]] = None
    symptom_duration: Optional[str] = None
    symptom_severity: Optional[int] = Field(None, ge=1, le=10)

    # Screening Scores
    phq9_score: Optional[int] = Field(None, ge=0, le=27)
    gad7_score: Optional[int] = Field(None, ge=0, le=21)

    # Safety Assessment
    current_suicidal_ideation: bool = False
    suicide_plan: bool = False
    suicide_attempt_history: bool = False
    suicide_attempt_details: Optional[str] = None
    self_harm_history: bool = False
    self_harm_details: Optional[str] = None

    # Substance Use
    alcohol_use: Optional[str] = None
    substance_use: Optional[str] = None
    tobacco_use: Optional[bool] = None

    # Goals & Preferences
    treatment_goals: Optional[str] = None
    preferred_appointment_times: Optional[List[str]] = None
    session_frequency_preference: Optional[str] = None

    # Consents
    consent_to_treatment: bool = False
    consent_to_telehealth: bool = False
    hipaa_acknowledgment: bool = False


class PatientIntakeFormUpdate(BaseModel):
    """Update existing intake form - all fields optional"""
    # All fields from Create but optional
    preferred_name: Optional[str] = None
    preferred_pronouns: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_group_number: Optional[str] = None
    insurance_subscriber_name: Optional[str] = None
    insurance_subscriber_relationship: Optional[str] = None
    insurance_subscriber_dob: Optional[datetime] = None
    primary_care_physician: Optional[str] = None
    pcp_phone: Optional[str] = None
    current_medications: Optional[List[MedicationItem]] = None
    medication_allergies: Optional[str] = None
    previous_mental_health_treatment: Optional[bool] = None
    previous_therapist_name: Optional[str] = None
    previous_treatment_dates: Optional[str] = None
    previous_psychiatric_medications: Optional[str] = None
    previous_hospitalizations: Optional[str] = None
    family_mental_health_history: Optional[str] = None
    primary_concerns: Optional[List[str]] = None
    symptom_duration: Optional[str] = None
    symptom_severity: Optional[int] = Field(None, ge=1, le=10)
    phq9_score: Optional[int] = Field(None, ge=0, le=27)
    gad7_score: Optional[int] = Field(None, ge=0, le=21)
    current_suicidal_ideation: Optional[bool] = None
    suicide_plan: Optional[bool] = None
    suicide_attempt_history: Optional[bool] = None
    suicide_attempt_details: Optional[str] = None
    self_harm_history: Optional[bool] = None
    self_harm_details: Optional[str] = None
    alcohol_use: Optional[str] = None
    substance_use: Optional[str] = None
    tobacco_use: Optional[bool] = None
    treatment_goals: Optional[str] = None
    preferred_appointment_times: Optional[List[str]] = None
    session_frequency_preference: Optional[str] = None
    consent_to_treatment: Optional[bool] = None
    consent_to_telehealth: Optional[bool] = None
    hipaa_acknowledgment: Optional[bool] = None


class PatientIntakeFormResponse(BaseModel):
    """Response schema for intake form"""
    id: int
    patient_id: int
    status: str

    # All form fields
    preferred_name: Optional[str] = None
    preferred_pronouns: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_group_number: Optional[str] = None
    insurance_subscriber_name: Optional[str] = None
    insurance_subscriber_relationship: Optional[str] = None
    insurance_subscriber_dob: Optional[datetime] = None
    primary_care_physician: Optional[str] = None
    pcp_phone: Optional[str] = None
    current_medications: Optional[List[Dict]] = None
    medication_allergies: Optional[str] = None
    previous_mental_health_treatment: Optional[bool] = None
    previous_therapist_name: Optional[str] = None
    previous_treatment_dates: Optional[str] = None
    previous_psychiatric_medications: Optional[str] = None
    previous_hospitalizations: Optional[str] = None
    family_mental_health_history: Optional[str] = None
    primary_concerns: Optional[List[str]] = None
    symptom_duration: Optional[str] = None
    symptom_severity: Optional[int] = None
    phq9_score: Optional[int] = None
    gad7_score: Optional[int] = None
    current_suicidal_ideation: bool
    suicide_plan: bool
    suicide_attempt_history: bool
    suicide_attempt_details: Optional[str] = None
    self_harm_history: bool
    self_harm_details: Optional[str] = None
    alcohol_use: Optional[str] = None
    substance_use: Optional[str] = None
    tobacco_use: Optional[bool] = None
    treatment_goals: Optional[str] = None
    preferred_appointment_times: Optional[List[str]] = None
    session_frequency_preference: Optional[str] = None
    consent_to_treatment: bool
    consent_to_telehealth: bool
    hipaa_acknowledgment: bool

    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
