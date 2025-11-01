from fastapi import APIRouter
from app.api.v1 import (
    auth,
    appointments,
    earnings,
    payments,
    pre_session,
    medication,
    referrals,
    provider_application,
    provider_documents,
    specialties,
    provider_availability,
    provider_search,
    appointment_booking,
    patient_intake,
    video_sessions,
    assessments,
    treatment_goals,
)

api_router = APIRouter()

# Core routes
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
api_router.include_router(earnings.router, prefix="/earnings", tags=["Earnings"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(pre_session.router, prefix="/pre-session", tags=["Pre-Session Tasks"])
api_router.include_router(medication.router, prefix="/medication", tags=["Medication Education"])
api_router.include_router(referrals.router, prefix="/referrals", tags=["Referrals"])

# Provider onboarding routes (Phase 2)
api_router.include_router(provider_application.router, prefix="/provider", tags=["Provider Onboarding"])
api_router.include_router(provider_documents.router, prefix="/provider", tags=["Provider Documents"])
api_router.include_router(provider_availability.router, prefix="/provider", tags=["Provider Availability"])

# Patient intake & scheduling routes (Phase 3)
api_router.include_router(provider_search.router, prefix="/search", tags=["Provider Search"])
api_router.include_router(appointment_booking.router, prefix="/booking", tags=["Appointment Booking"])
api_router.include_router(patient_intake.router, prefix="/patient", tags=["Patient Intake"])

# Telehealth video routes (Phase 4)
api_router.include_router(video_sessions.router, prefix="/video-sessions", tags=["Video Sessions"])

# Progress tracking routes (Phase 5)
api_router.include_router(assessments.router, prefix="/assessments", tags=["Assessments"])
api_router.include_router(treatment_goals.router, prefix="/treatment-goals", tags=["Treatment Goals"])

# Reference data routes
api_router.include_router(specialties.router, tags=["Reference Data"])
