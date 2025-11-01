"""Add Phase 5 progress tracking tables

Phase 5: Progress Tracking & Outcomes Measurement
Adds tables for clinical assessments, treatment goals, and progress tracking

Revision ID: 006
Revises: 005
Create Date: 2025-02-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Phase 5: Progress Tracking & Outcomes Measurement Tables
    - assessment_scales: Clinical assessment instruments (PHQ-9, GAD-7, custom)
    - assessment_attempts: Patient assessment completions over time
    - treatment_goals: SMART treatment goals
    - goal_progress: Progress updates for goals
    """

    # Create assessment_scales table
    op.create_table(
        'assessment_scales',
        sa.Column('id', sa.Integer(), nullable=False),

        # Scale identification
        sa.Column('scale_type', sa.String(length=50), nullable=False),
        sa.Column('scale_name', sa.String(length=255), nullable=False),
        sa.Column('scale_code', sa.String(length=50), nullable=False, unique=True),

        # Scale definition
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('instructions', sa.Text(), nullable=True),

        # Scoring
        sa.Column('min_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_score', sa.Integer(), nullable=False),

        # Questions (JSON array)
        sa.Column('questions', postgresql.JSON(astext_type=sa.Text()), nullable=False),

        # Severity thresholds (JSON)
        sa.Column('severity_thresholds', postgresql.JSON(astext_type=sa.Text()), nullable=True),

        # Custom scale metadata
        sa.Column('created_by_provider_id', sa.Integer(), nullable=True),

        # Active status
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_standard', sa.Boolean(), nullable=False, server_default='true'),

        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),

        sa.ForeignKeyConstraint(['created_by_provider_id'], ['providers.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('scale_code')
    )
    op.create_index(op.f('ix_assessment_scales_scale_type'), 'assessment_scales', ['scale_type'], unique=False)
    op.create_index(op.f('ix_assessment_scales_scale_code'), 'assessment_scales', ['scale_code'], unique=True)

    # Create assessment_attempts table
    op.create_table(
        'assessment_attempts',
        sa.Column('id', sa.Integer(), nullable=False),

        # Foreign keys
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('scale_id', sa.Integer(), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=True),

        # Responses (JSON array)
        sa.Column('responses', postgresql.JSON(astext_type=sa.Text()), nullable=False),

        # Scoring
        sa.Column('total_score', sa.Integer(), nullable=False),
        sa.Column('severity_level', sa.String(length=50), nullable=True),

        # Context
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('administered_by_provider_id', sa.Integer(), nullable=True),

        # Timing
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),

        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),

        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['scale_id'], ['assessment_scales.id'], ),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ),
        sa.ForeignKeyConstraint(['administered_by_provider_id'], ['providers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_assessment_attempts_patient_id'), 'assessment_attempts', ['patient_id'], unique=False)
    op.create_index(op.f('ix_assessment_attempts_scale_id'), 'assessment_attempts', ['scale_id'], unique=False)
    op.create_index(op.f('ix_assessment_attempts_appointment_id'), 'assessment_attempts', ['appointment_id'], unique=False)
    op.create_index(op.f('ix_assessment_attempts_total_score'), 'assessment_attempts', ['total_score'], unique=False)
    op.create_index(op.f('ix_assessment_attempts_severity_level'), 'assessment_attempts', ['severity_level'], unique=False)
    op.create_index(op.f('ix_assessment_attempts_completed_at'), 'assessment_attempts', ['completed_at'], unique=False)

    # Create treatment_goals table
    op.create_table(
        'treatment_goals',
        sa.Column('id', sa.Integer(), nullable=False),

        # Foreign keys
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),

        # Goal definition
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('goal_text', sa.Text(), nullable=False),

        # SMART criteria
        sa.Column('is_specific', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_measurable', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('target_metric', sa.String(length=255), nullable=True),
        sa.Column('target_value', sa.Float(), nullable=True),

        # Timeline
        sa.Column('target_date', sa.DateTime(timezone=True), nullable=True),

        # Status and progress
        sa.Column('status', sa.String(length=50), nullable=False, server_default='ACTIVE'),
        sa.Column('progress_percentage', sa.Integer(), nullable=False, server_default='0'),

        # Notes
        sa.Column('barriers', sa.Text(), nullable=True),
        sa.Column('interventions', sa.Text(), nullable=True),

        # Completion
        sa.Column('achieved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('discontinued_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('discontinued_reason', sa.Text(), nullable=True),

        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),

        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['provider_id'], ['providers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_treatment_goals_patient_id'), 'treatment_goals', ['patient_id'], unique=False)
    op.create_index(op.f('ix_treatment_goals_provider_id'), 'treatment_goals', ['provider_id'], unique=False)
    op.create_index(op.f('ix_treatment_goals_category'), 'treatment_goals', ['category'], unique=False)
    op.create_index(op.f('ix_treatment_goals_status'), 'treatment_goals', ['status'], unique=False)
    op.create_index(op.f('ix_treatment_goals_target_date'), 'treatment_goals', ['target_date'], unique=False)
    op.create_index(op.f('ix_treatment_goals_created_at'), 'treatment_goals', ['created_at'], unique=False)

    # Create goal_progress table
    op.create_table(
        'goal_progress',
        sa.Column('id', sa.Integer(), nullable=False),

        # Foreign keys
        sa.Column('goal_id', sa.Integer(), nullable=False),
        sa.Column('recorded_by_provider_id', sa.Integer(), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=True),

        # Progress measurement
        sa.Column('progress_percentage', sa.Integer(), nullable=False),
        sa.Column('metric_value', sa.Float(), nullable=True),

        # Notes
        sa.Column('progress_notes', sa.Text(), nullable=True),
        sa.Column('patient_feedback', sa.Text(), nullable=True),

        # Timing
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),

        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),

        sa.ForeignKeyConstraint(['goal_id'], ['treatment_goals.id'], ),
        sa.ForeignKeyConstraint(['recorded_by_provider_id'], ['providers.id'], ),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_goal_progress_goal_id'), 'goal_progress', ['goal_id'], unique=False)
    op.create_index(op.f('ix_goal_progress_recorded_at'), 'goal_progress', ['recorded_at'], unique=False)


