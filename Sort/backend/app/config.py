from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "DPR Assessment API"
    environment: str = "development"
    database_url: str = "sqlite:///./test.db"

    class Config:
        env_file = ".env"

settings = Settings()
