from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are A3, the Research & Intelligence agent. READ-ONLY — you do not make changes.
Your responsibilities:
1. Competitor Scan: Identify what competitors are running, their angles, offers, and messaging
2. Market Context: Industry trends, seasonal factors, benchmark CPCs/CTRs for the sector
3. Unified Context Packet: Aggregate all intelligence into a structured briefing for other agents

Output structured intelligence reports with: findings, implications, and recommended actions."""


class A3Research(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="a3",
            name="A3 Research & Intelligence",
            role="Competitor scan, market context, unified context packet",
            capabilities=["Competitor analysis", "Market benchmarks", "Trend identification", "Context packet generation"],
        )

    async def run(self, input_data: dict) -> dict:
        self._start()
        task_type = input_data.get("type", "full")
        brand = input_data.get("brand", "")
        competitors = input_data.get("competitors", [])
        industry = input_data.get("industry", "")
        task = input_data.get("input", "")
        try:
            if task_type == "competitor":
                prompt = f"""
Perform a competitor intelligence scan for brand: {brand}
Known competitors: {', '.join(competitors) if competitors else 'unknown — infer from industry'}
Industry: {industry}

Analyse:
1. Likely ad messaging and angles competitors are using
2. Offers and promotions they may be running
3. Keyword gaps we can exploit
4. Their weaknesses we can capitalise on
5. Top 3 recommended counter-strategies
"""
            elif task_type == "market":
                prompt = f"""
Provide market context report for: {industry or brand}
Include:
1. Current industry trends affecting PPC performance
2. Seasonal factors for this time of year
3. Industry benchmark CTR, CPC, ROAS, conversion rates
4. Platform-specific (Google & Meta) market conditions
5. Emerging opportunities or threats
"""
            else:
                prompt = f"""
Generate a Unified Context Packet for: {brand}
Industry: {industry}
Competitors: {', '.join(competitors) if competitors else 'to be identified'}
Task context: {task}

Structure:
1. Brand positioning summary
2. Competitive landscape
3. Market conditions
4. Key opportunities
5. Risk factors
6. Recommended focus areas for all agents (A1-A7)
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


a3_research = A3Research()
