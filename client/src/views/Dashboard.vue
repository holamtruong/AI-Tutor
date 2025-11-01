<template>
  <div class="dashboard-screen">
    <span class="bubble b1"></span>
    <span class="bubble b2"></span>
    <span class="bubble b3"></span>
    <span class="bubble b4"></span>
    <Navbar />

    <main class="dashboard-main">
      <header class="dashboard-header">
        <div class="header__title">
          <p class="eyebrow">Xin chào {{ displayName }} 👋</p>
          <h1>Bắt đầu học hôm nay</h1>
          <p class="subtitle">Chọn một ứng dụng để luyện tập theo lộ trình phù hợp với bạn.</p>
        </div>
      </header>

      <section class="features">
        <article class="feature-card" @click="go('/chat')">
          <span class="feature-icon feature-icon--chat" aria-hidden="true">
            <svg viewBox="0 0 24 24" class="icon">
              <path d="M4 6h16v9H7l-3 3z" stroke-width="1.8" stroke-linejoin="round" />
            </svg>
          </span>
          <div class="feature-body">
            <h2>Trò chuyện</h2>
            <p>Luyện nói và phản xạ tự nhiên với gia sư AI.</p>
          </div>
        </article>

        <article class="feature-card" @click="go('/dictionary')">
          <span class="feature-icon feature-icon--dict" aria-hidden="true">
            <svg viewBox="0 0 24 24" class="icon">
              <path d="M5 4h12a3 3 0 0 1 3 3v13l-4-3-4 3-4-3-4 3V7a3 3 0 0 1 3-3z" stroke-width="1.8"
                stroke-linejoin="round" />
            </svg>
          </span>
          <div class="feature-body">
            <h2>Từ điển</h2>
            <p>Tra cứu nghĩa, ví dụ và phát âm nhanh chóng.</p>
          </div>
        </article>

        <article class="feature-card" @click="go('/assignment')">
          <span class="feature-icon feature-icon--quiz" aria-hidden="true">
            <svg viewBox="0 0 24 24" class="icon">
              <path d="M4 5h16v3H4zM4 11h10v3H4zM4 17h7v3H4z" />
            </svg>
          </span>
          <div class="feature-body">
            <h2>Bài tập</h2>
            <p>Củng cố từ vựng qua bài trắc nghiệm thú vị.</p>
          </div>
        </article>

        <article class="feature-card" @click="go('/writing')">
          <span class="feature-icon feature-icon--write" aria-hidden="true">
            <svg viewBox="0 0 24 24" class="icon">
              <path d="M4 20h4l10-10-4-4L4 16zM14 6l4 4" stroke-width="1.8" stroke-linejoin="round"
                stroke-linecap="round" />
            </svg>
          </span>
          <div class="feature-body">
            <h2>Luyện viết</h2>
            <p>Viết đoạn văn và nhận phản hồi chấm điểm tự động.</p>
          </div>
        </article>
      </section>

      <section class="promo-section">
        <div class="promo-text">
          <h3>AI Tutor – Gia sư tiếng Anh của bạn</h3>
          <p>
            Công cụ hỗ trợ luyện nói, luyện viết, tra cứu từ vựng và làm bài tập tiếng Anh,
            giúp người học nâng cao kỹ năng một cách hiệu quả và chủ động.
          </p>
          <ul>
            <li>Phản hồi nhanh và phù hợp với năng lực từng người học.</li>
            <li>Giao diện trực quan, dễ sử dụng trên nhiều thiết bị.</li>
            <li>Hỗ trợ luyện phát âm chuẩn theo mô hình AI.</li>
            <li>Tự động chấm điểm và đưa ra nhận xét chi tiết cho bài viết.</li>
            <li>Kho từ vựng phong phú, cập nhật thường xuyên.</li>
            <li>Hỗ trợ nhiều phương thức học: tự học, luyện tập và kiểm tra.</li>
            <li>Ưu tiên bảo mật và quyền riêng tư của người dùng.</li>
          </ul>

          <p><strong>
              AI Tutor – Giải pháp hỗ trợ học tiếng Anh hiện đại và đáng tin cậy.
            </strong></p>

          <div class="promo-divider"></div>

          <h4>Ứng dụng miễn phí phục vụ giáo dục</h4>
          <p>
            AI Tutor được phát triển trong khuôn khổ môn học
            <strong>Nhập môn Công nghệ Phần mềm</strong>
            – Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM.
            Hãy đăng ký và trải nghiệm để nâng cao năng lực tiếng Anh của bạn một cách khoa học và hiệu quả.
          </p>
        </div>
      </section>



    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '@/components/Navbar.vue';
