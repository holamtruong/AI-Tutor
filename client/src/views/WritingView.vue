<template>
  <div class="writing-screen">
    <Navbar />

    <main class="writing-main">
      <section class="writing-content">
        <form class="writing-card" @submit.prevent="handleSubmit">
          <header class="writing-card__header">
            <h1 class="writing-title">Bài viết của bạn</h1>
            <p class="writing-subtitle">Luyện tập viết đoạn văn và nhận phản hồi ngay lập tức.</p>
          </header>

          <div class="writing-field">
            <label class="writing-label" for="writing-title">Tiêu đề</label>
            <input
              id="writing-title"
              v-model="title"
              type="text"
              class="writing-input"
              placeholder="Ví dụ: Bữa ăn yêu thích của tôi"
              :disabled="isEvaluating"
            />
          </div>

          <div class="writing-field">
            <div class="writing-field__header">
              <label class="writing-label" for="writing-content">Nội dung</label>
              <span class="writing-counter">{{ charCount }} ký tự</span>
            </div>
            <textarea
              id="writing-content"
              ref="textareaRef"
              v-model="content"
              class="writing-textarea"
              placeholder="Hãy viết đoạn văn của bạn..."
              rows="6"
              @input="handleTextareaInput"
              :disabled="isEvaluating"
            ></textarea>
          </div>

          <div class="writing-actions">
            <button
              type="button"
              class="writing-btn writing-btn--secondary"
              @click="resetForm"
              :disabled="isEvaluating && !activeSubmission"
            >
              Viết bài mới
            </button>
            <button
              type="submit"
              class="writing-btn"
              :disabled="!canSubmit"
            >
              <span v-if="isEvaluating">Đang chấm điểm...</span>
              <span v-else>Gửi đánh giá</span>
            </button>
          </div>

          <transition name="fade">
            <p v-if="errorMessage" class="writing-error">
              {{ errorMessage }}
              <button type="button" class="writing-error__retry" @click="handleSubmit" :disabled="isEvaluating">
                Thử lại
              </button>
            </p>
          </transition>
        </form>

        <transition name="fade">
          <section v-if="activeSubmission" class="writing-result">
            <header class="writing-result__header">
              <div>
                <h2>{{ activeSubmission.title || "Chưa có tiêu đề" }}</h2>
                <p class="writing-result__meta">
                  {{ formatDate(activeSubmission.createdAt) }} • {{ activeSubmission.charCount }} ký tự
                </p>
              </div>
              <span class="writing-score">Điểm: {{ activeSubmission.score }}/10</span>
            </header>

            <article class="writing-result__content">
              <h3>Nội dung</h3>
              <p class="writing-result__paragraph">{{ activeSubmission.content }}</p>
            </article>

            <aside class="writing-feedback">
              <h3>Phản hồi</h3>
              <p>{{ activeSubmission.feedback }}</p>
            </aside>
          </section>
        </transition>
      </section>

      <aside class="writing-history">
        <header class="writing-history__header">
          <h2>Lịch sử bài viết</h2>
          <p>Theo dõi tiến bộ của bạn qua từng lần luyện tập.</p>
        </header>
        <transition-group name="list-fade" tag="ul" class="writing-history__list">
          <li
            v-for="submission in submissions"
            :key="submission.id"
          >
            <button
              type="button"
              class="history-item"
              :class="{ 'history-item--active': submission.id === activeId }"
              @click="selectSubmission(submission.id)"
            >
              <div>
                <p class="history-item__title">{{ submission.title || "Chưa có tiêu đề" }}</p>
                <p class="history-item__date">{{ formatDate(submission.createdAt) }}</p>
              </div>
              <span class="history-item__score">{{ submission.score }}/10</span>
            </button>
          </li>
        </transition-group>

        <p v-if="!submissions.length" class="writing-history__empty">
          Chưa có bài viết nào. Hãy bắt đầu với đoạn văn đầu tiên!
        </p>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import Navbar from "@/components/Navbar.vue";
import { useWritingStore } from "@/composables/useWritingStore";
import { createApiUrl } from "@/config/api";
import { addAssignmentRecord } from "@/utils/localStorage";

