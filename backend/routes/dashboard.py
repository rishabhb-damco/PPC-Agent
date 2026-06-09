from fastapi import APIRouter
from services.mock_data import ALERTS, get_chart_data, META_CAMPAIGNS
from services.ai_service import ai_service, TASK_ROUTING
from services.google_ads_service import google_ads_service

router = APIRouter()


@router.get("/overview")
async def get_overview():
    """KPI summary — uses live Google Ads data when connected, falls back to mock."""
    live = await google_ads_service.get_campaigns()

    if live:
        total_spend    = round(sum(c["spend"] for c in live), 2)
        total_conv     = sum(c["conversions"] for c in live)
        roas_camps     = [c for c in live if c.get("roas")]
        roas_spend     = sum(c["spend"] for c in roas_camps)
        google_roas    = round(sum(c["roas"] * c["spend"] for c in roas_camps) / roas_spend, 2) if roas_spend else 0
        total_clicks   = sum(c["clicks"] for c in live)
        total_impr     = sum(c["impressions"] for c in live)
        blended_ctr    = round((total_clicks / total_impr) * 100, 2) if total_impr else 0

        # Meta still uses mock until Meta API is connected
        meta_spend     = round(sum(c["spend"] for c in META_CAMPAIGNS), 2)
        meta_conv      = sum(c["results"] for c in META_CAMPAIGNS if c["result_type"] in ("Purchases", "Leads"))
        meta_roas_c    = [c for c in META_CAMPAIGNS if c["roas"]]
        meta_roas_sp   = sum(c["spend"] for c in meta_roas_c)
        meta_roas      = round(sum(c["roas"] * c["spend"] for c in meta_roas_c) / meta_roas_sp, 2) if meta_roas_sp else 0

        return {
            "total_spend":      round(total_spend + meta_spend, 2),
            "total_roas":       round((google_roas + meta_roas) / 2, 2),
            "total_conversions": total_conv + meta_conv,
            "blended_ctr":      blended_ctr,
            "google_spend":     total_spend,
            "meta_spend":       meta_spend,
            "google_roas":      google_roas,
            "meta_roas":        meta_roas,
            "google_conversions": total_conv,
            "meta_conversions": meta_conv,
            "spend_change_pct": 0,
            "roas_change_pct":  0,
            "conv_change_pct":  0,
            "data_source":      "live",
        }

    # Fallback to mock
    from services.mock_data import get_kpi_summary
    return {**get_kpi_summary(), "data_source": "mock"}


@router.get("/alerts")
async def get_alerts(resolved: bool = False):
    alerts = [a for a in ALERTS if a["resolved"] == resolved]
    return {"alerts": alerts, "total": len(alerts)}


@router.get("/chart-data")
async def get_chart():
    return {"data": get_chart_data()}


@router.get("/ai-status")
async def get_ai_status():
    avail = ai_service.providers_available
    routing = [
        {
            "task_type": task,
            "preferred_provider": route["provider"],
            "label": route["label"],
            "active": avail.get(route["provider"], False),
        }
        for task, route in TASK_ROUTING.items()
    ]
    return {
        "providers": {
            "groq":       {"configured": avail["groq"],       "model": "llama-3.3-70b-versatile",  "best_for": ["keywords", "monitoring", "routing", "health"],  "signup_url": "https://console.groq.com"},
            "gemini":     {"configured": avail["gemini"],     "model": "gemini-2.0-flash",          "best_for": ["research", "reporting"],                         "signup_url": "https://aistudio.google.com/app/apikey"},
            "mistral":    {"configured": avail["mistral"],    "model": "mistral-small-latest",      "best_for": ["copy", "creative"],                              "signup_url": "https://console.mistral.ai"},
            "openrouter": {"configured": avail["openrouter"], "model": "multiple free models",      "best_for": ["fallback", "overflow"],                          "signup_url": "https://openrouter.ai/keys"},
        },
        "routing": routing,
        "fallback_chain": ["preferred provider", "groq", "openrouter"],
    }


@router.get("/agent-roster")
async def get_agent_roster():
    from agents.a0_orchestrator import a0_orchestrator
    from agents.a1_meta_agent import a1_meta_agent
    from agents.a2_google_agent import a2_google_agent
    from agents.a3_research import a3_research
    from agents.a4_technical_health import a4_technical_health
    from agents.a5_copy_concept import a5_copy_concept
    from agents.a6_design_production import a6_design_production
    from agents.a7_reporting import a7_reporting

    agents = [
        a0_orchestrator, a1_meta_agent, a2_google_agent, a3_research,
        a4_technical_health, a5_copy_concept, a6_design_production, a7_reporting,
    ]
    return {"agents": [a.to_dict() for a in agents]}
