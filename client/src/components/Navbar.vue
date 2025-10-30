<template>
  <header class="navbar">
    <div class="navbar__layout navbar__layout--row">
      <router-link class="navbar__brand" to="/dashboard">AI Tutor</router-link>
      <nav class="navbar__links">
        <router-link to="/assignment">Bài tập</router-link>
        <router-link to="/writing">Viết</router-link>
        <router-link to="/dictionary">Từ điển</router-link>
        <router-link to="/chat">Trò chuyện</router-link>
      </nav>
      <div class="navbar__user">
        <span class="navbar__user-name">{{ displayName }}</span>
      </div>
    </div>
  </header>
import { computed } from 'vue';
import { getUserPreferences } from '@/utils/localStorage';

const prefs = getUserPreferences();
const displayName = computed(() => prefs.fullName || 'Tài khoản');
</template>

<script setup lang="ts"></script>

<style scoped>



.navbar {
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
  background: linear-gradient(90deg, #f8fafc 80%, #e0e7ef 100%);
  box-shadow: 0 4px 24px rgba(79, 70, 229, 0.08);
  color: #0f172a;
  background-size: 200% 200%;
  animation: navbar-gradient-move 12s ease-in-out infinite;
}

@keyframes navbar-gradient-move {
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

.navbar__layout {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
}

.navbar__brand {
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 0.04em;
  text-decoration: none;
  color: #2563eb;
  background: linear-gradient(90deg, #3b82f6 40%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  /* text-fill-color: transparent; */
}

.navbar__links {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.navbar__brand {
  margin-right: 2.5rem;
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 0.04em;
  text-decoration: none;
}

.navbar__brand {
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 0.04em;
  text-decoration: none;
}

.navbar__links {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.navbar__links a {
  text-decoration: none;
  font-weight: 500;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  color: inherit;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.navbar__links a.router-link-active {
  background-color: rgba(255, 255, 255, 0.65);
  transform: translateY(-1px);
}

.navbar__links a:hover {
  background-color: rgba(255, 255, 255, 0.35);
}

@media (max-width: 720px) {
  .navbar {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
