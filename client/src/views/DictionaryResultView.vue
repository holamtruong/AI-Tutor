<template>
  <div class="dictionary-screen">
    <Navbar />

    <main class="dictionary-main dictionary-main--result">
      <header class="result-toolbar">
        <button class="toolbar__btn toolbar__btn--ghost" type="button" @click="router.back()">
          Quay lại
        </button>
        <div class="toolbar__spacer"></div>
        <button
          v-if="canSpeak"
          class="toolbar__btn"
          type="button"
          :disabled="isPlaying"
          @click="playAudio"
        >
          <span v-if="isPlaying">Đang phát...</span>
          <span v-else>Nghe phát âm</span>
        </button>
      </header>

      <section class="dictionary-card result-card">
        <header v-if="keyword" class="result-card__header">
          <h1>{{ keyword }}</h1>
          <p v-if="context">Ngữ cảnh: {{ context }}</p>
        </header>

        <div class="result-card__body">
          <div v-if="isLoading" class="status">Đang tra cứu...</div>
          <div v-else-if="error" class="status status--error">{{ error }}</div>
          <article v-else-if="result" class="result-content" v-html="renderedContent"></article>
          <div v-else class="status">Không tìm thấy nội dung phù hợp.</div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Navbar from "@/components/Navbar.vue";
import { API_DOMAIN } from "@/config/api";
import { hasCompletedOnboarding } from "@/utils/localStorage";

interface DictionaryResponse {
  content: string;
  word?: string;
}

const router = useRouter();
const route = useRoute();

const result = ref<DictionaryResponse | null>(null); // Ket qua tra cuu
const isLoading = ref(true); // Trang thai dang tai
const error = ref(""); // Loi khi tra cuu
const isPlaying = ref(false); // Trang thai phat am

const keyword = computed(() => (route.query.keyword as string | undefined) ?? ""); // Tu khoa tra cuu
const context = computed(() => (route.query.context as string | undefined) ?? ""); // Ngu canh tra cuu

// Kiem tra browser co ho tro speechSynthesis khong
const canSpeak = computed(() => 
  typeof window !== "undefined" && "speechSynthesis" in window && keyword.value.trim().length > 0
);

// Xu ly noi dung ket qua tra cuu de hien thi
const renderedContent = computed(() => {
  if (!result.value) {
    return "";
  }

  const segments = result.value.content
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => segment.replace(/\n/g, "<br />"));

  return `<div>${segments.map((text) => `<p>${text}</p>`).join("")}</div>`;
});

// Phat am bang browser speechSynthesis API
const playAudio = () => {
  if (!canSpeak.value) {
    return;
  }

  try {
    // Dung speech synthesis hien co
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(keyword.value);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onstart = () => {
      isPlaying.value = true;
    };
    
    utterance.onend = () => {
      isPlaying.value = false;
    };
    
    utterance.onerror = () => {
      isPlaying.value = false;
    };
    
    window.speechSynthesis.speak(utterance);
  } catch (error_) {
    console.error("Cannot speak word", error_);
    isPlaying.value = false;
  }
};

// POST yeu cau tra cuu tu dien
const fetchResult = async () => {
  if (!keyword.value) {
    router.replace("/dictionary");
    return;
  }

  try {
    isLoading.value = true;
    error.value = "";

    const response = await fetch(`${API_DOMAIN}/api/dictionary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        keyword: keyword.value,
        context: context.value,
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = (await response.json()) as DictionaryResponse;
    result.value = data;
  } catch (error_) {
    console.error("Dictionary lookup failed", error_);
    error.value =
      error_ instanceof Error
        ? error_.message
        : "Không thể tra cứu từ điển, vui lòng thử lại.";
  } finally {
    isLoading.value = false;
  }
};

// Chuyen huong nguoi dung neu chua hoan thanh onboarding va kich hoat lan tra cuu dau tien
onMounted(() => {
  if (!hasCompletedOnboarding()) {
    router.replace("/");
    return;
  }

  fetchResult();
});
</script>

<style scoped>
.dictionary-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
}

.dictionary-main {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
  display: grid;
  gap: 2rem;
}

.dictionary-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 24px;
  padding: 1.75rem;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(8px);
}

.result-toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toolbar__spacer {
  flex: 1;
}

.toolbar__btn {
  border: none;
  border-radius: 14px;
  padding: 0.65rem 1.1rem;
  font-weight: 600;
  cursor: pointer;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.toolbar__btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(79, 70, 229, 0.28);
}

.toolbar__btn:disabled {
  opacity: 0.75;
  cursor: progress;
  box-shadow: none;
}

.toolbar__btn--ghost {
  background: rgba(241, 245, 249, 0.85);
  color: #1e293b;
  box-shadow: none;
}

.result-card {
  display: grid;
  gap: 1.5rem;
  padding: 2rem;
}

.result-card__header {
  display: grid;
  gap: 0.35rem;
}

.result-card__header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
}

.result-card__header p {
  margin: 0;
  color: rgba(15, 23, 42, 0.65);
}

.result-card__body {
  min-height: 260px;
  display: grid;
}

.status {
  align-self: center;
  justify-self: center;
  padding: 0.75rem 1.25rem;
  border-radius: 16px;
  background: rgba(148, 163, 184, 0.18);
  color: rgba(15, 23, 42, 0.75);
  font-weight: 600;
  text-align: center;
}

.status--error {
  background: rgba(248, 113, 113, 0.18);
  color: #b91c1c;
}

.result-content {
  color: #0f172a;
  line-height: 1.75;
}

.result-content :deep(p) {
  margin: 0 0 1rem 0;
}

.result-content :deep(strong) {
  color: #1d4ed8;
}

@media (max-width: 640px) {
  .dictionary-main {
    padding: 2rem 1rem 3rem;
  }

  .result-card {
    padding: 1.75rem;
  }

  .result-card__header h1 {
    font-size: 1.75rem;
  }
}
</style>

