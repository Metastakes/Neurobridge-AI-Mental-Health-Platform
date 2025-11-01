"""
Seed script for standard clinical assessment scales
Adds PHQ-9 (depression) and GAD-7 (anxiety) scales to database

Run with: python -m scripts.seed_assessment_scales
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.assessment import AssessmentScale, AssessmentType


def seed_phq9(db: Session):
    """Seed PHQ-9 (Patient Health Questionnaire-9) depression scale"""

    # Check if already exists
    existing = db.query(AssessmentScale).filter(AssessmentScale.scale_code == "PHQ9").first()
    if existing:
        print("PHQ-9 scale already exists, skipping...")
        return existing

    phq9_questions = [
        {
            "question": "Little interest or pleasure in doing things",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        },
        {
            "question": "Feeling down, depressed, or hopeless",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        },
        {
            "question": "Trouble falling or staying asleep, or sleeping too much",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        },
        {
            "question": "Feeling tired or having little energy",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        },
        {
            "question": "Poor appetite or overeating",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        },
        {
            "question": "Feeling bad about yourself - or that you are a failure or have let yourself or your family down",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        },
        {
            "question": "Trouble concentrating on things, such as reading the newspaper or watching television",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        },
        {
            "question": "Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        },
        {
            "question": "Thoughts that you would be better off dead, or of hurting yourself in some way",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        }
    ]

    phq9_scale = AssessmentScale(
        scale_type=AssessmentType.PHQ9,
        scale_name="Patient Health Questionnaire-9 (PHQ-9)",
        scale_code="PHQ9",
        description="The PHQ-9 is a multipurpose instrument for screening, diagnosing, monitoring and measuring the severity of depression.",
        instructions="Over the last 2 weeks, how often have you been bothered by any of the following problems?",
        min_score=0,
        max_score=27,
        questions=phq9_questions,
        severity_thresholds={
            "MILD": 5,
            "MODERATE": 10,
            "MODERATELY_SEVERE": 15,
            "SEVERE": 20
        },
        is_standard=True,
        is_active=True,
        created_by_provider_id=None
    )

    db.add(phq9_scale)
    db.commit()
    db.refresh(phq9_scale)

    print(f"✓ Created PHQ-9 scale (ID: {phq9_scale.id})")
    return phq9_scale


def seed_gad7(db: Session):
    """Seed GAD-7 (Generalized Anxiety Disorder-7) anxiety scale"""

    # Check if already exists
    existing = db.query(AssessmentScale).filter(AssessmentScale.scale_code == "GAD7").first()
    if existing:
        print("GAD-7 scale already exists, skipping...")
        return existing

    gad7_questions = [
        {
            "question": "Feeling nervous, anxious, or on edge",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        },
        {
            "question": "Not being able to stop or control worrying",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        },
        {
            "question": "Worrying too much about different things",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        },
        {
            "question": "Trouble relaxing",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        },
        {
            "question": "Being so restless that it's hard to sit still",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        },
        {
            "question": "Becoming easily annoyed or irritable",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        },
        {
            "question": "Feeling afraid as if something awful might happen",
            "options": [
                {"value": 0, "text": "Not at all"},
                {"value": 1, "text": "Several days"},
                {"value": 2, "text": "More than half the days"},
                {"value": 3, "text": "Nearly every day"}
            ],
            "reverse_scored": False
        }
    ]

    gad7_scale = AssessmentScale(
        scale_type=AssessmentType.GAD7,
        scale_name="Generalized Anxiety Disorder-7 (GAD-7)",
        scale_code="GAD7",
        description="The GAD-7 is a valid and efficient tool for screening for GAD and assessing its severity in clinical practice and research.",
        instructions="Over the last 2 weeks, how often have you been bothered by the following problems?",
        min_score=0,
        max_score=21,
        questions=gad7_questions,
        severity_thresholds={
            "MILD": 5,
            "MODERATE": 10,
            "SEVERE": 15
        },
        is_standard=True,
        is_active=True,
        created_by_provider_id=None
    )

    db.add(gad7_scale)
    db.commit()
    db.refresh(gad7_scale)

    print(f"✓ Created GAD-7 scale (ID: {gad7_scale.id})")
    return gad7_scale


def main():
    """Main function to seed assessment scales"""
    print("Seeding standard assessment scales...")
    print("=" * 60)

    db = SessionLocal()

    try:
        phq9 = seed_phq9(db)
        gad7 = seed_gad7(db)

        print("=" * 60)
        print("✓ Seeding complete!")
        print(f"  - PHQ-9 (ID: {phq9.id if phq9 else 'existing'})")
        print(f"  - GAD-7 (ID: {gad7.id if gad7 else 'existing'})")

    except Exception as e:
        print(f"✗ Error seeding scales: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
