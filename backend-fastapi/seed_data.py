"""
Seed script for initial database data
Run with: python seed_data.py
"""

import sys
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.policy_rule import PolicyRule
from app.models.specialty import Specialty, InsurancePlan
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

    # Check if specialties already exist
    existing_count = db.query(Specialty).count()
    if existing_count > 0:
        logger.info(f"Specialties already seeded ({existing_count} found), skipping...")
        return

    specialties_data = [
        # Clinical Specialties
        {"name": "Adult Psychiatry", "category": "Clinical", "description": "Mental health treatment for adults", "keywords": "psychiatrist,adult,medication,therapy", "display_order": 1},
        {"name": "Child & Adolescent Psychiatry", "category": "Age Group", "description": "Mental health for children and teens", "keywords": "child,adolescent,pediatric,youth", "display_order": 2},
        {"name": "Geriatric Psychiatry", "category": "Age Group", "description": "Mental health for older adults", "keywords": "elderly,senior,geriatric,aging", "display_order": 3},
        {"name": "Addiction Psychiatry", "category": "Clinical", "description": "Substance use disorder treatment", "keywords": "addiction,substance,alcohol,drugs", "display_order": 4},
        {"name": "Clinical Psychology", "category": "Clinical", "description": "Psychological assessment and therapy", "keywords": "psychologist,therapy,assessment,testing", "display_order": 5},

        # Licensed Therapists
        {"name": "Licensed Clinical Social Worker (LCSW)", "category": "Clinical", "description": "Clinical social work therapy", "keywords": "lcsw,social worker,therapy,counseling", "display_order": 6},
        {"name": "Licensed Professional Counselor (LPC)", "category": "Clinical", "description": "Professional counseling services", "keywords": "lpc,counselor,therapy,mental health", "display_order": 7},
        {"name": "Licensed Marriage and Family Therapist (LMFT)", "category": "Clinical", "description": "Couples and family therapy", "keywords": "lmft,couples,family,marriage,relationships", "display_order": 8},

        # Advanced Practice
        {"name": "Psychiatric Nurse Practitioner (PMHNP)", "category": "Clinical", "description": "Psychiatric nursing and medication management", "keywords": "pmhnp,nurse practitioner,medication,prescriber", "display_order": 9},
        {"name": "Psychiatric Physician Assistant (PA-C)", "category": "Clinical", "description": "Physician assistant psychiatry", "keywords": "pa-c,physician assistant,medication,prescriber", "display_order": 10},

        # Condition-Specific
        {"name": "Trauma & PTSD Specialist", "category": "Condition", "description": "Trauma-focused therapy", "keywords": "trauma,ptsd,emdr,cbt", "display_order": 11},
        {"name": "Anxiety Disorders", "category": "Condition", "description": "Anxiety and panic disorder treatment", "keywords": "anxiety,panic,ocd,phobia", "display_order": 12},
        {"name": "Depression & Mood Disorders", "category": "Condition", "description": "Depression and bipolar treatment", "keywords": "depression,bipolar,mood,major depressive", "display_order": 13},
        {"name": "Eating Disorders", "category": "Condition", "description": "Eating disorder treatment", "keywords": "eating,anorexia,bulimia,binge", "display_order": 14},
        {"name": "ADHD & Neurodevelopmental", "category": "Condition", "description": "ADHD and developmental disorders", "keywords": "adhd,autism,developmental,neurodevelopmental", "display_order": 15},
    ]

    for spec_data in specialties_data:
        specialty = Specialty(**spec_data)
        db.add(specialty)

    db.commit()
    logger.info(f"✅ Seeded {len(specialties_data)} provider specialties")


