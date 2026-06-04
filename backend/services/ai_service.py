"""
Multi-provider AI service with task-based routing.

Provider → best tasks:
  Groq (Llama-3.3-70b)     — keywords, monitoring, routing, health  (fast + structured)
  Gemini (1.5-flash)        — research, reporting                    (long context + synthesis)
  Mistral (small-latest)    — copy, creative                         (nuanced writing)
  OpenRouter (free models)  — fallback + overflow                    (access to many free models)

Fallback chain: preferred → Groq → OpenRouter → error string
"""

import asyncio
from typing import Optional
from config import settings

# ── Provider availability ─────────────────────────────────────────────────────

GROQ_AVAILABLE      = False
GEMINI_AVAILABLE    = False
MISTRAL_AVAILABLE   = False
OPENROUTER_AVAILABLE = False

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    pass

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    pass

try:
    from mistralai import Mistral
    MISTRAL_AVAILABLE = True
except ImportError:
    pass

try:
    from openai import OpenAI as OpenAIClient
    OPENROUTER_AVAILABLE = True
except ImportError:
    pass

# ── Task → provider routing table ─────────────────────────────────────────────
# OpenRouter free model list (always free, no rate-limit cost):
#   meta-llama/llama-3.1-8b-instruct:free  — fast general
#   mistralai/mistral-7b-instruct:free      — lightweight creative
#   google/gemini-flash-1.5:free            — research (when available)

OPENROUTER_MODELS = {
    "research":   "google/gemini-flash-1.5:free",
    "reporting":  "google/gemini-flash-1.5:free",
    "copy":       "mistralai/mistral-7b-instruct:free",
    "creative":   "mistralai/mistral-7b-instruct:free",
    "default":    "meta-llama/llama-3.1-8b-instruct:free",
}

TASK_ROUTING: dict[str, dict] = {
    "research":   {"provider": "gemini",      "model": "gemini-1.5-flash",          "label": "Gemini Flash"},
    "reporting":  {"provider": "gemini",      "model": "gemini-1.5-flash",          "label": "Gemini Flash"},
    "copy":       {"provider": "mistral",     "model": "mistral-small-latest",      "label": "Mistral Small"},
    "creative":   {"provider": "mistral",     "model": "mistral-small-latest",      "label": "Mistral Small"},
    "keywords":   {"provider": "groq",        "model": "llama-3.3-70b-versatile",  "label": "Llama 3.3 70B"},
    "monitoring": {"provider": "groq",        "model": "llama-3.3-70b-versatile",  "label": "Llama 3.3 70B"},
    "routing":    {"provider": "groq",        "model": "llama-3.3-70b-versatile",  "label": "Llama 3.3 70B"},
    "health":     {"provider": "groq",        "model": "llama-3.3-70b-versatile",  "label": "Llama 3.3 70B"},
    "default":    {"provider": "groq",        "model": "llama-3.3-70b-versatile",  "label": "Llama 3.3 70B"},
}


