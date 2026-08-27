from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="EVALBENCH_")

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # PostgreSQL (required)
    postgres_dsn: str = "postgresql://postgres:postgres@localhost/evalbench"

    # Redis (required for /jobs endpoints, optional otherwise)
    redis_url: str = "redis://localhost:6379/0"
    redis_enabled: bool = False

    # CORS
    cors_origins: list[str] = ["*"]
