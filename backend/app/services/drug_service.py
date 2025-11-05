"""
Drug Interaction Service - Week 7
Checks for drug interactions using local database
"""
import json
from typing import List, Dict
from pathlib import Path


class DrugService:
    def __init__(self):
        self.drugs_file = Path(__file__).parent.parent / 'data' / 'drugs.json'
        self.interactions_file = Path(__file__).parent.parent / 'data' / 'interactions.json'

        # Load data
        self.drugs = self._load_drugs()
        self.interactions = self._load_interactions()

    def _load_drugs(self) -> Dict:
        """Load drugs database"""
        # TODO: Week 7 - Create drugs.json
        if not self.drugs_file.exists():
            return {}

        with open(self.drugs_file, 'r') as f:
            return json.load(f)

    def _load_interactions(self) -> List[Dict]:
        """Load interactions database"""
        # TODO: Week 7 - Create interactions.json
        if not self.interactions_file.exists():
            return []

        with open(self.interactions_file, 'r') as f:
            return json.load(f)

    async def check_interactions(self, medications: List[str]) -> List[Dict]:
        """
        Check for drug interactions

        Args:
            medications: List of medication names

        Returns:
            List of interactions found
        """
        # TODO: Week 7 - Implement interaction checking
        return []

    async def get_drug_info(self, drug_name: str) -> Dict:
        """
        Get information about a specific drug

        Returns:
            {
                'name': str,
                'class': str,
                'typical_dose_range': str,
                'warnings': list,
                'common_uses': list
            }
        """
        # TODO: Week 7 - Implement drug lookup
        return {}
