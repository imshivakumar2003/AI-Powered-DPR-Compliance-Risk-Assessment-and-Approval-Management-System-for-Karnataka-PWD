from fastapi import FastAPI
from app.routers import dpr
from app.config import settings

app = FastAPI(
    title=settings.app_name,
    description="Backend API for DPR Assessment and Risk Prediction",
    version="1.0.0"
)

# Include routers
app.include_router(dpr.router)

@app.get("/")
def read_root():
    return {"message": f"Welcome to the {settings.app_name}"}

@app.get("/health")
def health_check():
    return {"status": "ok", "environment": settings.environment}
