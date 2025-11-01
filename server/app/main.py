"""Khoi tao ung dung FastAPI va dang ky cac router"""

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .routers import chat, dictionary, writing

# tai day doc cac bien moi truong tu file env de ho tro chay local
load_dotenv()

settings = get_settings()

# khoi tao doi tuong ung dung voi tieu de mo ta du an
app = FastAPI(title="AI Tutor Backend")

# cho phep moi nguon truy cap vi frontend se tu xu ly xac thuc
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/Healthcheck")
async def healthcheck() -> str:
    """Diem check suc khoe don gian de giam sat dich vu"""

    return "connected successfully"


# danh ky cac router chuc nang voi cac prefix rieng
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(dictionary.router, prefix="/api/dictionary", tags=["dictionary"])
app.include_router(writing.router, prefix="/api", tags=["writing"])