import { getUserPreferences } from '@/utils/localStorage';

const router = useRouter();
const prefs = getUserPreferences();
// Present the stored name inside the hero greeting.
const displayName = computed(() => prefs.fullName || 'bạn');

// Utility navigation helper reused across dashboard quick actions.
const go = (path: string) => {
  router.push(path);
};
</script>

<style scoped>
.promo-divider {
  height: 1px;
  background: linear-gradient(90deg, #38bdf8 0%, #f472b6 100%);
  margin: 1.2rem 0;
  border: none;
}

.promo-testimonials {
  display: grid;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.promo-testimonials blockquote {
  background: rgba(165, 180, 252, 0.13);
  border-left: 4px solid #38bdf8;
  margin: 0;
  padding: 0.7rem 1rem;
  font-style: italic;
  color: #0f172a;
  border-radius: 10px;
}

.promo-testimonials span {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.98rem;
  color: #2563eb;
  font-weight: 600;
}

/* Promo section styles */
.promo-section {
  margin-top: 2.5rem;
  padding: 1.5rem 1rem;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 18px;
  box-shadow: 0 6px 24px rgba(56, 189, 248, 0.08);
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.promo-text h3 {
  margin: 0 0 0.5rem;
  font-size: 1.35rem;
  color: #2563eb;
  font-weight: 800;
}

.promo-text p {
  margin: 0.5rem 0;
  color: #0f172a;
  font-size: 1rem;
}

.promo-text ul {
  margin: 0.5rem 0 0.5rem 1.2rem;
  padding: 0;
  color: #0f172a;
  font-size: 1rem;
}

.promo-text li {
  margin-bottom: 0.3rem;
}

.dashboard-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(120deg, rgba(165, 180, 252, 0.7) 0%, rgba(56, 189, 248, 0.7) 40%, rgba(244, 114, 182, 0.7) 80%, rgba(248, 250, 252, 0.7) 100%);
  background-size: 400% 400%;
  animation: dashboard-gradient-move 32s ease-in-out infinite;
  position: relative;
  overflow: hidden;
}

.bubble {
  position: absolute;
  border-radius: 50%;
  opacity: 0.18;
  pointer-events: none;
  background: radial-gradient(circle at 30% 30%, #38bdf8 0%, #a5b4fc 80%, transparent 100%);
  animation: bubble-move 24s linear infinite;
}

.bubble.b1 {
  width: 180px;
  height: 180px;
  top: 8%;
  left: 6%;
  animation-delay: 0s;
}

.bubble.b2 {
  width: 120px;
  height: 120px;
  top: 60%;
  left: 12%;
  animation-delay: 8s;
}

.bubble.b3 {
  width: 140px;
  height: 140px;
  top: 30%;
  right: 10%;
  animation-delay: 16s;
}

.bubble.b4 {
  width: 90px;
  height: 90px;
  bottom: 8%;
  right: 18%;
  animation-delay: 4s;
}

@keyframes bubble-move {
  0% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-40px) scale(1.08);
  }

  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes dashboard-gradient-move {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

@keyframes dashboard-gradient-move {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

.dashboard-main {
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
  display: grid;
  gap: 2rem;
}

.dashboard-header {
  display: grid;
  gap: 0.6rem;
  color: #0f172a;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(15, 23, 42, 0.7);
  font-weight: 600;
}

.dashboard-header h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 2.6rem);
  letter-spacing: -0.01em;
}

.subtitle {
  margin: 0;
  color: rgba(15, 23, 42, 0.7);
  max-width: 620px;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}

.feature-card {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: center;
  padding: 1.25rem 1.25rem;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 20px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 44px rgba(79, 70, 229, 0.18);
}

.feature-icon {
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  color: #ffffff;
}

.feature-icon--chat {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.feature-icon--dict {
  background: linear-gradient(135deg, #06b6d4, #0ea5e9);
}

.feature-icon--quiz {
  background: linear-gradient(135deg, #6366f1, #3b82f6);
}

.feature-icon--write {
  background: linear-gradient(135deg, #f97316, #ef4444);
}

.icon {
  width: 26px;
  height: 26px;
  fill: none;
  stroke: currentColor;
}

.feature-body h2 {
  margin: 0 0 0.15rem;
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
}

.feature-body p {
  margin: 0;
  color: rgba(15, 23, 42, 0.7);
}

@media (max-width: 640px) {
  .dashboard-main {
    padding: 2rem 1rem 3rem;
  }
}
</style>
