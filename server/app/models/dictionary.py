"""Định nghĩa dữ liệu cho chức năng từ điển."""
from pydantic import BaseModel, Field


class DictionaryRequest(BaseModel):
    """Yêu cầu tra cứu từ vựng với từ khóa và ngữ cảnh tuỳ chọn."""

    keyword: str = Field(..., min_length=1)
    context: str | None = None


class DictionaryResponse(BaseModel):
    """Nội dung trả về khi người dùng tra cứu từ điển."""

    word: str
    content: str


class TranslationRequest(BaseModel):
    """Yêu cầu dịch thuật một đoạn văn bản bất kỳ."""

    text: str = Field(..., min_length=1)


class TranslationResponse(BaseModel):
    """Kết quả bản dịch từ tiếng Anh sang tiếng Việt."""

    translatedText: str


class IPAInfo(BaseModel):
    """Thông tin phiên âm và đường dẫn phát âm."""

    ipa: str
    audioUrls: dict[str, str]


class DictionaryResponseWithIPA(DictionaryResponse):
    """Kết quả tra cứu có kèm thông tin phát âm."""

    ipaInfo: IPAInfo | None = None
