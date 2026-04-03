from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.brand_store import (
    create_brand, get_all_brands, get_brand, get_analysis, get_approval_stats
)
from services.pipeline import run_full_pipeline

router = APIRouter()


class BrandCreate(BaseModel):
    name: str
    website: Optional[str] = ""
    industry: str
    competitors: Optional[List[str]] = []
    target_audience: Optional[str] = ""
    monthly_budget: Optional[str] = ""
    platforms: Optional[List[str]] = ["google", "meta"]
    goals: Optional[str] = ""


@router.get("/")
async def list_brands():
    brands = get_all_brands()
    result = []
    for b in brands:
        stats = get_approval_stats(b["id"])
        result.append({**b, "approval_stats": stats})
    return {"brands": result}


@router.post("/")
async def create_new_brand(data: BrandCreate, background_tasks: BackgroundTasks):
    brand = create_brand(data.dict())
    # Auto-start pipeline in background
    background_tasks.add_task(run_full_pipeline, brand["id"])
    return {"brand": brand, "message": "Brand created. Full analysis pipeline started automatically."}


@router.get("/{brand_id}")
async def get_brand_detail(brand_id: str):
    brand = get_brand(brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    analysis = get_analysis(brand_id)
    stats = get_approval_stats(brand_id)
    return {"brand": brand, "analysis": analysis, "approval_stats": stats}


@router.post("/{brand_id}/run-pipeline")
async def trigger_pipeline(brand_id: str, background_tasks: BackgroundTasks):
    brand = get_brand(brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if brand["analysis_status"] == "running":
        return {"message": "Pipeline already running for this brand"}
    background_tasks.add_task(run_full_pipeline, brand_id)
    return {"message": "Full analysis pipeline started", "brand_id": brand_id}


@router.get("/{brand_id}/analysis")
async def get_brand_analysis(brand_id: str):
    analysis = get_analysis(brand_id)
    brand = get_brand(brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return {
        "brand": brand,
        "analysis": analysis,
        "status": brand["analysis_status"],
    }
