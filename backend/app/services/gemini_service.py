"""
Gemini AI Service - Week 4
Handles AI suggestions, safety alerts, and SOAP note generation
"""
import google.generativeai as genai
import os
from typing import List, Dict

# Configure Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))


class GeminiService:
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=os.getenv('GEMINI_MODEL', 'gemini-1.5-pro')
        )

    async def generate_suggestion(self, transcript: str, context: Dict) -> Dict:
        """
        Generate next question suggestion based on transcript

        Args:
            transcript: Recent conversation text
            context: Session context (chief_complaint, etc.)

        Returns:
            {
                'type': 'question',
                'priority': 'medium',
                'title': 'Suggested Question',
                'content': 'Have you asked about...'
            }
        """
        # TODO: Week 4 - Implement suggestion generation
        return {
            'type': 'question',
            'priority': 'medium',
            'title': 'Placeholder',
            'content': 'AI suggestion will appear here'
        }

    async def check_safety_alerts(self, transcript: str) -> List[Dict]:
        """
        Check for safety concerns (SI/HI, abuse, substance use)

        Returns:
            List of safety alerts if any detected
        """
        # TODO: Week 4 - Implement safety alert detection
        return []

    async def generate_soap_note(self, session_data: Dict) -> str:
        """
        Generate SOAP note from session data

        Args:
            session_data: {
                'transcript': str,
                'mse': dict,
                'medications': list,
                'diagnoses': list,
                'chief_complaint': str
            }

        Returns:
            Formatted SOAP note
        """
        # TODO: Week 6 - Implement SOAP note generation
        return """
        S: [Subjective]
        O: [Objective]
        A: [Assessment]
        P: [Plan]
        """

    async def generate_core_elms(self, session_data: Dict) -> str:
        """
        Generate CORE ELMS formatted output

        Returns:
            CORE ELMS formatted string
        """
        # TODO: Week 6 - Implement CORE ELMS formatting
        return "[CORE ELMS output]"
