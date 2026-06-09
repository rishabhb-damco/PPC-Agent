import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from models.db_models import Brand, Analysis, ApprovalItem


# ─── Serialisers ──────────────────────────────────────────────────────────────

def _brand_to_dict(b: Brand) -> dict:
    return {
        "id": b.id,
        "name": b.name,
        "website": b.website,
        "industry": b.industry,
        "competitors": b.competitors or [],
        "target_audience": b.target_audience,
        "monthly_budget": b.monthly_budget,
        "platforms": b.platforms or ["google", "meta"],
        "goals": b.goals,
        "created_at": b.created_at.isoformat() if b.created_at else None,
        "last_analysed": b.last_analysed.isoformat() if b.last_analysed else None,
        "analysis_status": b.analysis_status,
        # Performance targets (F01)
        "target_cpl":           b.target_cpl,
        "target_roas":          b.target_roas,
        "target_monthly_leads": b.target_monthly_leads,
        "target_conv_rate":     b.target_conv_rate,
        "target_monthly_spend": b.target_monthly_spend,
        "currency":             getattr(b, "currency", "USD") or "USD",
    }


def _approval_to_dict(a: ApprovalItem) -> dict:
    return {
        "id": a.id,
        "brand_id": a.brand_id,
        "type": a.type,
        "category": a.category,
        "title": a.title,
        "description": a.description,
        "recommendation": a.recommendation,
        "agent_id": a.agent_id,
        "impact": a.impact,
        "status": a.status,
        "created_at": a.created_at.isoformat() if a.created_at else None,
        "actioned_at": a.actioned_at.isoformat() if a.actioned_at else None,
        "metadata": a.metadata_json or {},
    }


# ─── Brand CRUD ───────────────────────────────────────────────────────────────

async def create_brand(data: dict, db: AsyncSession) -> dict:
    brand = Brand(
        id=str(uuid.uuid4()),
        name=data["name"],
        website=data.get("website", ""),
        industry=data.get("industry", ""),
        competitors=data.get("competitors", []),
        target_audience=data.get("target_audience", ""),
        monthly_budget=data.get("monthly_budget", ""),
        platforms=data.get("platforms", ["google", "meta"]),
        goals=data.get("goals", ""),
        created_at=datetime.now(),
        analysis_status="never_run",
        target_cpl=data.get("target_cpl"),
        target_roas=data.get("target_roas"),
        target_monthly_leads=data.get("target_monthly_leads"),
        target_conv_rate=data.get("target_conv_rate"),
        target_monthly_spend=data.get("target_monthly_spend"),
        currency=data.get("currency", "USD"),
    )
    db.add(brand)
    await db.commit()
    await db.refresh(brand)
    return _brand_to_dict(brand)


async def get_all_brands(db: AsyncSession) -> List[dict]:
    result = await db.execute(select(Brand).order_by(Brand.created_at.desc()))
    return [_brand_to_dict(b) for b in result.scalars().all()]


async def get_brand(brand_id: str, db: AsyncSession) -> Optional[dict]:
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    return _brand_to_dict(brand) if brand else None


async def update_brand_targets(brand_id: str, targets: dict, db: AsyncSession) -> Optional[dict]:
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    if not brand:
        return None
    for field in ("target_cpl", "target_roas", "target_monthly_leads",
                  "target_conv_rate", "target_monthly_spend", "currency"):
        if field in targets:
            setattr(brand, field, targets[field])
    await db.commit()
    await db.refresh(brand)
    return _brand_to_dict(brand)


async def update_brand_status(brand_id: str, status: str, db: AsyncSession):
    values: dict = {"analysis_status": status}
    if status == "completed":
        values["last_analysed"] = datetime.now()
    await db.execute(update(Brand).where(Brand.id == brand_id).values(**values))
    await db.commit()


# ─── Analysis Storage ─────────────────────────────────────────────────────────

async def save_analysis(brand_id: str, analysis: dict, db: AsyncSession):
    result = await db.execute(select(Analysis).where(Analysis.brand_id == brand_id))
    existing = result.scalar_one_or_none()
    if existing:
        existing.data = analysis
        existing.generated_at = datetime.now()
    else:
        db.add(Analysis(brand_id=brand_id, data=analysis, generated_at=datetime.now()))
    await db.commit()


async def get_analysis(brand_id: str, db: AsyncSession) -> Optional[dict]:
    result = await db.execute(select(Analysis).where(Analysis.brand_id == brand_id))
    row = result.scalar_one_or_none()
    if not row:
        return None
    return {**row.data, "brand_id": brand_id, "generated_at": row.generated_at.isoformat()}


# ─── Approval Queue ───────────────────────────────────────────────────────────

async def add_approval_item(
    brand_id: str, item_type: str, title: str, description: str,
    recommendation: str, agent_id: str, impact: str = "medium",
    category: str = "general", metadata: dict = None, db: AsyncSession = None,
) -> dict:
    item = ApprovalItem(
        id=str(uuid.uuid4()),
        brand_id=brand_id,
        type=item_type,
        category=category,
        title=title,
        description=description,
        recommendation=recommendation,
        agent_id=agent_id,
        impact=impact,
        status="pending",
        created_at=datetime.now(),
        metadata_json=metadata or {},
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _approval_to_dict(item)


async def get_approval_queue(
    db: AsyncSession, brand_id: str = None, status: str = None,
) -> List[dict]:
    stmt = select(ApprovalItem)
    if brand_id:
        stmt = stmt.where(ApprovalItem.brand_id == brand_id)
    if status:
        stmt = stmt.where(ApprovalItem.status == status)
    result = await db.execute(stmt)
    items = [_approval_to_dict(a) for a in result.scalars().all()]
    return sorted(items, key=lambda x: (
        {"high": 0, "medium": 1, "low": 2}.get(x["impact"], 1),
        x["created_at"] or "",
    ))


async def action_approval_item(item_id: str, action: str, db: AsyncSession) -> Optional[dict]:
    result = await db.execute(select(ApprovalItem).where(ApprovalItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        return None
    item.status = action
    item.actioned_at = datetime.now()
    await db.commit()
    await db.refresh(item)
    return _approval_to_dict(item)


async def bulk_action_approvals(item_ids: List[str], action: str, db: AsyncSession) -> List[dict]:
    results = []
    for iid in item_ids:
        item = await action_approval_item(iid, action, db)
        if item:
            results.append(item)
    return results


async def get_approval_stats(db: AsyncSession, brand_id: str = None) -> dict:
    items = await get_approval_queue(db, brand_id)
    return {
        "total": len(items),
        "pending": len([i for i in items if i["status"] == "pending"]),
        "approved": len([i for i in items if i["status"] == "approved"]),
        "rejected": len([i for i in items if i["status"] == "rejected"]),
        "high_impact_pending": len([i for i in items if i["status"] == "pending" and i["impact"] == "high"]),
    }
