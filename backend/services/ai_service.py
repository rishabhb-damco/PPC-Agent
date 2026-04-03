import asyncio
from typing import Optional
from config import settings

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


class AIService:
    def __init__(self):
        self.client = None
        if GROQ_AVAILABLE and settings.GROQ_API_KEY:
            self.client = Groq(api_key=settings.GROQ_API_KEY)

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if not self.client:
            return (
                "AI service not configured. Please set GROQ_API_KEY in environment variables. "
                "Get a free key at https://console.groq.com"
            )
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        try:
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=4096,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"AI generation error: {str(e)}"

    async def generate_structured(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if system_prompt:
            system_prompt += "\nRespond in clean, concise bullet points or numbered lists. No markdown headers."
        return await self.generate(prompt, system_prompt)


ai_service = AIService()
