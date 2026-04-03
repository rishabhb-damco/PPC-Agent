from agents.base_agent import BaseAgent
from datetime import datetime
from services.mock_data import HEALTH_CHECKS

SYSTEM_PROMPT = """You are A4, the Technical Health agent. READ-ONLY — you audit and report, never change.
Your responsibilities:
1. Pixel & Tag Validation: Verify Meta Pixel, Google Tag, conversion tags are firing correctly
2. Landing Page Uptime: Monitor all tracked landing pages for availability and speed
3. Daily 5am Check: Automated health scan — report critical issues immediately

Output: structured health report with status (healthy/warning/critical), details, and fix recommendations."""


class A4TechnicalHealth(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="a4",
            name="A4 Technical Health",
            role="Pixel/tag validation, landing page uptime, daily 5am check",
            capabilities=["Pixel validation", "Tag auditing", "Uptime monitoring", "UTM validation", "Conversion tracking audit"],
        )

    async def run(self, input_data: dict) -> dict:
        self._start()
        checks = HEALTH_CHECKS
        critical = [c for c in checks if c["status"] == "critical"]
        warnings = [c for c in checks if c["status"] == "warning"]
        task = input_data.get("input", "Run daily health check")
        try:
            issues_summary = "\n".join(
                [f"- CRITICAL: {c['service']}: {c['details']}" for c in critical]
                + [f"- WARNING: {c['service']}: {c['details']}" for c in warnings]
            )
            prompt = f"""
Technical health check results:
{issues_summary if issues_summary else 'All systems healthy.'}

Task: {task}

Provide:
1. Priority-ordered fix recommendations
2. Impact of each issue on campaign performance
3. Estimated effort to fix each issue
4. Any proactive improvements to make
"""
            ai_analysis = await self.ask_ai(prompt, SYSTEM_PROMPT)
            self._complete()
            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "status": "completed",
                "result": {
                    "health_checks": checks,
                    "overall_status": "critical" if critical else ("warning" if warnings else "healthy"),
                    "critical_issues": len(critical),
                    "warnings": len(warnings),
                    "ai_analysis": ai_analysis,
                    "timestamp": datetime.now().isoformat(),
                },
                "requires_approval": False,
            }
        except Exception as e:
            self._error()
            return {"agent_id": self.agent_id, "status": "error", "result": str(e)}


a4_technical_health = A4TechnicalHealth()
