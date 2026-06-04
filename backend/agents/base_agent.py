from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional
from services.ai_service import ai_service


class BaseAgent(ABC):
    def __init__(self, agent_id: str, name: str, role: str, capabilities: List[str]):
        self.agent_id = agent_id
        self.name = name
        self.role = role
        self.capabilities = capabilities
        self.status = "idle"
        self.last_run: Optional[str] = None
        self._last_model_label: str = "unknown"

    def to_dict(self) -> dict:
        return {
            "id": self.agent_id,
            "name": self.name,
            "role": self.role,
            "status": self.status,
            "last_run": self.last_run,
            "capabilities": self.capabilities,
            "model": self._last_model_label,
        }

    def _start(self):
        self.status = "running"

    def _complete(self):
        self.status = "completed"
        self.last_run = datetime.now().isoformat()

    def _error(self):
        self.status = "error"

    async def ask_ai(self, prompt: str, system_prompt: str = "", task_type: str = "default") -> str:
        """Call AI with automatic provider routing. Returns text; stores model label internally."""
        result = await ai_service.generate_with_meta(prompt, system_prompt, task_type)
        self._last_model_label = result["label"]
        return result["text"]

    def _model_metadata(self) -> dict:
        """Return metadata dict to embed in approval queue items."""
        return {"model_used": self._last_model_label}

    @abstractmethod
    async def run(self, input_data: dict) -> dict:
        pass
