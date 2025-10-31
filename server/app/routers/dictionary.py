"""Router xử lý chức năng tra cứu từ điển và dịch thuật."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..models.dictionary import (
    DictionaryRequest,
    DictionaryResponseWithIPA,
    TranslationRequest,
    TranslationResponse,
    IPAInfo,
)
from ..services.dictionary_service import extract_ipa_and_audio
from ..services.gemini_service import generate_dictionary_content, generate_translation

router = APIRouter()


@router.post("/", response_model=DictionaryResponseWithIPA)
async def search_dictionary(payload: DictionaryRequest) -> DictionaryResponseWithIPA:
    """Tra cứu chi tiết một từ vựng bằng Gemini và kèm thông tin phát âm."""

    keyword = payload.keyword.strip()
    if not keyword:
        raise HTTPException(status_code=400, detail="Thiếu từ khóa tra cứu")

    content = await generate_dictionary_content(keyword, payload.context)
    ipa, audio_urls = await extract_ipa_and_audio(keyword)

    ipa_info = IPAInfo(ipa=ipa, audioUrls=audio_urls) if ipa or any(audio_urls.values()) else None
    return DictionaryResponseWithIPA(word=keyword, content=content, ipaInfo=ipa_info)


@router.post("/translate", response_model=TranslationResponse)
async def translate(payload: TranslationRequest) -> TranslationResponse:
    """Dịch văn bản từ tiếng Anh sang tiếng Việt theo phong cách từ điển."""

    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Thiếu nội dung cần dịch")

    translated = await generate_translation(text)
    if not translated:
        raise HTTPException(status_code=500, detail="Không thể dịch văn bản")

    return TranslationResponse(translatedText=translated)
