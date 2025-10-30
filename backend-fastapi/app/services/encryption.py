from cryptography.fernet import Fernet
from app.core.config import settings
import base64
import logging

logger = logging.getLogger(__name__)


class EncryptionService:
    """
    PHI encryption service for data at rest
    Uses Fernet (symmetric encryption) for database PHI fields
    """

    def __init__(self):
        # Derive encryption key from SECRET_KEY
        # In production, use a separate encryption key stored in secure key management (AWS KMS, Azure Key Vault, etc.)
        key = base64.urlsafe_b64encode(settings.SECRET_KEY.encode()[:32].ljust(32, b'0'))
        self.cipher = Fernet(key)

    def encrypt(self, plaintext: str) -> str:
        """Encrypt sensitive data before storing in database"""
        if not plaintext:
            return plaintext

        try:
            encrypted_bytes = self.cipher.encrypt(plaintext.encode())
            return encrypted_bytes.decode()
        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            raise ValueError("Failed to encrypt data")

    def decrypt(self, ciphertext: str) -> str:
        """Decrypt sensitive data when retrieving from database"""
        if not ciphertext:
            return ciphertext

        try:
            decrypted_bytes = self.cipher.decrypt(ciphertext.encode())
            return decrypted_bytes.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            raise ValueError("Failed to decrypt data")

    def encrypt_dict(self, data: dict, fields: list) -> dict:
        """Encrypt specific fields in a dictionary"""
        encrypted_data = data.copy()
        for field in fields:
            if field in encrypted_data and encrypted_data[field]:
                encrypted_data[field] = self.encrypt(str(encrypted_data[field]))
        return encrypted_data

    def decrypt_dict(self, data: dict, fields: list) -> dict:
        """Decrypt specific fields in a dictionary"""
        decrypted_data = data.copy()
        for field in fields:
            if field in decrypted_data and decrypted_data[field]:
                decrypted_data[field] = self.decrypt(decrypted_data[field])
        return decrypted_data
