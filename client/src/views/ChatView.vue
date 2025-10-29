<template>
  <div
    class="chat-screen"
    :class="{ 'chat-screen--sidebar-collapsed': isSidebarCollapsed }"
  >
    <Sidebar
      :collapsed="isSidebarCollapsed"
      :conversations="conversationSummaries"
      :active-id="activeConversationId"
      @toggle="toggleSidebar"
      @new-chat="startNewChat"
      @select="selectConversation"
      @delete="deleteConversation"
      @clear-all="clearAllConversations"
    />

    <main class="chat-main">
      <section class="conversation" ref="conversationRef">
        <div v-if="error" class="conversation__banner">
          {{ error }}
        </div>

        <article
          v-for="message in currentMessages"
          :key="message.id"
          class="bubble"
          :class="`bubble--${message.sender}`"
        >
          <div class="bubble__header">
            <span class="bubble__meta">
              {{ message.sender === "user" ? "Ban" : "EngChat" }} -
              {{ formatTime(message.timestamp) }}
            </span>
            <button
              class="bubble__action"
              type="button"
              title="Phat lai doan hoi thoai"
              aria-label="Phat lai doan hoi thoai"
              @click="playMessage(message)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" class="icon icon--sm">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            </button>
          </div>
          <p class="bubble__text">{{ message.content }}</p>
        </article>

        <div v-if="isSending" class="typing">
          <span class="typing__dot"></span>
          <span class="typing__dot"></span>
          <span class="typing__dot"></span>
          EngChat dang soan cau tra loi...
        </div>
      </section>

      <form class="composer" @submit.prevent="sendMessage">
        <div class="composer__input">
          <textarea
            v-model="draft"
            rows="3"
            placeholder="Nhap tin nhan cua ban..."
            :disabled="isSending"
            required
          ></textarea>
          <div class="composer__tools">
            <button
              class="icon-button"
              type="button"
              title="Ghi am giong noi"
              aria-label="Ghi am giong noi"
              @click="startVoiceInput"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
                <path
                  d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zm-5 8a5 5 0 0 0 10 0h-2a3 3 0 0 1-6 0H7zm4 6.93V21h2v-3.07a6.002 6.002 0 0 0 4.995-4.306l-1.94-.485A4 4 0 0 1 8.945 15.9l-1.94.485A6.002 6.002 0 0 0 11 17.93z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        <div class="composer__actions">
          <button class="composer__clear" type="button" @click="resetConversation">
            Dat lai doan chat
          </button>
          <button class="composer__send" type="submit" :disabled="isSending || !draft.trim()">
            Gui
          </button>
        </div>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import Sidebar from "@/components/Sidebar.vue";
import { API_DOMAIN } from "@/config";
import {
  clearChatHistory,
  getActiveConversationId,
  getChatConversations,
  hasCompletedOnboarding,
  saveActiveConversationId,
  saveChatConversations,
  type ChatConversation,
  type ChatMessage,
} from "@/utils/localStorage";
import { useRouter } from "vue-router";

const router = useRouter();

const conversations = ref<ChatConversation[]>([]);
const activeConversationId = ref("");
const draft = ref("");
const isSending = ref(false);
const error = ref("");
const isSidebarCollapsed = ref(false);
const conversationRef = ref<HTMLElement | null>(null);

const createWelcomeMessage = (): ChatMessage => ({
  id: crypto.randomUUID(),
  content:
    "Xin chao! Toi la EngChat, tro ly AI cua ban. Toi co the giai thich ngu phap, goi y bai hoc hoac luyen hoi thoai.",
  sender: "ai",
  timestamp: Date.now(),
});

const createConversation = (initialMessages: ChatMessage[] = [createWelcomeMessage()]): ChatConversation => {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    messages: initialMessages,
    createdAt: now,
    updatedAt: now,
  };
};

const generatePreview = (conversation: ChatConversation): string => {
  const last = [...conversation.messages].reverse().find((message) => message.content.trim().length);
  if (!last) {
    return "";
  }
  const normalized = last.content.replace(/\s+/g, " ").trim();
  return normalized.length > 60 ? `${normalized.slice(0, 60)}...` : normalized;
};

const currentConversation = computed(() =>
  conversations.value.find((conversation) => conversation.id === activeConversationId.value) ?? null
);