const MAX_RETRIES = 2;

const title = ref(""); // Tieu de bai viet
const content = ref(""); // Noi dung bai viet
const textareaRef = ref<HTMLTextAreaElement | null>(null); // Ref den the textarea de tu dong dieu chinh chieu cao
const isEvaluating = ref(false); // Trang thai dang cham diem
const errorMessage = ref(""); // Thong bao loi neu co
const activeId = ref<string | null>(null); // ID bai viet dang duoc chon hien thi chi tiet

const { submissions, addSubmission, reload } = useWritingStore(); // Store quan ly cac bai viet

const charCount = computed(() => content.value.trim().length); // Dem so ky tu trong noi dung bai viet
const canSubmit = computed(() => charCount.value > 0 && !isEvaluating.value); // Kiem tra neu co noi dung de gui va khong dang cham diem

// Tim bai viet dang duoc chon hien thi chi tiet
const activeSubmission = computed(() =>
  submissions.value.find((submission) => submission.id === activeId.value) ?? null
);

// Tu dong dieu chinh chieu cao cua textarea dua tren noi dung
const autoResize = () => {
  const textarea = textareaRef.value;
  if (!textarea) {
    return;
  }
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
};

// Xu ly su kien nhap noi dung trong textarea
const handleTextareaInput = () => {
  autoResize();
};

// Dinh dang ngay thang de hien thi
const formatDate = (timestamp: number) => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return formatter.format(new Date(timestamp));
};

// Dat lai form ve trang thai ban dau
const resetForm = () => {
  title.value = "";
  content.value = "";
  errorMessage.value = "";
  nextTick(autoResize);
};

// Chon mot bai viet trong lich su de hien thi chi tiet
const selectSubmission = (id: string) => {
  activeId.value = id;
};

// Ham gui noi dung bai viet den API de cham diem va nhan phan hoi
const evaluateWriting = async () => {
  const payload = {
    title: title.value.trim(),
    content: content.value.trim(),
  };

  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(createApiUrl("/api/evaluate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = (await response.json()) as { score: number; feedback: string };
      if (
        typeof data?.score === "number" &&
        data.score >= 0 &&
        data.score <= 10 &&
        typeof data.feedback === "string"
      ) {
        return data;
      }
      throw new Error("Invalid response format");
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Unknown error");
};

// Xu ly khi nguoi dung gui bai viet de cham diem
const handleSubmit = async () => {
  if (!canSubmit.value) {
    return;
  }

  isEvaluating.value = true;
  errorMessage.value = "";

  try {
    const result = await evaluateWriting();
    const record = addSubmission({
      title: title.value.trim(),
      content: content.value.trim(),
      charCount: charCount.value,
      score: result.score,
      feedback: result.feedback,
    });

    if (record) {
      activeId.value = record.id;
      addAssignmentRecord({
        type: "writing",
        topic: record.title || "writing",
        score: record.score,
      });
    }

    resetForm();
  } catch (error) {
    console.error("Failed to evaluate writing", error);
    errorMessage.value =
      "Không thể chấm điểm lúc này. Vui lòng kiểm tra kết nối và thử lại.";
  } finally {
    isEvaluating.value = false;
    reload();
  }
};

// Theo doi thay doi noi dung de tu dong dieu chinh chieu cao textarea
watch(content, () => nextTick(autoResize));

watch(
  () => submissions.value.length,
  (length) => {
    if (length && !activeId.value) {
      activeId.value = submissions.value[0].id;
    }
  },
  { immediate: true }
);

// Khi component duoc tai, kiem tra neu nguoi dung da hoan thanh onboarding thi dieu huong den dashboard
onMounted(() => {
  nextTick(autoResize);
  if (submissions.value.length) {
    activeId.value = submissions.value[0].id;
  }
});
</script>

<style scoped>
.writing-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
}

.writing-main {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
  display: grid;
  gap: 2rem;
  grid-template-columns: 1fr;
}

.writing-content {
  display: grid;
  gap: 1.5rem;
}

.writing-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 24px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(8px);
  padding: 2rem;
  display: grid;
  gap: 1.5rem;
}

