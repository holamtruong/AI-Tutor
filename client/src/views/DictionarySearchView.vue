<template>
  <div class="dictionary-screen">
    <Navbar />

    <main class="dictionary-main">
      <header class="hero dictionary-card">
        <div class="hero__icon">AI</div>
        <div class="hero__content">
          <h1>Từ điển thông minh</h1>
          <p>Tra cứu từ vựng, thành ngữ và câu mẫu với giải thích theo ngữ cảnh.</p>
        </div>
      </header>

      <div class="dictionary-grid">
        <form class="lookup-card dictionary-card" @submit.prevent="handleSubmit">
          <header class="lookup-card__header">
            <h2>Tra cứu nhanh</h2>
            <p>Nhập từ khóa và thêm ngữ cảnh để nhận giải thích rõ ràng hơn.</p>
          </header>

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
            <span>{{ showContext ? "Ẩn ngữ cảnh" : "Thêm ngữ cảnh" }}</span>
            <span aria-hidden="true">{{ showContext ? "-" : "+" }}</span>
          </button>

          <label v-if="showContext" class="form__field">
            <span>Ngữ cảnh</span>
            <textarea
              v-model="context"
              rows="3"
              placeholder="Mô tả câu, đoạn văn hoặc tình huống bạn đang tìm hiểu"
              @input="error = ''"
            ></textarea>
          </label>

          <p v-if="error" class="error">{{ error }}</p>

          <button class="submit" type="submit" :disabled="isSubmitting">
            <span v-if="isSubmitting">Đang tra cứu...</span>
            <span v-else>Tra cứu</span>
          </button>
        </form>

        <aside class="dictionary-side">
          <section class="suggestions dictionary-card">
            <header>
              <h2>Gợi ý tra cứu</h2>
              <button type="button" @click="shuffleSuggestions">Làm mới</button>
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

          <section v-if="recentSearches.length" class="recent dictionary-card">
            <header @click="toggleRecent">
              <h2>Tìm kiếm gần đây</h2>
              <span aria-hidden="true">{{ showRecent ? "-" : "+" }}</span>
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
        </aside>
      </div>
    </main>

    <dialog v-if="showGuide" class="dictionary-dialog" open>
      <div class="dictionary-dialog__content">
        <h2>Lần đầu sử dụng?</h2>
        <p>AI Tutor giúp bạn hiểu nghĩa của từ trong ngữ cảnh thực tế.</p>
        <ul>
          <li>Nhập từ khóa bằng tiếng Anh để tra cứu.</li>
          <li>Thêm ngữ cảnh bằng tiếng Việt hoặc Anh để có kết quả chính xác hơn.</li>
          <li>Lưu lại những từ quan trọng trong ghi chú riêng của bạn.</li>
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

// Reveal or hide the optional context textarea.
const toggleContext = () => {
  showContext.value = !showContext.value;
};

// Collapse the recent-search list to keep the UI compact.
const toggleRecent = () => {
  showRecent.value = !showRecent.value;
};

// Dismiss the onboarding tip for the dictionary feature.
const closeGuide = () => {
  showGuide.value = false;
};

// Persist the most recent search queries for quick reuse.
const persistRecent = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    RECENT_DICTIONARY_SEARCHES_KEY,
    JSON.stringify(recentSearches)
  );
};

// Pick a handful of sample keywords whenever the page loads.
const shuffleSuggestions = () => {
  const pool = [...SAMPLE_DICTIONARY_KEYWORDS];
  pool.sort(() => Math.random() - 0.5);
  suggestions.value = pool.slice(0, 6);
};

// Navigate directly to the dictionary result view with query parameters.
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

// Validate the search form, update history, and route to the results screen.
const handleSubmit = () => {
  if (!keyword.value.trim()) {
    return;
  }

  const trimmedKeyword = keyword.value.trim();
  const trimmedContext = context.value.trim();

  if (trimmedKeyword.length > 30) {
    error.value = "Từ khóa không được vượt quá 30 ký tự.";
    return;
  }

  if (trimmedContext && trimmedContext.length > trimmedKeyword.length * 5) {
    error.value = "Ngữ cảnh không nên dài hơn 5 lần từ khóa.";
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

// Load persisted preferences, show the guide if needed, and seed the suggestions.
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
      console.error("Cannot load dictionary history", error_);
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
.dictionary-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
}

.dictionary-main {
  width: 100%;
  max-width: 1100px;
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

.hero {
  display: flex;
  align-items: center;
  gap: 1.75rem;
  padding: 1.5rem 1.75rem;
  color: #0f172a;
}

.hero__icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  font-size: 1.4rem;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  box-shadow: 0 16px 30px rgba(79, 70, 229, 0.28);
}

.hero__content {
  display: grid;
  gap: 0.5rem;
}

.hero__content h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
}

