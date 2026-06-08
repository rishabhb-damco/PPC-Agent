from fastapi import APIRouter, Query
from services.mock_data import GOOGLE_CAMPAIGNS, META_CAMPAIGNS, GOOGLE_KEYWORDS
from services.google_ads_service import google_ads_service

router = APIRouter()


def _google_summary(campaigns: list) -> dict:
    total_spend = sum(c["spend"] for c in campaigns)
    total_conv = sum(c["conversions"] for c in campaigns)
    roas_camps = [c for c in campaigns if c.get("roas")]
    roas_spend = sum(c["spend"] for c in roas_camps)
    avg_roas = round(
        sum(c["roas"] * c["spend"] for c in roas_camps) / roas_spend, 2
    ) if roas_spend else 0
    return {
        "total_campaigns": len(campaigns),
        "total_spend": round(total_spend, 2),
        "total_conversions": total_conv,
        "avg_roas": avg_roas,
    }


@router.get("/google/status")
async def google_ads_status():
    """Check if Google Ads API is connected."""
    if not google_ads_service.is_configured:
        return {
            "connected": False,
            "message": "Google Ads credentials not configured. Set GOOGLE_ADS_* env vars to enable live data.",
        }
    summary = await google_ads_service.get_account_summary()
    return {"connected": True, "account": summary}



@router.get("/google")
async def get_google_campaigns(
    status: str = Query(default=None),
    date_range: str = Query(default="LAST_30_DAYS"),
):
    live = await google_ads_service.get_campaigns(date_range)
    is_live = live is not None
    campaigns = live if is_live else GOOGLE_CAMPAIGNS
    if status:
        campaigns = [c for c in campaigns if c["status"] == status.upper()]
    return {
        "campaigns": campaigns,
        "summary": _google_summary(campaigns),
        "data_source": "live" if is_live else "mock",
    }


@router.get("/google/keywords")
async def get_keywords(min_qs: int = Query(default=None)):
    live = await google_ads_service.get_keywords()
    is_live = live is not None
    keywords = live if is_live else GOOGLE_KEYWORDS
    if min_qs is not None:
        keywords = [k for k in keywords if k.get("quality_score") and k["quality_score"] >= min_qs]
    low_qs = [k for k in keywords if k.get("quality_score") and k["quality_score"] <= 4]
    return {
        "keywords": keywords,
        "total": len(keywords),
        "low_quality_score_count": len(low_qs),
        "low_quality_score_keywords": low_qs,
        "data_source": "live" if is_live else "mock",
    }


@router.get("/google/search-terms")
async def get_search_terms(campaign_id: str = Query(default=None)):
    """Live search term report — used by A2 agent for negative keyword suggestions."""
    live = await google_ads_service.get_search_terms(campaign_id)
    if live is None:
        return {
            "search_terms": [],
            "total": 0,
            "data_source": "not_configured",
            "message": "Set Google Ads credentials to enable search term reports.",
        }
    no_conv = [t for t in live if t["conversions"] == 0 and t["spend"] > 0]
    return {
        "search_terms": live,
        "total": len(live),
        "zero_conversion_terms": no_conv,
        "data_source": "live",
    }


@router.get("/meta")
async def get_meta_campaigns(status: str = Query(default=None)):
    campaigns = META_CAMPAIGNS
    if status:
        campaigns = [c for c in campaigns if c["status"] == status.upper()]
    total_spend = sum(c["spend"] for c in campaigns)
    purchase_results = sum(
        c["results"] for c in campaigns if c["result_type"] in ("Purchases", "Leads")
    )
    roas_camps = [c for c in campaigns if c["roas"]]
    roas_spend = sum(c["spend"] for c in roas_camps)
    avg_roas = (
        round(sum(c["roas"] * c["spend"] for c in roas_camps) / roas_spend, 2)
        if roas_spend else 0
    )
    return {
        "campaigns": campaigns,
        "summary": {
            "total_campaigns": len(campaigns),
            "total_spend": round(total_spend, 2),
            "total_results": purchase_results,
            "avg_roas": avg_roas,
        },
        "data_source": "mock",
    }
