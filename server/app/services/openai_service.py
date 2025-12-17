"""Tien ich lam viec voi cac model OpenAI"""

from __future__ import annotations

import json
import textwrap
from typing import Any

from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool
from openai import OpenAI

from ..core.config import get_settings

settings = get_settings()
# khoi tao OpenAI client
client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None


def _ensure_client() -> OpenAI:
    """Dam bao client ton tai va da co key"""

    if not settings.openai_api_key or not client:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured.")
    return client


# ============================================================================
# CHAT & WRITING EVALUATION
# ============================================================================

async def create_chat_completion(messages: list[dict[str, Any]]) -> dict[str, Any]:
    """Goi API chat completions va tra ve noi dung"""

    client_instance = _ensure_client()

    def _call_openai() -> dict[str, Any]:
        """Thuc thi loi goi dong bo tren thread khac"""
        # Hàm gọi OpenAI Chat Completion với định dạng phản hồi là JSON
        completion = client_instance.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=messages,
        )
        choice = completion.choices[0].message.content if completion.choices else ""
        return {"content": choice}

    return await run_in_threadpool(_call_openai)


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


# ============================================================================
# DICTIONARY & TRANSLATION
# ============================================================================

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
    """Goi OpenAI tao noi dung tu dien"""

    client_instance = _ensure_client()

    def _call_model() -> str:
        """Chay loi goi dong bo tren thread khac"""

        prompt = build_dictionary_prompt(keyword, context)
        response = client_instance.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a comprehensive English-Vietnamese dictionary assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        return response.choices[0].message.content or ""

    return await run_in_threadpool(_call_model)


async def generate_translation(text: str) -> str:
    """Goi OpenAI dich tieng Anh sang tieng Viet"""

    client_instance = _ensure_client()

    def _call_model() -> str:
        """Chay loi goi dong bo tren thread khac"""

        prompt = build_translation_prompt(text)
        response = client_instance.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional English-Vietnamese translator."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=200
        )
        return _clean_translation_output(response.choices[0].message.content or "")

    return await run_in_threadpool(_call_model)
