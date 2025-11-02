"""Add performance indexes

FIX #4 APPLIED: Composite indexes for common query patterns
Optimizes queries for earnings dashboard, appointments, and audit logs

Revision ID: 002
Revises: 001
Create Date: 2025-01-30

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    FIX #4: Add composite indexes for performance optimization
    These indexes match common query patterns in the application
    """
    # Earnings ledger indexes (for earnings dashboard queries)
    op.create_index(
        'ix_earnings_provider_type_created',
        'earnings_ledger',
        ['provider_id', 'entry_type', 'created_at'],
        unique=False
    )

    # Appointments indexes (for patient/provider appointment lists)
    op.create_index(
        'ix_appointments_patient_status',
        'appointments',
        ['patient_id', 'status'],
        unique=False
    )

    op.create_index(
        'ix_appointments_provider_status_starts',
        'appointments',
        ['provider_id', 'status', 'starts_at'],
        unique=False
    )

    # Pre-session tasks indexes (for task queries)
    op.create_index(
        'ix_pre_session_patient_status',
        'pre_session_tasks',
        ['patient_id', 'status'],
        unique=False
    )

    # Referrals indexes (for referral queries)
    op.create_index(
        'ix_referrals_to_type_status',
        'referrals',
        ['to_provider_type', 'status'],
        unique=False
    )

    # Medication quiz attempts indexes
    op.create_index(
        'ix_medication_attempts_patient',
        'medication_quiz_attempts',
        ['patient_id', 'education_id'],
        unique=False
    )

    # Audit logs indexes (for compliance queries)
    op.create_index(
        'ix_audit_logs_user_created',
        'audit_logs',
        ['user_id', 'created_at'],
        unique=False
    )


def downgrade() -> None:
    """Remove performance indexes"""
    op.drop_index('ix_audit_logs_user_created', table_name='audit_logs')
    op.drop_index('ix_medication_attempts_patient', table_name='medication_quiz_attempts')
    op.drop_index('ix_referrals_to_type_status', table_name='referrals')
    op.drop_index('ix_pre_session_patient_status', table_name='pre_session_tasks')
    op.drop_index('ix_appointments_provider_status_starts', table_name='appointments')
    op.drop_index('ix_appointments_patient_status', table_name='appointments')
    op.drop_index('ix_earnings_provider_type_created', table_name='earnings_ledger')
