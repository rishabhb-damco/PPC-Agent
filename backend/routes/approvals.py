from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from deps import get_current_user
from services.brand_store import (
    get_approval_queue, action_approval_item,
    bulk_action_approvals, get_approval_stats,
)

router = APIRouter()


class ActionItem(BaseModel):
    action: str  # approved | rejected


class BulkAction(BaseModel):
    item_ids: List[str]
    action: str


@router.get("/")
async def list_approvals(
    brand_id: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    items = await get_approval_queue(db, brand_id=brand_id, status=status)
    stats = await get_approval_stats(db, brand_id)
    return {"items": items, "stats": stats}


@router.get("/stats")
async def approval_stats(
    brand_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    return await get_approval_stats(db, brand_id)


@router.post("/{item_id}/action")
async def action_item(
    item_id: str,
    body: ActionItem,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    if body.action not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Action must be 'approved' or 'rejected'")
    item = await action_approval_item(item_id, body.action, db)
    if not item:
        raise HTTPException(status_code=404, detail="Approval item not found")
    return {"item": item, "message": f"Item {body.action} successfully"}


@router.post("/bulk-action")
async def bulk_action(
    body: BulkAction,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    if body.action not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Action must be 'approved' or 'rejected'")
    results = await bulk_action_approvals(body.item_ids, body.action, db)
    return {"actioned": len(results), "action": body.action}


@router.get("/pending-count")
async def pending_count(
    brand_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    items = await get_approval_queue(db, brand_id=brand_id, status="pending")
    high = [i for i in items if i["impact"] == "high"]
    return {
        "total_pending": len(items),
        "high_impact": len(high),
        "by_category": {
            "google_ads": len([i for i in items if i["category"] == "google_ads"]),
            "meta_ads": len([i for i in items if i["category"] == "meta_ads"]),
            "technical": len([i for i in items if i["category"] == "technical"]),
            "creative": len([i for i in items if i["category"] == "creative"]),
            "strategy": len([i for i in items if i["category"] == "strategy"]),
        },
    }
