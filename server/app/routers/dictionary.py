"""Router phuc vu tra cuu tu dien va dich"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..models.dictionary import (
    DictionaryRequest,
    DictionaryResponseWithIPA,
    IPAInfo,
    TranslationRequest,
    TranslationResponse,
)
from ..services.dictionary_service import extract_ipa_and_audio
from ..services.gemini_service import generate_dictionary_content, generate_translation

router = APIRouter()


@router.post("/", response_model=DictionaryResponseWithIPA)
async def search_dictionary(payload: DictionaryRequest) -> DictionaryResponseWithIPA:
    """Sinh noi dung tu dien va thong tin IPA"""

    keyword = payload.keyword.strip()
    if not keyword:
        raise HTTPException(status_code=400, detail="Keyword is required.")

    # goi Gemini tao noi dung giau ngu canh
    content = await generate_dictionary_content(keyword, payload.context)
    # lay them phien am va audio tu API cong khai
    ipa, audio_urls = await extract_ipa_and_audio(keyword)

    ipa_info = IPAInfo(ipa=ipa, audioUrls=audio_urls) if ipa or any(audio_urls.values()) else None
    return DictionaryResponseWithIPA(word=keyword, content=content, ipaInfo=ipa_info)


@router.post("/translate", response_model=TranslationResponse)
async def translate(payload: TranslationRequest) -> TranslationResponse:
    """Dich tieng Anh sang tieng Viet bang Gemini"""

    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required for translation.")

    # goi model dich noi dung
    translated = await generate_translation(text)
    if not translated:
        raise HTTPException(status_code=500, detail="Translation failed.")

    return TranslationResponse(translatedText=translated)
