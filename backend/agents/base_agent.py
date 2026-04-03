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

    def to_dict(self) -> dict:
        return {
            "id": self.agent_id,
            "name": self.name,
            "role": self.role,
            "status": self.status,
            "last_run": self.last_run,
            "capabilities": self.capabilities,
        }

    def _start(self):
        self.status = "running"

    def _complete(self):
        self.status = "completed"
        self.last_run = datetime.now().isoformat()

    def _error(self):
        self.status = "error"

    async def ask_ai(self, prompt: str, system_prompt: str = "") -> str:
        return await ai_service.generate(prompt, system_prompt)

    @abstractmethod
    async def run(self, input_data: dict) -> dict:
        pass
