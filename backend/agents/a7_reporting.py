from agents.base_agent import BaseAgent
from datetime import datetime, timedelta
from services.mock_data import GOOGLE_CAMPAIGNS, META_CAMPAIGNS, ALERTS, get_kpi_summary

SYSTEM_PROMPT = """You are A7, the Reporting & Narrative agent.
Your responsibilities:
1. 8-Stop Structure: Produce reports following the 8-stop framework:
   Stop 1: Executive Summary | Stop 2: Spend & Budget | Stop 3: Google Performance
   Stop 4: Meta Performance | Stop 5: Creative Performance | Stop 6: Technical Health
   Stop 7: Anomalies & Actions | Stop 8: Next Week Priorities

2. KPI Scorecards: Colour-coded scorecards (Green/Amber/Red) for each key metric
3. Anomalies & Actions: Detect deviations from targets and suggest corrective actions

Write in clear, professional language suitable for client-facing reports."""


class A7Reporting(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="a7",
            name="A7 Reporting & Narrative",
            role="8-stop reports, KPI scorecards, anomalies & actions",
            capabilities=["Weekly reports", "KPI scorecards", "Anomaly detection", "Narrative writing", "Action recommendations"],
        )

    async def run(self, input_data: dict) -> dict:
        self._start()
        report_type = input_data.get("type", "weekly")
        task = input_data.get("input", "Generate weekly performance report")
        try:
            kpis = get_kpi_summary()
            google_summary = {
                "total_spend": sum(c["spend"] for c in GOOGLE_CAMPAIGNS),
                "total_conversions": sum(c["conversions"] for c in GOOGLE_CAMPAIGNS),
                "avg_roas": round(sum(c["roas"] * c["spend"] for c in GOOGLE_CAMPAIGNS if c["roas"]) / sum(c["spend"] for c in GOOGLE_CAMPAIGNS), 2),
                "campaigns": [{"name": c["name"], "roas": c["roas"], "spend": c["spend"], "status": c["status"]} for c in GOOGLE_CAMPAIGNS],
            }
            meta_summary = {
                "total_spend": sum(c["spend"] for c in META_CAMPAIGNS),
                "total_results": sum(c["results"] for c in META_CAMPAIGNS if c["result_type"] in ("Purchases", "Leads")),
                "campaigns": [{"name": c["name"], "roas": c["roas"], "spend": c["spend"], "status": c["status"]} for c in META_CAMPAIGNS],
            }
            active_alerts = [a for a in ALERTS if not a["resolved"]]
            period_end = datetime.now()
            period_start = period_end - timedelta(days=7)
            period = f"{period_start.strftime('%d %b')} – {period_end.strftime('%d %b %Y')}"

            prompt = f"""
Generate a {report_type} performance report for period: {period}

KPI Summary:
- Total Spend: £{kpis['total_spend']:,.2f} ({kpis['spend_change_pct']:+.1f}% vs last week)
- Blended ROAS: {kpis['total_roas']}x ({kpis['roas_change_pct']:+.1f}% vs last week)
- Total Conversions: {kpis['total_conversions']} ({kpis['conv_change_pct']:+.1f}% vs last week)
- Blended CTR: {kpis['blended_ctr']}%

Google Ads: Spend £{google_summary['total_spend']:,.2f} | Conversions: {google_summary['total_conversions']} | Avg ROAS: {google_summary['avg_roas']}x
Meta Ads: Spend £{meta_summary['total_spend']:,.2f} | Results: {meta_summary['total_results']}

Active Alerts ({len(active_alerts)}):
{chr(10).join([f"- {a['severity'].upper()}: {a['title']}" for a in active_alerts])}

Additional context: {task}

Write the full 8-stop report. Be specific with numbers, insights, and recommendations.
"""
            narrative = await self.ask_ai(prompt, SYSTEM_PROMPT)
            self._complete()
            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "status": "completed",
                "result": {
                    "period": period,
                    "narrative": narrative,
                    "kpi_summary": kpis,
                    "active_alerts": len(active_alerts),
                    "google_summary": google_summary,
                    "meta_summary": meta_summary,
                    "generated_at": datetime.now().isoformat(),
                },
                "requires_approval": True,
                "approval_type": "Client Report Final Send",
            }
        except Exception as e:
            self._error()
            return {"agent_id": self.agent_id, "status": "error", "result": str(e)}


a7_reporting = A7Reporting()
