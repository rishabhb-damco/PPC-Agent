"""
Auto-run pipeline: given a brand, runs all 8 agents in sequence,
extracts actionable items, and populates the approval queue.
"""
import asyncio
from services.brand_store import (
    save_analysis, add_approval_item, update_brand_status, get_brand
)
from agents.a3_research import a3_research
from agents.a4_technical_health import a4_technical_health
from agents.a2_google_agent import a2_google_agent
from agents.a5_copy_concept import a5_copy_concept
from agents.a6_design_production import a6_design_production
from agents.a1_meta_agent import a1_meta_agent
from agents.a7_reporting import a7_reporting
from agents.a0_orchestrator import a0_orchestrator


async def run_full_pipeline(brand_id: str) -> dict:
    brand = get_brand(brand_id)
    if not brand:
        return {"error": "Brand not found"}

    update_brand_status(brand_id, "running")
    analysis = {"brand_id": brand_id, "brand_name": brand["name"], "steps": {}}

    try:
        name = brand["name"]
        industry = brand["industry"]
        competitors = brand["competitors"]
        audience = brand["target_audience"]
        platforms = brand["platforms"]
        goals = brand["goals"]

        # ── Step 1: Competitor + Market Research (A3) ──────────────────────────
        comp_result = await a3_research.run({
            "type": "competitor", "brand": name,
            "competitors": competitors, "industry": industry,
        })
        market_result = await a3_research.run({
            "type": "market", "brand": name, "industry": industry,
        })
        competitor_intel = comp_result.get("result", "")
        market_context = market_result.get("result", "")
        analysis["steps"]["competitor_research"] = competitor_intel
        analysis["steps"]["market_context"] = market_context

        # Add competitor strategy approvals
        add_approval_item(
            brand_id=brand_id, item_type="strategy",
            title="Competitor Counter-Strategy Identified",
            description=f"A3 agent completed competitor scan for {name} in {industry}.",
            recommendation=str(competitor_intel)[:600],
            agent_id="a3", impact="high", category="strategy",
        )

        # ── Step 2: Technical Health Audit (A4) ────────────────────────────────
        health_result = await a4_technical_health.run({
            "input": f"Full technical audit for {name} website and ad tracking"
        })
        health_data = health_result.get("result", {})
        analysis["steps"]["technical_health"] = health_data

        if isinstance(health_data, dict):
            for check in health_data.get("health_checks", []):
                if check["status"] in ("critical", "warning"):
                    add_approval_item(
                        brand_id=brand_id, item_type="technical",
                        title=f"{'🔴 Critical' if check['status'] == 'critical' else '⚠️ Warning'}: {check['service']}",
                        description=check["details"],
                        recommendation=f"Fix {check['service']} — this directly impacts conversion tracking accuracy.",
                        agent_id="a4",
                        impact="high" if check["status"] == "critical" else "medium",
                        category="technical",
                    )

        # ── Step 3: Google Ads Keywords + Headlines (A2) ───────────────────────
        keyword_result = await a2_google_agent.run({
            "type": "keywords", "input": f"{name} — {industry} — Target: {audience}",
            "context": {"brand": name, "industry": industry, "competitors": competitors},
        })
        headline_result = await a2_google_agent.run({
            "type": "headlines", "input": f"{name} — {industry}",
            "context": {"brand": name, "audience": audience, "goals": goals},
        })
        analysis["steps"]["keywords"] = keyword_result.get("result", "")
        analysis["steps"]["headlines"] = headline_result.get("result", "")

        add_approval_item(
            brand_id=brand_id, item_type="keyword",
            title="New Keyword Strategy Ready for Review",
            description=f"A2 agent generated keyword recommendations for {name}.",
            recommendation=str(keyword_result.get("result", ""))[:600],
            agent_id="a2", impact="high", category="google_ads",
        )
        add_approval_item(
            brand_id=brand_id, item_type="copy",
            title="RSA Headlines & Descriptions Generated",
            description=f"15 headlines + 4 descriptions ready for Google Ads RSA.",
            recommendation=str(headline_result.get("result", ""))[:600],
            agent_id="a2", impact="high", category="google_ads",
        )

        # ── Step 4: Ad Copy Variants (A5) ──────────────────────────────────────
        google_copy = await a5_copy_concept.run({
            "type": "variants", "product": name,
            "target_audience": audience, "platform": "google",
            "tone": "professional", "num_variants": 3, "input": name,
        })
        meta_copy = await a5_copy_concept.run({
            "type": "variants", "product": name,
            "target_audience": audience, "platform": "meta",
            "tone": "engaging", "num_variants": 3, "input": name,
        })
        hooks = await a5_copy_concept.run({
            "type": "hooks", "product": name,
            "target_audience": audience, "platform": "meta", "input": name,
        })
        analysis["steps"]["google_copy"] = google_copy.get("result", "")
        analysis["steps"]["meta_copy"] = meta_copy.get("result", "")
        analysis["steps"]["hooks"] = hooks.get("result", "")

        add_approval_item(
            brand_id=brand_id, item_type="copy",
            title="Google Ads Copy Variants — Approval Required",
            description=f"3 Google Ads copy variants generated for {name}. Review before going live.",
            recommendation=str(google_copy.get("result", ""))[:600],
            agent_id="a5", impact="high", category="google_ads",
        )
        add_approval_item(
            brand_id=brand_id, item_type="copy",
            title="Meta Ads Copy Variants — Approval Required",
            description=f"3 Meta Ads copy variants generated for {name}. Review before going live.",
            recommendation=str(meta_copy.get("result", ""))[:600],
            agent_id="a5", impact="high", category="meta_ads",
        )
        add_approval_item(
            brand_id=brand_id, item_type="creative",
            title="10 Ad Hook Formats Generated",
            description="High-converting hook formats for video and static ads.",
            recommendation=str(hooks.get("result", ""))[:600],
            agent_id="a5", impact="medium", category="creative",
        )

        # ── Step 5: Design Brief (A6) ───────────────────────────────────────────
        static_brief = await a6_design_production.run({
            "type": "static",
            "copy": str(meta_copy.get("result", ""))[:300],
            "brand": name, "format": "1080x1080", "input": name,
        })
        analysis["steps"]["design_brief"] = static_brief.get("result", "")

        add_approval_item(
            brand_id=brand_id, item_type="creative",
            title="Static Ad Design Brief Ready",
            description="Creative direction for static ads — layout, visuals, typography.",
            recommendation=str(static_brief.get("result", ""))[:600],
            agent_id="a6", impact="medium", category="creative",
        )

        # ── Step 6: Meta Campaign Analysis (A1) ────────────────────────────────
        meta_analysis = await a1_meta_agent.run({
            "input": f"Analyse and recommend Meta campaign strategy for {name} — {industry}. Audience: {audience}. Goals: {goals}",
            "mode": "monitor",
        })
        analysis["steps"]["meta_strategy"] = meta_analysis.get("result", "")

        add_approval_item(
            brand_id=brand_id, item_type="strategy",
            title="Meta Campaign Strategy Recommendations",
            description="A1 agent analysed Meta performance and recommends campaign structure changes.",
            recommendation=str(meta_analysis.get("result", ""))[:600],
            agent_id="a1", impact="high", category="meta_ads",
        )

        # ── Step 7: Full Report (A7) ────────────────────────────────────────────
        report = await a7_reporting.run({
            "type": "weekly",
            "input": f"Generate full performance and strategy report for {name} — {industry}. "
                     f"Incorporate competitor insights: {str(competitor_intel)[:300]}",
        })
        analysis["steps"]["report"] = report.get("result", {})

        add_approval_item(
            brand_id=brand_id, item_type="strategy",
            title="Full Analysis Report Ready — Client Send Requires Approval",
            description="A7 agent generated the complete 8-stop performance and strategy report.",
            recommendation="Review the report in the Reports section before sending to client.",
            agent_id="a7", impact="medium", category="reporting",
        )

        # ── Step 8: Orchestrator Summary (A0) ──────────────────────────────────
        summary = await a0_orchestrator.run({
            "input": f"Summarise the full analysis for {name}. Key findings from competitor research, "
                     f"technical health, ad copy recommendations, and top 3 priority actions.",
            "context": {
                "competitor_intel": str(competitor_intel)[:300],
                "market_context": str(market_context)[:200],
                "technical_issues": str(health_data.get("ai_analysis", ""))[:200] if isinstance(health_data, dict) else "",
            },
        })
        analysis["steps"]["executive_summary"] = summary.get("result", "")
        analysis["pipeline_complete"] = True

        save_analysis(brand_id, analysis)
        update_brand_status(brand_id, "completed")
        return {"status": "completed", "brand_id": brand_id, "analysis": analysis}

    except Exception as e:
        update_brand_status(brand_id, "error")
        analysis["error"] = str(e)
        save_analysis(brand_id, analysis)
        return {"status": "error", "error": str(e), "partial_analysis": analysis}
