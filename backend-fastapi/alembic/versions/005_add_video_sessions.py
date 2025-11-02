"""Add video session tables for telehealth

Phase 4: Telehealth Video Integration
Adds tables for video sessions, session notes, and virtual waiting room

Revision ID: 005
Revises: 004
Create Date: 2025-01-31

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Phase 4: Telehealth Video Integration Tables
    - video_sessions: Main video session tracking
    - session_notes: Real-time provider notes during sessions
    - waiting_room: Virtual waiting room for patients
    """

    # Create video_sessions table
    op.create_table(
        'video_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=False),

        # Video platform details
        sa.Column('platform', sa.String(length=50), nullable=False, server_default='GOOGLE_MEET'),
        sa.Column('meeting_url', sa.String(length=500), nullable=False),
        sa.Column('meeting_id', sa.String(length=255), nullable=True),
        sa.Column('meeting_password', sa.String(length=100), nullable=True),
        sa.Column('google_event_id', sa.String(length=255), nullable=True),
        sa.Column('google_meet_code', sa.String(length=50), nullable=True),

        # Session timing
        sa.Column('scheduled_start_time', sa.DateTime(), nullable=False),
        sa.Column('scheduled_duration_minutes', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('actual_start_time', sa.DateTime(), nullable=True),
        sa.Column('actual_end_time', sa.DateTime(), nullable=True),

        # Participant tracking
        sa.Column('provider_joined_at', sa.DateTime(), nullable=True),
        sa.Column('patient_joined_at', sa.DateTime(), nullable=True),

        # Session status
        sa.Column('status', sa.String(length=20), nullable=False, server_default='SCHEDULED'),
        sa.Column('connection_quality', sa.String(length=20), nullable=True),
        sa.Column('technical_issues', sa.Text(), nullable=True),

        # Recording
        sa.Column('recording_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('recording_consent', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('recording_url', sa.String(length=500), nullable=True),

        # Metadata
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),

        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('appointment_id')
    )
    op.create_index(op.f('ix_video_sessions_appointment_id'), 'video_sessions', ['appointment_id'], unique=False)
    op.create_index(op.f('ix_video_sessions_scheduled_start_time'), 'video_sessions', ['scheduled_start_time'], unique=False)
    op.create_index(op.f('ix_video_sessions_status'), 'video_sessions', ['status'], unique=False)
    op.create_index(op.f('ix_video_sessions_google_event_id'), 'video_sessions', ['google_event_id'], unique=False)

    # Create session_notes table
    op.create_table(
        'session_notes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('video_session_id', sa.Integer(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),

        # Note content
        sa.Column('note_content', sa.Text(), nullable=False),
        sa.Column('note_type', sa.String(length=50), nullable=True),
        sa.Column('note_timestamp', sa.DateTime(), nullable=False, server_default=sa.text('now()')),

        # Privacy
        sa.Column('is_private', sa.Boolean(), nullable=False, server_default='false'),

        sa.ForeignKeyConstraint(['video_session_id'], ['video_sessions.id'], ),
        sa.ForeignKeyConstraint(['provider_id'], ['providers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_session_notes_video_session_id'), 'session_notes', ['video_session_id'], unique=False)
    op.create_index(op.f('ix_session_notes_provider_id'), 'session_notes', ['provider_id'], unique=False)

    # Create waiting_room table
    op.create_table(
        'waiting_room',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('video_session_id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),

        # Waiting status
        sa.Column('joined_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('is_waiting', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('admitted_at', sa.DateTime(), nullable=True),

        # Communication
        sa.Column('message_to_provider', sa.Text(), nullable=True),
        sa.Column('technical_issue', sa.Text(), nullable=True),

        sa.ForeignKeyConstraint(['video_session_id'], ['video_sessions.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_waiting_room_video_session_id'), 'waiting_room', ['video_session_id'], unique=False)
    op.create_index(op.f('ix_waiting_room_patient_id'), 'waiting_room', ['patient_id'], unique=False)
    op.create_index(op.f('ix_waiting_room_is_waiting'), 'waiting_room', ['is_waiting'], unique=False)


def downgrade() -> None:
    """Remove Phase 4 tables"""
    op.drop_index(op.f('ix_waiting_room_is_waiting'), table_name='waiting_room')
    op.drop_index(op.f('ix_waiting_room_patient_id'), table_name='waiting_room')
    op.drop_index(op.f('ix_waiting_room_video_session_id'), table_name='waiting_room')
    op.drop_table('waiting_room')

    op.drop_index(op.f('ix_session_notes_provider_id'), table_name='session_notes')
    op.drop_index(op.f('ix_session_notes_video_session_id'), table_name='session_notes')
    op.drop_table('session_notes')

    op.drop_index(op.f('ix_video_sessions_google_event_id'), table_name='video_sessions')
    op.drop_index(op.f('ix_video_sessions_status'), table_name='video_sessions')
    op.drop_index(op.f('ix_video_sessions_scheduled_start_time'), table_name='video_sessions')
    op.drop_index(op.f('ix_video_sessions_appointment_id'), table_name='video_sessions')
    op.drop_table('video_sessions')
