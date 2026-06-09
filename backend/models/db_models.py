import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, JSON, ForeignKey, Integer, Text, Boolean, Float
from sqlalchemy.orm import mapped_column, Mapped
from database import Base


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    website: Mapped[str] = mapped_column(String(500), default="")
    industry: Mapped[str] = mapped_column(String(255), default="")
    competitors: Mapped[list] = mapped_column(JSON, default=list)
    target_audience: Mapped[str] = mapped_column(Text, default="")
    monthly_budget: Mapped[str] = mapped_column(String(100), default="")
    platforms: Mapped[list] = mapped_column(JSON, default=lambda: ["google", "meta"])
    goals: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    last_analysed: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    analysis_status: Mapped[str] = mapped_column(String(50), default="never_run")
    # Performance targets (F01)
    target_cpl: Mapped[float | None]  = mapped_column(Float, nullable=True)
    target_roas: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_monthly_leads: Mapped[int | None]   = mapped_column(Integer, nullable=True)
    target_conv_rate: Mapped[float | None]     = mapped_column(Float, nullable=True)
    target_monthly_spend: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD")


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    brand_id: Mapped[str] = mapped_column(String(36), ForeignKey("brands.id"), nullable=False, unique=True)
    data: Mapped[dict] = mapped_column(JSON, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class ApprovalItem(Base):
    __tablename__ = "approval_queue"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_id: Mapped[str] = mapped_column(String(36), ForeignKey("brands.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="general")
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    recommendation: Mapped[str] = mapped_column(Text, default="")
    agent_id: Mapped[str] = mapped_column(String(10), nullable=False)
    impact: Mapped[str] = mapped_column(String(20), default="medium")
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    actioned_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
