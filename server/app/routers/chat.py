"""Router phuc vu tinh nang tro chuyen va nhan dang giong noi"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile

from ..models.chat import ChatMessage, ChatRequest, ChatResponse, WhisperResponse
from ..services.openai_service import create_chat_completion, parse_chat_json, transcribe_audio

router = APIRouter()

# Cau hinh do phuc tap cau tra loi theo trinh do nguoi hoc
DEFAULT_LEVEL = 3 # Mac dinh la B1

# Huong dan dieu chinh cau tra loi theo 4 cap do
LEVEL_GUIDANCE: dict[int, str] = {
    1: (
        "Use A1-A2 vocabulary and very short sentences (1-2). Avoid idioms and complex grammar. "
        "Focus on clarity and confidence building. Offer only 1-2 gentle corrections and 1 simple practice tip."
    ),
    2: (
        "Keep language at A2-B1 level with everyday topics. Write concise 2-3 sentence replies, "
        "highlight key mistakes with short examples, and give concrete, easy follow-up questions."
    ),
    3: (
        "Use natural B1-B2 conversation but stretch the learner with ambitious grammar (subordinate clauses, "
        "conditionals) and higher-register vocabulary. Provide moderately longer replies (3-5 concise sentences), "
        "encourage elaboration, give concise corrections with stronger phrasing, and add challenging follow-up "
        "questions that require detail."
    ),
    4: (
        "Challenge the learner with C1-level vocabulary and nuanced phrasing. Inject sophisticated, topic-relevant "
        "lexis (collocations, phrasal verbs, idioms) and varied advanced grammar (inversion, clefts, reduced clauses) "
        "when natural, including academic/technical terms where appropriate. Provide longer, well-structured replies "
        "(4-6 sentences) to model rich discourse. Offer precise corrections, suggest richer alternatives, and ask "
        "probing follow-up questions that demand reasoning, examples, or comparisons."
    ),
}

BASE_INSTRUCTIONS = (
    # Ghi chu: Prompt goc bat model tra ve JSON va cach danh gia loi
    "You are an expert English tutor guiding learners to improve their speaking. Always reply only in English.\n"
    "For every learner message: respond naturally in an encouraging tone, identify any grammar, vocabulary, or pronunciation mistakes,\n"
    "provide concise corrections with improved phrasing, and give brief explanations that build confidence. "
    "Respond STRICTLY in JSON with keys \"reply\" (string) and \"followUpQuestions\" (string array of up to 3 concise questions that keep the conversation going at the learner's level). "
    "In your \"reply\", include a clearly labeled \"Corrections:\" section only when there are actual mistakes to mention; omit the section entirely if there are none."
)



def build_system_prompt(level: int | None) -> dict[str, str]:
    """Tao prompt phu hop voi trinh do cua nguoi hoc"""

    normalized = level if isinstance(level, int) and 1 <= level <= 4 else DEFAULT_LEVEL
    # Giai thich: LEVEL_GUIDANCE dieu chinh do phuc tap cau tra loi theo 4 cap do
    guidance = LEVEL_GUIDANCE.get(normalized, LEVEL_GUIDANCE[DEFAULT_LEVEL])
    content = (
        f"{BASE_INSTRUCTIONS}\n"
        f"Learner proficiency level: {normalized}.\n"
        f"Adjust complexity accordingly: {guidance}"
    )
    #print(f"System prompt for level {normalized}:\n{content}\n")
    return {"role": "system", "content": content}


def sanitize_history(history: list[ChatMessage] | None) -> list[dict[str, Any]]:
    """Bien doi lich su thanh dinh dang thong diep cho OpenAI"""

    if not history:
        return []
    sanitized: list[dict[str, Any]] = []
    for item in history:
        # bo qua cac vai tro khong hop le de tranh gay loi model
        if item.role not in {"user", "assistant"}:
            continue
        content = item.content.strip()
        if not content:
            continue
        sanitized.append({"role": item.role, "content": content})
    return sanitized


@router.post("/", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    """Xu ly yeu cau tro chuyen va tra ve cau tra loi"""

    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is required.")

    # chuan hoa lai lich su de gui len model
    history_messages = sanitize_history(payload.history)
    system_prompt = build_system_prompt(payload.proficiencyLevel)
    messages = [system_prompt, *history_messages, {"role": "user", "content": message}]

    # goi model chat va doc phan hoi
    completion = await create_chat_completion(messages)
    content = completion.get("content", "")
    reply, follow_up = parse_chat_json(content)
    return ChatResponse(reply=reply or content, followUpQuestions=follow_up)


@router.post("/whisper", response_model=WhisperResponse)
async def whisper(file: UploadFile = File(...)) -> WhisperResponse:
    """Chuyen tieng noi thanh text bang Whisper"""

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Invalid audio file.")

    # thuc hien goi Whisper asynchronously thong qua threadpool
    transcript = await transcribe_audio(file.filename or "audio.webm", file_bytes)
    if not transcript:
        raise HTTPException(status_code=500, detail="Unable to transcribe audio.")

    return WhisperResponse(transcript=transcript)
