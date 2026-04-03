from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are A5, the Copy & Concept agent for performance advertising.
Your responsibilities:
1. Ad Variants: Generate multiple high-converting ad copy variants for testing
2. Fatigue Refreshes: Detect creative fatigue signals and produce fresh copy
3. Hook Formats: Create powerful opening hooks for video, carousel, and static ads

Principles: benefit-led, direct response, pattern interrupt, social proof, urgency/scarcity where authentic.
Always write copy that converts, not just impresses."""


class A5CopyConcept(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="a5",
            name="A5 Copy & Concept",
            role="Ad variants, fatigue refreshes, hook formats",
            capabilities=["Ad copy variants", "Headline generation", "Hook writing", "Creative fatigue detection", "A/B test copy"],
        )

    async def run(self, input_data: dict) -> dict:
        self._start()
        task_type = input_data.get("type", "variants")
        product = input_data.get("product", "")
        audience = input_data.get("target_audience", "")
        platform = input_data.get("platform", "google")
        tone = input_data.get("tone", "professional")
        num_variants = input_data.get("num_variants", 3)
        task = input_data.get("input", "")
        try:
            if task_type == "variants":
                prompt = f"""
Generate {num_variants} ad copy variants for:
Product/Service: {product}
Target Audience: {audience}
Platform: {platform}
Tone: {tone}
Additional context: {task}

For each variant provide:
- Headline(s)
- Body copy
- CTA
- Angle/Hook used
- Why it should convert
"""
            elif task_type == "hooks":
                prompt = f"""
Generate 10 powerful ad hooks for:
Product: {product}
Audience: {audience}
Platform: {platform}

Include hooks using these formats:
1. Pain point agitation
2. Bold claim/statement
3. Question that creates curiosity
4. Social proof / numbers
5. "How to" format
6. Contrarian/pattern interrupt
7. Before/After
8. Story opener
9. Urgency/scarcity
10. Benefit-led
"""
            elif task_type == "refresh":
                prompt = f"""
Creative fatigue detected. Generate fresh ad copy to replace tired creatives.
Product: {product}
Audience: {audience}
Platform: {platform}
What's currently running (fatigued): {task}

Provide 5 fresh variants with different angles than what's currently running.
"""
            else:
                prompt = f"Generate ad copy for: {task}. Product: {product}, Audience: {audience}, Platform: {platform}"

            result = await self.ask_ai(prompt, SYSTEM_PROMPT)
            self._complete()
            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "status": "completed",
                "result": result,
                "requires_approval": True,
                "approval_type": "Creative Use Approval",
            }
        except Exception as e:
            self._error()
            return {"agent_id": self.agent_id, "status": "error", "result": str(e)}


a5_copy_concept = A5CopyConcept()
