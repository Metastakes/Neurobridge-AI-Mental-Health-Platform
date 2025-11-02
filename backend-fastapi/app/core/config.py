from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "NeuroBridge"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql://neurobridge:password@localhost:5432/neurobridge"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    STRIPE_API_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    AWS_SES_FROM_EMAIL: str = ""

    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    @field_validator('SECRET_KEY')
    def validate_secret_key(cls, v):
        if v == "CHANGE_ME_IN_PRODUCTION":
            raise ValueError('SECRET_KEY must be changed in production')
        if len(v) < 32:
            raise ValueError('SECRET_KEY must be at least 32 characters')
        return v

    @field_validator('DATABASE_URL')
    def validate_database_url(cls, v):
        if not v.startswith('postgresql://'):
            raise ValueError('DATABASE_URL must be PostgreSQL connection string')
        return v

    class Config:
        env_file = ".env"


settings = Settings()
