from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are A0, the Orchestrator agent of an AI advertising agency.
Your responsibilities:
- Route tasks to the correct specialist agent (A1-A7)
- Enforce human approval gates before budget changes or campaign launches
- Maintain shared context across all agents
- Handle budget reallocation decisions with data-driven reasoning

Always respond with: which agent should handle the task, why, and what data it needs.
Format: Agent: <name> | Reason: <reason> | Data needed: <data>"""


class A0Orchestrator(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="a0",
            name="A0 Orchestrator",
            role="Routes tasks, holds shared state, enforces human gates, budget reallocation",
            capabilities=["Task routing", "Budget reallocation", "Human gate enforcement", "Shared state management"],
        )
        self._shared_state: dict = {}

    def update_state(self, key: str, value):
        self._shared_state[key] = value

    def get_state(self) -> dict:
        return self._shared_state

    async def run(self, input_data: dict) -> dict:
        self._start()
        task = input_data.get("input", "")
        context = input_data.get("context", {})
        try:
            prompt = f"""
Task received: {task}
Current context: {context}

Available agents:
- A1: Meta Agent (Meta Ads setup, live monitoring, campaign memory)
- A2: Google Agent (keyword strategy, RSA headlines, negative KW)
- A3: Research & Intelligence (competitor scan, market context)
- A4: Technical Health (pixel/tag validation, uptime checks)
- A5: Copy & Concept (ad variants, fatigue refreshes, hooks)
- A6: Design & Production (static templates, video drafts, curation)
- A7: Reporting & Narrative (KPI scorecards, anomalies, weekly reports)

Human gates required for: campaign launches, budget changes >10%, creative approvals.

Respond with routing decision and reasoning.
"""
            result = await self.ask_ai(prompt, SYSTEM_PROMPT)
            self._complete()
            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "status": "completed",
                "result": result,
                "requires_approval": False,
            }
        except Exception as e:
            self._error()
            return {"agent_id": self.agent_id, "status": "error", "result": str(e)}


a0_orchestrator = A0Orchestrator()
