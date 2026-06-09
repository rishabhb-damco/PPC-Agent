from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {},
)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def run_column_migrations():
    """
    Safely add new columns to existing tables.
    Uses IF NOT EXISTS so it is safe to run on every startup.
    """
    is_sqlite = settings.DATABASE_URL.startswith("sqlite")

    # New target columns added in Phase 1 (F01)
    target_columns = [
        ("target_cpl",           "REAL"     if is_sqlite else "FLOAT"),
        ("target_roas",          "REAL"     if is_sqlite else "FLOAT"),
        ("target_monthly_leads", "INTEGER"  if is_sqlite else "INTEGER"),
        ("target_conv_rate",     "REAL"     if is_sqlite else "FLOAT"),
        ("target_monthly_spend", "REAL"     if is_sqlite else "FLOAT"),
        ("currency",             "TEXT DEFAULT 'USD'" if is_sqlite else "VARCHAR(10) DEFAULT 'USD'"),
        ("google_ads_customer_id", "TEXT" if is_sqlite else "VARCHAR(20)"),
    ]

    async with engine.begin() as conn:
        for col_name, col_type in target_columns:
            try:
                if is_sqlite:
                    await conn.execute(
                        __import__("sqlalchemy").text(
                            f"ALTER TABLE brands ADD COLUMN {col_name} {col_type}"
                        )
                    )
                else:
                    await conn.execute(
                        __import__("sqlalchemy").text(
                            f"ALTER TABLE brands ADD COLUMN IF NOT EXISTS {col_name} {col_type}"
                        )
                    )
            except Exception:
                pass  # Column already exists — safe to ignore
