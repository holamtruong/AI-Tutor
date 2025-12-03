<template>
  <div class="quiz-screen">
    <Navbar />

    <main class="quiz-main">
      <section class="quiz-card" v-if="!showResult">
        <header class="quiz-card__header">
          <div class="quiz-progress">
            <span class="quiz-progress__label">
              Câu hỏi {{ questionNumber }} / {{ TOTAL_QUESTIONS }}
            </span>
            <div class="quiz-progress__bar">
              <div class="quiz-progress__fill" :style="{ width: progressPercent }"></div>
            </div>
          </div>
          <div class="quiz-score">
            <span>Điểm hiện tại</span>
            <strong>{{ score }}</strong>
          </div>
        </header>

        <transition name="fade-slide" mode="out-in">
          <div class="quiz-body" :key="currentQuestion?.word">
            <h2 class="quiz-question">
              Chọn nghĩa đúng cho từ <span class="quiz-question__word">“{{ currentQuestion?.word }}”</span>
            </h2>

            <div class="quiz-choices">
              <button
                v-for="(choice, index) in currentQuestion?.choices ?? []"
                :key="choice"
                type="button"
                class="quiz-choice"
                :class="choiceClass(index)"
                :disabled="isReviewing"
                @click="selectChoice(index)"
              >
                <span>{{ choice }}</span>
              </button>
            </div>
          </div>
        </transition>

        <footer class="quiz-footer">
          <button
            type="button"
            class="quiz-footer__btn"
            :disabled="!isReviewing"
            @click="goToNext"
          >
            {{ isLastQuestion ? "Xem kết quả" : "Câu tiếp theo" }}
          </button>
        </footer>
      </section>

      <section class="quiz-card quiz-card--result" v-else>
        <header class="quiz-card__header quiz-card__header--result">
          <h2>Kết quả của bạn</h2>
          <p>Bạn trả lời đúng <strong>{{ score }}</strong> / {{ TOTAL_QUESTIONS }} câu hỏi.</p>
        </header>

        <div class="quiz-body quiz-body--result">
          <div class="quiz-scoreboard">
            <div class="quiz-scoreboard__ring">
              <span>{{ score }}</span>
              <small>/ {{ TOTAL_QUESTIONS }}</small>
            </div>
            <p class="quiz-scoreboard__message">{{ resultMessage }}</p>
          </div>

          <aside v-if="funFoodTip" class="quiz-tip">
            <h3>Gợi ý món ăn cho bạn 🍽️</h3>
            <p>{{ funFoodTip }}</p>
          </aside>
        </div>

        <footer class="quiz-footer quiz-footer--result">
          <button type="button" class="quiz-footer__btn" @click="restartGame">
            Chơi lại
          </button>
        </footer>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Navbar from "@/components/Navbar.vue";
import wordBank from "@/data/words.json";
import { addAssignmentRecord } from "@/utils/localStorage";

// Dinh nghia cau hoi va cau hoi quiz sau khi da trang bi
interface RawQuestion {
  word: string;
  choices: string[];
  answerIndex: number;
}

// Cau hoi quiz da duoc trang bi
interface QuizQuestion {
  word: string;
  choices: string[];
  correctIndex: number;
}

// Cau hinh quiz
const TOTAL_QUESTIONS = 10; // So cau hoi trong mot vong quiz
const QUIZ_TYPE = "vocabulary-quiz"; // Loai bai tap quiz
const QUIZ_TOPIC = "food"; // Chu de bai tap quiz

const questions = ref<QuizQuestion[]>([]); // Danh sach cau hoi quiz
const currentIndex = ref(0); // Chi so cau hoi hien tai
const selectedChoice = ref<number | null>(null); // Dap an nguoi dung da chon
const score = ref(0); // Diem so hien tai
const state = ref<"awaiting" | "review" | "finished">("awaiting"); // Trang thai quiz
const funFoodTip = ref(""); 

  // Ham tron mang ngau nhien de tao su da dang
