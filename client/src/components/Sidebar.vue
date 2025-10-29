<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed }">
    <div class="sidebar__top">
      <div class="sidebar__brand">
        <div class="brand__icon">EC</div>
        <div class="brand__text">
          <strong>EngChat</strong>
          <span>AI tutor</span>
        </div>
      </div>
      <button
        class="sidebar__toggle"
        type="button"
        :aria-label="collapsed ? 'Mo sidebar' : 'Thu gon sidebar'"
        @click="emit('toggle')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
          <rect x="3" y="4" width="4" height="16" rx="1" />
          <rect x="9" y="6" width="12" height="4" rx="1" />
          <rect x="9" y="14" width="12" height="4" rx="1" />
        </svg>
      </button>
    </div>

    <button
      class="sidebar__new"
      type="button"
      title="Tao doan chat moi"
      aria-label="Tao doan chat moi"
      @click="emit('new-chat')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
        <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="sidebar__new-label">New conversation</span>
    </button>

    <nav class="sidebar__nav">
      <p class="sidebar__title">Quick links</p>
      <router-link to="/chat" class="nav__link" title="Chat">
        <span class="nav__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
            <path d="M4 6h16v9H7l-3 3z" stroke-width="1.6" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="nav__label">Chat</span>
      </router-link>
      <router-link to="/dictionary" class="nav__link" title="Dictionary">
        <span class="nav__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
            <path d="M5 4h12a3 3 0 0 1 3 3v13l-4-3-4 3-4-3-4 3V7a3 3 0 0 1 3-3z" stroke-width="1.6" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="nav__label">Dictionary</span>
      </router-link>
      <router-link to="/dashboard" class="nav__link" title="Exercises">
        <span class="nav__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
            <path d="M4 5h16v3H4zM4 11h10v3H4zM4 17h7v3H4z" />
          </svg>
        </span>
        <span class="nav__label">Exercises</span>
      </router-link>
    </nav>

    <section class="sidebar__section">
      <div class="section__header">
        <p class="section__title">Chat history</p>
        <button
          class="section__clear"
          type="button"
          title="Xoa tat ca"
          aria-label="Xoa tat ca"
          :disabled="!conversations.length"
          @click="onClearAll"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
            <path
              d="M5 7h14M10 11v6M14 11v6M9 7V5h6v2M6 7l1 12h10l1-12"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <div v-if="!conversations.length" class="history__empty">
        <p>No saved conversations yet.</p>
      </div>

      <div v-else class="history">
        <div
          v-for="item in conversations"
          :key="item.id"
          class="history__item"
          :class="{ 'history__item--active': item.id === activeId }"
        >
          <button
            class="history__select"
            type="button"
            :title="`Mo doan chat ${item.title}`"
            @click="emit('select', item.id)"
          >
            <span class="history__title">{{ item.title }}</span>
            <span class="history__meta">{{ formatUpdatedAt(item.updatedAt) }}</span>
            <span v-if="item.preview" class="history__preview">{{ item.preview }}</span>
          </button>
          <button
            class="history__delete"
            type="button"
            title="Xoa doan chat"
            aria-label="Xoa doan chat"
            @click="onDelete(item.id)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" class="icon icon--sm">
              <path
                d="M6 7h12M10 11v6M14 11v6M9 7V5h6v2M7 7l1 12h8l1-12"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>

    <div class="sidebar__account">
      <p class="section__title">Account</p>
      <router-link
        to="/dashboard"
        class="btn btn--primary"
        title="Mo ho so hoc tap"
      >
        <span class="btn__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
            <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.31 0-6 2.13-6 4.76V20h12v-1.24C18 16.13 15.31 14 12 14z" />
          </svg>
        </span>
        <span class="btn__label">Learning profile</span>
      </router-link>
    </div>
  </aside>
</template>

<script setup lang="ts">
interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: number;
  preview?: string;
}

const props = defineProps<{
  collapsed: boolean;
  conversations: ConversationSummary[];
  activeId: string;
}>();

const emit = defineEmits<{
  (event: "toggle"): void;
  (event: "new-chat"): void;
  (event: "select", id: string): void;
  (event: "delete", id: string): void;
  (event: "clear-all"): void;
}>();

const formatUpdatedAt = (timestamp: number) => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
  return formatter.format(new Date(timestamp));
};

const onDelete = (id: string) => {
  if (confirm("Xac nhan xoa doan chat nay?")) {
    emit("delete", id);
  }
};

