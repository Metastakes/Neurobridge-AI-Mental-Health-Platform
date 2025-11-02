"""Add patient intake and scheduling tables

Phase 3: Patient Intake & Scheduling
Adds tables for patient intake forms, provider profiles, and appointment slots

Revision ID: 004
Revises: 003
Create Date: 2025-01-31

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Phase 3: Patient Intake & Scheduling Tables
    - patient_intake_forms: Comprehensive patient intake questionnaire
    - provider_profiles: Extended provider metadata for search/matching
    - appointment_slots: Available time slots for booking
    """

    # Create provider_profiles table
    op.create_table(
        'provider_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),

        # Professional Details
        sa.Column('years_experience', sa.Integer(), nullable=True),
        sa.Column('languages_spoken', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('education', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('certifications', postgresql.JSON(astext_type=sa.Text()), nullable=True),

        # Practice Details
        sa.Column('accepts_new_patients', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('min_age', sa.Integer(), nullable=True),
        sa.Column('max_age', sa.Integer(), nullable=True),

        # Specialties & Conditions
        sa.Column('specialty_ids', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('conditions_treated', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('treatment_modalities', postgresql.JSON(astext_type=sa.Text()), nullable=True),

        # Insurance
        sa.Column('insurance_plan_ids', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('accepts_medicare', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('accepts_medicaid', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('accepts_self_pay', sa.Boolean(), nullable=False, server_default='true'),

        # Availability & Scheduling
        sa.Column('average_response_time_hours', sa.Integer(), nullable=True),
        sa.Column('earliest_availability_date', sa.String(length=10), nullable=True),
        sa.Column('session_duration_minutes', sa.Integer(), nullable=False, server_default='50'),

        # Ratings & Reviews
        sa.Column('rating_average', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('rating_count', sa.Integer(), nullable=False, server_default='0'),

        # Profile Completeness
        sa.Column('profile_photo_url', sa.String(length=500), nullable=True),
        sa.Column('video_intro_url', sa.String(length=500), nullable=True),
        sa.Column('bio_long', sa.Text(), nullable=True),

        # SEO & Search
        sa.Column('search_keywords', sa.Text(), nullable=True),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('display_order', sa.Integer(), nullable=True),

        # Metadata
        sa.Column('last_profile_update', sa.String(length=10), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),

        sa.ForeignKeyConstraint(['provider_id'], ['providers.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('provider_id')
    )
    op.create_index(op.f('ix_provider_profiles_provider_id'), 'provider_profiles', ['provider_id'], unique=False)
    op.create_index(op.f('ix_provider_profiles_accepts_new_patients'), 'provider_profiles', ['accepts_new_patients'], unique=False)
    op.create_index(op.f('ix_provider_profiles_accepts_medicare'), 'provider_profiles', ['accepts_medicare'], unique=False)
    op.create_index(op.f('ix_provider_profiles_accepts_medicaid'), 'provider_profiles', ['accepts_medicaid'], unique=False)
    op.create_index(op.f('ix_provider_profiles_is_featured'), 'provider_profiles', ['is_featured'], unique=False)
    op.create_index(op.f('ix_provider_profiles_is_verified'), 'provider_profiles', ['is_verified'], unique=False)

    # Create appointment_slots table
    op.create_table(
        'appointment_slots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),

        # Slot timing
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('timezone', sa.String(length=50), nullable=False, server_default='America/New_York'),

        # Booking status
        sa.Column('is_booked', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('appointment_id', sa.Integer(), nullable=True),

        # Slot metadata
        sa.Column('slot_type', sa.String(length=50), nullable=True),
        sa.Column('is_telehealth', sa.Boolean(), nullable=False, server_default='true'),

        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),

        sa.ForeignKeyConstraint(['provider_id'], ['providers.id'], ),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_appointment_slots_provider_id'), 'appointment_slots', ['provider_id'], unique=False)
    op.create_index(op.f('ix_appointment_slots_start_time'), 'appointment_slots', ['start_time'], unique=False)
    op.create_index(op.f('ix_appointment_slots_is_booked'), 'appointment_slots', ['is_booked'], unique=False)
    op.create_index(op.f('ix_appointment_slots_appointment_id'), 'appointment_slots', ['appointment_id'], unique=False)
    op.create_index('ix_provider_slots_available', 'appointment_slots', ['provider_id', 'start_time', 'is_booked'], unique=False)

    # Create patient_intake_forms table
    op.create_table(
        'patient_intake_forms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),

        # Form status
        sa.Column('status', sa.String(length=20), nullable=False, server_default='DRAFT'),

        # Demographics
        sa.Column('preferred_name', sa.String(length=100), nullable=True),
        sa.Column('preferred_pronouns', sa.String(length=50), nullable=True),

        # Emergency Contact
        sa.Column('emergency_contact_name', sa.String(length=255), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(length=20), nullable=True),
        sa.Column('emergency_contact_relationship', sa.String(length=100), nullable=True),

        # Insurance Information
        sa.Column('insurance_provider', sa.String(length=255), nullable=True),
        sa.Column('insurance_policy_number', sa.String(length=100), nullable=True),
        sa.Column('insurance_group_number', sa.String(length=100), nullable=True),
        sa.Column('insurance_subscriber_name', sa.String(length=255), nullable=True),
        sa.Column('insurance_subscriber_relationship', sa.String(length=50), nullable=True),
        sa.Column('insurance_subscriber_dob', sa.DateTime(), nullable=True),

        # Medical History
        sa.Column('primary_care_physician', sa.String(length=255), nullable=True),
        sa.Column('pcp_phone', sa.String(length=20), nullable=True),
        sa.Column('current_medications', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('medication_allergies', sa.Text(), nullable=True),

        # Mental Health History
        sa.Column('previous_mental_health_treatment', sa.Boolean(), nullable=True),
        sa.Column('previous_therapist_name', sa.String(length=255), nullable=True),
        sa.Column('previous_treatment_dates', sa.String(length=100), nullable=True),
        sa.Column('previous_psychiatric_medications', sa.Text(), nullable=True),
        sa.Column('previous_hospitalizations', sa.Text(), nullable=True),
        sa.Column('family_mental_health_history', sa.Text(), nullable=True),

        # Current Symptoms
        sa.Column('primary_concerns', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('symptom_duration', sa.String(length=100), nullable=True),
        sa.Column('symptom_severity', sa.Integer(), nullable=True),

        # Behavioral Health Screening
        sa.Column('phq9_score', sa.Integer(), nullable=True),
        sa.Column('gad7_score', sa.Integer(), nullable=True),

        # Safety Assessment
        sa.Column('current_suicidal_ideation', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('suicide_plan', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('suicide_attempt_history', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('suicide_attempt_details', sa.Text(), nullable=True),
        sa.Column('self_harm_history', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('self_harm_details', sa.Text(), nullable=True),

        # Substance Use
        sa.Column('alcohol_use', sa.String(length=50), nullable=True),
        sa.Column('substance_use', sa.Text(), nullable=True),
        sa.Column('tobacco_use', sa.Boolean(), nullable=True),

        # Goals & Preferences
        sa.Column('treatment_goals', sa.Text(), nullable=True),
        sa.Column('preferred_appointment_times', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('session_frequency_preference', sa.String(length=50), nullable=True),

        # Legal & Administrative
        sa.Column('consent_to_treatment', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('consent_to_telehealth', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('hipaa_acknowledgment', sa.Boolean(), nullable=False, server_default='false'),

        # Metadata
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('provider_notes', sa.Text(), nullable=True),

        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),

        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patient_intake_forms_patient_id'), 'patient_intake_forms', ['patient_id'], unique=False)
    op.create_index(op.f('ix_patient_intake_forms_status'), 'patient_intake_forms', ['status'], unique=False)


def downgrade() -> None:
    """Remove Phase 3 tables"""
    op.drop_index(op.f('ix_patient_intake_forms_status'), table_name='patient_intake_forms')
    op.drop_index(op.f('ix_patient_intake_forms_patient_id'), table_name='patient_intake_forms')
    op.drop_table('patient_intake_forms')

    op.drop_index('ix_provider_slots_available', table_name='appointment_slots')
    op.drop_index(op.f('ix_appointment_slots_appointment_id'), table_name='appointment_slots')
    op.drop_index(op.f('ix_appointment_slots_is_booked'), table_name='appointment_slots')
    op.drop_index(op.f('ix_appointment_slots_start_time'), table_name='appointment_slots')
    op.drop_index(op.f('ix_appointment_slots_provider_id'), table_name='appointment_slots')
    op.drop_table('appointment_slots')

    op.drop_index(op.f('ix_provider_profiles_is_verified'), table_name='provider_profiles')
    op.drop_index(op.f('ix_provider_profiles_is_featured'), table_name='provider_profiles')
    op.drop_index(op.f('ix_provider_profiles_accepts_medicaid'), table_name='provider_profiles')
    op.drop_index(op.f('ix_provider_profiles_accepts_medicare'), table_name='provider_profiles')
    op.drop_index(op.f('ix_provider_profiles_accepts_new_patients'), table_name='provider_profiles')
    op.drop_index(op.f('ix_provider_profiles_provider_id'), table_name='provider_profiles')
    op.drop_table('provider_profiles')
