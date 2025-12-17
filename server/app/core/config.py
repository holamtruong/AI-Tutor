"""Mo ta cau hinh va tien ich doc bien moi truong"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Dinh nghia cac truong cau hinh doc tu moi truong"""

    openai_api_key: str | None = None
    port: int = 5050

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Tra ve mot ban sao settings duoc cache"""

    return Settings()
