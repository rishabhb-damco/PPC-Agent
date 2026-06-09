"""
Multi-provider AI service — all providers called via direct httpx REST.
No external AI SDK packages required; only httpx (already in requirements).

Provider → best tasks:
  Groq (Llama-3.3-70b)  — keywords, monitoring, routing, health  (fast + structured)
  Gemini 2.0 Flash       — research, reporting                    (long context + synthesis)
  Mistral Small          — copy, creative                         (nuanced writing)
  OpenRouter             — fallback + overflow                    (free models)

Fallback chain: preferred → Groq → OpenRouter → error string
"""

import asyncio
import httpx
from typing import Optional
from config import settings

# ── Provider availability (REST-based, always available if key is set) ─────────

GROQ_AVAILABLE = False
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    pass

# Gemini, Mistral, OpenRouter use pure httpx — no SDK, no conflicts
GEMINI_AVAILABLE    = True
MISTRAL_AVAILABLE   = True
OPENROUTER_AVAILABLE = True

# ── Task routing table ────────────────────────────────────────────────────────

OPENROUTER_MODELS = {
    "research":  "google/gemini-flash-1.5:free",
    "reporting": "google/gemini-flash-1.5:free",
    "copy":      "mistralai/mistral-7b-instruct:free",
    "creative":  "mistralai/mistral-7b-instruct:free",
    "default":   "meta-llama/llama-3.1-8b-instruct:free",
}

TASK_ROUTING: dict[str, dict] = {
    "research":   {"provider": "gemini",      "model": "gemini-2.0-flash",         "label": "Gemini 2.0 Flash"},
    "reporting":  {"provider": "gemini",      "model": "gemini-2.0-flash",         "label": "Gemini 2.0 Flash"},
    "copy":       {"provider": "mistral",     "model": "mistral-small-latest",     "label": "Mistral Small"},
    "creative":   {"provider": "mistral",     "model": "mistral-small-latest",     "label": "Mistral Small"},
    "keywords":   {"provider": "groq",        "model": "llama-3.3-70b-versatile", "label": "Llama 3.3 70B"},
    "monitoring": {"provider": "groq",        "model": "llama-3.3-70b-versatile", "label": "Llama 3.3 70B"},
    "routing":    {"provider": "groq",        "model": "llama-3.3-70b-versatile", "label": "Llama 3.3 70B"},
    "health":     {"provider": "groq",        "model": "llama-3.3-70b-versatile", "label": "Llama 3.3 70B"},
    "default":    {"provider": "groq",        "model": "llama-3.3-70b-versatile", "label": "Llama 3.3 70B"},
}

GROQ_FALLBACK = {"provider": "groq", "model": "llama-3.3-70b-versatile", "label": "Llama 3.3 70B (fallback)"}


