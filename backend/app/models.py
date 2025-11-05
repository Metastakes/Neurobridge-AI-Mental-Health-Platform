"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Literal
from datetime import datetime


# Session models
class SessionCreate(BaseModel):
    """Create a new session"""
    patient_age_range: str = Field(..., description="e.g., '25-30'")
    patient_sex: Literal['M', 'F', 'Other']
    patient_ethnicity: str
    chief_complaint: str = Field(..., description="Primary reason for visit")


class SessionResponse(BaseModel):
    """Session response"""
    id: str
    session_number: int
    user_id: str
    status: Literal['active', 'completed', 'error']
    created_at: datetime


# Transcript models
class TranscriptSegment(BaseModel):
    """A segment of transcribed audio"""
    text: str
    speaker: Literal['provider', 'patient']
    timestamp: float
    confidence: float = Field(ge=0.0, le=1.0)


# AI Suggestion models
class AISuggestion(BaseModel):
    """AI-generated suggestion"""
    type: Literal['question', 'safety_alert', 'clinical_note']
    priority: Literal['low', 'medium', 'high', 'critical']
    title: str
    content: str
    timestamp: float


# MSE models
class MSEData(BaseModel):
    """Mental Status Exam data"""
    appearance: Optional[str] = None
    behavior: Optional[str] = None
    speech: Optional[str] = None
    mood: Optional[str] = None
    affect: Optional[str] = None
    thought_process: Optional[str] = None
    thought_content: Optional[str] = None
    perception: Optional[str] = None
    cognition: Optional[str] = None
    insight: Optional[str] = None
    judgment: Optional[str] = None


# Medication models
class Medication(BaseModel):
    """Medication entry"""
    name: str
    dose: str
    frequency: str
    route: str
    indication: str


class MedicationCheck(BaseModel):
    """Check for drug interactions"""
    medications: List[str]


class DrugInteraction(BaseModel):
    """Drug interaction warning"""
    drug1: str
    drug2: str
    severity: Literal['minor', 'moderate', 'major', 'contraindicated']
    description: str
    recommendation: str


# Diagnosis models
class Diagnosis(BaseModel):
    """Diagnosis entry"""
    icd10_code: str
    description: str
    type: Literal['primary', 'secondary']


# Documentation models
class SOAPNote(BaseModel):
    """SOAP note output"""
    subjective: str
    objective: str
    assessment: str
    plan: str


class COREELMSOutput(BaseModel):
    """CORE ELMS formatted output"""
    session_number: int
    date: str
    patient_id: str  # De-identified
    duration_minutes: int
    diagnoses: List[str]
    interventions: List[str]
    clinical_notes: str


# User models
class UserCreate(BaseModel):
    """User registration"""
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    school: Optional[str] = None
    graduation_year: Optional[int] = None


class UserLogin(BaseModel):
    """User login"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User data response"""
    id: str
    email: str
    full_name: str
    school: Optional[str]
    graduation_year: Optional[int]
    subscription_status: Literal['trial', 'active', 'canceled', 'expired']


# Progress models
class ProgressResponse(BaseModel):
    """User progress data"""
    total_sessions: int
    total_hours: float
    current_streak_days: int
    longest_streak_days: int
    xp: int
    level: int


class Achievement(BaseModel):
    """Achievement/badge"""
    badge_type: str
    name: str
    description: str
    icon: str
    earned_at: Optional[datetime] = None
