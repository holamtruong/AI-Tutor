"""Định nghĩa dữ liệu cho chức năng chấm bài viết."""
from pydantic import BaseModel, Field


class WritingEvaluationRequest(BaseModel):
    """Nội dung bài viết do người học gửi lên để đánh giá."""

    title: str | None = Field(default=None)
    content: str = Field(..., min_length=1)


class WritingEvaluationResponse(BaseModel):
    """Điểm số và nhận xét sau khi đánh giá bài viết."""

    score: int
    feedback: str
