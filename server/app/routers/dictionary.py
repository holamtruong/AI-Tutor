"""Router phuc vu tra cuu tu dien va dich"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..models.dictionary import (
    DictionaryRequest,
    DictionaryResponse,
    TranslationRequest,
    TranslationResponse,
)
from ..services.openai_service import generate_dictionary_content, generate_translation

router = APIRouter()


@router.post("/", response_model=DictionaryResponse)
async def search_dictionary(payload: DictionaryRequest) -> DictionaryResponse:
    """Sinh noi dung tu dien"""

    keyword = payload.keyword.strip()
    if not keyword:
        raise HTTPException(status_code=400, detail="Keyword is required.")

    # goi OpenAI tao noi dung giau ngu canh
    content = await generate_dictionary_content(keyword, payload.context)
    return DictionaryResponse(word=keyword, content=content)


@router.post("/translate", response_model=TranslationResponse)
async def translate(payload: TranslationRequest) -> TranslationResponse:
    """Dich tieng Anh sang tieng Viet bang OpenAI"""

    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required for translation.")

    # goi model dich noi dung
    translated = await generate_translation(text)
    if not translated:
        raise HTTPException(status_code=500, detail="Translation failed.")

    return TranslationResponse(translatedText=translated)
