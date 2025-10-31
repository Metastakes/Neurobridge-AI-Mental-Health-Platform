"""
Seed script for initial database data
Run with: python seed_data.py
"""

import sys
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.policy_rule import PolicyRule
from app.services.billing.rules_engine import BillingRulesEngine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_policy_rules(db: Session):
    """Seed default policy rules for billing"""
    logger.info("Seeding policy rules...")

    rules_engine = BillingRulesEngine(db)
    rules_engine.create_default_rules()

    logger.info("✅ Policy rules seeded")


def seed_provider_specialties(db: Session):
    """Seed common mental health specialties"""
    logger.info("Seeding provider specialties...")

    # Note: We'll add a specialties table in Phase 2
    # For now, this is a placeholder

    specialties = [
        "Adult Psychiatry",
        "Child & Adolescent Psychiatry",
        "Geriatric Psychiatry",
        "Addiction Psychiatry",
        "Clinical Psychology",
        "Licensed Clinical Social Worker (LCSW)",
        "Licensed Professional Counselor (LPC)",
        "Licensed Marriage and Family Therapist (LMFT)",
        "Psychiatric Nurse Practitioner (PMHNP)",
        "Psychiatric Physician Assistant (PA-C)",
    ]

    logger.info(f"✅ Will seed {len(specialties)} specialties in Phase 2")


def seed_insurance_plans(db: Session):
    """Seed common insurance plans"""
    logger.info("Seeding insurance plans...")

    # Note: We'll add an insurance_plans table in Phase 2

    plans = [
        {"name": "Aetna", "payer_id": "60054"},
        {"name": "Anthem Blue Cross Blue Shield", "payer_id": "ANTHEM"},
        {"name": "Cigna", "payer_id": "62308"},
        {"name": "UnitedHealthcare", "payer_id": "87726"},
        {"name": "Blue Cross Blue Shield", "payer_id": "BCBS"},
        {"name": "Medicare", "payer_id": "MEDICARE"},
        {"name": "Medicaid", "payer_id": "MEDICAID"},
        {"name": "Kaiser Permanente", "payer_id": "KAISER"},
        {"name": "Humana", "payer_id": "HUMANA"},
        {"name": "Tricare", "payer_id": "TRICARE"},
    ]

    logger.info(f"✅ Will seed {len(plans)} insurance plans in Phase 2")


def seed_icd10_codes(db: Session):
    """Seed common ICD-10 mental health diagnosis codes"""
    logger.info("Seeding ICD-10 codes...")

    # Note: We'll add a diagnosis_codes table in Phase 5

    common_codes = [
        {"code": "F32.9", "description": "Major depressive disorder, single episode, unspecified"},
        {"code": "F33.1", "description": "Major depressive disorder, recurrent, moderate"},
        {"code": "F41.1", "description": "Generalized anxiety disorder"},
        {"code": "F41.0", "description": "Panic disorder [episodic paroxysmal anxiety]"},
        {"code": "F43.10", "description": "Post-traumatic stress disorder, unspecified"},
        {"code": "F31.9", "description": "Bipolar disorder, unspecified"},
        {"code": "F20.9", "description": "Schizophrenia, unspecified"},
        {"code": "F60.3", "description": "Borderline personality disorder"},
        {"code": "F90.2", "description": "Attention-deficit hyperactivity disorder, combined type"},
        {"code": "F50.00", "description": "Anorexia nervosa, unspecified"},
    ]

    logger.info(f"✅ Will seed {len(common_codes)} ICD-10 codes in Phase 5")


def main():
    """Main seed function"""
    logger.info("🌱 Starting database seeding...")

    db = SessionLocal()

    try:
        # Seed policy rules (Phase 1)
        seed_policy_rules(db)

        # These will be implemented in later phases
        seed_provider_specialties(db)
        seed_insurance_plans(db)
        seed_icd10_codes(db)

        logger.info("✅ Database seeding complete!")

    except Exception as e:
        logger.error(f"❌ Seeding failed: {str(e)}")
        db.rollback()
        sys.exit(1)

    finally:
        db.close()


if __name__ == "__main__":
    main()