const currentMessages = computed(() => currentConversation.value?.messages ?? []);

const conversationSummaries = computed(() =>
  conversations.value.map((conversation) => ({
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt,
    preview: generatePreview(conversation),
  }))
);

const generateTitle = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) {
    return "New conversation";
  }
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}...` : trimmed;
};

const sortByUpdatedAt = (items: ChatConversation[]): ChatConversation[] =>
  [...items].sort((a, b) => b.updatedAt - a.updatedAt);

const commitConversations = (next: ChatConversation[]) => {
  const sorted = sortByUpdatedAt(next);
  conversations.value = sorted;
  saveChatConversations(sorted);
  saveActiveConversationId(activeConversationId.value);
};

const setActiveConversation = (id: string) => {
  activeConversationId.value = id;
  saveActiveConversationId(id);
  nextTick(() => scrollToBottom());
};

const scrollToBottom = () => {
  window.requestAnimationFrame(() => {
    const element = conversationRef.value;
    if (!element) {
      return;
    }
    element.scrollTop = element.scrollHeight;
  });
};

watch(
  currentMessages,
  () => {
    nextTick(() => scrollToBottom());
  },
  { deep: true }
);

watch(activeConversationId, () => {
  nextTick(() => scrollToBottom());
});

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const playMessage = (message: ChatMessage) => {
  console.info("[TTS] Play message", message.id);
};

const startVoiceInput = () => {
  console.info("[STT] Start voice input");
};

const startNewChat = () => {
  error.value = "";
  draft.value = "";
  const conversation = createConversation();
  commitConversations([conversation, ...conversations.value]);
  setActiveConversation(conversation.id);
};

const appendMessageToActive = (message: ChatMessage) => {
  const id = activeConversationId.value;
  if (!id) {
    return;
  }

  const next = conversations.value.map((conversation) => {
    if (conversation.id !== id) {
      return conversation;
    }

    const nextMessages = [...conversation.messages, message];
    const nextTitle =
      conversation.messages.length === 0 && message.sender === "user"
        ? generateTitle(message.content)
        : conversation.title;

    return {
      ...conversation,
      title: nextTitle,
      messages: nextMessages,
      updatedAt: message.timestamp,
    };
  });

  commitConversations(next);
};

const ensureActiveConversation = () => {
  if (currentConversation.value) {
    return;
  }
  startNewChat();
};

const sendMessage = async () => {
  const text = draft.value.trim();
  if (!text || isSending.value) {
    return;
  }

  ensureActiveConversation();

  draft.value = "";
  error.value = "";

  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    content: text,
    sender: "user",
    timestamp: Date.now(),
  };

  appendMessageToActive(userMessage);
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

    appendMessageToActive(aiMessage);
  } catch (error_) {
    console.error("Cannot send message", error_);
    error.value =
      error_ instanceof Error
        ? error_.message
        : "May chu dang ban, vui long thu lai sau.";
  } finally {
    isSending.value = false;
  }
};

const resetConversation = () => {
  const conversation = currentConversation.value;
  if (!conversation) {
    startNewChat();
    return;
  }

  const now = Date.now();
  const next = conversations.value.map((item) =>
    item.id === conversation.id
      ? {
          ...item,
          messages: [createWelcomeMessage()],
          updatedAt: now,
        }
      : item
  );

  commitConversations(next);
  error.value = "";
  nextTick(() => scrollToBottom());
};

const deleteConversation = (id: string) => {
  const filtered = conversations.value.filter((conversation) => conversation.id !== id);

  if (!filtered.length) {
    const conversation = createConversation();
    commitConversations([conversation]);
    setActiveConversation(conversation.id);
    error.value = "";
    draft.value = "";
    return;
  }

  commitConversations(filtered);
  if (activeConversationId.value === id) {
    setActiveConversation(filtered[0].id);
  }
  error.value = "";
};

const clearAllConversations = () => {
  clearChatHistory();
  const conversation = createConversation();
  commitConversations([conversation]);
  setActiveConversation(conversation.id);
  draft.value = "";
  error.value = "";
};

const selectConversation = (id: string) => {
  if (id === activeConversationId.value) {
    return;
  }
  if (!conversations.value.some((conversation) => conversation.id === id)) {
    return;
  }
  setActiveConversation(id);
  error.value = "";
};

const formatTime = (timestamp: number) => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
  return formatter.format(new Date(timestamp));
};

onMounted(() => {
  if (!hasCompletedOnboarding()) {
    router.replace("/");
    return;
  }

  const storedConversations = getChatConversations();
  const storedActiveId = getActiveConversationId();

  if (storedConversations.length) {
    commitConversations(storedConversations);
    const fallbackId = conversations.value[0]?.id ?? "";
    if (fallbackId) {
      const hasStoredActive = conversations.value.some(
        (conversation) => conversation.id === storedActiveId
      );
      setActiveConversation(hasStoredActive ? storedActiveId : fallbackId);
    }
  } else {
    const conversation = createConversation();
    commitConversations([conversation]);
    setActiveConversation(conversation.id);
  }
});
</script>

<style scoped>
.chat-screen {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px 1fr;
  background: #f1f5f9;
  transition: grid-template-columns 0.25s ease;
}

.chat-screen--sidebar-collapsed {
  grid-template-columns: 90px 1fr;
}

.chat-main {
  height: 100vh;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 1.25rem;
  padding: 1.5rem;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  overflow: hidden;
}

.conversation {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 22px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
}

.conversation__banner {
  padding: 0.75rem 1rem;
  border-radius: 16px;
  background: rgba(220, 38, 38, 0.12);
  color: #991b1b;
  font-weight: 600;
  font-size: 0.9rem;
}

.bubble {
  display: grid;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-radius: 20px;
  max-width: min(640px, 100%);
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
}

.bubble__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.bubble__meta {
  font-size: 0.8rem;
  color: rgba(15, 23, 42, 0.55);
  letter-spacing: 0.01em;
}

.bubble__action {
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.12);
  color: #4338ca;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.bubble__action:hover {
  background: rgba(79, 70, 229, 0.18);
  color: #312e81;
}

.bubble__text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 1rem;
}

.bubble--ai {
  align-self: flex-start;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #0f172a;
}

.bubble--user {
  align-self: flex-end;
  background: linear-gradient(135deg, #2563eb, #6366f1);
  color: #ffffff;
}

.bubble--user .bubble__meta {
  color: rgba(255, 255, 255, 0.7);
}

.bubble--user .bubble__action {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.typing {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #475569;
}

.typing__dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #6366f1;
  animation: typingPulse 1.2s infinite ease-in-out;
}

.typing__dot:nth-child(2) {
  animation-delay: 0.15s;
}

.typing__dot:nth-child(3) {
  animation-delay: 0.3s;
}

.composer {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 26px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.14);
}

.composer__input {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  align-items: flex-end;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 20px;
  padding: 0.75rem 0.75rem 0.75rem 1rem;
  background: #f8fafc;
}

textarea {
  border: none;
  background: transparent;
  resize: none;
  min-height: 80px;
  max-height: 220px;
  font-size: 1rem;
  line-height: 1.5;
  color: #0f172a;
}

textarea:focus {
  outline: none;
}

.composer__tools {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-button {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: #ffffff;
  color: #1f2937;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.icon-button:hover {
  background: #e0e7ff;
  border-color: rgba(99, 102, 241, 0.45);
  color: #4338ca;
}

.icon {
  width: 20px;
  height: 20px;
  display: block;
  fill: currentColor;
}

.icon--sm {
  width: 16px;
  height: 16px;
}

.composer__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.composer__clear,
.composer__send {
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1.6rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.composer__clear {
  background: rgba(148, 163, 184, 0.22);
  color: #0f172a;
}

.composer__clear:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(148, 163, 184, 0.25);
}

.composer__send {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #ffffff;
  min-width: 110px;
}

.composer__send:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(79, 70, 229, 0.35);
}

.composer__send:disabled {
  opacity: 0.65;
  cursor: progress;
  transform: none;
  box-shadow: none;
}

@keyframes typingPulse {
  0%,
  80%,
  100% {
    opacity: 0.2;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@media (max-width: 960px) {
  .chat-screen {
    grid-template-columns: 1fr;
  }

  .chat-main {
    height: auto;
    padding: 1rem;
  }

  .conversation {
    max-height: 60vh;
  }
}
</style>
