# TOPLINE

from fastapi import APIRouter, HTTPException
from app.schemas_recommendation import RecommendationResponse
from app.services.recommendation_service import RecommendationService
from app.db.fake_db import get_dpr

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/dpr/{dpr_id}", response_model=RecommendationResponse)
async def get_dpr_recommendations(dpr_id: str):
    """
    Get AI-generated recommendations for a specific DPR.
    Returns prioritised, actionable improvement suggestions
    based on sector, risk level, and quality assessment.
    """
    dpr = get_dpr(dpr_id)
    if not dpr:
        raise HTTPException(status_code=404, detail="DPR not found")

    # Build context for recommendation engine
    dpr_context = {
        "id": dpr.id,
        "sector": getattr(dpr, "sector", "Roads"),
        "risk_level": dpr.risk_level or "Low",
        "quality_score": getattr(dpr, "quality_score", 70),
    }

    result = RecommendationService.generate_recommendations(dpr_context)
    return result
