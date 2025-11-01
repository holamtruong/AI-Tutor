"""Mo ta model cho tinh nang tu dien va dich"""

from pydantic import BaseModel, Field


class DictionaryRequest(BaseModel):
    """Thong tin nguoi dung gui len khi tra cuu"""

    keyword: str = Field(..., min_length=1)
    context: str | None = None


class DictionaryResponse(BaseModel):
    """Noi dung tra ve sau khi tra cuu"""

    word: str
    content: str


class TranslationRequest(BaseModel):
    """Thong tin gui len khi dich van ban"""

    text: str = Field(..., min_length=1)


class TranslationResponse(BaseModel):
    """Ket qua dich tra ve"""

    translatedText: str


class IPAInfo(BaseModel):
    """Thong tin phien am va link audio"""

    ipa: str
    audioUrls: dict[str, str]


class DictionaryResponseWithIPA(DictionaryResponse):
    """Ket qua tra cuu kem thong tin phien am"""

    ipaInfo: IPAInfo | None = None
