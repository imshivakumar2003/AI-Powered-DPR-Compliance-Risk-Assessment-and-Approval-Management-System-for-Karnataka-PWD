from typing import Dict, Optional
from app.models import DPRProjectModel

# Mock database dictionary
_db: Dict[str, DPRProjectModel] = {}

def get_dpr(dpr_id: str) -> Optional[DPRProjectModel]:
    return _db.get(dpr_id)

def save_dpr(dpr: DPRProjectModel) -> DPRProjectModel:
    _db[dpr.id] = dpr
    return dpr

def update_dpr_status(dpr_id: str, status: str) -> Optional[DPRProjectModel]:
    dpr = _db.get(dpr_id)
    if dpr:
        dpr.status = status
        return dpr
    return None