.hero__content p {
  margin: 0;
  color: rgba(15, 23, 42, 0.75);
  line-height: 1.6;
  max-width: 520px;
}

.dictionary-grid {
  display: grid;
  gap: 1.75rem;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: start;
}

.dictionary-side {
  display: grid;
  gap: 1.5rem;
}

.lookup-card {
  display: grid;
  gap: 1.25rem;
  padding: 2rem;
}

.lookup-card__header {
  display: grid;
  gap: 0.35rem;
}

.lookup-card__header h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #1e293b;
}

.lookup-card__header p {
  margin: 0;
  color: rgba(15, 23, 42, 0.65);
}

.form__field {
  display: grid;
  gap: 0.5rem;
}

.form__field span {
  font-weight: 600;
  color: #1e293b;
}

.form__field input,
.form__field textarea {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 16px;
  padding: 0.8rem 1rem;
  background: rgba(241, 245, 249, 0.9);
  color: #0f172a;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.form__field textarea {
  resize: vertical;
  min-height: 120px;
}

.form__field input:focus,
.form__field textarea:focus {
  outline: none;
  border-color: rgba(79, 70, 229, 0.55);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
  background: #ffffff;
}

.toggle {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: none;
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  background: rgba(79, 70, 229, 0.12);
  color: #4338ca;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.toggle:hover {
  transform: translateY(-1px);
  background: rgba(79, 70, 229, 0.18);
}

.error {
  margin: 0;
  color: #dc2626;
  font-weight: 600;
}

.submit {
  border: none;
  border-radius: 18px;
  padding: 0.95rem 1.2rem;
  font-weight: 600;
  font-size: 1rem;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(79, 70, 229, 0.28);
}

.submit:disabled {
  opacity: 0.7;
  cursor: progress;
  box-shadow: none;
}

.suggestions header,
.recent header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 1rem 0;
}

.suggestions h2,
.recent h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

.suggestions header button {
  border: none;
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.suggestions header button:hover {
  background: rgba(59, 130, 246, 0.18);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.chip {
  border: none;
  padding: 0.5rem 0.95rem;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.16);
  color: #312e81;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.chip:hover {
  transform: translateY(-1px);
  background: rgba(99, 102, 241, 0.24);
}

.recent ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.85rem;
}

.recent button {
  border: none;
  background: rgba(241, 245, 249, 0.9);
  border-radius: 16px;
  padding: 0.75rem 1rem;
  text-align: left;
  cursor: pointer;
  display: grid;
  gap: 0.35rem;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.recent button:hover {
  background: rgba(226, 232, 240, 0.95);
  transform: translateY(-1px);
}

.recent strong {
  color: #0f172a;
}

.recent small {
  color: rgba(15, 23, 42, 0.65);
}

.dictionary-dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  background: rgba(15, 23, 42, 0.45);
  border: none;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  z-index: 20;
}

.dictionary-dialog__content {
  max-width: 420px;
  background: #ffffff;
  border-radius: 24px;
  padding: 2rem;
  display: grid;
  gap: 1rem;
  box-shadow: 0 26px 48px rgba(15, 23, 42, 0.2);
}

.dictionary-dialog__content h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
}

.dictionary-dialog__content p {
  margin: 0;
  color: rgba(15, 23, 42, 0.7);
  line-height: 1.6;
}

.dictionary-dialog__content ul {
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  gap: 0.5rem;
  color: rgba(15, 23, 42, 0.75);
}

.dictionary-dialog__content button {
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #22d3ee, #6366f1);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.dictionary-dialog__content button:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(79, 70, 229, 0.28);
}

@media (max-width: 960px) {
  .dictionary-grid {
    grid-template-columns: 1fr;
  }

  .dictionary-side {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dictionary-main {
    padding: 2rem 1rem 3rem;
  }

  .hero {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }

  .hero__content h1 {
    font-size: 1.75rem;
  }

  .lookup-card {
    padding: 1.75rem;
  }
}
</style>
