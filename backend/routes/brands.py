from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from deps import get_current_user
from services.brand_store import (
    create_brand, get_all_brands, get_brand, get_analysis, get_approval_stats,
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
async def list_brands(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    brands = await get_all_brands(db)
    result = []
    for b in brands:
        stats = await get_approval_stats(db, b["id"])
        result.append({**b, "approval_stats": stats})
    return {"brands": result}


@router.post("/")
async def create_new_brand(
    data: BrandCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    brand = await create_brand(data.dict(), db)
    background_tasks.add_task(run_full_pipeline, brand["id"])
    return {"brand": brand, "message": "Brand created. Full analysis pipeline started automatically."}


@router.get("/{brand_id}")
async def get_brand_detail(
    brand_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    brand = await get_brand(brand_id, db)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    analysis = await get_analysis(brand_id, db)
    stats = await get_approval_stats(db, brand_id)
    return {"brand": brand, "analysis": analysis, "approval_stats": stats}


@router.post("/{brand_id}/run-pipeline")
async def trigger_pipeline(
    brand_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    brand = await get_brand(brand_id, db)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if brand["analysis_status"] == "running":
        return {"message": "Pipeline already running for this brand"}
    background_tasks.add_task(run_full_pipeline, brand_id)
    return {"message": "Full analysis pipeline started", "brand_id": brand_id}


@router.get("/{brand_id}/analysis")
async def get_brand_analysis(
    brand_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    brand = await get_brand(brand_id, db)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    analysis = await get_analysis(brand_id, db)
    return {"brand": brand, "analysis": analysis, "status": brand["analysis_status"]}
