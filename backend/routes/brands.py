from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from deps import get_current_user
from config import settings
from services.brand_store import (
    create_brand, get_all_brands, get_brand, get_analysis, get_approval_stats,
    update_brand_targets,
)
from services.pipeline import run_full_pipeline

router = APIRouter()


class BrandCreate(BaseModel):
    name: str
    website: Optional[str] = ""
    industry: str
    competitors: Optional[List[str]] = []
    target_audience: Optional[str] = ""
    monthly_budget: Optional[str] = ""
    platforms: Optional[List[str]] = ["google", "meta"]
    goals: Optional[str] = ""
    # Performance targets (F01)
    target_cpl:           Optional[float] = None
    target_roas:          Optional[float] = None
    target_monthly_leads: Optional[int]   = None
    target_conv_rate:     Optional[float] = None
    target_monthly_spend: Optional[float] = None
    currency:             Optional[str]   = "USD"


class BrandTargetsUpdate(BaseModel):
    target_cpl:           Optional[float] = None
    target_roas:          Optional[float] = None
    target_monthly_leads: Optional[int]   = None
    target_conv_rate:     Optional[float] = None
    target_monthly_spend: Optional[float] = None
    currency:             Optional[str]   = "USD"


@router.get("/")
async def list_brands(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    brands = await get_all_brands(db)
    result = []
    for b in brands:
        stats = await get_approval_stats(db, b["id"])
        result.append({**b, "approval_stats": stats})
    return {"brands": result}


@router.post("/")
async def create_new_brand(
    data: BrandCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    brand = await create_brand(data.dict(), db)
    background_tasks.add_task(run_full_pipeline, brand["id"])
    return {"brand": brand, "message": "Brand created. Full analysis pipeline started automatically."}


@router.get("/pacing/all")
async def get_all_pacing_route(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Budget pacing for all brands. Registered before /{brand_id} to avoid wildcard capture."""
    from datetime import date
    import re
    from services.google_ads_service import google_ads_service
    from services.brand_store import get_analysis as _get_analysis

    brands   = await get_all_brands(db)
    today    = date.today()
    days_in  = (date(today.year + (today.month // 12), (today.month % 12) + 1, 1) - date(today.year, today.month, 1)).days
    days_el  = today.day
    days_rem = days_in - days_el

    result = []
    for brand in brands:
        # Parse monthly budget — prefer numeric target_monthly_spend, fall back to string parsing
        budget_num = brand.get("target_monthly_spend") or 0.0
        currency   = brand.get("currency") or "USD"
        if not budget_num:
            raw = brand.get("monthly_budget", "") or ""
            nums = re.findall(r"[\d,]+\.?\d*", raw.replace(",", ""))
            if nums:
                budget_num = float(nums[0])
            if "INR" in raw.upper() or "₹" in raw:
                currency = "INR"

        platforms    = brand.get("platforms", [])
        google_spend = meta_spend = 0.0
        data_source  = "no_data"

        # Only query Google Ads if this brand's customer ID matches the configured account.
        # Prevents Wellspring's spend from appearing on Meta-only clients.
        brand_gads_id = (brand.get("google_ads_customer_id") or "").replace("-", "")
        configured_id = (settings.GOOGLE_ADS_CUSTOMER_ID or "").replace("-", "")
        if "google" in platforms and google_ads_service.is_configured and brand_gads_id and brand_gads_id == configured_id:
            try:
                camps = await google_ads_service.get_campaigns("THIS_MONTH")
                if camps:
                    google_spend = round(sum(c["spend"] for c in camps), 2)
                    data_source  = "live"
            except Exception:
                pass

        if "meta" in platforms:
            analysis = await _get_analysis(brand["id"], db)
            if analysis and "meta_campaigns" in analysis:
                meta_spend = round(sum(c.get("spend", 0) for c in analysis["meta_campaigns"].get("campaigns", [])), 2)
                if data_source != "live":
                    data_source = "snapshot"

        total = google_spend + meta_spend
        if budget_num > 0:
            daily_rate    = total / max(days_el, 1)
            projected     = round(daily_rate * days_in, 2)
            pct_budget    = round((total / budget_num) * 100, 1)
            pct_elapsed   = round((days_el / days_in) * 100, 1)
            variance      = round(pct_budget - pct_elapsed, 1)
            status = "on_pace" if abs(variance) <= 10 else ("over_pacing" if variance > 10 else "under_pacing")
        else:
            projected = pct_budget = variance = 0.0
            pct_elapsed = round((days_el / days_in) * 100, 1)
            status = "no_budget"

        result.append({
            "brand_id": brand["id"], "brand_name": brand["name"],
            "platforms": platforms, "currency": currency,
            "monthly_budget": budget_num, "spend_to_date": total,
            "google_spend": google_spend, "meta_spend": meta_spend,
            "projected_spend": projected, "days_elapsed": days_el,
            "days_remaining": days_rem, "days_in_month": days_in,
            "pct_of_budget": pct_budget, "pct_elapsed": pct_elapsed,
            "variance_pct": variance, "status": status, "data_source": data_source,
        })

    order = {"over_pacing": 0, "under_pacing": 1, "on_pace": 2, "no_budget": 3}
    result.sort(key=lambda x: (order.get(x["status"], 4), -x["spend_to_date"]))
    return {"pacing": result, "as_of": today.isoformat(), "days_elapsed": days_el, "days_in_month": days_in}


@router.get("/{brand_id}")
async def get_brand_detail(
    brand_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    brand = await get_brand(brand_id, db)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    analysis = await get_analysis(brand_id, db)
    stats = await get_approval_stats(db, brand_id)
    return {"brand": brand, "analysis": analysis, "approval_stats": stats}


@router.post("/{brand_id}/run-pipeline")
async def trigger_pipeline(
    brand_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    brand = await get_brand(brand_id, db)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if brand["analysis_status"] == "running":
        return {"message": "Pipeline already running for this brand"}
    background_tasks.add_task(run_full_pipeline, brand_id)
    return {"message": "Full analysis pipeline started", "brand_id": brand_id}


@router.patch("/{brand_id}/accounts")
async def set_brand_accounts(
    brand_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Set platform account IDs on a brand (e.g. google_ads_customer_id)."""
    from sqlalchemy import update
    from models.db_models import Brand
    brand = await get_brand(brand_id, db)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    allowed = {"google_ads_customer_id"}
    values  = {k: v for k, v in data.items() if k in allowed}
    if values:
        await db.execute(update(Brand).where(Brand.id == brand_id).values(**values))
        await db.commit()
    updated = await get_brand(brand_id, db)
    return {"brand": updated}


@router.patch("/{brand_id}/targets")
async def set_brand_targets(
    brand_id: str,
    data: BrandTargetsUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    brand = await update_brand_targets(brand_id, data.dict(exclude_unset=True), db)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return {"brand": brand}


@router.delete("/{brand_id}")
async def delete_brand(
    brand_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    from sqlalchemy import delete as sql_delete
    from models.db_models import Brand, Analysis, ApprovalItem
    brand = await get_brand(brand_id, db)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    await db.execute(sql_delete(ApprovalItem).where(ApprovalItem.brand_id == brand_id))
    await db.execute(sql_delete(Analysis).where(Analysis.brand_id == brand_id))
    await db.execute(sql_delete(Brand).where(Brand.id == brand_id))
    await db.commit()
    return {"deleted": True, "brand_id": brand_id, "name": brand["name"]}


@router.get("/{brand_id}/analysis")
async def get_brand_analysis(
    brand_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    brand = await get_brand(brand_id, db)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    analysis = await get_analysis(brand_id, db)
    return {"brand": brand, "analysis": analysis, "status": brand["analysis_status"]}