const onClearAll = () => {
  if (!props.conversations.length) {
    return;
  }
  if (confirm("Xac nhan xoa tat ca lich su?")) {
    emit("clear-all");
  }
};
</script>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 280px;
  min-height: 100vh;
  padding: 1.5rem 1.25rem;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(14px);
  border-right: 1px solid rgba(15, 23, 42, 0.08);
  transition: width 0.25s ease, padding 0.25s ease;
}

.sidebar__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
}

.brand__text {
  display: grid;
  gap: 0.15rem;
  color: #0f172a;
  line-height: 1.1;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.sidebar__toggle {
  border: none;
  border-radius: 12px;
  padding: 0.45rem;
  background: rgba(148, 163, 184, 0.3);
  color: #0f172a;
  cursor: pointer;
}

.sidebar__new {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  border: none;
  border-radius: 12px;
  padding: 0.65rem 1rem;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

.sidebar__nav {
  display: grid;
  gap: 0.5rem;
}

.sidebar__title,
.section__title {
  margin: 0 0 0.35rem 0.25rem;
  color: rgba(15, 23, 42, 0.6);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.nav__link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.8rem;
  border-radius: 12px;
  color: #0f172a;
  text-decoration: none;
}

.nav__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(99, 102, 241, 0.12);
  color: #4338ca;
}

.nav__link.router-link-active {
  background: rgba(99, 102, 241, 0.12);
  color: #4338ca;
}

.sidebar__section {
  display: grid;
  gap: 0.5rem;
}

.section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section__clear {
  border: none;
  background: rgba(148, 163, 184, 0.25);
  color: #0f172a;
  border-radius: 10px;
  padding: 0.45rem;
  cursor: pointer;
}

.section__clear:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.history {
  display: grid;
  gap: 0.5rem;
  max-height: 320px;
  overflow-y: auto;
}

.history__item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.35rem;
  align-items: stretch;
  padding: 0.6rem;
  border-radius: 12px;
  background: rgba(241, 245, 249, 0.65);
  transition: background 0.2s ease, transform 0.2s ease;
}

.history__item--active {
  background: rgba(129, 140, 248, 0.25);
  transform: translateX(2px);
}

.history__select {
  border: none;
  background: transparent;
  display: grid;
  gap: 0.25rem;
  text-align: left;
  cursor: pointer;
  color: #0f172a;
}

.history__title {
  font-weight: 600;
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history__meta {
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.55);
}

.history__preview {
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.history__delete {
  border: none;
  background: rgba(148, 163, 184, 0.25);
  color: #0f172a;
  border-radius: 10px;
  padding: 0.35rem;
  cursor: pointer;
  align-self: center;
}

.history__empty {
  padding: 0.75rem;
  border-radius: 12px;
  background: rgba(241, 245, 249, 0.65);
  color: rgba(15, 23, 42, 0.6);
  font-size: 0.85rem;
  text-align: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  border: none;
  border-radius: 12px;
  padding: 0.6rem 0.9rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}

.btn__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
}

.btn--primary {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #ffffff;
}

.sidebar__account {
  margin-top: auto;
  display: grid;
  gap: 0.5rem;
}

.icon {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
}

.icon--sm {
  width: 14px;
  height: 14px;
}

.sidebar--collapsed {
  width: 90px;
  padding: 1.25rem 0.75rem;
  gap: 0.75rem;
}

.sidebar--collapsed .sidebar__brand,
.sidebar--collapsed .sidebar__new-label,
.sidebar--collapsed .sidebar__title,
.sidebar--collapsed .section__title,
.sidebar--collapsed .history__title,
.sidebar--collapsed .history__preview,
.sidebar--collapsed .history__meta,
.sidebar--collapsed .btn__label {
  display: none;
}

.sidebar--collapsed .sidebar__new,
.sidebar--collapsed .nav__link,
.sidebar--collapsed .history__item,
.sidebar--collapsed .btn {
  justify-content: center;
}

.sidebar--collapsed .history__item {
  grid-template-columns: auto;
}

.sidebar--collapsed .history__delete {
  display: none;
}

@media (max-width: 960px) {
  .sidebar {
    width: 100%;
    min-height: auto;
    position: static;
    border-right: none;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  }

  .sidebar--collapsed {
    width: 100%;
    padding: 1rem;
  }
}
</style>
