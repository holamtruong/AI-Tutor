"""Tien ich lam viec voi cac model OpenAI"""

from __future__ import annotations

import json
from io import BytesIO
from typing import Any

from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool
from openai import OpenAI

from ..core.config import get_settings

settings = get_settings()
# khoi tao client dung chung de tranh tao lai nhieu lan
client = OpenAI(api_key=settings.openai_api_key)


def _ensure_client() -> OpenAI:
    """Dam bao client ton tai va da co key"""

    if not settings.openai_api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured.")
    return client


async def create_chat_completion(messages: list[dict[str, Any]]) -> dict[str, Any]:
    """Goi API chat completions va tra ve noi dung"""

    client_instance = _ensure_client()

    def _call_openai() -> dict[str, Any]:
        """Thuc thi loi goi dong bo tren thread khac"""

        completion = client_instance.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=messages,
        )
        choice = completion.choices[0].message.content if completion.choices else ""
        return {"content": choice}

    return await run_in_threadpool(_call_openai)


async def transcribe_audio(file_name: str, file_bytes: bytes) -> str:
    """Chuyen file am thanh thanh text bang Whisper"""

    client_instance = _ensure_client()

    def _call_whisper() -> str:
        """Thuc thi loi goi Whisper tren thread pool"""

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
    """Tach phan tra loi va cau hoi tiep theo tu chuoi JSON"""

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return content or "", []

    reply = data.get("reply") if isinstance(data.get("reply"), str) else ""
    follow_up = data.get("followUpQuestions")
    if isinstance(follow_up, list) and all(isinstance(item, str) for item in follow_up):
        return reply or content, follow_up
    return reply or content, []
