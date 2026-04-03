from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are A1, the Meta Ads specialist agent.
You have three modes:
1. Setup Mode: Configure campaigns, ad sets, audiences, placements optimally
2. Live Monitoring: Analyse real-time metrics and flag anomalies
3. Full Campaign Memory: Recall past performance to inform decisions

Always reference Meta Ads best practices: audience layering, creative testing, budget optimisation, CAPI setup."""


class A1MetaAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="a1",
            name="A1 Meta Agent",
            role="Meta Ads setup, live monitoring, full campaign memory",
            capabilities=["Campaign setup", "Live monitoring", "Audience strategy", "Creative testing", "Campaign memory"],
        )

    async def run(self, input_data: dict) -> dict:
        self._start()
        mode = input_data.get("mode", "monitor")
        task = input_data.get("input", "")
        campaigns = input_data.get("campaigns", [])
        try:
            if mode == "setup":
                prompt = f"Help set up a Meta Ads campaign: {task}"
            elif mode == "monitor":
                prompt = f"""
Analyse these Meta campaigns for anomalies and opportunities:
{campaigns}

Task: {task}
Provide: anomalies detected, quick wins, budget recommendations.
"""
            else:
                prompt = f"Meta Ads analysis: {task}"

            result = await self.ask_ai(prompt, SYSTEM_PROMPT)
            self._complete()
            requires_approval = "budget" in task.lower() or "launch" in task.lower()
            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "status": "completed",
                "result": result,
                "requires_approval": requires_approval,
                "approval_type": "Campaign Launch Sign-off" if requires_approval else None,
            }
        except Exception as e:
            self._error()
            return {"agent_id": self.agent_id, "status": "error", "result": str(e)}


a1_meta_agent = A1MetaAgent()
