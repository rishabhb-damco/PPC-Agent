from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import re
from services.ai_service import ai_service

router = APIRouter()


class ExtractRequest(BaseModel):
    url: str


def clean_html(html: str) -> str:
    """Strip tags, scripts, styles — keep readable text."""
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<[^>]+>', ' ', html)
    html = re.sub(r'\s+', ' ', html)
    return html.strip()[:4000]


@router.post("/from-url")
async def extract_brand_from_url(req: ExtractRequest):
    url = req.url.strip()
    if not url.startswith("http"):
        url = "https://" + url

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (compatible; PPCAgent/1.0)"
            })
            html = resp.text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch URL: {str(e)}")

    text = clean_html(html)

    prompt = f"""
Analyse this website content and extract brand information for a PPC advertising setup.

Website URL: {url}
Website content: {text}

Return ONLY a JSON object with these exact keys (no explanation, no markdown, just JSON):
{{
  "name": "Brand or business name",
  "industry": "Industry/sector (e.g. Healthcare, E-commerce, SaaS, Legal)",
  "description": "1-2 sentence description of what the business does",
  "target_audience": "Who are their customers (age, interests, pain points)",
  "unique_selling_points": ["USP 1", "USP 2", "USP 3"],
  "products_services": ["Main product/service 1", "Main product/service 2"],
  "location": "City/Country if detectable, else empty string",
  "tone": "Brand tone: professional / casual / luxury / urgent / friendly",
  "suggested_competitors": ["Likely competitor type 1", "Likely competitor type 2"],
  "goals": "Likely advertising goal e.g. lead generation, e-commerce sales, bookings"
}}
"""

    result = await ai_service.generate(prompt)

    # Extract JSON from response
    try:
        json_match = re.search(r'\{.*\}', result, re.DOTALL)
        if json_match:
            import json
            extracted = json.loads(json_match.group())
            return {"success": True, "url": url, "extracted": extracted}
    except Exception:
        pass

    return {"success": False, "url": url, "raw": result,
            "extracted": {"name": "", "industry": "", "description": "",
                          "target_audience": "", "unique_selling_points": [],
                          "products_services": [], "location": "", "tone": "professional",
                          "suggested_competitors": [], "goals": ""}}
