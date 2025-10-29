<template>
  <div class="screen">
    <Navbar />

    <div class="app-shell">
      <!-- Sidebar -->
      <aside class="sidebar" :class="{ 'sidebar--open': sidebarOpen }">
        <div class="sidebar__header">
          <button class="sidebar__new" type="button" @click="createNewConversation">
            + Cuộc trò chuyện mới
          </button>
          <button class="sidebar__collapse" type="button" @click="toggleSidebar" aria-label="Đóng thanh bên">
            ✕
          </button>
        </div>

        <div class="sidebar__list" role="list">
          <button
            v-for="c in conversations"
            :key="c.id"
            class="sidebar__item"
            :class="{ 'sidebar__item--active': c.id === activeConversationId }"
            @click="selectConversation(c.id)"
          >
            <div class="sidebar__item-main">
              <div class="sidebar__title" :title="c.title">{{ c.title }}</div>
              <div class="sidebar__meta">{{ formatDateTime(c.updatedAt ?? c.createdAt) }}</div>
            </div>
            <div class="sidebar__item-actions">
              <button
                class="icon-btn"
                type="button"
                title="Xóa"
                @click.stop="deleteConversation(c.id)"
              >
                🗑
              </button>
            </div>
          </button>
        </div>

        <div class="sidebar__footer">
          <span class="sidebar__brand">AI Tutor</span>
          <span class="sidebar__hint">Lưu cục bộ</span>
        </div>
      </aside>

      <!-- Main -->
      <main class="main">
        <header class="header">
          <div class="header__row">
            <button class="burger" type="button" aria-label="Mở thanh bên" @click="toggleSidebar">
              ☰
            </button>
            <h1>Trò chuyện cùng AI Tutor</h1>
          </div>
          <p>
            Đặt câu hỏi về ngữ pháp, từ vựng hoặc xin gợi ý bài học. AI Tutor sẽ
            trả lời dựa trên thông tin mới nhất và trình độ của bạn.
          </p>
        </header>

        <section class="conversation" ref="conversationRef">
          <article
            v-for="message in messages"
            :key="message.id"
            class="bubble"
            :class="`bubble--${message.sender}`"
          >
            <span class="bubble__meta">
              {{ message.sender === "user" ? "Bạn" : "AI Tutor" }} •
              {{ formatTime(message.timestamp) }}
            </span>
            <p class="bubble__text">{{ message.content }}</p>
          </article>

          <div v-if="isSending" class="typing">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            AI Tutor đang soạn câu trả lời...
          </div>
        </section>

        <form class="composer" @submit.prevent="sendMessage">
          <textarea
            v-model="draft"
            rows="3"
            placeholder="Nhập tin nhắn... (Ctrl+Enter để gửi)"
            :disabled="isSending"
            required
            @keydown.enter.ctrl.exact.prevent="sendMessage"
          ></textarea>
          <div class="composer__actions">
            <button class="composer__clear" type="button" @click="clearActiveHistory">
              Xóa hội thoại này
            </button>
            <div class="composer__right">
              <button class="composer__ghost" type="button" @click="createNewConversation">
                Cuộc trò chuyện mới
              </button>
              <button class="composer__send" type="submit" :disabled="isSending || !draft.trim()">
                Gửi
              </button>
            </div>
          </div>
        </form>

        <p v-if="error" class="error">{{ error }}</p>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import Navbar from "@/components/Navbar.vue";
import { API_DOMAIN } from "@/config";
import {
  clearChatHistory,
  getChatHistory,
  hasCompletedOnboarding,
  saveChatHistory,
  type ChatMessage,
} from "@/utils/localStorage";
import { useRouter } from "vue-router";

type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt?: number;
};

const router = useRouter();

// Sidebar state (for mobile)
const sidebarOpen = ref(false);
const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);

// Conversations
const CONV_KEY = "AI Tutor:conversations:v2";

const conversations = ref<Conversation[]>([]);
const activeConversationId = ref<string>("");

const activeConversation = computed<Conversation | undefined>(() =>
  conversations.value.find((c) => c.id === activeConversationId.value)
);

