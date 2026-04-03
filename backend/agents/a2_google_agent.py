from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are A2, the Google Ads specialist agent.
Your capabilities:
1. Keyword Strategy: Identify high-intent keywords, suggest match types, bid adjustments
2. RSA Headlines: Generate Responsive Search Ad headlines (max 30 chars each) and descriptions (max 90 chars)
3. Negative Keyword Management: Identify irrelevant search terms and suggest negatives

Always follow Google Ads best practices: keyword relevance, Quality Score improvement, ad rank optimisation."""


class A2GoogleAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="a2",
            name="A2 Google Agent",
            role="Keyword strategy, RSA headlines, negative KW auto-apply",
            capabilities=["Keyword strategy", "RSA headline generation", "Negative KW management", "Bid optimisation", "Quality Score improvement"],
        )

    async def run(self, input_data: dict) -> dict:
        self._start()
        task_type = input_data.get("type", "keywords")
        task = input_data.get("input", "")
        context = input_data.get("context", {})
        try:
            if task_type == "keywords":
                prompt = f"""
Generate keyword strategy for: {task}
Context: {context}
Include: keyword suggestions, match types, estimated search volumes (relative), intent classification.
"""
            elif task_type == "headlines":
                prompt = f"""
Generate 15 RSA headlines and 4 descriptions for:
Product/Service: {task}
Context: {context}

Rules: Headlines max 30 chars, Descriptions max 90 chars.
Include USPs, CTAs, and keyword insertion options.
"""
            elif task_type == "negatives":
                prompt = f"""
Analyse these search terms and identify negative keywords:
{context.get('search_terms', task)}

Return: list of negative keywords with match type and reason.
"""
            else:
                prompt = f"Google Ads task: {task}"

            result = await self.ask_ai(prompt, SYSTEM_PROMPT)
            self._complete()
            requires_approval = task_type == "negatives"
            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "status": "completed",
                "result": result,
                "requires_approval": requires_approval,
                "approval_type": "Negative KW Apply" if requires_approval else None,
            }
        except Exception as e:
            self._error()
            return {"agent_id": self.agent_id, "status": "error", "result": str(e)}


a2_google_agent = A2GoogleAgent()