class AIService:
    def __init__(self):
        self.groq_client       = None
        self.gemini_model      = None
        self.mistral_client    = None
        self.openrouter_client = None
        self._init_providers()

    def _init_providers(self):
        if GROQ_AVAILABLE and settings.GROQ_API_KEY:
            try:
                self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception:
                pass

        if GEMINI_AVAILABLE and settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.gemini_model = genai.GenerativeModel("gemini-1.5-flash")
            except Exception:
                pass

        if MISTRAL_AVAILABLE and settings.MISTRAL_API_KEY:
            try:
                self.mistral_client = Mistral(api_key=settings.MISTRAL_API_KEY)
            except Exception:
                pass

        if OPENROUTER_AVAILABLE and settings.OPENROUTER_API_KEY:
            try:
                self.openrouter_client = OpenAIClient(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=settings.OPENROUTER_API_KEY,
                )
            except Exception:
                pass

    # ── Provider availability ─────────────────────────────────────────────────

    @property
    def providers_available(self) -> dict:
        return {
            "groq":       self.groq_client is not None,
            "gemini":     self.gemini_model is not None,
            "mistral":    self.mistral_client is not None,
            "openrouter": self.openrouter_client is not None,
        }

    def _resolve_route(self, task_type: str) -> dict | None:
        """
        Returns the route dict to use, falling back in priority order:
        preferred → groq → openrouter → None (all down).
        """
        route    = TASK_ROUTING.get(task_type, TASK_ROUTING["default"])
        provider = route["provider"]

        # Preferred provider is available → use it
        if provider == "gemini"  and self.gemini_model:     return route
        if provider == "mistral" and self.mistral_client:   return route
        if provider == "groq"    and self.groq_client:      return route

        # Preferred not available → fall back to Groq
        if self.groq_client:
            return {
                "provider": "groq",
                "model": "llama-3.3-70b-versatile",
                "label": f"Llama 3.3 70B (fallback — {provider} not configured)",
            }

        # Groq also down → fall back to OpenRouter
        if self.openrouter_client:
            or_model = OPENROUTER_MODELS.get(task_type, OPENROUTER_MODELS["default"])
            return {
                "provider": "openrouter",
                "model": or_model,
                "label": f"OpenRouter/{or_model.split('/')[1].split(':')[0]} (fallback)",
            }

        return None  # Everything is down

    # ── Sync generation methods (run in thread pool) ──────────────────────────

    def _build_messages(self, prompt: str, system_prompt: Optional[str]) -> list:
        msgs = []
        if system_prompt:
            msgs.append({"role": "system", "content": system_prompt})
        msgs.append({"role": "user", "content": prompt})
        return msgs

    def _gen_groq(self, prompt: str, system_prompt: Optional[str], model: str) -> str:
        resp = self.groq_client.chat.completions.create(
            model=model,
            messages=self._build_messages(prompt, system_prompt),
            max_tokens=4096,
            temperature=0.7,
        )
        return resp.choices[0].message.content

    def _gen_gemini(self, prompt: str, system_prompt: Optional[str]) -> str:
        full = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        return self.gemini_model.generate_content(full).text

    def _gen_mistral(self, prompt: str, system_prompt: Optional[str], model: str) -> str:
        resp = self.mistral_client.chat.complete(
            model=model,
            messages=self._build_messages(prompt, system_prompt),
        )
        return resp.choices[0].message.content

    def _gen_openrouter(self, prompt: str, system_prompt: Optional[str], model: str) -> str:
        resp = self.openrouter_client.chat.completions.create(
            model=model,
            messages=self._build_messages(prompt, system_prompt),
            max_tokens=4096,
        )
        return resp.choices[0].message.content

    # ── Public async API ──────────────────────────────────────────────────────

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        task_type: str = "default",
    ) -> str:
        """Generate text. Returns string only (backward-compatible)."""
        result = await self.generate_with_meta(prompt, system_prompt, task_type)
        return result["text"]

    async def generate_with_meta(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        task_type: str = "default",
    ) -> dict:
        """Generate text and return {text, provider, model, label}."""
        route = self._resolve_route(task_type)

        if route is None:
            return {
                "text": (
                    "No AI provider configured. Add at least GROQ_API_KEY to backend/.env "
                    "(free key at console.groq.com)."
                ),
                "provider": "none", "model": "none", "label": "Not configured",
            }

        provider = route["provider"]
        model    = route["model"]
        label    = route["label"]

        try:
            if provider == "gemini":
                text = await asyncio.to_thread(self._gen_gemini, prompt, system_prompt)
            elif provider == "mistral":
                text = await asyncio.to_thread(self._gen_mistral, prompt, system_prompt, model)
            elif provider == "openrouter":
                text = await asyncio.to_thread(self._gen_openrouter, prompt, system_prompt, model)
            else:
                text = await asyncio.to_thread(self._gen_groq, prompt, system_prompt, model)

            return {"text": text, "provider": provider, "model": model, "label": label}

        except Exception as e:
            # Provider errored — cascade to the next available one
            for fallback_provider, fallback_fn in [
                ("groq",       lambda: asyncio.to_thread(self._gen_groq, prompt, system_prompt, "llama-3.3-70b-versatile") if self.groq_client and provider != "groq" else None),
                ("openrouter", lambda: asyncio.to_thread(self._gen_openrouter, prompt, system_prompt, OPENROUTER_MODELS.get(task_type, OPENROUTER_MODELS["default"])) if self.openrouter_client and provider != "openrouter" else None),
            ]:
                coro = fallback_fn()
                if coro is None:
                    continue
                try:
                    text = await coro
                    return {
                        "text":     text,
                        "provider": fallback_provider,
                        "model":    "llama-3.3-70b-versatile" if fallback_provider == "groq" else OPENROUTER_MODELS.get(task_type, OPENROUTER_MODELS["default"]),
                        "label":    f"{'Llama 3.3 70B' if fallback_provider == 'groq' else 'OpenRouter'} (fallback from {provider})",
                    }
                except Exception:
                    continue

            return {"text": f"AI error: {e}", "provider": "none", "model": "none", "label": "Error"}

    async def generate_structured(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        task_type: str = "default",
    ) -> str:
        if system_prompt:
            system_prompt += "\nRespond in clean, concise bullet points or numbered lists. No markdown headers."
        return await self.generate(prompt, system_prompt, task_type)


ai_service = AIService()
