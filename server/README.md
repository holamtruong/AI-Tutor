# AI Tutor Backend (FastAPI)

Hệ thống backend FastAPI phục vụ gia sư tiếng Anh tương tác, tích hợp OpenAI (chat, Whisper, chấm bài viết) và Google Gemini (giải nghĩa từ, dịch thuật).

## Model usage
- Gemini Flash 2.0 xử lý tra cứu từ điển và dịch thuật vì prompt đòi hỏi giải thích song ngữ dài, nhiều định dạng trong khi model này có độ trễ thấp và chi phí tiết kiệm.
- GPT-4o-mini đảm nhiệm hội thoại, chấm bài viết theo JSON và Whisper nhận dạng giọng nói nhờ dùng chung OpenAI client ổn định, bảo đảm phản hồi đúng cấu trúc.

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
- `POST /api/dictionary/translate` – dịch tiếng Anh sang tiếng Việt (kết quả ngắn gọn, 1 dòng; phù hợp hiển thị quick-lookup)
- `POST /api/evaluate` – chấm điểm và phản hồi bài viết

## Công nghệ & Kiến trúc

- Công nghệ
   - Python 3.11+ chạy trên ASGI
   - FastAPI (dựa trên Starlette) cho định tuyến, middleware và OpenAPI/Swagger
   - Pydantic v2 cho schema/validate; pydantic-settings để nạp biến môi trường qua `.env`
   - Uvicorn làm ASGI server (hot-reload khi phát triển)
   - Triển khai trên Render qua `render.yaml` (build, start command, health check)

- Cấu trúc mã nguồn (rút gọn)
   - `app/main.py`: khởi tạo FastAPI, mount router và health check
   - `app/core/config.py`: cấu hình using `BaseSettings` (đọc OPENAI_API_KEY, GEMINI_API_KEY, PORT)
   - `app/routers/*`: các endpoint REST (chat, whisper, dictionary, writing/evaluate)
   - `app/services/*`: tích hợp SDK (OpenAI, Gemini) và logic gọi model
   - `app/models/*`: schema request/response trả về JSON chuẩn cho frontend

- Tích hợp mô hình AI
   - Google Gemini 2.0 Flash: tra cứu từ điển và dịch (giải thích song ngữ, chi phí thấp, độ trễ thấp)
   - OpenAI GPT-4o-mini: hội thoại và chấm điểm bài viết (định dạng JSON ổn định)
   - OpenAI Whisper: chuyển giọng nói thành văn bản (file upload -> transcript)

- Thiết kế API
   - Endpoint REST rõ ràng, trả về JSON có cấu trúc; health check `/api/Healthcheck`
   - Phân tách tác vụ theo model để tối ưu chi phí/độ trễ và đảm bảo chất lượng đầu ra
   - Async I/O theo mô hình ASGI, tận dụng `run_in_threadpool` cho các SDK đồng bộ

- Triển khai & vận hành
   - Render: build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Cấu hình biến môi trường trong dashboard: `OPENAI_API_KEY`, `GEMINI_API_KEY`
   - Theo dõi health check và log để giám sát

## Thư viện sử dụng

Trích từ `requirements.txt` (phiên bản có thể thay đổi theo thời gian):

- `fastapi==0.115.0` – khung API, định nghĩa route, DI, OpenAPI
- `uvicorn[standard]==0.30.1` – ASGI server để chạy ứng dụng
- `python-dotenv==1.0.1` – nạp biến môi trường từ file `.env`
- `openai==1.44.0` – SDK OpenAI (chat GPT-4o-mini, Whisper STT)
- `google-generativeai==0.7.2` – SDK Google Gemini (gemini-2.0-flash)
- `httpx==0.27.2` – HTTP client async (trực tiếp/gián tiếp qua SDK)
- `pydantic-settings==2.4.0` – quản lý cấu hình dựa trên Pydantic v2
- `python-multipart==0.0.9` – parse form-data/file upload cho endpoint Whisper

Ghi chú:
- FastAPI dựa trên Starlette và Pydantic v2 (được kéo theo như phụ thuộc gián tiếp).
- Khi làm việc với file âm thanh lớn (Whisper), cân nhắc giới hạn kích thước tải lên và timeout.
