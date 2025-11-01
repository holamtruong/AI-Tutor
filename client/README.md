# AI Tutor – Client (Vue 3 + Vite)

Giao diện học tiếng Anh tương tác xây dựng bằng Vue 3 + TypeScript, chạy bằng Vite. Client kết nối tới backend FastAPI để trò chuyện với gia sư AI, tra từ điển và chấm bài viết. Dữ liệu cá nhân phía client được lưu cục bộ để trải nghiệm nhất quán giữa các lần truy cập.

## Tính năng chính
- Onboarding: thu thập tên, tuổi, cấp độ và giọng nói ưa thích để cá nhân hóa.
- Dashboard: lối tắt tới bài tập, nhật ký viết, từ điển và phòng chat.
- Chat với AI: phản hồi theo thời gian gần thực, gợi ý tiếp tục hội thoại, hỗ trợ ghi âm/đọc to (Web Speech API).
- Từ điển thông minh: chạm vào từ để xem nghĩa, phiên âm, ví dụ ngữ cảnh.
- Bài tập & mini-quiz: luyện từ vựng nhanh, lưu điểm số trong trình duyệt.
- Nhật ký viết: lưu bài nộp, chấm điểm và phản hồi, theo dõi lịch sử.
- Responsive UI: sidebar thu gọn, tối ưu cho thiết bị di động.

## Công nghệ sử dụng
- Framework: Vue 3 + TypeScript
- Dev/build: Vite, Vue Router
- Web API: Speech Synthesis, Speech Recognition, LocalStorage
- Styling: CSS thuần
- Kết nối backend: gọi HTTP tới FastAPI server (mặc định `http://localhost:5050` khi dev)

## Cấu trúc thư mục (client)
```
client/
  index.html
  vite.config.ts              # Vite dev server (host 0.0.0.0, port 3000)
  src/
    App.vue
    main.ts
    components/
      Navbar.vue
      Sidebar.vue
    views/
      AssignmentView.vue
      ChatView.vue
      DashboardView.vue
      DictionaryResultView.vue
      DictionarySearchView.vue
      OnboardingView.vue
      WritingAssignment.vue
      WritingView.vue
    router/
      index.ts                # Định tuyến các trang
    composables/
      useWritingStore.ts      # Store viết bài, trạng thái dùng lại
    config/
      api.ts                  # Cấu hình domain API (local/prod)
    constants/
      index.ts
    data/
      words.json
    styles/
      main.css
    utils/
      localStorage.ts
```

## Cấu hình API domain
Mặc định, file `src/config/api.ts` tự động xác định domain API:
- Local dev: `http://localhost:5050`
- Production: giá trị hằng `PRODUCTION_API_DOMAIN` trong `api.ts`

Hãy chỉnh `PRODUCTION_API_DOMAIN` để trỏ tới URL Render của server, ví dụ:
```ts
// client/src/config/api.ts
const PRODUCTION_API_DOMAIN = "https://ai-tutor-backend.onrender.com"; // cập nhật theo Render
```

Ghi chú: `vercel.json` có biến `VITE_API_DOMAIN`, nhưng mã hiện tại chưa đọc giá trị này. Nếu muốn dùng biến môi trường thay vì hằng số, bạn có thể cập nhật `api.ts` để ưu tiên `import.meta.env.VITE_API_DOMAIN` rồi fallback như sau:
```ts
const fromEnv = (import.meta as any).env?.VITE_API_DOMAIN as string | undefined;
const API_BASE = fromEnv ?? (isLocalhost ? LOCAL_API_DOMAIN : PRODUCTION_API_DOMAIN);
```

## Chạy phát triển (Windows PowerShell)
```powershell
cd client
npm install
npm run dev  # http://localhost:3000
```
Để tính năng đầy đủ, hãy khởi động server FastAPI ở cổng 5050:
```powershell
cd server
uvicorn app.main:app --host 0.0.0.0 --port 5050
```

## Build và preview
```powershell
cd client
npm run build
npm run preview  # xem bản build cục bộ
```

## Triển khai trên Vercel
- `vercel.json` (ở root repo) đã cấu hình:
  - Install: `npm install --prefix client`
  - Build: `npm run build --prefix client`
  - Output: `client/dist`
  - Dev: `npm run dev --prefix client`
- Thiết lập Project Settings trên Vercel:
  - Root Directory: `client`
  - (Tuỳ chọn) Environment Variables: có thể đặt `VITE_API_DOMAIN` nếu bạn đã cập nhật `api.ts` để đọc biến này.
- Nếu cần SPA rewrites:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

## Kết nối tới Server
- Server FastAPI cần bật CORS cho domain Vercel và localhost khi dev. Repo backend hiện bật CORS cho mọi origin để dễ phát triển.
- Một số endpoint tham khảo (server):
  - `GET /api/Healthcheck`
  - `POST /api/chat`
  - `POST /api/chat/whisper`
  - `POST /api/dictionary`
  - `POST /api/evaluate`

## Xử lý sự cố
- CORS: kiểm tra domain và `PRODUCTION_API_DOMAIN`/`VITE_API_DOMAIN`.
- Mixed Content: dùng HTTPS trên production.
- Cổng bận 3000: sửa `vite.config.ts` hoặc tắt tiến trình chiếm cổng.
- Web Speech API: khuyến nghị Chrome/Edge, cấp quyền microphone khi ghi âm.

## Giấy phép và đóng góp
Dự án phục vụ mục đích học tập. Mọi góp ý, issue hoặc PR đều được hoan nghênh.
