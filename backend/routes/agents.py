from fastapi import APIRouter
from models.schemas import AgentRunRequest, CopyGenerationRequest, ResearchRequest
from agents.a0_orchestrator import a0_orchestrator
from agents.a1_meta_agent import a1_meta_agent
from agents.a2_google_agent import a2_google_agent
from agents.a3_research import a3_research
from agents.a4_technical_health import a4_technical_health
from agents.a5_copy_concept import a5_copy_concept
from agents.a6_design_production import a6_design_production
from agents.a7_reporting import a7_reporting

router = APIRouter()

ALL_AGENTS = [
    a0_orchestrator, a1_meta_agent, a2_google_agent, a3_research,
    a4_technical_health, a5_copy_concept, a6_design_production, a7_reporting,
]


@router.get("/status")
async def get_agents_status():
    return {"agents": [a.to_dict() for a in ALL_AGENTS]}


@router.post("/a0/route")
async def orchestrator_route(req: AgentRunRequest):
    return await a0_orchestrator.run({"input": req.input, "context": req.context})


@router.post("/a1/monitor")
async def meta_monitor(req: AgentRunRequest):
    from services.mock_data import META_CAMPAIGNS
    return await a1_meta_agent.run({"input": req.input, "mode": "monitor", "campaigns": META_CAMPAIGNS})


@router.post("/a1/setup")
async def meta_setup(req: AgentRunRequest):
    return await a1_meta_agent.run({"input": req.input, "mode": "setup"})


@router.post("/a2/keywords")
async def google_keywords(req: AgentRunRequest):
    return await a2_google_agent.run({"type": "keywords", "input": req.input, "context": req.context})


@router.post("/a2/headlines")
async def google_headlines(req: AgentRunRequest):
    return await a2_google_agent.run({"type": "headlines", "input": req.input, "context": req.context})


@router.post("/a2/negatives")
async def google_negatives(req: AgentRunRequest):
    from services.mock_data import GOOGLE_KEYWORDS
    return await a2_google_agent.run({"type": "negatives", "input": req.input, "context": {"search_terms": req.input}})


@router.post("/a3/research")
async def run_research(req: ResearchRequest):
    return await a3_research.run({
        "type": "full", "brand": req.brand,
        "competitors": req.competitors, "industry": req.industry, "input": req.brand,
    })


@router.post("/a3/competitor")
async def competitor_scan(req: ResearchRequest):
    return await a3_research.run({
        "type": "competitor", "brand": req.brand,
        "competitors": req.competitors, "industry": req.industry,
    })


@router.post("/a3/market")
async def market_context(req: ResearchRequest):
    return await a3_research.run({
        "type": "market", "brand": req.brand, "industry": req.industry,
    })


@router.get("/a4/health")
async def technical_health():
    return await a4_technical_health.run({"input": "Run daily technical health check"})


@router.post("/a5/copy")
async def generate_copy(req: CopyGenerationRequest):
    return await a5_copy_concept.run({
        "type": "variants",
        "product": req.product,
        "target_audience": req.target_audience,
        "platform": req.platform,
        "tone": req.tone,
        "num_variants": req.num_variants,
        "input": req.product,
    })


@router.post("/a5/hooks")
async def generate_hooks(req: CopyGenerationRequest):
    return await a5_copy_concept.run({
        "type": "hooks",
        "product": req.product,
        "target_audience": req.target_audience,
        "platform": req.platform,
        "input": req.product,
    })


@router.post("/a6/static-brief")
async def static_brief(req: AgentRunRequest):
    return await a6_design_production.run({
        "type": "static",
        "copy": req.input,
        "brand": req.context.get("brand", ""),
        "format": req.context.get("format", "1080x1080"),
        "input": req.input,
    })


@router.post("/a6/video-script")
async def video_script(req: AgentRunRequest):
    return await a6_design_production.run({
        "type": "video",
        "copy": req.input,
        "brand": req.context.get("brand", ""),
        "platform": req.context.get("platform", "Meta"),
        "duration": req.context.get("duration", "15-30 seconds"),
        "input": req.input,
    })


@router.get("/a7/weekly-report")
async def weekly_report():
    return await a7_reporting.run({"type": "weekly", "input": "Generate weekly performance report"})


@router.get("/a7/scorecard")
async def kpi_scorecard():
    return await a7_reporting.run({"type": "scorecard", "input": "Generate KPI scorecard"})