.writing-card__header {
  display: grid;
  gap: 0.35rem;
}

.writing-title {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
}

.writing-subtitle {
  margin: 0;
  color: rgba(15, 23, 42, 0.7);
}

.writing-field {
  display: grid;
  gap: 0.6rem;
}

.writing-field__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.writing-label {
  font-weight: 600;
  color: #1e293b;
}

.writing-counter {
  font-size: 0.85rem;
  color: rgba(30, 41, 59, 0.7);
}

.writing-input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 16px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  background: rgba(241, 245, 249, 0.9);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.writing-input:focus {
  outline: none;
  border-color: rgba(79, 70, 229, 0.6);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.16);
  background: #ffffff;
}

.writing-textarea {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 18px;
  padding: 0.85rem 1rem;
  font-size: 1rem;
  line-height: 1.6;
  background: rgba(241, 245, 249, 0.9);
  resize: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.writing-textarea:focus {
  outline: none;
  border-color: rgba(79, 70, 229, 0.6);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.16);
  background: #ffffff;
}

.writing-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.writing-btn {
  border: none;
  border-radius: 16px;
  padding: 0.85rem 1.75rem;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  box-shadow: 0 12px 24px rgba(79, 70, 229, 0.28);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.writing-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(79, 70, 229, 0.32);
}

.writing-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.writing-btn--secondary {
  background: rgba(241, 245, 249, 0.85);
  color: #1e293b;
  box-shadow: none;
}

.writing-error {
  margin: 0;
  color: #b91c1c;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.writing-error__retry {
  border: none;
  background: none;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.writing-result {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 24px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  padding: 2rem;
  display: grid;
  gap: 1.5rem;
}

.writing-result__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.writing-result__header h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
}

.writing-result__meta {
  margin: 0.35rem 0 0 0;
  color: rgba(15, 23, 42, 0.65);
}

.writing-score {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.18);
  color: #166534;
  font-weight: 700;
}

.writing-result__content {
  display: grid;
  gap: 0.6rem;
}

.writing-result__content h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

.writing-result__paragraph {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.7;
  color: #0f172a;
}

.writing-feedback {
  background: rgba(59, 130, 246, 0.12);
  border-radius: 18px;
  padding: 1.25rem 1.5rem;
  color: #1d4ed8;
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.16);
  display: grid;
  gap: 0.5rem;
}

.writing-feedback h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.writing-feedback p {
  margin: 0;
  line-height: 1.6;
}

.writing-history {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 24px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  padding: 1.75rem;
  display: grid;
  gap: 1.25rem;
}

.writing-history__header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}

.writing-history__header p {
  margin: 0.35rem 0 0 0;
  color: rgba(15, 23, 42, 0.7);
  font-size: 0.9rem;
}

.writing-history__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  align-items: stretch;
}

.writing-history__list li {
  margin: 0;
}

.writing-history__empty {
  margin: 0;
  font-size: 0.95rem;
  color: rgba(15, 23, 42, 0.65);
}

.history-item {
  width: 100%;
  border: none;
  border-radius: 16px;
  padding: 0.9rem 1rem;
  background: rgba(241, 245, 249, 0.85);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.75rem;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.history-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(15, 23, 42, 0.12);
}

.history-item--active {
  background: rgba(99, 102, 241, 0.18);
  box-shadow: 0 12px 24px rgba(79, 70, 229, 0.22);
}

.history-item__title {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #0f172a;
  text-align: left;
}

.history-item__date {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(15, 23, 42, 0.6);
  text-align: left;
}

.history-item__score {
  font-weight: 700;
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.15);
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  margin-top: 0.1rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.list-fade-enter-active,
.list-fade-leave-active {
  transition: all 0.25s ease;
}

.list-fade-enter-from,
.list-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (min-width: 1024px) {
  .writing-main {
    grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  }
}

@media (max-width: 640px) {
  .writing-main {
    padding: 2rem 1rem 3rem;
  }

  .writing-card,
  .writing-result,
  .writing-history {
    padding: 1.5rem;
  }

  .writing-result__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .writing-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>








