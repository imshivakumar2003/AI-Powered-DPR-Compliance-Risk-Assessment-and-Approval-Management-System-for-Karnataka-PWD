from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="DPR Analysis API",
    description="Backend API for the AI-Powered DPR Analysis System",
    version="1.0.0"
)

class HealthCheckResponse(BaseModel):
    status: str
    message: str

@app.get("/api/health", response_model=HealthCheckResponse)
def health_check():
    return {
        "status": "healthy",
        "message": "DPR Analysis Backend is running."
    }

@app.get("/")
def root():
    return {"message": "Welcome to the DPR Analysis API. Go to /docs for the Swagger UI."}