const shuffle = <T,>(source: T[]): T[] => {
  const copied = [...source];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
};

// Tao mot vong quiz moi tu ngan hang tu
const prepareQuestions = () => {
  const rawList = shuffle((wordBank as RawQuestion[]).slice());
  const prepared = rawList.slice(0, TOTAL_QUESTIONS).map((item) => {
    const decorated = item.choices.map((choice, index) => ({
      choice,
      isCorrect: index === item.answerIndex,
    }));

    const shuffledChoices = shuffle(decorated);
    return {
      word: item.word,
      choices: shuffledChoices.map((entry) => entry.choice),
      correctIndex: shuffledChoices.findIndex((entry) => entry.isCorrect),
    };
  });

  questions.value = prepared;
  currentIndex.value = 0;
  selectedChoice.value = null;
  score.value = 0;
  state.value = "awaiting";
};

const currentQuestion = computed(() => questions.value[currentIndex.value]);
const questionNumber = computed(() => currentIndex.value + 1);
const isReviewing = computed(() => state.value === "review");
const isLastQuestion = computed(() => currentIndex.value === TOTAL_QUESTIONS - 1);
const showResult = computed(() => state.value === "finished");
const progressPercent = computed(() => {
  const progressValue =
    (currentIndex.value + (state.value === "finished" ? 1 : 0)) / TOTAL_QUESTIONS;
  return `${Math.min(progressValue * 100, 100)}%`;
});

// Xu ly khi nguoi dung chon dap an, cham diem ngay va chuyen sang che do xem lai.
const selectChoice = (index: number) => {
  if (state.value !== "awaiting") {
    return;
  }

  selectedChoice.value = index;
  if (currentQuestion.value && index === currentQuestion.value.correctIndex) {
    score.value += 1;
  }
  state.value = "review";
};

// Chuyen sang cau hoi tiep theo hoac ket thuc khi het cau hoi.
const goToNext = () => {
  if (state.value !== "review") {
    return;
  }

  if (isLastQuestion.value) {
    state.value = "finished";
    addAssignmentRecord({
      type: QUIZ_TYPE,
      topic: QUIZ_TOPIC,
      score: score.value,
    });
    return;
  }

  currentIndex.value += 1;
  selectedChoice.value = null;
  state.value = "awaiting";
};

// Dat lai quiz de nguoi dung choi lai ngay.
const restartGame = () => {
  prepareQuestions();
};

// Tinh class CSS cho moi nut dap an khi dang xem lai.
const choiceClass = (index: number) => {
  if (!isReviewing.value || !currentQuestion.value) {
    return "";
  }
  if (index === currentQuestion.value.correctIndex) {
    return "quiz-choice--correct";
  }
  if (index === selectedChoice.value) {
    return "quiz-choice--wrong";
  }
  return "quiz-choice--muted";
};

const resultMessage = computed(() => {
  const ratio = score.value / TOTAL_QUESTIONS;
  if (ratio === 1) {
    return "Bạn là bậc thầy ẩm thực! 🎉";
  }
  if (ratio >= 0.7) {
    return "Tuyệt vời! Bạn hiểu biết rất nhiều về ẩm thực.";
  }
  if (ratio >= 0.4) {
    return "Khá tốt! Tiếp tục luyện tập để ghi nhớ nhiều hơn nhé.";
  }
  return "Đừng bỏ cuộc, chơi lại để thuộc thêm nhiều từ mới!";
});

// Lay ngau nhien mon an tu API cong khai de phan vui nhon luon moi.
const loadRandomMeal = async () => {
  try {
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
    if (!response.ok) {
      throw new Error("Bad response");
    }
    const data = await response.json();
    const meal = data?.meals?.[0];
    if (meal?.strMeal) {
      const area = meal.strArea ? ` (${meal.strArea})` : "";
      funFoodTip.value = `${meal.strMeal}${area} - thử tìm hiểu thêm để mở rộng vốn từ!`;
    }
  } catch (error) {
    funFoodTip.value = "";
  }
};

