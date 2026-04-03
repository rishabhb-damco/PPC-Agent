from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routes import dashboard, campaigns, agents, reports, brands, approvals, extract

app = FastAPI(
    title="PPC Agent API",
    description="AI Agency Framework for Performance Marketing Intelligence",
    version="1.0.0",
)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(campaigns.router, prefix="/api/v1/campaigns", tags=["Campaigns"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["Agents"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(brands.router, prefix="/api/v1/brands", tags=["Brands"])
app.include_router(approvals.router, prefix="/api/v1/approvals", tags=["Approvals"])
app.include_router(extract.router, prefix="/api/v1/extract", tags=["Extract"])


@app.get("/")
async def root():
    return {"status": "PPC Agent API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
