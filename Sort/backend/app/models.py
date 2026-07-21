from datetime import datetime
from typing import Optional

class DPRProjectModel:
    """
    Dummy DB model for a DPR (Detailed Project Report) Project.
    In a real app, this would be an SQLAlchemy declarative base class.
    """
    def __init__(self, id: str, title: str, description: str, status: str = "pending"):
        self.id = id
        self.title = title
        self.description = description
        self.status = status
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.risk_score: Optional[float] = None
        self.risk_level: Optional[str] = None
        
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "risk_score": self.risk_score,
            "risk_level": self.risk_level,
        }
