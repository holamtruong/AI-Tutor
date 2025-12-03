"""Mo ta cac model cho tinh nang tro chuyen"""

from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Mo ta tung tin nhan trong lich su"""

    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    """Payload khi nguoi hoc gui tin nhan"""

    message: str = Field(..., min_length=1)
    history: list[ChatMessage] | None = None
    proficiencyLevel: int | None = Field(
        default=None, ge=1, le=4, description="Muc do trinh do cua nguoi hoc (1-4)"
    )


class ChatResponse(BaseModel):
    """Phan hoi tu model gui ve frontend"""

    reply: str
    followUpQuestions: list[str]


class WhisperResponse(BaseModel):
    """Ket qua transcript sau khi goi Whisper"""

    transcript: str
