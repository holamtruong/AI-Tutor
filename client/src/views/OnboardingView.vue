<template>
  <div class="screen">
    <div class="floating floating--top" aria-hidden="true"></div>
    <div class="floating floating--bottom" aria-hidden="true"></div>

    <main class="card">
      <section v-if="step === 1" class="section">
        <header class="section__header">
          <h1>Chào mừng!</h1>
          <p>
            AI Tutor muốn biết thêm một chút về bạn để có thể đồng hành cùng bạn
            học tiếng Anh hiệu quả hơn.
          </p>
        </header>

        <form class="form" @submit.prevent="handleFirstStep">
          <label class="form__field">
            <span>Họ và tên</span>
            <input
              v-model.trim="firstStep.fullName"
              type="text"
              name="fullName"
              placeholder="Tên của bạn"
              autocomplete="off"
              required
            />
            <small v-if="errors.fullName" class="error">{{ errors.fullName }}</small>
          </label>

          <label class="form__field">
            <span>Giới tính</span>
            <select v-model="firstStep.gender" name="gender">
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </label>

          <label class="form__field">
            <span>Tuổi</span>
            <input
              v-model.number="firstStep.age"
              type="number"
              min="7"
              max="60"
              step="1"
              name="age"
              placeholder="16"
              required
            />
            <small v-if="errors.age" class="error">{{ errors.age }}</small>
          </label>

          <button class="button" type="submit">Tiếp tục</button>
        </form>
      </section>

      <section v-else class="section">
        <header class="section__header">
          <h1>Trình độ tiếng Anh</h1>
          <p>
            Chọn trình độ phù hợp để chúng tôi gợi ý lộ trình học tập dành riêng
            cho bạn.
          </p>
        </header>

        <div class="levels">
          <button
            v-for="level in levels"
            :key="level.id"
            type="button"
            class="level"
            :class="{ 'level--active': selectedLevel === level.id }"
            @click="selectLevel(level.id)"
          >
            <strong>{{ level.name }}</strong>
            <small>{{ level.description }}</small>
          </button>
        </div>

        <p v-if="errors.level" class="error error--center">{{ errors.level }}</p>

        <button class="button" type="button" @click="completeOnboarding">
          Bắt đầu hành trình học tập
        </button>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { PROFICIENCY_LEVELS } from "@/constants";
import {
  getUserPreferences,
  hasCompletedOnboarding,
  saveUserPreferences,
  type UserPreferences,
} from "@/utils/localStorage";

const router = useRouter();
const step = ref(1);
const levels = computed(() => PROFICIENCY_LEVELS);

const stored = getUserPreferences();

const firstStep = reactive({
  fullName: stored.fullName ?? "",
  gender: stored.gender ?? "male",
  age: stored.age ?? ("" as number | ""),
});

const selectedLevel = ref<number | null>(stored.proficiencyLevel ?? null);

const errors = reactive<{ fullName: string; age: string; level: string }>({
  fullName: "",
  age: "",
  level: "",
});

const validateFirstStep = () => {
  errors.fullName = "";
  errors.age = "";

  if (!firstStep.fullName || firstStep.fullName.length < 2) {
    errors.fullName = "Vui lòng nhập tên hợp lệ";
  }

  if (typeof firstStep.age !== "number" || Number.isNaN(firstStep.age)) {
    errors.age = "Vui lòng nhập tuổi";
  } else if (firstStep.age < 7 || firstStep.age > 60) {
    errors.age = "Ứng dụng hiện hỗ trợ người dùng từ 7 đến 60 tuổi";
  }

  return !errors.fullName && !errors.age;
};

const handleFirstStep = () => {
  if (!validateFirstStep()) {
    return;
  }

  const partial: UserPreferences = {
    fullName: firstStep.fullName,
    gender: firstStep.gender,
    age: typeof firstStep.age === "number" ? firstStep.age : undefined,
  };

  saveUserPreferences(partial);
  step.value = 2;
};

const selectLevel = (levelId: number) => {
  selectedLevel.value = levelId;
  errors.level = "";
};

const completeOnboarding = () => {
  if (!selectedLevel.value) {
    errors.level = "Vui lòng chọn trình độ của bạn";
    return;
  }

  saveUserPreferences({
    fullName: firstStep.fullName,
    gender: firstStep.gender,
    age: typeof firstStep.age === "number" ? firstStep.age : undefined,
    proficiencyLevel: selectedLevel.value,
    hasCompletedOnboarding: true,
  });

  router.push("/dashboard");
};

onMounted(() => {
  if (hasCompletedOnboarding()) {
    router.replace("/dashboard");
  } else if (stored.proficiencyLevel) {
    step.value = 2;
  }
});
</script>

<style scoped>
.screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  position: relative;
  padding: 2.5rem 1.5rem;
  overflow: hidden;
}

.floating {
  position: absolute;
  width: 18rem;
  height: 18rem;
  border-radius: 999px;
  filter: blur(80px);
  opacity: 0.35;
}

.floating--top {
  background: #f472b6;
  top: -6rem;
  right: -4rem;
}

.floating--bottom {
  background: #38bdf8;
  bottom: -6rem;
  left: -4rem;
}

.card {
  position: relative;
  width: min(100%, 640px);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
  backdrop-filter: blur(12px);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.section__header h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(2rem, 3vw, 2.5rem);
  letter-spacing: 0.02em;
}

.section__header p {
  margin: 0;
  color: #475569;
  line-height: 1.6;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form__field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.form__field span {
  font-weight: 600;
  color: #1e293b;
}

input,
select {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  padding: 0.75rem 1rem;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.75);
  transition: border 0.2s ease, box-shadow 0.2s ease;
}

input:focus,
select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.button {
  margin-top: 0.5rem;
  border: none;
  border-radius: 16px;
  padding: 0.9rem 1rem;
  font-weight: 600;
  font-size: 1rem;
  color: white;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 35px rgba(99, 102, 241, 0.35);
}

.button:active {
  transform: translateY(1px);
}

.levels {
  display: grid;
  gap: 1rem;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.level {
  border: none;
  border-radius: 18px;
  padding: 1.25rem;
  text-align: left;
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: grid;
  gap: 0.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.level strong {
  font-size: 1.1rem;
  color: #0f172a;
}

.level small {
  color: #475569;
  line-height: 1.5;
}

.level:hover,
.level--active {
  transform: translateY(-2px);
  box-shadow: 0 18px 35px rgba(14, 165, 233, 0.25);
}

.level--active {
  border: 2px solid rgba(14, 165, 233, 0.5);
}

.error {
  color: #dc2626;
  font-weight: 500;
}

.error--center {
  text-align: center;
}

@media (max-width: 640px) {
  .card {
    padding: 2rem;
  }
}
</style>
