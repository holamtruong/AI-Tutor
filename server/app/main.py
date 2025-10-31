"""Điểm khởi động FastAPI và khai báo router."""
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .routers import chat, dictionary, writing

# Nạp biến môi trường từ file .env nếu có
load_dotenv()

settings = get_settings()

app = FastAPI(title="AI Tutor Backend")

# Cấu hình CORS cho ứng dụng
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)


@app.get("/api/Healthcheck")
async def healthcheck() -> str:
    """Kiểm tra trạng thái ứng dụng và trả về thông điệp thành công."""

    return "connected successfully"


app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(dictionary.router, prefix="/api/dictionary", tags=["dictionary"])
app.include_router(writing.router, prefix="/api", tags=["writing"])
