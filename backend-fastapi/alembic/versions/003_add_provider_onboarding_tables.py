"""Add provider onboarding tables

Phase 2: Provider Onboarding
Adds tables for provider application, credentialing, documents, and availability

Revision ID: 003
Revises: 002
Create Date: 2025-01-31

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Phase 2: Provider Onboarding Tables
    - provider_applications: Multi-step application wizard
    - provider_licenses: State medical licenses
    - provider_documents: S3 document storage
    - provider_availability: Weekly scheduling
    - provider_time_off: Time off management
    - specialties: Provider specialties
    - insurance_plans: Accepted insurance plans
    """

    # Create specialties table
    op.create_table(
        'specialties',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('keywords', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='999'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_specialties_name'), 'specialties', ['name'], unique=True)
    op.create_index(op.f('ix_specialties_category'), 'specialties', ['category'], unique=False)

    # Create insurance_plans table
    op.create_table(
        'insurance_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('payer_id', sa.String(length=50), nullable=True),
        sa.Column('payer_name', sa.String(length=255), nullable=True),
        sa.Column('plan_type', sa.String(length=50), nullable=True),
        sa.Column('state_coverage', sa.Text(), nullable=True),
        sa.Column('clearinghouse', sa.String(length=100), nullable=True),
        sa.Column('requires_auth', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('logo_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='999'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_insurance_plans_payer_id'), 'insurance_plans', ['payer_id'], unique=True)
    op.create_index(op.f('ix_insurance_plans_name'), 'insurance_plans', ['name'], unique=False)

    # Create provider_applications table
    op.create_table(
        'provider_applications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'CAQH_VERIFICATION', 'BACKGROUND_CHECK', 'APPROVED', 'REJECTED', name='applicationstatus'), nullable=False),
        sa.Column('current_step', sa.Integer(), nullable=False, server_default='1'),

        # Step 1: Basic Information
        sa.Column('first_name', sa.String(length=100), nullable=True),
        sa.Column('last_name', sa.String(length=100), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('date_of_birth', sa.DateTime(), nullable=True),
        sa.Column('ssn_last_four', sa.String(length=4), nullable=True),

        # Step 2: Professional Information
        sa.Column('npi_number', sa.String(length=10), nullable=True),
        sa.Column('dea_number', sa.String(length=9), nullable=True),
        sa.Column('provider_type', sa.String(length=50), nullable=True),
        sa.Column('specialties', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('years_experience', sa.Integer(), nullable=True),

        # Step 3: Practice Address
        sa.Column('practice_name', sa.String(length=255), nullable=True),
        sa.Column('practice_address_line1', sa.String(length=255), nullable=True),
        sa.Column('practice_address_line2', sa.String(length=255), nullable=True),
        sa.Column('practice_city', sa.String(length=100), nullable=True),
        sa.Column('practice_state', sa.String(length=2), nullable=True),
        sa.Column('practice_zip', sa.String(length=10), nullable=True),
        sa.Column('practice_phone', sa.String(length=20), nullable=True),

        # Step 4: Insurance & Credentialing
        sa.Column('insurance_plans', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('accepts_medicare', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('accepts_medicaid', sa.Boolean(), nullable=True, server_default='false'),

        # Step 5: CAQH Credentialing
        sa.Column('caqh_provider_id', sa.String(length=50), nullable=True),
        sa.Column('caqh_username', sa.String(length=100), nullable=True),
        sa.Column('caqh_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('caqh_last_verified', sa.DateTime(), nullable=True),

        # Step 6: Background Check & Documents
        sa.Column('background_check_consent', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('background_check_status', sa.String(length=50), nullable=True),
        sa.Column('background_check_completed_at', sa.DateTime(), nullable=True),
        sa.Column('documents_complete', sa.Boolean(), nullable=False, server_default='false'),

        # Admin Fields
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('admin_notes', sa.Text(), nullable=True),

        # Timestamps
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()'), onupdate=sa.text('now()')),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),

        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_provider_applications_user_id'), 'provider_applications', ['user_id'], unique=False)
    op.create_index(op.f('ix_provider_applications_status'), 'provider_applications', ['status'], unique=False)
    op.create_index(op.f('ix_provider_applications_npi_number'), 'provider_applications', ['npi_number'], unique=False)

    # Create provider_licenses table
    op.create_table(
        'provider_licenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),
        sa.Column('license_type', sa.String(length=50), nullable=False),
        sa.Column('license_number', sa.String(length=50), nullable=False),
        sa.Column('state', sa.String(length=2), nullable=False),
        sa.Column('issued_date', sa.DateTime(), nullable=True),
        sa.Column('expiration_date', sa.DateTime(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('verification_source', sa.String(length=100), nullable=True),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),

        sa.ForeignKeyConstraint(['provider_id'], ['providers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_provider_licenses_provider_id'), 'provider_licenses', ['provider_id'], unique=False)
    op.create_index(op.f('ix_provider_licenses_state'), 'provider_licenses', ['state'], unique=False)
    op.create_index(op.f('ix_provider_licenses_expiration'), 'provider_licenses', ['expiration_date'], unique=False)

    # Create provider_documents table
    op.create_table(
        'provider_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),
        sa.Column('document_type', sa.Enum('DEA_CERTIFICATE', 'STATE_LICENSE', 'MALPRACTICE_INSURANCE', 'CV_RESUME', 'BOARD_CERTIFICATION', 'W9_TAX_FORM', 'HIPAA_TRAINING', 'OTHER', name='documenttype'), nullable=False),
        sa.Column('document_name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('file_type', sa.String(length=50), nullable=True),
        sa.Column('s3_bucket', sa.String(length=100), nullable=True),
        sa.Column('s3_key', sa.String(length=500), nullable=True),
        sa.Column('status', sa.Enum('UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', name='documentstatus'), nullable=False),
        sa.Column('expiration_date', sa.DateTime(), nullable=True),
        sa.Column('requires_renewal', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),

        sa.ForeignKeyConstraint(['provider_id'], ['providers.id'], ),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_provider_documents_provider_id'), 'provider_documents', ['provider_id'], unique=False)
    op.create_index(op.f('ix_provider_documents_status'), 'provider_documents', ['status'], unique=False)
    op.create_index(op.f('ix_provider_documents_expiration'), 'provider_documents', ['expiration_date'], unique=False)

    # Create provider_availability table
    op.create_table(
        'provider_availability',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),
        sa.Column('day_of_week', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('timezone', sa.String(length=50), nullable=False, server_default='America/New_York'),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('override_date', sa.DateTime(), nullable=True),
        sa.Column('allowed_appointment_types', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),

        sa.ForeignKeyConstraint(['provider_id'], ['providers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_provider_availability_provider_id'), 'provider_availability', ['provider_id'], unique=False)
    op.create_index('ix_provider_availability_day_time', 'provider_availability', ['provider_id', 'day_of_week', 'start_time'], unique=False)

    # Create provider_time_off table
    op.create_table(
        'provider_time_off',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('is_all_day', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),

        sa.ForeignKeyConstraint(['provider_id'], ['providers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_provider_time_off_provider_id'), 'provider_time_off', ['provider_id'], unique=False)
    op.create_index('ix_provider_time_off_dates', 'provider_time_off', ['provider_id', 'start_date', 'end_date'], unique=False)


def downgrade() -> None:
    """Remove Phase 2 tables"""
    op.drop_index('ix_provider_time_off_dates', table_name='provider_time_off')
    op.drop_index(op.f('ix_provider_time_off_provider_id'), table_name='provider_time_off')
    op.drop_table('provider_time_off')

    op.drop_index('ix_provider_availability_day_time', table_name='provider_availability')
    op.drop_index(op.f('ix_provider_availability_provider_id'), table_name='provider_availability')
    op.drop_table('provider_availability')

    op.drop_index(op.f('ix_provider_documents_expiration'), table_name='provider_documents')
    op.drop_index(op.f('ix_provider_documents_status'), table_name='provider_documents')
    op.drop_index(op.f('ix_provider_documents_provider_id'), table_name='provider_documents')
    op.drop_table('provider_documents')

    op.drop_index(op.f('ix_provider_licenses_expiration'), table_name='provider_licenses')
    op.drop_index(op.f('ix_provider_licenses_state'), table_name='provider_licenses')
    op.drop_index(op.f('ix_provider_licenses_provider_id'), table_name='provider_licenses')
    op.drop_table('provider_licenses')

    op.drop_index(op.f('ix_provider_applications_npi_number'), table_name='provider_applications')
    op.drop_index(op.f('ix_provider_applications_status'), table_name='provider_applications')
    op.drop_index(op.f('ix_provider_applications_user_id'), table_name='provider_applications')
    op.drop_table('provider_applications')

    op.drop_index(op.f('ix_insurance_plans_name'), table_name='insurance_plans')
    op.drop_index(op.f('ix_insurance_plans_payer_id'), table_name='insurance_plans')
    op.drop_table('insurance_plans')

    op.drop_index(op.f('ix_specialties_category'), table_name='specialties')
    op.drop_index(op.f('ix_specialties_name'), table_name='specialties')
    op.drop_table('specialties')

    # Drop enums
    op.execute('DROP TYPE documentstatus')
    op.execute('DROP TYPE documenttype')
    op.execute('DROP TYPE applicationstatus')
