"""Initial schema: brands, analyses, approval_queue

Revision ID: 001
Revises:
Create Date: 2026-05-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "brands",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("website", sa.String(500), nullable=True, server_default=""),
        sa.Column("industry", sa.String(255), nullable=True, server_default=""),
        sa.Column("competitors", sa.JSON(), nullable=True),
        sa.Column("target_audience", sa.Text(), nullable=True, server_default=""),
        sa.Column("monthly_budget", sa.String(100), nullable=True, server_default=""),
        sa.Column("platforms", sa.JSON(), nullable=True),
        sa.Column("goals", sa.Text(), nullable=True, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("last_analysed", sa.DateTime(), nullable=True),
        sa.Column("analysis_status", sa.String(50), nullable=True, server_default="never_run"),
    )

    op.create_table(
        "analyses",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("brand_id", sa.String(36), sa.ForeignKey("brands.id"), nullable=False, unique=True),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("generated_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "approval_queue",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("brand_id", sa.String(36), sa.ForeignKey("brands.id"), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("category", sa.String(50), nullable=True, server_default="general"),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True, server_default=""),
        sa.Column("recommendation", sa.Text(), nullable=True, server_default=""),
        sa.Column("agent_id", sa.String(10), nullable=False),
        sa.Column("impact", sa.String(20), nullable=True, server_default="medium"),
        sa.Column("status", sa.String(20), nullable=True, server_default="pending"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("actioned_at", sa.DateTime(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
    )

    op.create_index("ix_approval_queue_brand_id", "approval_queue", ["brand_id"])
    op.create_index("ix_approval_queue_status", "approval_queue", ["status"])


def downgrade() -> None:
    op.drop_table("approval_queue")
    op.drop_table("analyses")
    op.drop_table("brands")
