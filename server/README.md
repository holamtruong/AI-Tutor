# AI Tutor Backend (FastAPI)

Ứng dụng backend được chuyển sang FastAPI. Cài đặt phụ thuộc và chạy server:

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 5050
```

Các biến môi trường cần thiết:

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
