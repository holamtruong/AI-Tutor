<template>
  <div class="screen">
    <Navbar />

    <main class="container">
      <header class="header">
        <h1>Trò chuyện cùng EngChat</h1>
        <p>
          Đặt câu hỏi về ngữ pháp, từ vựng hoặc xin gợi ý bài học. EngChat sẽ
          trả lời dựa trên thông tin mới nhất và trình độ của bạn.
        </p>
      </header>

      <section class="conversation" ref="conversationRef">
        <article v-for="message in messages" :key="message.id" class="bubble" :class="`bubble--${message.sender}`">
          <span class="bubble__meta">
            {{ message.sender === "user" ? "Bạn" : "EngChat" }} •
            {{ formatTime(message.timestamp) }}
          </span>
          <p class="bubble__text">{{ message.content }}</p>
        </article>
        <div v-if="isSending" class="typing">EngChat đang soạn câu trả lời...</div>
      </section>

      <form class="composer" @submit.prevent="sendMessage">
        <textarea
          v-model="draft"
          rows="3"
          placeholder="Nhập tin nhắn..."
          :disabled="isSending"
          required
        ></textarea>
        <div class="composer__actions">
          <button class="composer__clear" type="button" @click="clearHistory">
            Xóa hội thoại
          </button>
          <button class="composer__send" type="submit" :disabled="isSending || !draft.trim()">
            Gửi
          </button>
        </div>
      </form>

      <p v-if="error" class="error">{{ error }}</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
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

const router = useRouter();

const messages = ref<ChatMessage[]>([]);
const draft = ref("");
const isSending = ref(false);
const error = ref("");
const conversationRef = ref<HTMLElement | null>(null);

const scrollToBottom = () => {
  window.requestAnimationFrame(() => {
    const el = conversationRef.value;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  });
};

watch(messages, () => {
  saveChatHistory(messages.value);
  scrollToBottom();
});

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const addMessage = (message: ChatMessage) => {
  messages.value = [...messages.value, message];
};

const sendMessage = async () => {
  if (!draft.value.trim() || isSending.value) {
    return;
  }

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

const clearHistory = () => {
  messages.value = [];
  clearChatHistory();
};

onMounted(() => {
  if (!hasCompletedOnboarding()) {
    router.replace("/");
    return;
  }

  const stored = getChatHistory();
  if (stored.length) {
    messages.value = stored;
  } else {
    messages.value = [
      {
        id: crypto.randomUUID(),
        content:
          "Xin chào! Tôi là EngChat, gia sư AI của bạn. Tôi có thể giúp bạn giải thích ngữ pháp, gợi ý bài học hoặc luyện hội thoại.",
        sender: "ai",
        timestamp: Date.now(),
      },
    ];
  }

  scrollToBottom();
});
</script>

<style scoped>
.screen {
  min-height: 100vh;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(14px);
}

.container {
  max-width: 920px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
  display: grid;
  gap: 1.5rem;
}

.header {
  display: grid;
  gap: 0.75rem;
  text-align: center;
  color: #0f172a;
}

.header h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3rem);
}

.header p {
  margin: 0 auto;
  max-width: 560px;
  color: rgba(15, 23, 42, 0.7);
  line-height: 1.6;
}

.conversation {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 24px;
  padding: 1.5rem;
  display: grid;
  gap: 1rem;
  max-height: 460px;
  overflow-y: auto;
  box-shadow: 0 25px 45px rgba(15, 23, 42, 0.25);
}

.bubble {
  display: grid;
  gap: 0.35rem;
  padding: 1rem;
  border-radius: 18px;
  background: rgba(241, 245, 249, 0.85);
  color: #0f172a;
}

.bubble--ai {
  background: rgba(199, 210, 254, 0.45);
  border: 1px solid rgba(99, 102, 241, 0.25);
}

.bubble--user {
  justify-self: end;
  background: rgba(34, 211, 238, 0.2);
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
  font-size: 0.85rem;
  color: rgba(15, 23, 42, 0.7);
  font-style: italic;
}

.composer {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 24px;
  padding: 1.25rem;
  display: grid;
  gap: 1rem;
  box-shadow: 0 25px 45px rgba(15, 23, 42, 0.25);
}

textarea {
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  padding: 0.85rem 1rem;
  font-size: 1rem;
  resize: vertical;
  min-height: 120px;
}

.composer__actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.composer__clear,
.composer__send {
  border: none;
  border-radius: 999px;
  padding: 0.7rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
}

.composer__clear {
  background: rgba(148, 163, 184, 0.25);
  color: #0f172a;
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
  text-align: center;
  color: #dc2626;
  font-weight: 600;
}
</style>