const messages = computed<ChatMessage[]>({
  get: () => activeConversation.value?.messages ?? [],
  set: (val) => {
    const idx = conversations.value.findIndex((c) => c.id === activeConversationId.value);
    if (idx !== -1) {
      conversations.value[idx] = {
        ...conversations.value[idx],
        messages: val,
        updatedAt: Date.now(),
      };
      persistConversations();
      // Keep legacy single-thread history up-to-date (last opened)
      saveChatHistory(val);
    }
  },
});

const draft = ref("");
const isSending = ref(false);
const error = ref("");
const conversationRef = ref<HTMLElement | null>(null);

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDateTime = (timestamp: number) => {
  const d = new Date(timestamp);
  return d.toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
};

const scrollToBottom = () => {
  window.requestAnimationFrame(() => {
    const el = conversationRef.value;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  });
};

const persistConversations = () => {
  const payload = {
    conversations: conversations.value,
    activeId: activeConversationId.value,
  };
  localStorage.setItem(CONV_KEY, JSON.stringify(payload));
};

const loadConversations = () => {
  const raw = localStorage.getItem(CONV_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { conversations: Conversation[]; activeId?: string };
      conversations.value = parsed.conversations ?? [];
      activeConversationId.value = parsed.activeId ?? conversations.value[0]?.id ?? "";
    } catch {
      conversations.value = [];
      activeConversationId.value = "";
    }
  }

  // Migration from legacy single chat history if no conversation exists
  if (conversations.value.length === 0) {
    const legacy = getChatHistory();
    const now = Date.now();
    const firstUser = legacy.find((m) => m.sender === "user");
    const title =
      firstUser?.content?.slice(0, 40) ||
      "Cuộc trò chuyện mới";

    const baseMessages =
      legacy.length > 0
        ? legacy
        : [
            {
              id: crypto.randomUUID(),
              content:
                "Xin chào! Tôi là AI Tutor, gia sư AI của bạn. Tôi có thể giúp bạn giải thích ngữ pháp, gợi ý bài học hoặc luyện hội thoại.",
              sender: "ai",
              timestamp: now,
            } as ChatMessage,
          ];

    const conv: Conversation = {
      id: crypto.randomUUID(),
      title,
      messages: baseMessages,
      createdAt: now,
      updatedAt: now,
    };
    conversations.value = [conv];
    activeConversationId.value = conv.id;
    persistConversations();
  }
};

