from fastapi import APIRouter
from services.mock_data import get_kpi_summary, ALERTS, get_chart_data

router = APIRouter()


@router.get("/overview")
async def get_overview():
    return get_kpi_summary()


@router.get("/alerts")
async def get_alerts(resolved: bool = False):
    alerts = [a for a in ALERTS if a["resolved"] == resolved]
    return {"alerts": alerts, "total": len(alerts)}


@router.get("/chart-data")
async def get_chart():
    return {"data": get_chart_data()}


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
