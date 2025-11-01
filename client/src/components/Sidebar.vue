<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed }">
    <div class="sidebar__top">
      <router-link to="/dashboard" class="sidebar__brand" style="text-decoration:none; color:inherit;">
        <div class="brand__icon">AI</div>
        <div class="brand__text">
          <strong>AI Tutor</strong>
          <span>Gia sư tiếng Anh</span>
        </div>
      </router-link>
      <button
        class="sidebar__toggle"
        type="button"
        :aria-label="collapsed ? 'Mở thanh bên' : 'Thu gọn thanh bên'"
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
      title="Tạo cuộc trò chuyện mới"
      aria-label="Tạo cuộc trò chuyện mới"
      @click="emit('new-chat')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
        <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="sidebar__new-label">Cuộc trò chuyện mới</span>
    </button>

    <nav class="sidebar__nav">
      <p class="sidebar__title">Liên kết nhanh</p>
      <router-link to="/chat" class="nav__link" title="Trò chuyện">
        <span class="nav__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
            <path d="M4 6h16v9H7l-3 3z" stroke-width="1.6" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="nav__label">Trò chuyện</span>
      </router-link>
      <router-link to="/dictionary" class="nav__link" title="Từ điển">
        <span class="nav__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
            <path d="M5 4h12a3 3 0 0 1 3 3v13l-4-3-4 3-4-3-4 3V7a3 3 0 0 1 3-3z" stroke-width="1.6" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="nav__label">Từ điển</span>
      </router-link>
      <router-link to="/assignment" class="nav__link" title="Bài tập">
        <span class="nav__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
            <path d="M4 5h16v3H4zM4 11h10v3H4zM4 17h7v3H4z" />
          </svg>
        </span>
        <span class="nav__label">Bài tập</span>
      </router-link>
      <router-link to="/writing" class="nav__link" title="Luyện viết">
        <span class="nav__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
            <path d="M4 20h4l10-10-4-4L4 16zM14 6l4 4" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" />
          </svg>
        </span>
        <span class="nav__label">Luyện viết</span>
      </router-link>
    </nav>

    <section class="sidebar__section">
      <div class="section__header">
        <p class="section__title">Lịch sử trò chuyện</p>
      </div>

      <div v-if="!conversations.length" class="history__empty">
        <p>Chưa có cuộc trò chuyện nào.</p>
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
            :title="`Mở cuộc trò chuyện ${item.title}`"
            @click="emit('select', item.id)"
          >
            <span class="history__title">{{ item.title }}</span>
            <span class="history__meta">{{ formatUpdatedAt(item.updatedAt) }}</span>
            <span v-if="item.preview" class="history__preview">{{ item.preview }}</span>
          </button>
          <button
            class="history__delete"
            type="button"
            title="Xóa cuộc trò chuyện"
            aria-label="Xóa cuộc trò chuyện"
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
      <p class="section__title">Tài khoản</p>
      <button
        class="btn btn--account"
        type="button"
        title="Cập nhật thông tin tài khoản"
        @click="onAccountClick"
      >
        <span class="btn__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
            <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.31 0-6 2.13-6 4.76V20h12v-1.24C18 16.13 15.31 14 12 14z" />
          </svg>
        </span>
        <span class="btn__label">{{ userName || "Bạn học" }}</span>
      </button>
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
  userName?: string;
}>();

const emit = defineEmits<{
  (event: "toggle"): void;
  (event: "new-chat"): void;
  (event: "select", id: string): void;
  (event: "delete", id: string): void;
  (event: "clear-all"): void;
  (event: "open-account"): void;
}>();

// Format the updated time inside history items using the user's locale.
const formatUpdatedAt = (timestamp: number) => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
  return formatter.format(new Date(timestamp));
};

// Ask for confirmation before deleting a single conversation from history.
const onDelete = (id: string) => {
  if (confirm("Xác nhận xoá cuộc trò chuyện này?")) {
    emit("delete", id);
  }
};

// Entry point for the "clear all" CTA with short-circuiting on empty history.
const onClearAll = () => {
  if (!props.conversations.length) {
    return;
  }
  if (confirm("Xác nhận xoá toàn bộ lịch sử?")) {
    emit("clear-all");
  }
};

// Bubble the account button click up so the parent view can open the modal.
const onAccountClick = () => {
  emit("open-account");
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
  max-height: 520px;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
}

.history__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.35rem;
  align-items: stretch;
  padding: 0.45rem;
  border-radius: 12px;
  background: rgba(241, 245, 249, 0.65);
  transition: background 0.2s ease, transform 0.2s ease;
  min-width: 0;
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

.history__meta { display: none; }

.history__preview { display: none; }

.history__delete {
  border: none;
  background: rgba(148, 163, 184, 0.25);
  color: #0f172a;
  border-radius: 10px;
  padding: 0.35rem;
  cursor: pointer;
  align-self: center;
  opacity: 0;
  pointer-events: none;
  width: 0;
  padding: 0;
  transition: opacity 0.15s ease, width 0.15s ease, padding 0.15s ease;
}

.history__item:hover .history__delete {
  opacity: 1;
  pointer-events: auto;
  width: auto;
  padding: 0.35rem;
}

.history__delete .icon { width: 18px; height: 18px; }

.history__item:hover {
  background: rgba(129, 140, 248, 0.18);
  transform: translateX(1px);
}
.history__item--active:hover {
  background: rgba(129, 140, 248, 0.35);
  transform: translateX(3px);
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

.btn--account {
  background: #ffffff;
  color: #0f172a;
  border: 1px solid rgba(15, 23, 42, 0.12);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
}

.btn--account:hover {
  background: #f8fafc;
  color: #0f172a;
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.16);
}

.btn--account:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.28), 0 6px 14px rgba(15, 23, 42, 0.12);
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

/* Hide chat history section entirely when collapsed on desktop */
.sidebar--collapsed .sidebar__section {
  display: none;
}

.sidebar--collapsed .sidebar__brand,
.sidebar--collapsed .sidebar__new-label,
.sidebar--collapsed .sidebar__title,
.sidebar--collapsed .section__title,
.sidebar--collapsed .nav__label,
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

  /* On mobile, hide the sidebar entirely when collapsed */
  .sidebar--collapsed {
    display: none;
  }
}
</style>
