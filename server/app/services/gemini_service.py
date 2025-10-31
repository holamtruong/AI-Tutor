"""Các hàm tiện ích để làm việc với Google Gemini."""
from __future__ import annotations

import textwrap

import google.generativeai as genai
from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool

from ..core.config import get_settings

settings = get_settings()

if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)


def _ensure_model(model_name: str) -> genai.GenerativeModel:
    """Tạo model Gemini, báo lỗi nếu thiếu khóa API."""

    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="Thiếu biến môi trường GEMINI_API_KEY")
    return genai.GenerativeModel(model_name)


def build_dictionary_prompt(keyword: str, context: str | None = None) -> str:
    """Sinh prompt phục vụ tra cứu từ điển theo yêu cầu đặc thù."""

    context_clause = f' trong ngữ cảnh "{context}"' if context else ""
    return textwrap.dedent(
        f"""
        Bạn là một **từ điển Anh-Việt toàn diện, chính xác và giàu tính ứng dụng**, được thiết kế để giúp người dùng hiểu và sử dụng từ vựng một cách **tự nhiên, đúng ngữ pháp và phù hợp với ngữ cảnh**. Mục đích bạn được tạo ra là giúp người học tiếng Anh không chỉ **hiểu nghĩa của từ**, mà còn **sử dụng nó một cách tự nhiên, chính xác và hiệu quả trong giao tiếp thực tế**.
        Hãy giải thích nghĩa của từ "{keyword}"{context_clause}
        <GOALS>
        1. **Giải nghĩa chính xác & dễ hiểu**, ưu tiên nghĩa phù hợp nhất với ngữ cảnh.
        2. **Hướng dẫn cách sử dụng từ đúng văn phong & ngữ pháp**.
        3. **Liệt kê lỗi sai phổ biến & cách tránh**.
        4. **Cung cấp thông tin thú vị, mẹo ghi nhớ & nguồn gốc từ vựng**.
        5. **Tổng hợp từ đồng nghĩa, trái nghĩa & cụm từ liên quan**.
        6. **Lập bảng so sánh với các từ/cụm từ tương tự nếu cần (cheat sheet)**.
        7. **Hướng dẫn sử dụng từ trong các tình huống thực tế**.
        </GOALS>

        Trình bày hoàn toàn bằng tiếng Việt theo văn phong trang trọng, súc tích.
        """
    ).strip()


def build_translation_prompt(text: str) -> str:
    """Sinh prompt ngắn gọn cho chức năng dịch thuật."""

    return textwrap.dedent(
        f"""
        Bạn là một công cụ phiên dịch, luôn dịch từ tiếng Anh sang tiếng Việt.
        Hãy dịch từ "{text}" một cách ngắn gọn, trình bày theo phong cách từ điển trang trọng với cấu trúc: (phiên âm IPA) (loại từ): nghĩa.
        Hãy loại bỏ mọi ký tự * trong câu trả lời.
        """
    ).strip()


async def generate_dictionary_content(keyword: str, context: str | None = None) -> str:
    """Gọi Gemini để sinh nội dung giải thích từ vựng."""

    model = _ensure_model("gemini-2.0-flash")

    def _call_model() -> str:
        """Thực thi lời gọi model đồng bộ trong thread pool."""

        prompt = build_dictionary_prompt(keyword, context)
        result = model.generate_content(prompt)
        return result.text or ""

    return await run_in_threadpool(_call_model)


async def generate_translation(text: str) -> str:
    """Gọi Gemini để tạo bản dịch tiếng Việt."""

    model = _ensure_model("gemini-2.0-flash")

    def _call_model() -> str:
        """Sinh bản dịch trong thread pool để tránh chặn event loop."""

        prompt = build_translation_prompt(text)
        result = model.generate_content(prompt)
        return result.text or ""

    return await run_in_threadpool(_call_model)
