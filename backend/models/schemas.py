from pydantic import BaseModel
from typing import Optional, List, Any
from enum import Enum


class AgentStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    ERROR = "error"
    AWAITING_APPROVAL = "awaiting_approval"


class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class CampaignStatus(str, Enum):
    ENABLED = "ENABLED"
    PAUSED = "PAUSED"
    REMOVED = "REMOVED"


# --- Request models ---

class AgentRunRequest(BaseModel):
    input: str
    context: Optional[dict] = {}


class CopyGenerationRequest(BaseModel):
    product: str
    target_audience: str
    platform: str  # google or meta
    tone: Optional[str] = "professional"
    num_variants: Optional[int] = 3


class ResearchRequest(BaseModel):
    brand: str
    competitors: Optional[List[str]] = []
    industry: Optional[str] = ""


# --- Response models ---

class KPISummary(BaseModel):
    total_spend: float
    total_roas: float
    total_conversions: int
    blended_ctr: float
    google_spend: float
    meta_spend: float
    google_roas: float
    meta_roas: float
    google_conversions: int
    meta_conversions: int
    spend_change_pct: float
    roas_change_pct: float
    conv_change_pct: float


class Alert(BaseModel):
    id: str
    severity: AlertSeverity
    title: str
    description: str
    platform: str
    campaign: Optional[str] = None
    timestamp: str
    resolved: bool = False


class Campaign(BaseModel):
    id: str
    name: str
    status: str
    budget: float
    impressions: int
    clicks: int
    ctr: float
    avg_cpc: float
    spend: float
    conversions: int
    conv_rate: float
    cost_per_conv: float
    roas: float
    quality_score_avg: Optional[float] = None
    network: str
    platform: str


class Keyword(BaseModel):
    keyword: str
    match_type: str
    quality_score: Optional[int] = None
    impressions: int
    clicks: int
    ctr: float
    avg_cpc: float
    spend: float
    conversions: int
    status: str


class AgentInfo(BaseModel):
    id: str
    name: str
    role: str
    status: AgentStatus
    last_run: Optional[str] = None
    capabilities: List[str]


class AgentResponse(BaseModel):
    agent_id: str
    agent_name: str
    status: str
    result: Any
    requires_approval: bool = False
    approval_type: Optional[str] = None


class HealthCheck(BaseModel):
    service: str
    status: str
    details: Optional[str] = None
    last_checked: str


class TechnicalHealthReport(BaseModel):
    overall_status: str
    checks: List[HealthCheck]
    critical_issues: int
    warnings: int
    timestamp: str


class WeeklyReport(BaseModel):
    period: str
    executive_summary: str
    google_performance: dict
    meta_performance: dict
    top_performing_campaigns: List[dict]
    anomalies: List[str]
    action_items: List[str]
    kpi_scorecard: dict
    generated_at: str
