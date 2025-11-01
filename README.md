# AI Tutor – Client

Giao diện học tiếng Anh tương tác xây dựng bằng Vue 3. Ứng dụng giúp học viên định hình mục tiêu, ôn luyện hội thoại với gia sư AI, tra cứu từ vựng, làm bài tập nhanh và theo dõi tiến bộ viết. Tất cả dữ liệu cá nhân được lưu cục bộ để trải nghiệm nhất quán trong mỗi lần truy cập.

## Tính năng chính
- **Luồng onboarding** thu thập tên, tuổi, cấp độ và giọng nói ưa thích để cá nhân hóa nội dung.
- **Bảng điều khiển** hiển thị lối tắt tới bài tập, nhật ký viết, từ điển và phòng chat.
- **Phòng chat với AI** hỗ trợ phản hồi theo thời gian thực, đọc/ghi âm, gợi ý từ vựng và quản lý lịch sử hội thoại.
- **Từ điển thông minh** cho phép chạm vào từ để xem nghĩa, phát âm và ví dụ trong ngữ cảnh.
- **Bài tập & trò chơi** tạo mini quiz từ vựng, lưu điểm số vào trình duyệt.
- **Nhật ký viết** lưu bài nộp, chấm điểm, phản hồi và lịch sử theo từng người dùng.
- **Giao diện responsive** với sidebar thu gọn và điều hướng thân thiện trên thiết bị di động.

## Công nghệ sử dụng
- [Vue 3](https://vuejs.org/) kết hợp [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) cho môi trường phát triển và build
- [Vue Router](https://router.vuejs.org/) điều hướng phía client
- Web API: Speech Synthesis, Speech Recognition, LocalStorage
- CSS thuần được tinh chỉnh riêng thay vì dùng UI framework lớn

## Cấu trúc thư mục chính
```
client/
  src/
    components/     # Navbar, sidebar, thành phần chia sẻ
    views/          # Các màn hình tính năng (chat, dashboard, onboarding,...)
    composables/    # Store trạng thái tái sử dụng (ví dụ lịch sử viết)
    utils/          # Hàm trợ giúp cho localStorage và cấu hình chung
    constants/      # Dữ liệu tĩnh, enum, cấu hình mức độ
    styles/         # Style toàn cục
server/
  src/
    ...             # API Express phục vụ cho gia sư AI
```

## Thiết lập môi trường
Ứng dụng mong đợi biến `VITE_API_DOMAIN`. Nếu không cung cấp, giá trị mặc định là `http://localhost:5283`.

```
# client/.env.local
VITE_API_DOMAIN=https://ten-may-chu-api-cua-ban
```

Server sử dụng `.env` (tham khảo `server/.env.example`) để thiết lập `PORT`, `OPENAI_API_KEY`, `GEMINI_API_KEY`.

## Bắt đầu phát triển
1. **Cài đặt phụ thuộc**
   ```bash
   cd client
   npm install
   cd ../server
   yarn install
   ```
2. **Chạy song song client & server**
   ```bash
   # tab 1
   cd client
   npm run dev

   # tab 2
   cd server
   yarn dev
   ```
   Client lắng trên `http://localhost:5173`, server Express mặc định `http://localhost:5050` (hoặc `PORT` trong `.env`).
3. **Build sản phẩm**
   ```bash
   cd client && npm run build
   cd ../server && yarn build
   ```

## Script npm/yarn
- `npm run dev` – khởi động Vite ở chế độ development (client).
- `npm run build` – chạy `vue-tsc` và build Vite (client).
- `npm run preview` – xem thử bản build (client).
- `yarn dev` – sử dụng nodemon để chạy server TypeScript.
- `yarn build` – biên dịch TypeScript sang `dist/`.
- `yarn start` – chạy server từ mã đã build.

## Triển khai
### Client trên Vercel
- File `vercel.json` định nghĩa build cho thư mục `client`.
- Tạo secret `vite_api_domain` trên Vercel trỏ tới URL server Render.
- Quy trình build:
  - Cài đặt: `npm install --prefix client`
  - Build: `npm run build --prefix client`
  - Output: `client/dist`

### Server trên Render
- Blueprint `render.yaml` mô tả dịch vụ Node.js cho thư mục `server`.
- Render tự tạo web service với lệnh:
  - Build: `yarn install --frozen-lockfile && yarn build`
  - Start: `yarn start`
- Cấu hình biến môi trường: `OPENAI_API_KEY`, `GEMINI_API_KEY`, (tùy chọn) `NODE_ENV=production`. Port do Render cung cấp qua biến `PORT`.

## Ghi chú
- Dữ liệu học viên được lưu trong `localStorage`; xóa storage sẽ đưa trạng thái về ban đầu.
- Tính năng giọng nói phụ thuộc vào Web Speech API (khuyến nghị Chrome hoặc Edge).
- Khi triển khai, đảm bảo server cho phép CORS từ domain Vercel và cập nhật `VITE_API_DOMAIN` tương ứng.

## Đóng góp
Dự án phục vụ mục đích học tập. Rất mong nhận được phản hồi, đề xuất hoặc pull request từ bạn.
