from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import time
import random

app = FastAPI(title="MDoNER DPR-AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RiskPrediction(BaseModel):
    risk_score: int
    risk_category: str
    top_risk_factors: List[str]
    mitigation_recommendations: List[str]

class DimensionScore(BaseModel):
    dimension: str
    score: int
    feedback: str

class QualityAssessment(BaseModel):
    overall_score: int
    status: str
    dimensions: List[DimensionScore]

class DPRResponse(BaseModel):
    id: str
    filename: str
    status: str
    upload_date: str
    estimated_cost: float
    sector: str

@app.get("/")
def read_root():
    return {"message": "Welcome to MDoNER DPR-AI API"}

@app.post("/api/dpr/upload", response_model=DPRResponse)
async def upload_dpr(file: UploadFile = File(...)):
    # Simulate processing delay
    return {
        "id": f"DPR-{random.randint(1000, 9999)}",
        "filename": file.filename,
        "status": "PROCESSING",
        "upload_date": "2026-04-21T10:00:00Z",
        "estimated_cost": random.uniform(10.0, 500.0),
        "sector": random.choice(["Roads", "Power", "Healthcare", "Education", "Tourism"])
    }

@app.get("/api/dpr/{dpr_id}/assessment", response_model=QualityAssessment)
def get_assessment(dpr_id: str):
    # Simulated scoring engine
    overall = random.randint(45, 95)
    return {
        "overall_score": overall,
        "status": "APPROVED" if overall > 75 else "NEEDS_REVISION",
        "dimensions": [
            {"dimension": "Technical Soundness", "score": random.randint(60, 95), "feedback": "Design specifications are mostly clear."},
            {"dimension": "Financial Realism", "score": random.randint(40, 90), "feedback": "Cost estimates lack some detailed breakdowns."},
            {"dimension": "Risk Identification", "score": random.randint(50, 95), "feedback": "Standard risks identified, missing geological survey details."},
            {"dimension": "Timeline Feasibility", "score": random.randint(55, 90), "feedback": "Timeline is aggressive for the terrain."},
            {"dimension": "Environmental Compliance", "score": random.randint(70, 100), "feedback": "EIA completed and attached."},
            {"dimension": "Stakeholder Engagement", "score": random.randint(60, 100), "feedback": "Community consultation records present."},
            {"dimension": "Procurement Clarity", "score": random.randint(65, 95), "feedback": "Tender criteria defined well."},
            {"dimension": "Sustainability", "score": random.randint(50, 90), "feedback": "O&M budget needs clarity for post-handover."}
        ]
    }

@app.get("/api/dpr/{dpr_id}/risk", response_model=RiskPrediction)
def get_risk_prediction(dpr_id: str):
    # Simulated XGBoost Risk Model
    risk = random.randint(15, 85)
    category = "High" if risk > 70 else "Medium" if risk > 40 else "Low"
    return {
        "risk_score": risk,
        "risk_category": category,
        "top_risk_factors": [
            "Terrain Complexity (Himalayan Region)",
            "Delayed Environmental Clearances",
            "Monsoon Window Constraints"
        ],
        "mitigation_recommendations": [
            "Conduct advanced LiDAR topographic survey",
            "Front-load procurement before monsoon season",
            "Establish multi-agency coordination committee for clearances"
        ]
    }

@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    return {
        "total_dprs": 524,
        "pending_review": 42,
        "high_risk_projects": 18,
        "total_fund_allocation_cr": 162000,
        "unutilised_funds_cr": 9384,
    }