def downgrade() -> None:
    """Remove Phase 5 tables"""
    op.drop_index(op.f('ix_goal_progress_recorded_at'), table_name='goal_progress')
    op.drop_index(op.f('ix_goal_progress_goal_id'), table_name='goal_progress')
    op.drop_table('goal_progress')

    op.drop_index(op.f('ix_treatment_goals_created_at'), table_name='treatment_goals')
    op.drop_index(op.f('ix_treatment_goals_target_date'), table_name='treatment_goals')
    op.drop_index(op.f('ix_treatment_goals_status'), table_name='treatment_goals')
    op.drop_index(op.f('ix_treatment_goals_category'), table_name='treatment_goals')
    op.drop_index(op.f('ix_treatment_goals_provider_id'), table_name='treatment_goals')
    op.drop_index(op.f('ix_treatment_goals_patient_id'), table_name='treatment_goals')
    op.drop_table('treatment_goals')

    op.drop_index(op.f('ix_assessment_attempts_completed_at'), table_name='assessment_attempts')
    op.drop_index(op.f('ix_assessment_attempts_severity_level'), table_name='assessment_attempts')
    op.drop_index(op.f('ix_assessment_attempts_total_score'), table_name='assessment_attempts')
    op.drop_index(op.f('ix_assessment_attempts_appointment_id'), table_name='assessment_attempts')
    op.drop_index(op.f('ix_assessment_attempts_scale_id'), table_name='assessment_attempts')
    op.drop_index(op.f('ix_assessment_attempts_patient_id'), table_name='assessment_attempts')
    op.drop_table('assessment_attempts')

    op.drop_index(op.f('ix_assessment_scales_scale_code'), table_name='assessment_scales')
    op.drop_index(op.f('ix_assessment_scales_scale_type'), table_name='assessment_scales')
    op.drop_table('assessment_scales')
