"""Tien ich lam viec voi Google Gemini"""

from __future__ import annotations

import textwrap

import google.generativeai as genai
from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool

from ..core.config import get_settings

settings = get_settings()

# chi cau hinh Gemini khi co key de tranh loi
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)


def _ensure_model(model_name: str) -> genai.GenerativeModel:
    """Tra ve doi tuong model da duoc cau hinh hoac bao loi khi thieu key"""

    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")
    return genai.GenerativeModel(model_name)


def build_dictionary_prompt(keyword: str, context: str | None = None) -> str:
    """Lap prompt giai thich tu vung giong tu dien"""

    context_clause = f' in the context of "{context}"' if context else ""
    return textwrap.dedent(
        f"""
        You are a comprehensive English-Vietnamese dictionary. Help learners understand and use the word "{keyword}"{context_clause}.
        <GOALS>
        1. Provide accurate meanings with emphasis on the sense that fits the context.
        2. Explain how to use the word naturally in sentences.
        3. Highlight common mistakes and how to avoid them.
        4. Share memorable notes or background information that aids retention.
        5. List synonyms, antonyms, and related expressions.
        6. Create a short comparison table with similar words when useful.
        7. Suggest practical scenarios where the word is commonly used.
        </GOALS>

        Respond in Vietnamese with clear sections and formatting that is easy to read.
        """
    ).strip()


def build_translation_prompt(text: str) -> str:
    """Lap prompt phuc vu dich"""

    return textwrap.dedent(
        f"""
        Translate the following English text into natural Vietnamese that sounds like a modern bilingual dictionary entry.

        Text: "{text}"

        Strip any asterisks or markdown bullet markers from the output.
        """
    ).strip()


async def generate_dictionary_content(keyword: str, context: str | None = None) -> str:
    """Goi Gemini tao noi dung tu dien"""

    model = _ensure_model("gemini-2.0-flash")

    def _call_model() -> str:
        """Chay loi goi dong bo tren thread khac"""

        prompt = build_dictionary_prompt(keyword, context)
        result = model.generate_content(prompt)
        return result.text or ""

    return await run_in_threadpool(_call_model)


async def generate_translation(text: str) -> str:
    """Goi Gemini dich tieng Anh sang tieng Viet"""

    model = _ensure_model("gemini-2.0-flash")

    def _call_model() -> str:
        """Chay loi goi dong bo tren thread khac"""

        prompt = build_translation_prompt(text)
        result = model.generate_content(prompt)
        return result.text or ""

    return await run_in_threadpool(_call_model)
