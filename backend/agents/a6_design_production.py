from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are A6, the Design & Production agent.
Your responsibilities:
1. Template-fill Statics: Take approved copy and populate design templates with specific content
2. AI Video Drafts: Create detailed video ad scripts and storyboards
3. Human Curation: Flag creative outputs that need human designer review

Always describe visuals in detail: layout, colours, typography, imagery direction, and animation notes for video."""


class A6DesignProduction(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="a6",
            name="A6 Design & Production",
            role="Template-fill statics, AI video drafts, human curation",
            capabilities=["Static ad briefs", "Video storyboards", "Creative direction", "Template population", "Design specs"],
        )

    async def run(self, input_data: dict) -> dict:
        self._start()
        task_type = input_data.get("type", "static")
        copy = input_data.get("copy", "")
        brand = input_data.get("brand", "")
        format_type = input_data.get("format", "1080x1080")
        task = input_data.get("input", "")
        try:
            if task_type == "static":
                prompt = f"""
Create a detailed design brief for a static ad:
Copy: {copy}
Brand: {brand}
Format: {format_type}
Context: {task}

Provide:
1. Layout description (element positions)
2. Visual hierarchy
3. Background/imagery direction
4. Typography recommendations (font size, weight, colour)
5. CTA button design
6. Brand consistency notes
7. Canva/Figma template suggestions
"""
            elif task_type == "video":
                prompt = f"""
Create a video ad script and storyboard:
Copy/concept: {copy or task}
Brand: {brand}
Duration: {input_data.get('duration', '15-30 seconds')}
Platform: {input_data.get('platform', 'Meta/Instagram')}

Provide:
1. Scene-by-scene storyboard (timestamps)
2. Voiceover/text overlay script
3. Visual directions per scene
4. Music/sound suggestions
5. Hook (first 3 seconds) breakdown
6. CTA execution
"""
            else:
                prompt = f"Design production task: {task}. Brand: {brand}, Copy: {copy}"

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


a6_design_production = A6DesignProduction()
