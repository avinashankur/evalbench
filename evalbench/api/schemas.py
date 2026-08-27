from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    version: str
    postgres: str
    redis: str
