from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DPRSubmitRequest(BaseModel):
    title: str = Field(..., description="Title of the DPR project")
    description: str = Field(..., description="Description of the DPR project")
    project_type: str = Field("infrastructure", description="Type of the project")

class DPRResponse(BaseModel):
    id: str
    title: str
    description: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RiskPredictionResponse(BaseModel):
    dpr_id: str
    risk_score: float
    risk_level: str
    factors: list[str]
