from fastapi import APIRouter
from datetime import datetime, timedelta
from services.mock_data import get_kpi_summary, GOOGLE_CAMPAIGNS, META_CAMPAIGNS, ALERTS

router = APIRouter()


@router.get("/weekly")
async def weekly_report():
    kpis = get_kpi_summary()
    period_end = datetime.now()
    period_start = period_end - timedelta(days=7)
    top_camps = sorted(
        GOOGLE_CAMPAIGNS + META_CAMPAIGNS,
        key=lambda x: x.get("roas") or 0, reverse=True
    )[:5]
    return {
        "period": f"{period_start.strftime('%d %b')} – {period_end.strftime('%d %b %Y')}",
        "kpi_summary": kpis,
        "top_performing_campaigns": [
            {"name": c["name"], "platform": c["platform"], "roas": c.get("roas"), "spend": c["spend"]}
            for c in top_camps
        ],
        "active_alerts": [a for a in ALERTS if not a["resolved"]],
        "generated_at": datetime.now().isoformat(),
    }


@router.get("/kpi-scorecard")
async def kpi_scorecard():
    kpis = get_kpi_summary()

    def rate(value, good, ok):
        if value >= good:
            return "green"
        elif value >= ok:
            return "amber"
        return "red"

    scorecard = {
        "total_roas": {"value": kpis["total_roas"], "status": rate(kpis["total_roas"], 5.0, 3.0), "target": 5.0},
        "google_roas": {"value": kpis["google_roas"], "status": rate(kpis["google_roas"], 5.0, 3.0), "target": 5.0},
        "meta_roas": {"value": kpis["meta_roas"], "status": rate(kpis["meta_roas"], 6.0, 4.0), "target": 6.0},
        "blended_ctr": {"value": kpis["blended_ctr"], "status": rate(kpis["blended_ctr"], 2.0, 1.0), "target": 2.0},
        "total_conversions": {"value": kpis["total_conversions"], "status": "green", "target": 500},
    }
    return {"scorecard": scorecard, "generated_at": datetime.now().isoformat()}


@router.get("/anomalies")
async def get_anomalies():
    return {
        "anomalies": [a for a in ALERTS if not a["resolved"] and a["severity"] in ("error", "critical", "warning")],
        "total": len([a for a in ALERTS if not a["resolved"]]),
    }
