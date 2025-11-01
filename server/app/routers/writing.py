"""Router cham diem va phan hoi bai viet"""

from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException

from ..models.writing import WritingEvaluationRequest, WritingEvaluationResponse
from ..services.openai_service import create_chat_completion

router = APIRouter()


@router.post("/evaluate", response_model=WritingEvaluationResponse)
async def evaluate(payload: WritingEvaluationRequest) -> WritingEvaluationResponse:
    """Cham diem bai viet va tao feedback bang OpenAI"""

    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Content is required for evaluation.")

    title = payload.title.strip() if payload.title else "Untitled"

    system_prompt = {
        "role": "system",
        "content": (
            "You are an English writing evaluator. Given a learner's writing, assign a holistic score from 0 to 10 (integer) and provide clear, constructive feedback that covers grammar, vocabulary, cohesion, and suggestions for improvement. Always respond strictly in JSON with keys \"score\" (integer) and \"feedback\" (string)."
        ),
    }
    user_prompt = {"role": "user", "content": f"Title: {title}\nContent:\n{content}"}

    # goi model chat de nhan lai ket qua JSON
    completion = await create_chat_completion([system_prompt, user_prompt])
    content_response = completion.get("content", "")
    if not content_response:
        raise HTTPException(status_code=500, detail="Model returned invalid evaluation.")

    try:
        parsed = json.loads(content_response)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail="Model returned invalid evaluation.") from exc

    score = parsed.get("score")
    if isinstance(score, str) and score.isdigit():
        score = int(score)
    feedback = parsed.get("feedback")
    if not isinstance(score, int) or not isinstance(feedback, str) or not feedback.strip():
        raise HTTPException(status_code=500, detail="Model returned invalid evaluation.")

    return WritingEvaluationResponse(score=score, feedback=feedback.strip())
