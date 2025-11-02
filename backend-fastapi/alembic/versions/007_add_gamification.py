"""Add gamification tables

Phase 5 Enhancement: Gamification System
Adds achievements, streaks, milestones, and motivational messages

Revision ID: 007
Revises: 006
Create Date: 2025-02-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add gamification tables"""

    # Create achievements table
    op.create_table(
        'achievements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('icon', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('tier', sa.String(length=50), nullable=False, server_default='BRONZE'),
        sa.Column('unlock_criteria', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('color', sa.String(length=50), nullable=True),
        sa.Column('is_hidden', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_achievements_category'), 'achievements', ['category'], unique=False)

    # Create patient_achievements table
    op.create_table(
        'patient_achievements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('achievement_id', sa.Integer(), nullable=False),
        sa.Column('unlocked_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('is_viewed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('trigger_context', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['achievement_id'], ['achievements.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patient_achievements_patient_id'), 'patient_achievements', ['patient_id'], unique=False)
    op.create_index(op.f('ix_patient_achievements_achievement_id'), 'patient_achievements', ['achievement_id'], unique=False)
    op.create_index(op.f('ix_patient_achievements_unlocked_at'), 'patient_achievements', ['unlocked_at'], unique=False)

    # Create patient_streaks table
    op.create_table(
        'patient_streaks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False, unique=True),
        sa.Column('current_streak_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('longest_streak_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_assessment_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_streak_weeks', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('longest_streak_weeks', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_session_week', sa.Integer(), nullable=True),
        sa.Column('total_assessment_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_session_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('engagement_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patient_streaks_patient_id'), 'patient_streaks', ['patient_id'], unique=True)
    op.create_index(op.f('ix_patient_streaks_last_assessment_date'), 'patient_streaks', ['last_assessment_date'], unique=False)

    # Create milestones table
    op.create_table(
        'milestones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('icon', sa.String(length=100), nullable=False),
        sa.Column('criteria', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('sequence_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_milestones_sequence_order'), 'milestones', ['sequence_order'], unique=False)

    # Create patient_milestones table
    op.create_table(
        'patient_milestones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('milestone_id', sa.Integer(), nullable=False),
        sa.Column('achieved_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('is_celebrated', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('achievement_context', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['milestone_id'], ['milestones.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patient_milestones_patient_id'), 'patient_milestones', ['patient_id'], unique=False)
    op.create_index(op.f('ix_patient_milestones_milestone_id'), 'patient_milestones', ['milestone_id'], unique=False)
    op.create_index(op.f('ix_patient_milestones_achieved_at'), 'patient_milestones', ['achieved_at'], unique=False)

    # Create motivational_messages table
    op.create_table(
        'motivational_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('icon', sa.String(length=100), nullable=True),
        sa.Column('context_type', sa.String(length=50), nullable=False),
        sa.Column('display_criteria', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('weight', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_motivational_messages_context_type'), 'motivational_messages', ['context_type'], unique=False)


def downgrade() -> None:
    """Remove gamification tables"""
    op.drop_index(op.f('ix_motivational_messages_context_type'), table_name='motivational_messages')
    op.drop_table('motivational_messages')

    op.drop_index(op.f('ix_patient_milestones_achieved_at'), table_name='patient_milestones')
    op.drop_index(op.f('ix_patient_milestones_milestone_id'), table_name='patient_milestones')
    op.drop_index(op.f('ix_patient_milestones_patient_id'), table_name='patient_milestones')
    op.drop_table('patient_milestones')

    op.drop_index(op.f('ix_milestones_sequence_order'), table_name='milestones')
    op.drop_table('milestones')

    op.drop_index(op.f('ix_patient_streaks_last_assessment_date'), table_name='patient_streaks')
    op.drop_index(op.f('ix_patient_streaks_patient_id'), table_name='patient_streaks')
    op.drop_table('patient_streaks')

    op.drop_index(op.f('ix_patient_achievements_unlocked_at'), table_name='patient_achievements')
    op.drop_index(op.f('ix_patient_achievements_achievement_id'), table_name='patient_achievements')
    op.drop_index(op.f('ix_patient_achievements_patient_id'), table_name='patient_achievements')
    op.drop_table('patient_achievements')

    op.drop_index(op.f('ix_achievements_category'), table_name='achievements')
    op.drop_table('achievements')