const createNewConversation = () => {
  const now = Date.now();
  const conv: Conversation = {
    id: crypto.randomUUID(),
    title: "Cuộc trò chuyện mới",
    messages: [
      {
        id: crypto.randomUUID(),
        content:
          "Xin chào! Tôi là AI Tutor, gia sư AI của bạn. Bạn muốn luyện gì hôm nay?",
        sender: "ai",
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  conversations.value = [conv, ...conversations.value];
  activeConversationId.value = conv.id;
  persistConversations();
  scrollToBottom();
  // Also reset legacy storage to match active
  saveChatHistory(conv.messages);
};

const selectConversation = (id: string) => {
  activeConversationId.value = id;
  persistConversations();
  // Sync legacy single-thread storage
  const current = conversations.value.find((c) => c.id === id);
  if (current) saveChatHistory(current.messages);
  scrollToBottom();
};

const deleteConversation = (id: string) => {
  const idx = conversations.value.findIndex((c) => c.id === id);
  if (idx === -1) return;

  const isActive = id === activeConversationId.value;
  conversations.value.splice(idx, 1);

  if (conversations.value.length === 0) {
    createNewConversation();
  } else if (isActive) {
    const next = conversations.value[Math.min(idx, conversations.value.length - 1)];
    activeConversationId.value = next.id;
    // Sync legacy storage
    saveChatHistory(next.messages);
  }
  persistConversations();
};

const updateTitleIfNeeded = (firstUserText: string) => {
  const conv = activeConversation.value;
  if (!conv) return;
  const hasOnlyGreeting = conv.messages.filter((m) => m.sender === "user").length <= 1;
  // If title is still default, update based on the first user message
  if (conv.title === "Cuộc trò chuyện mới" || !conv.title.trim() || hasOnlyGreeting) {
    const newTitle = firstUserText.trim().slice(0, 60) || "Cuộc trò chuyện";
    conv.title = newTitle;
    conv.updatedAt = Date.now();
    conversations.value = conversations.value.map((c) => (c.id === conv.id ? { ...conv } : c));
    persistConversations();
  }
};

const addMessage = (message: ChatMessage) => {
  messages.value = [...messages.value, message];
  scrollToBottom();
};

const sendMessage = async () => {
  if (!draft.value.trim() || isSending.value) return;

  const text = draft.value.trim();
  draft.value = "";
  error.value = "";

  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    content: text,
    sender: "user",
    timestamp: Date.now(),
  };

  addMessage(userMessage);
  updateTitleIfNeeded(text);
  isSending.value = true;

  try {
    const response = await fetch(`${API_DOMAIN}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ message: text }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = (await response.json()) as { reply: string };

    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: data.reply,
      sender: "ai",
      timestamp: Date.now(),
    };

    addMessage(aiMessage);
  } catch (error_) {
    console.error("Không thể gửi tin nhắn", error_);
    error.value =
      error_ instanceof Error
        ? error_.message
        : "Máy chủ đang bận, vui lòng thử lại sau.";
  } finally {
    isSending.value = false;
  }
};

const clearActiveHistory = () => {
  const conv = activeConversation.value;
  if (!conv) return;
  const now = Date.now();
  const resetMessages: ChatMessage[] = [
    {
      id: crypto.randomUUID(),
      content:
        "Xin chào! Tôi là AI Tutor, gia sư AI của bạn. Tôi có thể giúp bạn giải thích ngữ pháp, gợi ý bài học hoặc luyện hội thoại.",
      sender: "ai",
      timestamp: now,
    },
  ];
  conversations.value = conversations.value.map((c) =>
    c.id === conv.id
      ? { ...c, messages: resetMessages, updatedAt: now, title: "Cuộc trò chuyện mới" }
      : c
  );
  persistConversations();
  saveChatHistory(resetMessages);
  scrollToBottom();
};

// Backward compatibility: still clear legacy storage when user clears all
const clearLegacyAll = () => {
  clearChatHistory();
};

onMounted(() => {
  if (!hasCompletedOnboarding()) {
    router.replace("/");
    return;
  }

  loadConversations();
  scrollToBottom();
});

// Persist whenever conversations change significantly
watch(
  () => [conversations.value.length, activeConversationId.value],
  () => persistConversations()
);
</script>

<style scoped>
/* App shell */
.screen {
  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(99, 102, 241, 0.18), transparent 60%),
    radial-gradient(1000px 500px at 100% 0%, rgba(34, 211, 238, 0.18), transparent 60%),
    linear-gradient(180deg, #f8fafc 0%, #ffffff 60%);
}

.app-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1rem 3rem;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1rem;
}

@media (max-width: 980px) {
  .app-shell {
    grid-template-columns: 1fr;
  }
}

/* Sidebar */
.sidebar {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 140px);
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.12);
}

@media (max-width: 980px) {
  .sidebar {
    position: fixed;
    inset: 72px 12px 12px 12px;
    z-index: 40;
    display: none;
  }
  .sidebar.sidebar--open {
    display: flex;
  }
}

.sidebar__header {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.sidebar__new {
  flex: 1;
  border: 1px dashed rgba(99, 102, 241, 0.5);
  background: rgba(99, 102, 241, 0.08);
  color: #3730a3;
  padding: 0.6rem 0.9rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

.sidebar__collapse {
  border: none;
  background: transparent;
  font-size: 1.1rem;
  cursor: pointer;
  color: rgba(15, 23, 42, 0.7);
}

.sidebar__list {
  display: grid;
  gap: 0.25rem;
  overflow-y: auto;
  padding: 0.25rem;
}

.sidebar__item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: center;
  text-align: left;
  width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(248, 250, 252, 0.8);
  border-radius: 14px;
  padding: 0.6rem 0.75rem;
  cursor: pointer;
}

.sidebar__item:hover {
  background: rgba(224, 231, 255, 0.35);
  border-color: rgba(99, 102, 241, 0.25);
}

.sidebar__item--active {
  background: rgba(199, 210, 254, 0.45);
  border-color: rgba(99, 102, 241, 0.45);
}

.sidebar__item-main {
  min-width: 0;
}

.sidebar__title {
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__meta {
  font-size: 0.78rem;
  color: rgba(15, 23, 42, 0.6);
  margin-top: 2px;
}

.icon-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: rgba(15, 23, 42, 0.6);
}

.sidebar__footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: rgba(15, 23, 42, 0.55);
  padding: 0.25rem 0.25rem 0;
}

/* Main */
.main {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  gap: 1rem;
}

.header {
  display: grid;
  gap: 0.4rem;
  text-align: left;
  color: #0f172a;
}

.header__row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header h1 {
  margin: 0;
  font-size: clamp(1.6rem, 3.2vw, 2.4rem);
  letter-spacing: -0.02em;
}

.header p {
  margin: 0;
  max-width: 680px;
  color: rgba(15, 23, 42, 0.7);
  line-height: 1.6;
}

.burger {
  display: none;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(255, 255, 255, 0.8);
  padding: 0.4rem 0.6rem;
  border-radius: 10px;
  cursor: pointer;
}
@media (max-width: 980px) {
  .burger {
    display: inline-block;
  }
}

/* Conversation */
.conversation {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 24px;
  padding: 1.25rem;
  display: grid;
  gap: 1rem;
  max-height: 56vh;
  overflow-y: auto;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 25px 45px rgba(15, 23, 42, 0.18);
}

.bubble {
  display: grid;
  gap: 0.35rem;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: rgba(241, 245, 249, 0.85);
  color: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.bubble--ai {
  background: linear-gradient(180deg, rgba(199, 210, 254, 0.55), rgba(199, 210, 254, 0.3));
  border: 1px solid rgba(99, 102, 241, 0.25);
}

.bubble--user {
  justify-self: end;
  background: linear-gradient(180deg, rgba(34, 211, 238, 0.28), rgba(34, 211, 238, 0.18));
  border: 1px solid rgba(8, 145, 178, 0.35);
}

.bubble__meta {
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.6);
}

.bubble__text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.6;
}

.typing {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: rgba(15, 23, 42, 0.7);
  font-style: italic;
}
.dot {
  width: 6px;
  height: 6px;
  background: rgba(99, 102, 241, 0.9);
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.2s infinite ease-in-out;
}
.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.15s; }
.dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.75); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/* Composer */
.composer {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  padding: 1rem;
  display: grid;
  gap: 0.9rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 25px 45px rgba(15, 23, 42, 0.15);
}

textarea {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  padding: 0.85rem 1rem;
  font-size: 1rem;
  resize: vertical;
  min-height: 120px;
  outline: none;
  background: rgba(248, 250, 252, 0.9);
}

textarea:focus {
  border-color: rgba(99, 102, 241, 0.6);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
}

.composer__actions {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
}

.composer__right {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.composer__clear,
.composer__send,
.composer__ghost {
  border: none;
  border-radius: 999px;
  padding: 0.65rem 1.2rem;
  font-weight: 700;
  cursor: pointer;
}

.composer__clear {
  background: rgba(148, 163, 184, 0.2);
  color: #0f172a;
}

.composer__ghost {
  background: rgba(99, 102, 241, 0.12);
  color: #3730a3;
}

.composer__send {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
}

.composer__send:disabled {
  opacity: 0.7;
  cursor: progress;
}

.error {
  margin: 0;
  text-align: left;
  color: #dc2626;
  font-weight: 600;
}

/* Utility scrollbars */
.sidebar__list::-webkit-scrollbar,
.conversation::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
.sidebar__list::-webkit-scrollbar-thumb,
.conversation::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.5);
  border-radius: 8px;
}
</style>