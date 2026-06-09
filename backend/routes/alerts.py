from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from deps import get_current_user
from services.email_service import send_alert_email
from services.mock_data import ALERTS
from services.brand_store import get_all_brands, get_approval_stats

router = APIRouter()


class AlertItem(BaseModel):
    id: str
    severity: str
    title: str
    description: str
    platform: str
    campaign: Optional[str] = None


class SendAlertRequest(BaseModel):
    alerts: Optional[List[AlertItem]] = None   # if None, uses all active system alerts
    include_brands: bool = True


@router.post("/send-summary")
async def send_alert_summary(
    req: SendAlertRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Send an alert summary email to the configured address."""
    # Use provided alerts or fall back to active system alerts
    alerts = [a.dict() for a in req.alerts] if req.alerts else [
        a for a in ALERTS if not a["resolved"]
    ]

    brands = None
    if req.include_brands:
        brand_list = await get_all_brands(db)
        brands_with_stats = []
        for b in brand_list:
            stats = await get_approval_stats(db, b["id"])
            brands_with_stats.append({**b, "approval_stats": stats})
        brands = brands_with_stats

    result = await send_alert_email(alerts, brands, source="manual")
    return result


@router.post("/send-pipeline-summary")
async def send_pipeline_summary(
    brand_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Send a pipeline completion alert with high-impact items."""
    from services.brand_store import get_approval_queue, get_brand
    brand = await get_brand(brand_id, db)
    if not brand:
        return {"sent": False, "error": "Brand not found"}

    items = await get_approval_queue(db, brand_id=brand_id, status="pending")
    high_impact = [i for i in items if i["impact"] == "high"]

    if not high_impact:
        return {"sent": False, "reason": "No high-impact items — email skipped"}

    # Convert approval items to alert format for email
    alerts = [
        {
            "id": item["id"],
            "severity": "error" if item["impact"] == "high" else "warning",
            "title": item["title"],
            "description": item["description"][:150],
            "platform": item["category"].replace("_", " ").title(),
            "campaign": None,
        }
        for item in high_impact[:8]
    ]

    brands = [{**brand, "approval_stats": await get_approval_stats(db, brand_id)}]
    result = await send_alert_email(alerts, brands, source="pipeline")
    return result
