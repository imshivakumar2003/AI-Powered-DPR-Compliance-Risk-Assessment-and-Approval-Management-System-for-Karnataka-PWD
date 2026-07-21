# TOPLINE

from pydantic import BaseModel
from typing import List


class RecommendationItem(BaseModel):
    id: str
    category: str
    priority: str  # "critical", "high", "medium", "low"
    title: str
    description: str
    impact: str
    actionable_steps: List[str]


class RecommendationResponse(BaseModel):
    dpr_id: str
    total_recommendations: int
    critical_count: int
    high_count: int
    recommendations: List[RecommendationItem]
