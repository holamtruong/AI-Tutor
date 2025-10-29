<template>
  <div class="screen">
    <Navbar />

    <main class="container">
      <header class="hero">
        <div class="hero__icon">📚</div>
        <h1>Từ điển thông minh</h1>
        <p>
          Tra cứu từ vựng, thành ngữ và cụm động từ với ví dụ thực tế. Bạn cũng
          có thể thêm ngữ cảnh để nhận kết quả chính xác hơn.
        </p>
      </header>

      <form class="form" @submit.prevent="handleSubmit">
        <label class="form__field">
          <span>Từ khóa</span>
          <input
            v-model="keyword"
            type="text"
            required
            maxlength="30"
            placeholder="Nhập từ hoặc cụm từ..."
            @input="error = ''"
          />
        </label>

        <button class="toggle" type="button" @click="toggleContext">
          <span>{{ showContext ? "Ẩn" : "Thêm" }} ngữ cảnh</span>
          <span aria-hidden="true">✨</span>
        </button>

        <label v-if="showContext" class="form__field">
          <span>Ngữ cảnh</span>
          <textarea
            v-model="context"
            rows="3"
            placeholder="Viết đoạn văn bản chứa từ khóa để nhận kết quả sát nhất"
            @input="error = ''"
          ></textarea>
        </label>

        <p v-if="error" class="error">{{ error }}</p>

        <button class="submit" type="submit" :disabled="isSubmitting">
          <span v-if="isSubmitting">Đang tra cứu...</span>
          <span v-else>Tra cứu</span>
        </button>
      </form>

      <section class="suggestions">
        <header>
          <h2>Gợi ý tra cứu</h2>
          <button type="button" @click="shuffleSuggestions">🔄</button>
        </header>
        <div class="chips">
          <button
            v-for="word in suggestions"
            :key="word"
            class="chip"
            type="button"
            @click="searchWord(word)"
          >
            {{ word }}
          </button>
        </div>
      </section>

      <section v-if="recentSearches.length" class="recent">
        <header @click="toggleRecent">
          <h2>Tìm kiếm gần đây</h2>
          <span aria-hidden="true">{{ showRecent ? "▴" : "▾" }}</span>
        </header>
        <ul v-if="showRecent">
          <li v-for="search in recentSearches" :key="search.keyword">
            <button type="button" @click="searchWord(search.keyword, search.context)">
              <strong>{{ search.keyword }}</strong>
              <small v-if="search.context">{{ search.context }}</small>
            </button>
          </li>
        </ul>
      </section>
    </main>

    <dialog v-if="showGuide" class="dialog" open>
      <div class="dialog__content">
        <h2>Lần đầu sử dụng?</h2>
        <p>
          AI-Tutor giúp bạn hiểu nghĩa của từ thông qua định nghĩa, ví dụ minh
          họa và bản dịch cần thiết. Hãy bắt đầu với một từ bạn đang băn khoăn
          nhé!
        </p>
        <ul>
          <li>Nhập từ khóa tiếng Anh để tra cứu.</li>
          <li>Thêm ngữ cảnh bằng tiếng Việt hoặc tiếng Anh để kết quả chính xác.</li>
          <li>Lưu lại các từ quan trọng bằng cách ghi chú riêng.</li>
        </ul>
        <button type="button" @click="closeGuide">Bắt đầu</button>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import Navbar from "@/components/Navbar.vue";
import {
  RECENT_DICTIONARY_SEARCHES_KEY,
  SAMPLE_DICTIONARY_KEYWORDS,
  VISITED_KEYS,
} from "@/constants";
import { getUserPreferences, hasCompletedOnboarding } from "@/utils/localStorage";

interface RecentSearch {
  keyword: string;
  context?: string;
}

const router = useRouter();
const keyword = ref("");
const context = ref("");
const showContext = ref(false);
const error = ref("");
const isSubmitting = ref(false);
const showGuide = ref(false);
const showRecent = ref(true);
const suggestions = ref<string[]>([]);
const recentSearches = reactive<RecentSearch[]>([]);

const toggleContext = () => {
  showContext.value = !showContext.value;
};

const toggleRecent = () => {
  showRecent.value = !showRecent.value;
};

const closeGuide = () => {
  showGuide.value = false;
};

const persistRecent = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    RECENT_DICTIONARY_SEARCHES_KEY,
    JSON.stringify(recentSearches)
  );
};

const shuffleSuggestions = () => {
  const pool = [...SAMPLE_DICTIONARY_KEYWORDS];
  pool.sort(() => Math.random() - 0.5);
  suggestions.value = pool.slice(0, 5);
};

const searchWord = (word: string, customContext?: string) => {
  const params = new URLSearchParams({ keyword: word });
  if (customContext) {
    params.set("context", customContext);
  }
  router
    .push(`/dictionary/result?${params.toString()}`)
    .finally(() => {
      isSubmitting.value = false;
    });
};

