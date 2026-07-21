from fastapi import APIRouter, HTTPException
from app.schemas import DPRSubmitRequest, DPRResponse, RiskPredictionResponse
from app.services.pipeline_service import PipelineService
from app.db.fake_db import get_dpr

router = APIRouter(prefix="/dpr", tags=["DPR Assessment"])

@router.post("/submit", response_model=DPRResponse)
async def submit_dpr(request: DPRSubmitRequest):
    """
    Endpoint to submit a new DPR for processing.
    """
    # Trigger the pipeline service
    dpr_record = PipelineService.process_dpr(request.model_dump())
    return dpr_record.to_dict()

@router.get("/{dpr_id}/status", response_model=DPRResponse)
async def get_dpr_status(dpr_id: str):
    """
    Endpoint to retrieve the current status of a submitted DPR.
    """
    dpr = get_dpr(dpr_id)
    if not dpr:
        raise HTTPException(status_code=404, detail="DPR not found")
    return dpr.to_dict()

@router.get("/{dpr_id}/risk", response_model=RiskPredictionResponse)
async def get_dpr_risk(dpr_id: str):
    """
    Endpoint to retrieve the risk prediction for a DPR.
    """
    dpr = get_dpr(dpr_id)
    if not dpr:
        raise HTTPException(status_code=404, detail="DPR not found")
    if dpr.status != "completed":
        raise HTTPException(status_code=400, detail="Risk prediction not yet completed")
    
    return RiskPredictionResponse(
        dpr_id=dpr.id,
        risk_score=dpr.risk_score or 0.0,
        risk_level=dpr.risk_level or "Unknown",
        factors=["Simulated factor 1", "Simulated factor 2"]
    )
