<template>
  <div class="screen">
    <Navbar />

    <main class="container">
      <header class="header">
        <button class="back" type="button" @click="router.back()">← Quay lại</button>
        <div class="spacer"></div>
        <button
          v-if="audioSrc"
          class="audio"
          type="button"
          :disabled="isPlaying"
          @click="playAudio"
        >
          <span v-if="isPlaying">Đang phát...</span>
          <span v-else>Nghe phát âm</span>
        </button>
      </header>

      <section class="content">
        <div v-if="isLoading" class="status">Đang tra cứu...</div>
        <div v-else-if="error" class="status status--error">{{ error }}</div>
        <article v-else-if="result" class="result" v-html="renderedContent"></article>
        <div v-else class="status">Không tìm thấy kết quả phù hợp.</div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Navbar from "@/components/Navbar.vue";
import { API_DOMAIN } from "@/config";
import { hasCompletedOnboarding } from "@/utils/localStorage";

interface DictionaryResponse {
  content: string;
  audioUrls?: {
    us?: string;
  };
}

const router = useRouter();
const route = useRoute();

const result = ref<DictionaryResponse | null>(null);
const isLoading = ref(true);
const error = ref("");
const isPlaying = ref(false);
const audioElement = ref<HTMLAudioElement | null>(null);

const keyword = computed(() => route.query.keyword as string | undefined);
const context = computed(() => route.query.context as string | undefined);

const audioSrc = computed(() => result.value?.audioUrls?.us ?? "");

watch(audioSrc, (src) => {
  if (!src) {
    audioElement.value = null;
    return;
  }
  const audio = new Audio(src);
  audio.addEventListener("ended", () => {
    isPlaying.value = false;
  });
  audio.addEventListener("pause", () => {
    isPlaying.value = false;
  });
  audioElement.value = audio;
});

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

const playAudio = async () => {
  if (!audioElement.value) {
    return;
  }
  try {
    isPlaying.value = true;
    await audioElement.value.play();
  } catch (error_) {
    console.error("Không thể phát âm thanh", error_);
    isPlaying.value = false;
  }
};

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
    console.error("Tra cứu thất bại", error_);
    error.value =
      error_ instanceof Error
        ? error_.message
        : "Không thể tra cứu từ điển, vui lòng thử lại.";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  if (!hasCompletedOnboarding()) {
    router.replace("/");
    return;
  }
  fetchResult();
});
</script>

<style scoped>
.screen {
  min-height: 100vh;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(14px);
}

.container {
  max-width: 820px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
  display: grid;
  gap: 2rem;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back,
.audio {
  border: none;
  border-radius: 12px;
  padding: 0.6rem 1rem;
  font-weight: 600;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.8);
  color: #0f172a;
}

.audio {
  background: linear-gradient(135deg, #22d3ee, #6366f1);
  color: white;
}

.audio:disabled {
  opacity: 0.75;
  cursor: progress;
}

.spacer {
  flex: 1;
}

.content {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
  min-height: 280px;
}

.status {
  text-align: center;
  color: rgba(15, 23, 42, 0.75);
  font-weight: 600;
}

.status--error {
  color: #dc2626;
}

.result :deep(p) {
  margin: 0 0 1rem;
  line-height: 1.7;
  color: #0f172a;
}

.result :deep(strong) {
  color: #1d4ed8;
}
</style>
