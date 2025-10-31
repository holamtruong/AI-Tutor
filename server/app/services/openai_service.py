"""Các hàm tiện ích làm việc với OpenAI."""
from __future__ import annotations

import json
from io import BytesIO
from typing import Any

from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool
from openai import OpenAI

from ..core.config import get_settings

settings = get_settings()
client = OpenAI(api_key=settings.openai_api_key)


def _ensure_client() -> OpenAI:
    """Tạo client OpenAI và kiểm tra khóa API trước khi sử dụng."""

    if not settings.openai_api_key:
        raise HTTPException(status_code=500, detail="Thiếu biến môi trường OPENAI_API_KEY")
    return client


async def create_chat_completion(messages: list[dict[str, Any]]) -> dict[str, Any]:
    """Gọi API chat completions của OpenAI để lấy câu trả lời."""

    client_instance = _ensure_client()

    def _call_openai() -> dict[str, Any]:
        """Thực hiện lời gọi đồng bộ tới OpenAI trong thread pool."""

        completion = client_instance.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=messages,
        )
        choice = completion.choices[0].message.content if completion.choices else ""
        return {"content": choice}

    return await run_in_threadpool(_call_openai)


async def transcribe_audio(file_name: str, file_bytes: bytes) -> str:
    """Sử dụng Whisper để chuyển đổi âm thanh thành văn bản."""

    client_instance = _ensure_client()

    def _call_whisper() -> str:
        """Gọi API Whisper ở thread pool để tránh chặn event loop."""

        audio_stream = BytesIO(file_bytes)
        audio_stream.name = file_name
        transcription = client_instance.audio.transcriptions.create(
            model="whisper-1",
            file=audio_stream,
            language="en",
        )
        text = getattr(transcription, "text", None)
        if isinstance(text, str) and text.strip():
            return text
        if isinstance(transcription, dict):
            return transcription.get("text", "")
        return ""

    return await run_in_threadpool(_call_whisper)


def parse_chat_json(content: str) -> tuple[str, list[str]]:
    """Tách phần trả lời và danh sách câu hỏi gợi ý từ phản hồi JSON."""

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return content or "", []

    reply = data.get("reply") if isinstance(data.get("reply"), str) else ""
    follow_up = data.get("followUpQuestions")
    if isinstance(follow_up, list) and all(isinstance(item, str) for item in follow_up):
        return reply or content, follow_up
    return reply or content, []
