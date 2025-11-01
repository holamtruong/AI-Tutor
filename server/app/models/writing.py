"""Mo ta model danh gia bai viet"""

from pydantic import BaseModel, Field


class WritingEvaluationRequest(BaseModel):
    """Noi dung bai viet do nguoi hoc gui len"""

    title: str | None = Field(default=None)
    content: str = Field(..., min_length=1)


class WritingEvaluationResponse(BaseModel):
    """Ket qua diem va nhan xet"""

    score: int
    feedback: str
