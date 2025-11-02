"""Add medication education and rewards tables

Phase 5 Enhancement: Medication Education & Rewards Marketplace
Adds medication quizzes, points system, and rewards catalog

Revision ID: 008
Revises: 007
Create Date: 2025-02-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add medication education and rewards tables"""

    # Create prescribed_medications table
    op.create_table(
        'prescribed_medications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),
        sa.Column('medication_name', sa.String(length=255), nullable=False),
        sa.Column('dosage', sa.String(length=100), nullable=True),
        sa.Column('frequency', sa.String(length=100), nullable=True),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('prescribed_date', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('requires_quiz', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('quiz_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('quiz_completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['provider_id'], ['providers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_prescribed_medications_patient_id'), 'prescribed_medications', ['patient_id'], unique=False)
    op.create_index(op.f('ix_prescribed_medications_provider_id'), 'prescribed_medications', ['provider_id'], unique=False)
    op.create_index(op.f('ix_prescribed_medications_medication_name'), 'prescribed_medications', ['medication_name'], unique=False)

    # Create medication_quiz_questions table
    op.create_table(
        'medication_quiz_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('medication_name', sa.String(length=255), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('question_type', sa.String(length=50), nullable=False),
        sa.Column('options', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('correct_answer', sa.String(length=10), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('is_critical', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_medication_quiz_questions_medication_name'), 'medication_quiz_questions', ['medication_name'], unique=False)
    op.create_index(op.f('ix_medication_quiz_questions_question_type'), 'medication_quiz_questions', ['question_type'], unique=False)

    # Create medication_quiz_attempts table
    op.create_table(
        'medication_quiz_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('prescribed_medication_id', sa.Integer(), nullable=False),
        sa.Column('responses', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('total_questions', sa.Integer(), nullable=False),
        sa.Column('correct_answers', sa.Integer(), nullable=False),
        sa.Column('score_percentage', sa.Integer(), nullable=False),
        sa.Column('passed', sa.Boolean(), nullable=False),
        sa.Column('points_earned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['prescribed_medication_id'], ['prescribed_medications.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_medication_quiz_attempts_patient_id'), 'medication_quiz_attempts', ['patient_id'], unique=False)
    op.create_index(op.f('ix_medication_quiz_attempts_prescribed_medication_id'), 'medication_quiz_attempts', ['prescribed_medication_id'], unique=False)

    # Create reward_items table
    op.create_table(
        'reward_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('brand_name', sa.String(length=255), nullable=True),
        sa.Column('is_partner', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('points_cost', sa.Integer(), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('stock_quantity', sa.Integer(), nullable=True),
        sa.Column('max_per_user', sa.Integer(), nullable=True),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('terms_conditions', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reward_items_category'), 'reward_items', ['category'], unique=False)
    op.create_index(op.f('ix_reward_items_is_featured'), 'reward_items', ['is_featured'], unique=False)

    # Create patient_points table
    op.create_table(
        'patient_points',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False, unique=True),
        sa.Column('current_balance', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_points_earned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_points_spent', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_redemptions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patient_points_patient_id'), 'patient_points', ['patient_id'], unique=True)

    # Create reward_redemptions table
    op.create_table(
        'reward_redemptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('reward_item_id', sa.Integer(), nullable=False),
        sa.Column('points_spent', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='PENDING'),
        sa.Column('requires_shipping', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('shipping_address', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('tracking_number', sa.String(length=255), nullable=True),
        sa.Column('redeemed_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('fulfilled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['reward_item_id'], ['reward_items.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reward_redemptions_patient_id'), 'reward_redemptions', ['patient_id'], unique=False)
    op.create_index(op.f('ix_reward_redemptions_reward_item_id'), 'reward_redemptions', ['reward_item_id'], unique=False)
    op.create_index(op.f('ix_reward_redemptions_status'), 'reward_redemptions', ['status'], unique=False)

    # Create points_transactions table
    op.create_table(
        'points_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_points_id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.String(length=50), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('reference_id', sa.Integer(), nullable=True),
        sa.Column('reference_type', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['patient_points_id'], ['patient_points.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_points_transactions_patient_id'), 'points_transactions', ['patient_id'], unique=False)
    op.create_index(op.f('ix_points_transactions_transaction_type'), 'points_transactions', ['transaction_type'], unique=False)
    op.create_index(op.f('ix_points_transactions_created_at'), 'points_transactions', ['created_at'], unique=False)


def downgrade() -> None:
    """Remove medication education and rewards tables"""
    op.drop_index(op.f('ix_points_transactions_created_at'), table_name='points_transactions')
    op.drop_index(op.f('ix_points_transactions_transaction_type'), table_name='points_transactions')
    op.drop_index(op.f('ix_points_transactions_patient_id'), table_name='points_transactions')
    op.drop_table('points_transactions')

    op.drop_index(op.f('ix_reward_redemptions_status'), table_name='reward_redemptions')
    op.drop_index(op.f('ix_reward_redemptions_reward_item_id'), table_name='reward_redemptions')
    op.drop_index(op.f('ix_reward_redemptions_patient_id'), table_name='reward_redemptions')
    op.drop_table('reward_redemptions')

    op.drop_index(op.f('ix_patient_points_patient_id'), table_name='patient_points')
    op.drop_table('patient_points')

    op.drop_index(op.f('ix_reward_items_is_featured'), table_name='reward_items')
    op.drop_index(op.f('ix_reward_items_category'), table_name='reward_items')
    op.drop_table('reward_items')

    op.drop_index(op.f('ix_medication_quiz_attempts_prescribed_medication_id'), table_name='medication_quiz_attempts')
    op.drop_index(op.f('ix_medication_quiz_attempts_patient_id'), table_name='medication_quiz_attempts')
    op.drop_table('medication_quiz_attempts')

    op.drop_index(op.f('ix_medication_quiz_questions_question_type'), table_name='medication_quiz_questions')
    op.drop_index(op.f('ix_medication_quiz_questions_medication_name'), table_name='medication_quiz_questions')
    op.drop_table('medication_quiz_questions')

    op.drop_index(op.f('ix_prescribed_medications_medication_name'), table_name='prescribed_medications')
    op.drop_index(op.f('ix_prescribed_medications_provider_id'), table_name='prescribed_medications')
    op.drop_index(op.f('ix_prescribed_medications_patient_id'), table_name='prescribed_medications')
    op.drop_table('prescribed_medications')
