from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: Optional[str] = None
    CORS_ORIGINS: str = "*"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
