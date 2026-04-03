from datetime import datetime
from typing import Dict, List, Optional
import uuid


# ─── In-memory stores (upgradeable to DB later) ───────────────────────────────

_brands: Dict[str, dict] = {}
_analyses: Dict[str, dict] = {}      # brand_id -> latest analysis
_approval_queue: Dict[str, dict] = {}  # item_id -> approval item


# ─── Brand CRUD ───────────────────────────────────────────────────────────────

def create_brand(data: dict) -> dict:
    brand_id = str(uuid.uuid4())
    brand = {
        "id": brand_id,
        "name": data["name"],
        "website": data.get("website", ""),
        "industry": data.get("industry", ""),
        "competitors": data.get("competitors", []),
        "target_audience": data.get("target_audience", ""),
        "monthly_budget": data.get("monthly_budget", ""),
        "platforms": data.get("platforms", ["google", "meta"]),
        "goals": data.get("goals", ""),
        "created_at": datetime.now().isoformat(),
        "last_analysed": None,
        "analysis_status": "never_run",  # never_run | running | completed | error
    }
    _brands[brand_id] = brand
    return brand


def get_all_brands() -> List[dict]:
    return list(_brands.values())


def get_brand(brand_id: str) -> Optional[dict]:
    return _brands.get(brand_id)


def update_brand_status(brand_id: str, status: str):
    if brand_id in _brands:
        _brands[brand_id]["analysis_status"] = status
        if status == "completed":
            _brands[brand_id]["last_analysed"] = datetime.now().isoformat()


# ─── Analysis Storage ─────────────────────────────────────────────────────────

def save_analysis(brand_id: str, analysis: dict):
    _analyses[brand_id] = {
        **analysis,
        "brand_id": brand_id,
        "generated_at": datetime.now().isoformat(),
    }


def get_analysis(brand_id: str) -> Optional[dict]:
    return _analyses.get(brand_id)


# ─── Approval Queue ───────────────────────────────────────────────────────────

def add_approval_item(brand_id: str, item_type: str, title: str, description: str,
                       recommendation: str, agent_id: str, impact: str = "medium",
                       category: str = "general", metadata: dict = None) -> dict:
    item_id = str(uuid.uuid4())
    item = {
        "id": item_id,
        "brand_id": brand_id,
        "type": item_type,          # copy | keyword | technical | budget | creative | strategy
        "category": category,       # google_ads | meta_ads | seo | technical | creative
        "title": title,
        "description": description,
        "recommendation": recommendation,
        "agent_id": agent_id,
        "impact": impact,           # high | medium | low
        "status": "pending",        # pending | approved | rejected | implemented
        "created_at": datetime.now().isoformat(),
        "actioned_at": None,
        "metadata": metadata or {},
    }
    _approval_queue[item_id] = item
    return item


def get_approval_queue(brand_id: str = None, status: str = None) -> List[dict]:
    items = list(_approval_queue.values())
    if brand_id:
        items = [i for i in items if i["brand_id"] == brand_id]
    if status:
        items = [i for i in items if i["status"] == status]
    return sorted(items, key=lambda x: (
        {"high": 0, "medium": 1, "low": 2}.get(x["impact"], 1),
        x["created_at"]
    ))


def action_approval_item(item_id: str, action: str) -> Optional[dict]:
    """action: approved | rejected"""
    if item_id in _approval_queue:
        _approval_queue[item_id]["status"] = action
        _approval_queue[item_id]["actioned_at"] = datetime.now().isoformat()
        return _approval_queue[item_id]
    return None


def bulk_action_approvals(item_ids: List[str], action: str) -> List[dict]:
    return [action_approval_item(iid, action) for iid in item_ids if iid in _approval_queue]


def get_approval_stats(brand_id: str = None) -> dict:
    items = get_approval_queue(brand_id)
    return {
        "total": len(items),
        "pending": len([i for i in items if i["status"] == "pending"]),
        "approved": len([i for i in items if i["status"] == "approved"]),
        "rejected": len([i for i in items if i["status"] == "rejected"]),
        "high_impact_pending": len([i for i in items if i["status"] == "pending" and i["impact"] == "high"]),
    }
