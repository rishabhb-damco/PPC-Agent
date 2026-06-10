"""
Account Health Score — computed on demand per brand.
No DB table. Inputs: targets, pacing data, tracking alerts.

Score logic:
  green  — all core signals healthy
  amber  — one signal off by 15–30%, or minor tracking issue
  red    — any signal off by >30%, or critical tracking failure

Components checked:
  - cpl_status:     actual CPL vs target_cpl
  - roas_status:    actual ROAS vs target_roas (if available)
  - pacing_status:  budget pacing variance
  - tracking_ok:    no critical tracking alerts
  - retention_risk: derived from pacing + overdue approvals
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from deps import get_current_user
from services.brand_store import get_all_brands, get_brand, get_approval_queue
from services.google_ads_service import google_ads_service
# ALERTS import removed — tracking excluded from health score until per-brand alert storage exists

router = APIRouter()


def _score(components: dict) -> str:
    statuses = list(components.values())
    if not statuses:
        return "unknown"   # No targets configured — cannot produce a reliable health signal
    if "red" in statuses:
        return "red"
    if "amber" in statuses:
        return "amber"
    return "green"


async def _compute_health(brand: dict, db: AsyncSession) -> dict:
    from datetime import date
    from services.brand_store import get_analysis
    from config import settings

    brand_id    = brand["id"]
    target_cpl  = brand.get("target_cpl")
    target_roas = brand.get("target_roas")
    platforms   = brand.get("platforms", [])

    components: dict[str, str] = {}

    # Tracking is excluded from health score until per-brand alert storage exists.
    # The global mock alerts would produce incorrect health signals for all clients.

    # ── CPL vs target ────────────────────────────────────────────────────────
    brand_gads_id  = (brand.get("google_ads_customer_id") or "").replace("-", "")
    configured_id  = (settings.GOOGLE_ADS_CUSTOMER_ID or "").replace("-", "")
    gads_linked    = bool(brand_gads_id and configured_id and brand_gads_id == configured_id)

    if target_cpl and "google" in platforms and google_ads_service.is_configured and gads_linked:
        try:
            camps = await google_ads_service.get_campaigns("LAST_30_DAYS")
            if camps:
                spend = sum(c["spend"] for c in camps)
                conv  = sum(c["conversions"] for c in camps)
                if conv > 0:
                    actual_cpl = spend / conv
                    variance   = ((actual_cpl - target_cpl) / target_cpl) * 100
                    components["cpl"] = "green" if variance <= 15 else "amber" if variance <= 30 else "red"
        except Exception:
            pass

    # ── 3. Budget pacing ──────────────────────────────────────────────────────
    target_spend = brand.get("target_monthly_spend") or 0.0
    if target_spend > 0:
        today   = date.today()
        days_in = (date(today.year + (today.month // 12), (today.month % 12) + 1, 1) - date(today.year, today.month, 1)).days
        days_el = today.day

        total_spend = 0.0
        if "google" in platforms and google_ads_service.is_configured and gads_linked:
            try:
                camps = await google_ads_service.get_campaigns("THIS_MONTH")
                if camps:
                    total_spend += sum(c["spend"] for c in camps)
            except Exception:
                pass
        if "meta" in platforms:
            analysis = await get_analysis(brand_id, db)
            if analysis and "meta_campaigns" in analysis:
                total_spend += sum(c.get("spend", 0) for c in analysis["meta_campaigns"].get("campaigns", []))

        pct_budget  = (total_spend / target_spend) * 100
        pct_elapsed = (days_el / days_in) * 100
        variance    = pct_budget - pct_elapsed
        components["pacing"] = "green" if abs(variance) <= 10 else "amber" if abs(variance) <= 25 else "red"

    # ── 4. Retention risk (overdue high-impact approvals) ────────────────────
    from datetime import datetime
    pending = await get_approval_queue(db, brand_id=brand_id, status="pending")
    aged_high = [
        i for i in pending
        if i["impact"] == "high"
        and i.get("created_at")
        and (datetime.now() - datetime.fromisoformat(i["created_at"])).days > 7
    ]
    components["retention"] = "amber" if aged_high else "green"

    score = _score(components)
    return {
        "brand_id":   brand_id,
        "brand_name": brand["name"],
        "score":      score,
        "components": components,
    }


@router.get("/all")
async def get_all_health(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    brands = await get_all_brands(db)
    result = []
    for brand in brands:
        health = await _compute_health(brand, db)
        result.append(health)
    return {"health": result}


@router.get("/{brand_id}")
async def get_brand_health(
    brand_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    brand = await get_brand(brand_id, db)
    if not brand:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Brand not found")
    return await _compute_health(brand, db)
