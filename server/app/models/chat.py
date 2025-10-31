"""Định nghĩa dữ liệu trao đổi cho chức năng trò chuyện."""
from typing import Literal
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Mô tả một lượt tin nhắn trong lịch sử hội thoại."""

    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    """Yêu cầu người dùng gửi lên khi muốn trò chuyện với chatbot."""

    message: str = Field(..., min_length=1)
    history: list[ChatMessage] | None = None


class ChatResponse(BaseModel):
    """Cấu trúc phản hồi cho phần trò chuyện."""

    reply: str
    followUpQuestions: list[str]


class WhisperResponse(BaseModel):
    """Phản hồi cho tính năng nhận dạng giọng nói."""

    transcript: str
