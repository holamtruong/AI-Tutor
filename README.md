# AI Tutor – Client (Frontend) + FastAPI Server (Backend)

Ứng dụng học tiếng Anh tương tác gồm client viết bằng Vue 3 và backend viết bằng Python + FastAPI. Ứng dụng giúp học viên định hình mục tiêu, ôn luyện hội thoại với gia sư AI, tra cứu từ vựng, làm bài tập nhanh và theo dõi tiến bộ viết. Dữ liệu cá nhân phía client được lưu cục bộ để trải nghiệm nhất quán trong mỗi lần truy cập.

## Tính năng chính
- **Luồng onboarding** thu thập tên, tuổi, cấp độ và giọng nói ưa thích để cá nhân hóa nội dung.
- **Bảng điều khiển** hiển thị lối tắt tới bài tập, nhật ký viết, từ điển và phòng chat.
- **Phòng chat với AI** hỗ trợ phản hồi theo thời gian thực, đọc/ghi âm, gợi ý từ vựng và quản lý lịch sử hội thoại.
- **Từ điển thông minh** cho phép chạm vào từ để xem nghĩa, phát âm và ví dụ trong ngữ cảnh.
- **Bài tập & trò chơi** tạo mini quiz từ vựng, lưu điểm số vào trình duyệt.
- **Nhật ký viết** lưu bài nộp, chấm điểm, phản hồi và lịch sử theo từng người dùng.
- **Giao diện responsive** với sidebar thu gọn và điều hướng thân thiện trên thiết bị di động.

## Công nghệ sử dụng
- Frontend: [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), [Vue Router](https://router.vuejs.org/)
- Web API: Speech Synthesis, Speech Recognition, LocalStorage
- Styling: CSS thuần, tối ưu nhẹ
- Backend: [Python 3.11+](https://www.python.org/) + [FastAPI](https://fastapi.tiangolo.com/) (ASGI) chạy với Uvicorn
- Tích hợp mô hình: OpenAI (GPT-4o-mini, Whisper), Google Gemini (gemini-2.0-flash)
- Hạ tầng: Client trên Vercel, Server trên Render

## Cấu trúc thư mục chính
```
client/
  src/
    components/     # Navbar, Sidebar, thành phần chia sẻ
    views/          # Màn hình tính năng (chat, dashboard, onboarding,...)
    composables/    # Store trạng thái tái sử dụng (ví dụ lịch sử viết)
    utils/          # Hàm trợ giúp cho localStorage và cấu hình chung
    constants/      # Dữ liệu tĩnh, enum, cấu hình mức độ
    styles/         # Style toàn cục
  vite.config.ts    # dev server Vite (mặc định cổng 3000)
server/
  app/
    main.py         # Khởi tạo FastAPI, health check, đăng ký router
    core/config.py  # Đọc biến môi trường (OPENAI_API_KEY, GEMINI_API_KEY, PORT)
    routers/        # chat, dictionary, writing
    services/       # openai_service, gemini_service
    models/         # schema request/response
  requirements.txt  # phụ thuộc Python
  render.yaml       # blueprint triển khai trên Render (Python)
vercel.json         # cấu hình build/deploy client trên Vercel
```

## Thiết lập môi trường
- Biến môi trường Backend (đặt trong `server/.env` khi phát triển, cấu hình trong Render khi triển khai):
  - `OPENAI_API_KEY` – bắt buộc cho chat/chấm viết/Whisper
  - `GEMINI_API_KEY` – bắt buộc cho tra cứu từ điển/dịch thuật
  - `PORT` – tùy chọn khi chạy local (mặc định 5050). Render tự cấp biến `PORT` khi chạy production

- Cấu hình domain API cho Frontend: client hiện dùng auto-detect trong `client/src/config/api.ts`:
  - Local: mặc định gọi tới `http://localhost:5050`
  - Production: cập nhật hằng số `PRODUCTION_API_DOMAIN` trỏ tới URL Render (ví dụ: `https://ai-tutor-backend.onrender.com`)

## Bắt đầu phát triển
1. Cài đặt phụ thuộc
  ```bash
  cd client
  npm install
  cd ../server
  python -m venv .venv
  .\.venv\Scripts\activate   # Windows
  pip install --upgrade pip
  pip install -r requirements.txt
  ```
2. Chạy song song client & server
  ```bash
  # tab 1
  cd client
  npm run dev   # Vite lắng trên http://localhost:3000

  # tab 2
  cd server
  uvicorn app.main:app --host 0.0.0.0 --port 5050
  ```
  Client: http://localhost:3000 · Server FastAPI: http://localhost:5050 (hoặc PORT trong `.env`).
3. Build/Preview client
  ```bash
  cd client && npm run build && npm run preview
  ```

## Script & lệnh thường dùng
- Client
  - `npm run dev` – khởi động Vite ở chế độ development (mặc định cổng 3000)
  - `npm run build` – chạy `vue-tsc` và build Vite
  - `npm run preview` – xem thử bản build
- Server (FastAPI)
  - Chạy dev: `uvicorn app.main:app --host 0.0.0.0 --port 5050`
  - Yêu cầu: Python 3.11+, `pip install -r requirements.txt`

## Triển khai
### Client trên Vercel
- `vercel.json` định nghĩa build cho thư mục `client`.
- Cấu hình trong Vercel:
  - Root Directory: `client`
  - Install: `npm install --prefix client`
  - Build: `npm run build --prefix client`
  - Output: `client/dist`
- Cấu hình API domain cho production: chỉnh `PRODUCTION_API_DOMAIN` trong `client/src/config/api.ts` trỏ tới URL Render.

### Server trên Render (Python + FastAPI)
- Sử dụng blueprint `server/render.yaml` (env: python).
- Render sẽ chạy:
  - Build: `pip install --upgrade pip && pip install -r requirements.txt`
  - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check: `/api/Healthcheck`
- Biến môi trường: thêm `OPENAI_API_KEY`, `GEMINI_API_KEY` trong Render Dashboard.

## Ghi chú
- Dữ liệu học viên được lưu trong `localStorage`; xóa storage sẽ đưa trạng thái về ban đầu.
- Tính năng giọng nói phụ thuộc vào Web Speech API (khuyến nghị Chrome hoặc Edge).
- Khi triển khai, đảm bảo server cho phép CORS từ domain Vercel. Backend hiện bật CORS cho mọi origin (có thể siết chặt trong sản xuất).

## Đóng góp
Dự án phục vụ mục đích học tập. Rất mong nhận được phản hồi, đề xuất hoặc pull request từ bạn.
