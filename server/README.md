# AI Tutor Backend (FastAPI)

Hệ thống backend FastAPI phục vụ gia sư tiếng Anh tương tác, tích hợp OpenAI (chat, Whisper, chấm bài viết) và Google Gemini (giải nghĩa từ, dịch thuật).

## Tính năng chính
- Các endpoint REST cho trò chuyện, tra cứu từ điển, chấm điểm bài viết và chuyển giọng nói thành văn bản
- Phản hồi JSON có cấu trúc rõ ràng, tối ưu cho frontend
- Cấu hình sẵn để triển khai lên Render thông qua `render.yaml`
- Hỗ trợ cả virtualenv và Conda, phụ thuộc được cố định trong `requirements.txt` và `environment.yml`

## Yêu cầu hệ thống
- Python 3.11 trở lên
- Tùy chọn: Conda (sử dụng `environment.yml`)
- Tài khoản Render để triển khai

## Biến môi trường
Khai báo các biến này trong `.env` khi phát triển và cấu hình trên Render:
- `OPENAI_API_KEY` – bắt buộc cho chat, chấm viết và Whisper
- `GEMINI_API_KEY` – bắt buộc cho tra cứu từ điển và dịch thuật
- `PORT` – tùy chọn khi chạy local (mặc định 5050); Render sẽ tự đặt biến này

Sao chép `.env.example` thành `.env` và điền giá trị thực tế trước khi chạy.

## Thiết lập môi trường
### Cách 1: virtualenv + pip
```bash
python -m venv .venv
.\.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux
pip install --upgrade pip
pip install -r requirements.txt
```

### Cách 2: Conda
```bash
conda env create -f environment.yml
conda activate ai-tutor-backend
```

## Khởi động API
```bash
uvicorn app.main:app --host 0.0.0.0 --port 5050 
```
Nếu không đặt `PORT`, uvicorn sẽ mặc định 8000. Nên đặt `PORT=5050` khi chạy local để đồng bộ với frontend.

## Triển khai lên Render
1. Đẩy mã nguồn lên Git repository.
2. Tạo Blueprint trên Render và trỏ tới repository đó.
3. Render đọc `render.yaml` và tạo dịch vụ web Python với:
   - Lệnh build: `pip install --upgrade pip && pip install -r requirements.txt`
   - Lệnh khởi động: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Đường dẫn health check: `/api/Healthcheck`
4. Thiết lập `OPENAI_API_KEY` và `GEMINI_API_KEY` trong Render dashboard.
5. Deploy và theo dõi log để đảm bảo dịch vụ hoạt động ổn định.

## Tham chiếu nhanh API
- `GET /api/Healthcheck` – kiểm tra trạng thái dịch vụ
- `POST /api/chat` – trò chuyện với gia sư AI
- `POST /api/chat/whisper` – tải file âm thanh và nhận transcript
- `POST /api/dictionary` – giải nghĩa từ vựng có phiên âm IPA
- `POST /api/dictionary/translate` – dịch tiếng Anh sang tiếng Việt
- `POST /api/evaluate` – chấm điểm và phản hồi bài viết
