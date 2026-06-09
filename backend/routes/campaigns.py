from fastapi import APIRouter, Query, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from services.mock_data import GOOGLE_CAMPAIGNS, META_CAMPAIGNS, GOOGLE_KEYWORDS
from services.google_ads_service import google_ads_service
from services.brand_store import get_analysis, save_analysis, get_brand
from database import get_db
from deps import get_current_user

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _google_summary(campaigns: list) -> dict:
    total_spend = sum(c["spend"] for c in campaigns)
    total_conv  = sum(c["conversions"] for c in campaigns)
    roas_camps  = [c for c in campaigns if c.get("roas")]
    roas_spend  = sum(c["spend"] for c in roas_camps)
    avg_roas    = round(
        sum(c["roas"] * c["spend"] for c in roas_camps) / roas_spend, 2
    ) if roas_spend else 0
    return {
        "total_campaigns":  len(campaigns),
        "total_spend":      round(total_spend, 2),
        "total_conversions": total_conv,
        "avg_roas":         avg_roas,
    }


def _meta_summary(campaigns: list) -> dict:
    total_spend = sum(c.get("spend", 0) for c in campaigns)
    total_res   = sum(c.get("results", 0) for c in campaigns if c.get("result_type") not in (None, "Impressions", "Link Clicks"))
    roas_camps  = [c for c in campaigns if c.get("roas")]
    roas_spend  = sum(c["spend"] for c in roas_camps)
    avg_roas    = round(
        sum(c["roas"] * c["spend"] for c in roas_camps) / roas_spend, 2
    ) if roas_spend else 0
    return {
        "total_campaigns": len(campaigns),
        "total_spend":     round(total_spend, 2),
        "total_results":   total_res,
        "avg_roas":        avg_roas,
    }


# ── Google Ads ────────────────────────────────────────────────────────────────

@router.get("/google/status")
async def google_ads_status():
    if not google_ads_service.is_configured:
        return {"connected": False, "message": "Google Ads credentials not configured."}
    summary = await google_ads_service.get_account_summary()
    return {"connected": True, "account": summary}


@router.get("/google")
async def get_google_campaigns(
    status: str = Query(default=None),
    date_range: str = Query(default="LAST_30_DAYS"),
):
    live    = await google_ads_service.get_campaigns(date_range)
    is_live = live is not None
    campaigns = live if is_live else GOOGLE_CAMPAIGNS
    if status:
        campaigns = [c for c in campaigns if c["status"] == status.upper()]
    return {
        "campaigns":   campaigns,
        "summary":     _google_summary(campaigns),
        "data_source": "live" if is_live else "mock",
    }


@router.get("/google/keywords")
async def get_keywords(min_qs: int = Query(default=None)):
    live    = await google_ads_service.get_keywords()
    is_live = live is not None
    keywords = live if is_live else GOOGLE_KEYWORDS
    if min_qs is not None:
        keywords = [k for k in keywords if k.get("quality_score") and k["quality_score"] >= min_qs]
    low_qs = [k for k in keywords if k.get("quality_score") and k["quality_score"] <= 4]
    return {
        "keywords": keywords, "total": len(keywords),
        "low_quality_score_count": len(low_qs),
        "low_quality_score_keywords": low_qs,
        "data_source": "live" if is_live else "mock",
    }


@router.get("/google/search-terms")
async def get_search_terms(campaign_id: str = Query(default=None)):
    live = await google_ads_service.get_search_terms(campaign_id)
    if live is None:
        return {"search_terms": [], "total": 0, "data_source": "not_configured"}
    no_conv = [t for t in live if t["conversions"] == 0 and t["spend"] > 0]
    return {"search_terms": live, "total": len(live), "zero_conversion_terms": no_conv, "data_source": "live"}


# ── Meta Ads ──────────────────────────────────────────────────────────────────

class MetaCampaignData(BaseModel):
    campaigns: List[dict]
    currency: Optional[str] = "USD"
    source: Optional[str] = "meta_mcp"
    pulled_at: Optional[str] = None


@router.post("/meta/{brand_id}/snapshot")
async def save_meta_snapshot(
    brand_id: str,
    data: MetaCampaignData,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Store a Meta campaign snapshot for a specific brand (pulled via Meta MCP)."""
    brand = await get_brand(brand_id, db)
    if not brand:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Brand not found")

    analysis = await get_analysis(brand_id, db) or {}
    analysis["meta_campaigns"] = {
        "campaigns": data.campaigns,
        "currency": data.currency,
        "source": data.source,
        "pulled_at": data.pulled_at,
    }
    await save_analysis(brand_id, analysis, db)
    return {"saved": True, "campaign_count": len(data.campaigns), "brand": brand["name"]}


@router.get("/meta")
async def get_meta_campaigns(
    brand_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Return Meta campaigns — live snapshot if stored for brand, else mock."""
    # Try brand-specific stored data first
    if brand_id:
        analysis = await get_analysis(brand_id, db)
        if analysis and "meta_campaigns" in analysis:
            stored = analysis["meta_campaigns"]
            campaigns = stored.get("campaigns", [])
            if status:
                campaigns = [c for c in campaigns if c.get("status", "").upper() == status.upper()]
            return {
                "campaigns":   campaigns,
                "summary":     _meta_summary(campaigns),
                "data_source": "live",
                "currency":    stored.get("currency", "USD"),
                "pulled_at":   stored.get("pulled_at"),
            }

    # Fallback to mock
    campaigns = META_CAMPAIGNS
    if status:
        campaigns = [c for c in campaigns if c["status"] == status.upper()]
    return {
        "campaigns":   campaigns,
        "summary":     _meta_summary(campaigns),
        "data_source": "mock",
        "currency":    "USD",
    }
