"""Initial schema with all models and GUARANTEE enforcement

Revision ID: 001
Revises:
Create Date: 2025-01-30

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enums
    op.execute("""
        CREATE TYPE userrole AS ENUM ('PATIENT', 'PROVIDER', 'ADMIN');
        CREATE TYPE providertype AS ENUM ('THERAPIST', 'PMHNP', 'PSYCHIATRIST', 'FNP');
        CREATE TYPE appointmentstatus AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
        CREATE TYPE paymenttype AS ENUM ('CASH', 'INSURANCE');
        CREATE TYPE taskstatus AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE');
        CREATE TYPE quizstatus AS ENUM ('PASSED', 'FAILED');
        CREATE TYPE referralstatus AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED');
        CREATE TYPE earningsentrytype AS ENUM ('SESSION_REVENUE', 'NO_SHOW_FEE', 'INSURANCE_TOPUP', 'ADMIN_FEE', 'LATE_CANCEL_FEE');
    """)

    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('role', postgresql.ENUM(name='userrole', create_type=False), nullable=False),
        sa.Column('is_active', sa.Integer(), default=1, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Providers table
    op.create_table(
        'providers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('provider_type', postgresql.ENUM(name='providertype', create_type=False), nullable=False),
        sa.Column('specialty', sa.String(255), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('license_number', sa.String(100), nullable=True),
        sa.Column('state', sa.String(2), nullable=True),
        sa.Column('hourly_rate_cents', sa.Integer(), nullable=False, default=15000),
        sa.Column('no_show_min_fee_cents', sa.Integer(), nullable=False, default=5000),
        sa.Column('insurance_no_show_fee_cents', sa.Integer(), nullable=False, default=12500),
        sa.Column('late_cancel_window_hours', sa.Integer(), nullable=False, default=24),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('no_show_min_fee_cents >= 5000', name='check_no_show_min_fee'),
        sa.CheckConstraint('insurance_no_show_fee_cents >= 5000', name='check_insurance_no_show_min_fee')
    )
    op.create_index('ix_providers_user_id', 'providers', ['user_id'], unique=True)

    # Patients table
    op.create_table(
        'patients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('insurance_provider', sa.String(255), nullable=True),
        sa.Column('insurance_policy_number', sa.String(100), nullable=True),
        sa.Column('default_payment_method_id', sa.String(255), nullable=True),
        sa.Column('provider_id', sa.Integer(), nullable=True),
        sa.Column('diagnosis', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['provider_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_patients_user_id', 'patients', ['user_id'], unique=True)

    # Appointments table
    op.create_table(
        'appointments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),
        sa.Column('appointment_type', sa.String(100), nullable=False, default='therapy_session'),
        sa.Column('status', postgresql.ENUM(name='appointmentstatus', create_type=False), nullable=False, default='SCHEDULED'),
        sa.Column('payment_type', postgresql.ENUM(name='paymenttype', create_type=False), nullable=False),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('no_show_fee_charged_cents', sa.Integer(), nullable=True, default=0),
        sa.Column('admin_fee_cents', sa.Integer(), nullable=True, default=0),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['provider_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Pre-session tasks table
    op.create_table(
        'pre_session_tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('question_1', sa.Text(), nullable=False),
        sa.Column('question_2', sa.Text(), nullable=False),
        sa.Column('question_3', sa.Text(), nullable=False),
        sa.Column('status', postgresql.ENUM(name='taskstatus', create_type=False), nullable=False, default='PENDING'),
        sa.Column('due_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Pre-session task responses table
    op.create_table(
        'pre_session_task_responses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('answer_1', sa.Text(), nullable=False),
        sa.Column('answer_2', sa.Text(), nullable=False),
        sa.Column('answer_3', sa.Text(), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['pre_session_tasks.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Medication education table
    op.create_table(
        'medication_education',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('medication_name', sa.String(255), nullable=False),
        sa.Column('medication_class', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('usage_instructions', sa.Text(), nullable=False),
        sa.Column('side_effects', sa.Text(), nullable=False),
        sa.Column('warnings', sa.Text(), nullable=False),
        sa.Column('quiz_questions', postgresql.JSON(), nullable=False),
        sa.Column('passing_score', sa.Integer(), nullable=False, default=80),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Medication quiz attempts table
    op.create_table(
        'medication_quiz_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('education_id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('answers', postgresql.JSON(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('status', postgresql.ENUM(name='quizstatus', create_type=False), nullable=False),
        sa.Column('acknowledged', sa.Integer(), nullable=False, default=0),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('attempted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['education_id'], ['medication_education.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Referrals table
    op.create_table(
        'referrals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('referring_provider_id', sa.Integer(), nullable=False),
        sa.Column('referred_to_provider_id', sa.Integer(), nullable=True),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('clinical_notes', sa.Text(), nullable=True),
        sa.Column('status', postgresql.ENUM(name='referralstatus', create_type=False), nullable=False, default='PENDING'),
        sa.Column('from_provider_type', sa.String(50), nullable=False),
        sa.Column('to_provider_type', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['referring_provider_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['referred_to_provider_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Earnings ledger table
    op.create_table(
        'earnings_ledger',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=True),
        sa.Column('entry_type', postgresql.ENUM(name='earningsentrytype', create_type=False), nullable=False),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('payment_type', sa.String(50), nullable=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['provider_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Payment intents table
    op.create_table(
        'payment_intents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('stripe_payment_intent_id', sa.String(255), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=True),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, default='usd'),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('payment_method_id', sa.String(255), nullable=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('failure_message', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_payment_intents_stripe_id', 'payment_intents', ['stripe_payment_intent_id'], unique=True)

    # Policy rules table
    op.create_table(
        'policy_rules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('rule_key', sa.String(255), nullable=False),
        sa.Column('rule_name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('rule_json', postgresql.JSON(), nullable=False),
        sa.Column('is_enabled', sa.Integer(), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_policy_rules_key', 'policy_rules', ['rule_key'], unique=True)

    # Audit logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(100), nullable=False),
        sa.Column('resource_id', sa.Integer(), nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('changes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('policy_rules')
    op.drop_table('payment_intents')
    op.drop_table('earnings_ledger')
    op.drop_table('referrals')
    op.drop_table('medication_quiz_attempts')
    op.drop_table('medication_education')
    op.drop_table('pre_session_task_responses')
    op.drop_table('pre_session_tasks')
    op.drop_table('appointments')
    op.drop_table('patients')
    op.drop_table('providers')
    op.drop_table('users')

    op.execute('DROP TYPE earningsentrytype')
    op.execute('DROP TYPE referralstatus')
    op.execute('DROP TYPE quizstatus')
    op.execute('DROP TYPE taskstatus')
    op.execute('DROP TYPE paymenttype')
    op.execute('DROP TYPE appointmentstatus')
    op.execute('DROP TYPE providertype')
    op.execute('DROP TYPE userrole')
