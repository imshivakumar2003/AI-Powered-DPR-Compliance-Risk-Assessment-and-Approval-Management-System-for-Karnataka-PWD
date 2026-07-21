from app.services.storage_service import StorageService
from app.services.extraction_service import ExtractionService
from app.services.structuring_service import StructuringService
from app.services.quality_service import QualityService
from app.services.compliance_service import ComplianceService
from app.services.risk_service import RiskService
from app.models import DPRProjectModel
from app.db.fake_db import save_dpr, update_dpr_status
import uuid

class PipelineService:
    @staticmethod
    def process_dpr(request_data: dict) -> DPRProjectModel:
        # Create initial DB record
        dpr_id = str(uuid.uuid4())
        dpr = DPRProjectModel(
            id=dpr_id,
            title=request_data.get("title", "Untitled"), 
            description=request_data.get("description", "")
        )
        save_dpr(dpr)
        update_dpr_status(dpr_id, "processing")
        
        # Simulate pipeline
        # 1. Storage
        # file_path = StorageService.store_file(file_content, filename)
        file_path = f"virtual_storage/{dpr_id}.pdf"
        
        # 2. Extraction
        raw_data = ExtractionService.extract_data(file_path)
        
        # 3. Structuring
        structured_data = StructuringService.structure_data(raw_data)
        
        # 4. Quality
        quality_score = QualityService.assess_quality(structured_data)
        
        # 5. Compliance
        is_compliant = ComplianceService.check_compliance(structured_data)
        
        # 6. Risk Prediction
        risk_result = RiskService.predict_risk(structured_data)
        
        # Update DB record with results
        dpr.risk_score = risk_result["risk_score"]
        dpr.risk_level = risk_result["risk_level"]
        update_dpr_status(dpr_id, "completed")
        
        return dpr
