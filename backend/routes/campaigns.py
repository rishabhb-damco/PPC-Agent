from fastapi import APIRouter, Query
from services.mock_data import GOOGLE_CAMPAIGNS, META_CAMPAIGNS, GOOGLE_KEYWORDS

router = APIRouter()


@router.get("/google")
async def get_google_campaigns(status: str = Query(default=None)):
    campaigns = GOOGLE_CAMPAIGNS
    if status:
        campaigns = [c for c in campaigns if c["status"] == status.upper()]
    total_spend = sum(c["spend"] for c in campaigns)
    total_conv = sum(c["conversions"] for c in campaigns)
    avg_roas = round(sum(c["roas"] * c["spend"] for c in campaigns if c["roas"]) / total_spend, 2) if total_spend else 0
    return {
        "campaigns": campaigns,
        "summary": {
            "total_campaigns": len(campaigns),
            "total_spend": round(total_spend, 2),
            "total_conversions": total_conv,
            "avg_roas": avg_roas,
        },
    }


@router.get("/meta")
async def get_meta_campaigns(status: str = Query(default=None)):
    campaigns = META_CAMPAIGNS
    if status:
        campaigns = [c for c in campaigns if c["status"] == status.upper()]
    total_spend = sum(c["spend"] for c in campaigns)
    purchase_results = sum(c["results"] for c in campaigns if c["result_type"] in ("Purchases", "Leads"))
    roas_camps = [c for c in campaigns if c["roas"]]
    roas_spend = sum(c["spend"] for c in roas_camps)
    avg_roas = round(sum(c["roas"] * c["spend"] for c in roas_camps) / roas_spend, 2) if roas_spend else 0
    return {
        "campaigns": campaigns,
        "summary": {
            "total_campaigns": len(campaigns),
            "total_spend": round(total_spend, 2),
            "total_results": purchase_results,
            "avg_roas": avg_roas,
        },
    }


@router.get("/google/keywords")
async def get_keywords(min_qs: int = Query(default=None)):
    keywords = GOOGLE_KEYWORDS
    if min_qs is not None:
        keywords = [k for k in keywords if k.get("quality_score") and k["quality_score"] >= min_qs]
    low_qs = [k for k in keywords if k.get("quality_score") and k["quality_score"] <= 4]
    return {
        "keywords": keywords,
        "total": len(keywords),
        "low_quality_score_count": len(low_qs),
        "low_quality_score_keywords": low_qs,
    }
