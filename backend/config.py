from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    MISTRAL_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    CORS_ORIGINS: str = "*"
    ENVIRONMENT: str = "development"
    # SQLite for local dev; set to postgresql+asyncpg://... for production
    DATABASE_URL: str = "sqlite+aiosqlite:///./ppc_agent.db"
    # Generate a strong key: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = "change-this-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    # Google Ads API — all five required to enable live data; leave blank to use mock
    GOOGLE_ADS_DEVELOPER_TOKEN: str = ""
    GOOGLE_ADS_CLIENT_ID: str = ""
    GOOGLE_ADS_CLIENT_SECRET: str = ""
    GOOGLE_ADS_REFRESH_TOKEN: str = ""
    GOOGLE_ADS_CUSTOMER_ID: str = ""        # e.g. 123-456-7890 or 1234567890
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: str = ""  # MCC manager account ID (optional)

    class Config:
        env_file = ".env"


settings = Settings()
