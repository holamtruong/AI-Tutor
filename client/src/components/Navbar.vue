<template>
  <header class="navbar">
    <router-link class="navbar__brand" to="/dashboard">EngChat</router-link>
    <nav class="navbar__links">
      <router-link to="/dashboard">Trang chủ</router-link>
      <router-link to="/dictionary">Từ điển</router-link>
      <router-link to="/chat">Trò chuyện</router-link>
    </nav>
  </header>
</template>

<script setup lang="ts"></script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  max-width: 1080px;
  margin: 0 auto;
  color: #0f172a;
}

.navbar__brand {
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 0.04em;
  text-decoration: none;
}

.navbar__links {
  display: flex;
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