const handleSubmit = () => {
  if (!keyword.value.trim()) {
    return;
  }

  const trimmedKeyword = keyword.value.trim();
  const trimmedContext = context.value.trim();

  if (trimmedKeyword.length > 30) {
    error.value = "Từ khóa không được vượt quá 30 ký tự";
    return;
  }

  if (trimmedContext && trimmedContext.length > trimmedKeyword.length * 5) {
    error.value = "Ngữ cảnh không nên dài quá 5 lần từ khóa";
    return;
  }

  isSubmitting.value = true;

  const params = new URLSearchParams({ keyword: trimmedKeyword });
  if (trimmedContext) {
    params.set("context", trimmedContext);
  }

  const existingIndex = recentSearches.findIndex(
    (item) => item.keyword === trimmedKeyword
  );
  if (existingIndex !== -1) {
    recentSearches.splice(existingIndex, 1);
  }

  recentSearches.unshift({ keyword: trimmedKeyword, context: trimmedContext });
  if (recentSearches.length > 5) {
    recentSearches.splice(5);
  }
  persistRecent();

  router.push(`/dictionary/result?${params.toString()}`);
};

onMounted(() => {
  if (!hasCompletedOnboarding()) {
    router.replace("/");
    return;
  }

  shuffleSuggestions();

  const visited = localStorage.getItem(VISITED_KEYS.dictionary);
  if (!visited) {
    showGuide.value = true;
    localStorage.setItem(VISITED_KEYS.dictionary, "true");
  }

  const stored = localStorage.getItem(RECENT_DICTIONARY_SEARCHES_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as RecentSearch[];
      recentSearches.splice(0, recentSearches.length, ...parsed);
    } catch (error_) {
      console.error("Không thể đọc lịch sử tra cứu", error_);
    }
  }

  const prefs = getUserPreferences();
  if (!prefs.fullName) {
    showGuide.value = true;
  }

  window.setTimeout(() => {
    isSubmitting.value = false;
  }, 200);
});
</script>

<style scoped>
.screen {
  min-height: 100vh;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(14px);
}

.container {
  max-width: 880px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
  display: grid;
  gap: 2rem;
}

.hero {
  text-align: center;
  display: grid;
  gap: 1rem;
  color: #0f172a;
}

.hero__icon {
  font-size: 2.5rem;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2.2rem, 6vw, 3.1rem);
}

.hero p {
  margin: 0 auto;
  max-width: 520px;
  color: rgba(15, 23, 42, 0.7);
  line-height: 1.7;
}

.form {
  background: rgba(255, 255, 255, 0.75);
  border-radius: 24px;
  padding: 2rem;
  display: grid;
  gap: 1.25rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
}

.form__field {
  display: grid;
  gap: 0.5rem;
  text-align: left;
}

.form__field span {
  font-weight: 600;
}

input,
textarea {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  padding: 0.75rem 1rem;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.85);
}

textarea {
  resize: vertical;
}

.toggle {
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1rem;
  background: rgba(14, 165, 233, 0.15);
  color: #0f172a;
  font-weight: 600;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.submit {
  border: none;
  border-radius: 18px;
  padding: 0.9rem 1rem;
  font-weight: 600;
  font-size: 1rem;
  color: white;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  cursor: pointer;
}

.submit:disabled {
  opacity: 0.7;
  cursor: progress;
}

.error {
  margin: 0;
  color: #dc2626;
  font-weight: 600;
}

.suggestions,
.recent {
  background: rgba(255, 255, 255, 0.75);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
}

.suggestions header,
.recent header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.suggestions h2,
.recent h2 {
  margin: 0;
  font-size: 1.1rem;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.chip {
  border: none;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.18);
  color: #312e81;
  font-weight: 600;
  cursor: pointer;
}

.recent ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.recent button {
  border: none;
  background: rgba(241, 245, 249, 0.8);
  border-radius: 16px;
  padding: 0.75rem 1rem;
  text-align: left;
  cursor: pointer;
  display: grid;
  gap: 0.35rem;
}

.recent strong {
  color: #0f172a;
}

.recent small {
  color: rgba(15, 23, 42, 0.7);
}

.dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  background: rgba(15, 23, 42, 0.5);
  display: grid;
  place-items: center;
  border: none;
  padding: 1.5rem;
}

.dialog__content {
  max-width: 420px;
  background: white;
  border-radius: 24px;
  padding: 2rem;
  display: grid;
  gap: 1rem;
}

.dialog__content h2 {
  margin: 0;
}

.dialog__content ul {
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  gap: 0.5rem;
}

.dialog__content button {
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #22d3ee, #6366f1);
  cursor: pointer;
}
</style>
