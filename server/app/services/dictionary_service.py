"""Các tiện ích hỗ trợ lấy dữ liệu phát âm và âm thanh."""
from __future__ import annotations

from typing import Any

import httpx


async def fetch_dictionary_api(word: str) -> Any:
    """Gọi API từ điển công cộng để lấy dữ liệu chi tiết."""

    url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()


async def extract_ipa_and_audio(word: str) -> tuple[str, dict[str, str]]:
    """Trích xuất IPA và đường dẫn phát âm từ dữ liệu API."""

    try:
        data = await fetch_dictionary_api(word)
    except Exception:
        return "", {"us": "", "uk": ""}

    first_entry = data[0] if isinstance(data, list) and data else {}
    phonetics = first_entry.get("phonetics", []) if isinstance(first_entry, dict) else []

    ipa = next((item.get("text") for item in phonetics if isinstance(item, dict) and item.get("text")), "")

    def _find_audio(suffix: str) -> str:
        """Tìm đường dẫn audio phù hợp với hậu tố chỉ vùng phát âm."""

        for item in phonetics:
            if not isinstance(item, dict):
                continue
            audio = item.get("audio", "")
            if suffix in audio:
                return audio
        return ""

    us_audio = _find_audio("us.mp3")
    uk_audio = _find_audio("uk.mp3")

    if not us_audio and phonetics:
        first_audio = phonetics[0]
        if isinstance(first_audio, dict):
            us_audio = first_audio.get("audio", "")

    return ipa or "", {"us": us_audio or "", "uk": uk_audio or ""}