// Tao vong quiz va meo nho ngay khi component render.
onMounted(() => {
  prepareQuestions();
  loadRandomMeal();
});
</script>

<style scoped>
.quiz-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
}

.quiz-main {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
  display: grid;
}

.quiz-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 24px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(8px);
  padding: 2rem;
  display: grid;
  gap: 1.75rem;
  animation: pop-in 0.6s ease;
}

.quiz-card--result {
  max-width: 640px;
}

.quiz-card__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
  justify-content: space-between;
}

.quiz-card__header--result {
  display: grid;
  gap: 0.35rem;
}

.quiz-progress {
  flex: 1;
  min-width: 220px;
  display: grid;
  gap: 0.5rem;
}

.quiz-progress__label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.quiz-progress__bar {
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.25);
  overflow: hidden;
}

.quiz-progress__fill {
  height: 100%;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  transition: width 0.35s ease;
}

.quiz-score {
  display: grid;
  gap: 0.25rem;
  text-align: right;
}

.quiz-score span {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(30, 41, 59, 0.7);
}

.quiz-score strong {
  font-size: 1.8rem;
  color: #0f172a;
}

.quiz-body {
  display: grid;
  gap: 1.5rem;
}

.quiz-question {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.quiz-question__word {
  color: #6366f1;
}

.quiz-choices {
  display: grid;
  gap: 1rem;
}

.quiz-choice {
  border: none;
  border-radius: 18px;
  padding: 1rem 1.25rem;
  text-align: left;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  background: rgba(99, 102, 241, 0.08);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.quiz-choice:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2);
}

.quiz-choice:disabled {
  cursor: default;
}

.quiz-choice--correct {
  background: rgba(34, 197, 94, 0.15);
  color: #166534;
  box-shadow: 0 12px 24px rgba(34, 197, 94, 0.22);
}

.quiz-choice--wrong {
  background: rgba(239, 68, 68, 0.18);
  color: #991b1b;
}

.quiz-choice--muted {
  opacity: 0.7;
}

.quiz-footer {
  display: flex;
  justify-content: flex-end;
}

.quiz-footer--result {
  justify-content: center;
}

.quiz-footer__btn {
  border: none;
  border-radius: 16px;
  padding: 0.85rem 1.8rem;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  box-shadow: 0 12px 24px rgba(79, 70, 229, 0.28);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.quiz-footer__btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(79, 70, 229, 0.32);
}

.quiz-footer__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.quiz-body--result {
  display: grid;
  gap: 1.5rem;
  justify-items: center;
  text-align: center;
}

.quiz-scoreboard {
  display: grid;
  gap: 1rem;
  justify-items: center;
}

.quiz-scoreboard__ring {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: conic-gradient(from 90deg, rgba(99, 102, 241, 0.2), rgba(37, 99, 235, 0.7));
  color: #1e293b;
  font-size: 2.25rem;
  font-weight: 800;
  position: relative;
}

.quiz-scoreboard__ring small {
  font-size: 1rem;
  color: rgba(15, 23, 42, 0.7);
}

.quiz-scoreboard__message {
  font-size: 1.1rem;
  color: #334155;
  margin: 0;
}

.quiz-tip {
  background: rgba(59, 130, 246, 0.12);
  padding: 1.25rem 1.5rem;
  border-radius: 18px;
  color: #1d4ed8;
  box-shadow: 0 12px 28px rgba(59, 130, 246, 0.16);
}

.quiz-tip h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.quiz-tip p {
  margin: 0;
  line-height: 1.6;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .quiz-card {
    padding: 1.75rem;
  }

  .quiz-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .quiz-score {
    text-align: left;
  }

  .quiz-choice {
    padding: 0.9rem 1rem;
  }

  .quiz-footer {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .quiz-main {
    padding: 2rem 1rem 3rem;
  }

  .quiz-question {
    font-size: 1.25rem;
  }

  .quiz-scoreboard__ring {
    width: 150px;
    height: 150px;
    font-size: 1.9rem;
  }
}
</style>