class AIService:
    def __init__(self):
        self.groq_client = None
        # REST-based providers store their API key as the "client"
        self.gemini_key     = settings.GEMINI_API_KEY or ""
        self.mistral_key    = settings.MISTRAL_API_KEY or ""
        self.openrouter_key = settings.OPENROUTER_API_KEY or ""
        self._init_groq()

    def _init_groq(self):
        if GROQ_AVAILABLE and settings.GROQ_API_KEY:
            try:
                self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception:
                pass

    # ── Provider availability ─────────────────────────────────────────────────

    @property
    def providers_available(self) -> dict:
        return {
            "groq":       self.groq_client is not None,
            "gemini":     bool(self.gemini_key),
            "mistral":    bool(self.mistral_key),
            "openrouter": bool(self.openrouter_key),
        }

    def _resolve_route(self, task_type: str) -> dict | None:
        avail = self.providers_available
        route    = TASK_ROUTING.get(task_type, TASK_ROUTING["default"])
        provider = route["provider"]

        if provider == "gemini"  and avail["gemini"]:     return route
        if provider == "mistral" and avail["mistral"]:    return route
        if provider == "groq"    and avail["groq"]:       return route

        # Fallback → Groq → OpenRouter → None
        if avail["groq"]:
            return {**GROQ_FALLBACK, "label": f"Llama 3.3 70B (fallback — {provider} key not set)"}
        if avail["openrouter"]:
            model = OPENROUTER_MODELS.get(task_type, OPENROUTER_MODELS["default"])
            return {"provider": "openrouter", "model": model, "label": f"OpenRouter/{model.split('/')[1].split(':')[0]}"}
        return None

    # ── Sync generation helpers ───────────────────────────────────────────────

    def _chat_messages(self, prompt: str, system_prompt: Optional[str]) -> list:
        msgs = []
        if system_prompt:
            msgs.append({"role": "system", "content": system_prompt})
        msgs.append({"role": "user", "content": prompt})
        return msgs

    def _gen_groq(self, prompt: str, system_prompt: Optional[str], model: str) -> str:
        resp = self.groq_client.chat.completions.create(
            model=model,
            messages=self._chat_messages(prompt, system_prompt),
            max_tokens=4096,
            temperature=0.7,
        )
        return resp.choices[0].message.content

    def _gen_gemini(self, prompt: str, system_prompt: Optional[str]) -> str:
        """Gemini REST API — no SDK package required."""
        full = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        url  = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.gemini_key}"
        resp = httpx.post(url, json={"contents": [{"role": "user", "parts": [{"text": full}]}]}, timeout=60)
        resp.raise_for_status()
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"]

    def _gen_mistral(self, prompt: str, system_prompt: Optional[str], model: str) -> str:
        """Mistral REST API (OpenAI-compatible) — no SDK package required."""
        resp = httpx.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.mistral_key}", "Content-Type": "application/json"},
            json={"model": model, "messages": self._chat_messages(prompt, system_prompt), "max_tokens": 4096},
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    def _gen_openrouter(self, prompt: str, system_prompt: Optional[str], model: str) -> str:
        """OpenRouter REST API (OpenAI-compatible) — no SDK package required."""
        resp = httpx.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.openrouter_key}", "Content-Type": "application/json"},
            json={"model": model, "messages": self._chat_messages(prompt, system_prompt), "max_tokens": 4096},
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    # ── Public async API ──────────────────────────────────────────────────────

    async def generate(self, prompt: str, system_prompt: Optional[str] = None, task_type: str = "default") -> str:
        result = await self.generate_with_meta(prompt, system_prompt, task_type)
        return result["text"]

    async def generate_with_meta(
        self, prompt: str, system_prompt: Optional[str] = None, task_type: str = "default"
    ) -> dict:
        route = self._resolve_route(task_type)
        if route is None:
            return {
                "text": "No AI provider configured. Add GROQ_API_KEY to backend/.env (free at console.groq.com).",
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
            # Cascade fallback
            for fb_provider, fb_fn in [
                ("groq",       lambda: asyncio.to_thread(self._gen_groq, prompt, system_prompt, GROQ_FALLBACK["model"])
                               if self.groq_client and provider != "groq" else None),
                ("openrouter", lambda: asyncio.to_thread(self._gen_openrouter, prompt, system_prompt, OPENROUTER_MODELS.get(task_type, OPENROUTER_MODELS["default"]))
                               if self.openrouter_key and provider != "openrouter" else None),
            ]:
                coro = fb_fn()
                if coro is None:
                    continue
                try:
                    text = await coro
                    return {
                        "text": text,
                        "provider": fb_provider,
                        "model": GROQ_FALLBACK["model"] if fb_provider == "groq" else OPENROUTER_MODELS.get(task_type, OPENROUTER_MODELS["default"]),
                        "label": f"{'Llama 3.3 70B' if fb_provider == 'groq' else 'OpenRouter'} (fallback from {provider})",
                    }
                except Exception:
                    continue

            return {"text": f"AI error: {e}", "provider": "none", "model": "none", "label": "Error"}

    async def generate_structured(self, prompt: str, system_prompt: Optional[str] = None, task_type: str = "default") -> str:
        if system_prompt:
            system_prompt += "\nRespond in clean, concise bullet points or numbered lists. No markdown headers."
        return await self.generate(prompt, system_prompt, task_type)


ai_service = AIService()
