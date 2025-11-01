<template>
  <div class="screen">
    <Navbar />
    <main class="content">
      <header class="hero">
        <p class="hero__eyebrow">Xin chào {{ preferences.fullName || "bạn" }}!</p>
        <h1>Tự học tiếng Anh với gia sư AI</h1>
        <p class="hero__description">
          Chọn một tính năng để bắt đầu hành trình học tập được cá nhân hóa cho
          trình độ của bạn.
        </p>
      </header>

      <section class="grid">
        <article
          v-for="feature in features"
          :key="feature.href"
          class="card"
          :style="{ backgroundImage: feature.gradient }"
          @click="goTo(feature.href)"
        >
          <div class="card__overlay"></div>
          <div class="card__content">
            <h2>{{ feature.title }}</h2>
            <p class="card__subtitle">{{ feature.englishTitle }}</p>
            <p class="card__description">{{ feature.description }}</p>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import Navbar from "@/components/Navbar.vue";
import { FEATURES } from "@/constants";
import { getUserPreferences, hasCompletedOnboarding } from "@/utils/localStorage";

const router = useRouter();
const preferences = reactive(getUserPreferences());
const features = FEATURES;

// Convenience helper used by the feature cards to trigger navigation.
const goTo = (href: string) => {
  router.push(href);
};

// Redirect users who skipped onboarding back to the information flow.
onMounted(() => {
  if (!hasCompletedOnboarding()) {
    router.replace("/");
  }
});
</script>

<style scoped>
.screen {
  min-height: 100vh;
  backdrop-filter: blur(14px);
  background:
    radial-gradient(circle at 18% 22%, rgba(255, 255, 255, 0.85), transparent 55%),
    radial-gradient(circle at 82% 12%, rgba(94, 234, 212, 0.32), transparent 60%),
    radial-gradient(circle at 12% 82%, rgba(244, 114, 182, 0.28), transparent 58%),
    linear-gradient(
      135deg,
      rgba(248, 251, 255, 0.96) 0%,
      rgba(230, 240, 255, 0.88) 45%,
      rgba(210, 226, 255, 0.82) 100%
    );
}

.content {
  max-width: 1024px;
  margin: 0 auto;
  padding: 3.5rem 2rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.hero {
  display: grid;
  gap: 0.75rem;
  color: #0f172a;
}

.hero__eyebrow {
  margin: 0;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(15, 23, 42, 0.7);
}

.hero h1 {
  margin: 0;
  font-size: clamp(2.2rem, 5vw, 3.25rem);
  letter-spacing: -0.01em;
}

.hero__description {
  max-width: 520px;
  margin: 0;
  color: rgba(15, 23, 42, 0.75);
  line-height: 1.7;
}

.grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.card {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  cursor: pointer;
  color: white;
  padding: 2.5rem 2rem;
  min-height: 220px;
  display: flex;
  align-items: flex-end;
  background-size: cover;
  background-position: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.55));
}

.card__content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.75rem;
}

.card h2 {
  margin: 0;
  font-size: 1.8rem;
}

.card__subtitle {
  margin: 0;
  opacity: 0.8;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.card__description {
  margin: 0;
  line-height: 1.6;
  font-size: 0.95rem;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 30px 50px rgba(15, 23, 42, 0.3);
}
</style>