def seed_insurance_plans(db: Session):
    """Seed common insurance plans"""
    logger.info("Seeding insurance plans...")

    # Check if insurance plans already exist
    existing_count = db.query(InsurancePlan).count()
    if existing_count > 0:
        logger.info(f"Insurance plans already seeded ({existing_count} found), skipping...")
        return

    plans_data = [
        # Major National Payers
        {"name": "Aetna", "payer_id": "60054", "payer_name": "Aetna Health Inc.", "plan_type": "Commercial", "state_coverage": "All States", "clearinghouse": "Change Healthcare", "requires_auth": True, "display_order": 1},
        {"name": "Anthem Blue Cross Blue Shield", "payer_id": "ANTHEM", "payer_name": "Anthem Inc.", "plan_type": "Commercial", "state_coverage": "All States", "clearinghouse": "Change Healthcare", "requires_auth": True, "display_order": 2},
        {"name": "Cigna", "payer_id": "62308", "payer_name": "Cigna Health and Life Insurance Company", "plan_type": "Commercial", "state_coverage": "All States", "clearinghouse": "Change Healthcare", "requires_auth": True, "display_order": 3},
        {"name": "UnitedHealthcare", "payer_id": "87726", "payer_name": "UnitedHealthcare", "plan_type": "Commercial", "state_coverage": "All States", "clearinghouse": "Change Healthcare", "requires_auth": True, "display_order": 4},
        {"name": "Blue Cross Blue Shield", "payer_id": "BCBS", "payer_name": "Blue Cross Blue Shield Association", "plan_type": "Commercial", "state_coverage": "All States", "clearinghouse": "Change Healthcare", "requires_auth": True, "display_order": 5},

        # Government Programs
        {"name": "Medicare", "payer_id": "MEDICARE", "payer_name": "Centers for Medicare & Medicaid Services", "plan_type": "Medicare", "state_coverage": "All States", "clearinghouse": "Availity", "requires_auth": False, "display_order": 6},
        {"name": "Medicaid", "payer_id": "MEDICAID", "payer_name": "State Medicaid Programs", "plan_type": "Medicaid", "state_coverage": "Varies by State", "clearinghouse": "Availity", "requires_auth": True, "display_order": 7},
        {"name": "Tricare", "payer_id": "TRICARE", "payer_name": "Department of Defense", "plan_type": "Military", "state_coverage": "All States", "clearinghouse": "Tricare", "requires_auth": True, "display_order": 8},

        # Regional Payers
        {"name": "Kaiser Permanente", "payer_id": "KAISER", "payer_name": "Kaiser Foundation Health Plan", "plan_type": "HMO", "state_coverage": "CA,OR,WA,CO,MD,VA,DC,GA,HI", "clearinghouse": "Change Healthcare", "requires_auth": True, "display_order": 9},
        {"name": "Humana", "payer_id": "HUMANA", "payer_name": "Humana Inc.", "plan_type": "Commercial", "state_coverage": "All States", "clearinghouse": "Change Healthcare", "requires_auth": True, "display_order": 10},

        # Additional Commercial Payers
        {"name": "Oscar Health", "payer_id": "OSCAR", "payer_name": "Oscar Health Plan", "plan_type": "Commercial", "state_coverage": "CA,NY,TX,FL,NJ,OH,TN,AZ", "clearinghouse": "Change Healthcare", "requires_auth": False, "display_order": 11},
        {"name": "Centene/Ambetter", "payer_id": "CENTENE", "payer_name": "Centene Corporation", "plan_type": "Marketplace", "state_coverage": "All States", "clearinghouse": "Availity", "requires_auth": True, "display_order": 12},
        {"name": "Molina Healthcare", "payer_id": "MOLINA", "payer_name": "Molina Healthcare Inc.", "plan_type": "Medicaid Managed", "state_coverage": "CA,TX,FL,OH,WA,MI,NY", "clearinghouse": "Availity", "requires_auth": True, "display_order": 13},
        {"name": "EmblemHealth", "payer_id": "EMBLEM", "payer_name": "EmblemHealth Inc.", "plan_type": "Commercial", "state_coverage": "NY,NJ,CT", "clearinghouse": "Change Healthcare", "requires_auth": True, "display_order": 14},
        {"name": "Harvard Pilgrim", "payer_id": "HPHC", "payer_name": "Harvard Pilgrim Health Care", "plan_type": "Commercial", "state_coverage": "MA,NH,ME,CT,VT", "clearinghouse": "Change Healthcare", "requires_auth": True, "display_order": 15},
    ]

    for plan_data in plans_data:
        plan = InsurancePlan(**plan_data)
        db.add(plan)

    db.commit()
    logger.info(f"✅ Seeded {len(plans_data)} insurance plans")


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
