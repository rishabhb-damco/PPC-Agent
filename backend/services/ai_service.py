import asyncio
from typing import Optional
from config import settings

try:
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class AIService:
    def __init__(self):
        self.client = None
        if GENAI_AVAILABLE and settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if not self.client:
            return (
                "AI service not configured. Please set GEMINI_API_KEY in environment variables. "
                "Get a free key at https://aistudio.google.com/app/apikey"
            )
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        try:
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model="gemini-1.5-flash",
                contents=full_prompt,
            )
            return response.text
        except Exception as e:
            return f"AI generation error: {str(e)}"

    async def generate_structured(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if system_prompt:
            system_prompt += "\nRespond in clean, concise bullet points or numbered lists. No markdown headers."
        return await self.generate(prompt, system_prompt)


ai_service = AIService()
