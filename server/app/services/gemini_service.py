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
    """Lap prompt phuc vu dich (xuat ngan gon, 1 dong)."""

    return textwrap.dedent(
        f"""
        You are a professional translator. Translate the text below into clear, natural Vietnamese.

        Requirements:
        - Output ONLY the translated Vietnamese text, in ONE LINE. No explanation, headings, notes, or examples.
        - Plain text only: no quotes/backticks, no list markers, no markdown.
        - Be concise and faithful to the meaning.
        - If the input is a single word or short phrase (≤ 3 words), return 1–3 common Vietnamese equivalents separated by ", "; do NOT add a trailing period.
        - Prefer a short phrasing suitable for quick tooltip display.

        Text:
        {text}
        """
    ).strip()


def _clean_translation_output(s: str) -> str:
    """Lam gon dau ra: bo markdown/ngoac kep, chuan hoa khoang trang, 1 dong, gioi han do dai nho gon."""

    if not s:
        return ""
    s = s.strip()
    # bo code fences/backticks/ast/markdown bullets don gian
    for token in ("```", "`"):
        s = s.replace(token, "")
    # cat ngoac kep/ngoac don o dau/ cuoi neu co
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1].strip()
    # bo ky tu bullet dau dong
    lines = []
    for line in s.splitlines():
        line = line.lstrip().lstrip("-*•\t ")
        lines.append(line)
    # luon dua ve 1 dong
    s = " ".join(part.strip() for part in lines if part.strip())
    # chuan hoa nhieu khoang trang thanh 1
    while "  " in s:
        s = s.replace("  ", " ")
    s = s.strip()
    # gioi han do dai phu hop tooltip (vi du ~160 ky tu)
    max_len = 160
    if len(s) > max_len:
        cut = s[:max_len]
        # cat den khoang trang gan nhat de tranh cat giua tu
        last_space = cut.rfind(" ")
        if last_space >= 80:  # tranh cat qua som neu chuoi ngan
            cut = cut[:last_space]
        s = cut.rstrip(" ,.;:！!？?、") + "…"
    return s


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
        return _clean_translation_output(result.text or "")

    return await run_in_threadpool(_call_model)
