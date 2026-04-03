import asyncio
from typing import Optional
from config import settings

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


class AIService:
    def __init__(self):
        self.model = None
        if GEMINI_AVAILABLE and settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if not self.model:
            return (
                "AI service not configured. Please set GEMINI_API_KEY in environment variables. "
                "Get a free key at https://aistudio.google.com/app/apikey"
            )
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        try:
            response = await asyncio.to_thread(
                self.model.generate_content, full_prompt
            )
            return response.text
        except Exception as e:
            return f"AI generation error: {str(e)}"

    async def generate_structured(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate a response expected to be a clean list or structured text."""
        if system_prompt:
            system_prompt += "\nRespond in clean, concise bullet points or numbered lists. No markdown headers."
        return await self.generate(prompt, system_prompt)


ai_service = AIService()
