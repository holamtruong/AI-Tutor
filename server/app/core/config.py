"""Cấu hình hệ thống và đọc biến môi trường."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Lớp thiết lập ứng dụng, đọc giá trị từ biến môi trường."""

    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    port: int = 5050

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache()
def get_settings() -> Settings:
    """Đọc cấu hình một lần và tái sử dụng cho toàn ứng dụng."""

    return Settings()
