<template>
  <div
    class="chat-screen"
    :class="{ 'chat-screen--sidebar-collapsed': isSidebarCollapsed }"
  >
    <Sidebar
      :collapsed="isSidebarCollapsed"
      :conversations="conversationSummaries"
      :active-id="activeConversationId"
      :user-name="userDisplayName"
      @toggle="toggleSidebar"
      @new-chat="startNewChat"
      @select="selectConversation"
      @delete="deleteConversation"
      @clear-all="clearAllConversations"
      @open-account="openAccountModal"
    />

    <!-- Mobile-only navbar shown when sidebar is collapsed -->
    <header class="mobile-navbar" v-if="isSidebarCollapsed">
      <div class="mobile-navbar__brand">
        <span class="brand__icon">EC</span>
        <strong class="brand__text">AI Tutor</strong>
      </div>
      <button
        class="mobile-navbar__toggle"
        type="button"
        aria-label="Má»Ÿ thanh bÃªn"
        @click="toggleSidebar"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
          <rect x="3" y="4" width="4" height="16" rx="1" />
          <rect x="9" y="6" width="12" height="4" rx="1" />
          <rect x="9" y="14" width="12" height="4" rx="1" />
        </svg>
      </button>
    </header>

    <main class="chat-main">
      <section class="conversation" ref="conversationRef">
        <div v-if="error" class="conversation__banner">
          {{ error }}
        </div>

        <!-- Centered welcome prompt when a conversation has no messages yet -->
        <div v-if="currentMessages.length === 0" class="welcome" aria-live="polite">
          <div class="welcome__card">
            <h2 class="welcome__title">AI Tutor</h2>
            <p class="welcome__text">{{ welcomeText }}</p>
          </div>
        </div>

        <article
          v-for="message in currentMessages"
          :key="message.id"
          class="bubble"
          :class="`bubble--${message.sender}`"
        >
          <div class="bubble__header">
            <span class="bubble__meta">
              {{ message.sender === "user" ? "Báº¡n" : "AI Tutor" }} -
              {{ formatTime(message.timestamp) }}
            </span>
            <button
              class="bubble__action"
              type="button"
              title="PhÃ¡t láº¡i Ä‘oáº¡n há»™i thoáº¡i"
              aria-label="PhÃ¡t láº¡i Ä‘oáº¡n há»™i thoáº¡i"
              @click="playMessage(message)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" class="icon icon--sm">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            </button>
          </div>
          <p class="bubble__text">
            <template
              v-for="(token, index) in tokenizeMessageContent(message.content)"
              :key="`${message.id}-${index}`"
            >
              <button
                v-if="token.type === 'word'"
                type="button"
                class="bubble__token bubble__token--word"
                @click="handleWordLookup(token.lookup ?? token.display, $event)"
              >
                {{ token.display }}
              </button>
              <span v-else class="bubble__token bubble__token--text">{{ token.display }}</span>
            </template>
          </p>
        </article>

        <div v-if="isSending" class="typing" aria-live="polite">
          <span class="typing__dot"></span>
          <span class="typing__dot"></span>
          <span class="typing__dot"></span>
          AI Tutor Ä‘ang soáº¡n cÃ¢u tráº£ lá»i...
        </div>
        <div
          v-if="vocabPopover.visible"
          class="vocab-popover"
          ref="vocabPopoverRef"
          :style="vocabPopoverStyle"
        >
          <header class="vocab-popover__header">
            <div class="vocab-popover__title">
              <strong>{{ vocabPopover.keyword }}</strong>
              <button
                v-if="canSpeakVocab"
                type="button"
                class="vocab-popover__audio"
                :title="isVocabSpeaking ? 'Äang phÃ¡t...' : 'PhÃ¡t Ã¢m'"
                :aria-label="isVocabSpeaking ? 'Äang phÃ¡t' : 'PhÃ¡t Ã¢m'"
                :disabled="isVocabSpeaking"
                @click="speakVocabWord"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" class="icon icon--sm">
                  <path
                    d="M5 9v6h3l4 4V5L8 9H5Zm11.5 3a2.5 2.5 0 0 0-1.5-2.296v4.592A2.5 2.5 0 0 0 16.5 12Zm-1.5-6.32v2.073A4.5 4.5 0 0 1 18.5 12a4.5 4.5 0 0 1-3.5 4.247v2.073A6.5 6.5 0 0 0 20.5 12 6.5 6.5 0 0 0 15 5.68Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
            <button
              class="vocab-popover__close"
              type="button"
              aria-label="ÄÃ³ng giáº£i nghÄ©a"
              @click="closeVocabPopover"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
                <path
                  d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12l-5.775 5.775a1 1 0 1 0 1.414 1.414L12 13.414l5.775 5.775a1 1 0 0 0 1.414-1.414L13.414 12l5.775-5.775a1 1 0 0 0-1.414-1.414L12 10.586Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </header>
          <div class="vocab-popover__body">
            <div v-if="vocabPopover.loading" class="vocab-popover__status">Äang tra cá»©u...</div>
            <div
              v-else-if="vocabPopover.error"
              class="vocab-popover__status vocab-popover__status--error"
            >
              {{ vocabPopover.error }}
            </div>
            <div v-else class="vocab-popover__content" v-html="vocabPopoverHtml"></div>
          </div>
        </div>
      </section>

      <form class="composer" @submit.prevent="sendMessage">
        <div class="composer__input" :class="{ 'composer__input--listening': isRecording }">
          <textarea
            v-model="draft"
            rows="3"
            placeholder="Nháº­p tin nháº¯n cá»§a báº¡n..."
            :disabled="isSending"
            @keydown.enter.exact="onEnterKey"
            @compositionstart="onCompositionStart"
            @compositionend="onCompositionEnd"
            required
          ></textarea>
          <div class="composer__tools">
            <button
               class="icon-button"
               :class="{ 'icon-button--recording': isRecording }"
               type="button"
               :title="isRecording ? 'Dá»«ng nghe' : 'Ghi Ã¢m giá»ng nÃ³i'"
               :aria-label="isRecording ? 'Dá»«ng nghe' : 'Ghi Ã¢m giá»ng nÃ³i'"
               :aria-pressed="isRecording ? 'true' : 'false'"
               @click="isRecording ? stopVoiceInput(true) : startVoiceInput()"
            >
              <svg v-if="!isRecording" viewBox="0 0 24 24" aria-hidden="true" class="icon">
                <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zm-5 9a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.93V21h-2v-3.07A7 7 0 0 1 5 11h2z" fill="currentColor" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true" class="icon">
                <rect x="6" y="6" width="12" height="12" rx="2" fill="#ffffff" />
              </svg>
            </button>
            <!-- Auto mode toggle shown to the right of mic when no typed text -->
            <button
              v-if="!hasText && !isRecording"
              class="icon-button auto-toggle"
              :class="{ 'icon-button--primary': autoMode }"
              type="button"
              title="Cháº¿ Ä‘á»™ tá»± Ä‘á»™ng"
              aria-label="Cháº¿ Ä‘á»™ tá»± Ä‘á»™ng"
              @click="toggleAutoMode"
            >
              <!-- waveform-lines icon -->
              <svg viewBox="0 0 24 24" aria-hidden="true" class="icon">
                <rect x="3" y="8" width="2" height="8" rx="1" fill="currentColor" />
                <rect x="7" y="5" width="2" height="14" rx="1" fill="currentColor" />
                <rect x="11" y="2" width="2" height="20" rx="1" fill="currentColor" />
                <rect x="15" y="5" width="2" height="14" rx="1" fill="currentColor" />
                <rect x="19" y="8" width="2" height="8" rx="1" fill="currentColor" />
              </svg>
            </button>
            <div v-if="isRecording" class="audio-wave" aria-hidden="true">
              <span
                v-for="n in 5"
                :key="n"
                class="audio-wave__bar"
                :style="audioMeterOn
                  ? { animation: 'none', height: (6 + Math.round(audioLevels[n-1] * 12)) + 'px', opacity: (0.5 + audioLevels[n-1] * 0.5) }
                  : { animationDelay: (n * 0.12) + 's' }"
              ></span>
            </div>
            <!-- Show Send button only when there is typed text (or while sending to allow Stop) -->
            <button
              class="icon-button icon-button--primary"
              type="button"
              :title="isSending ? 'Dá»«ng' : 'Gá»­i'"
              :aria-label="isSending ? 'Dá»«ng' : 'Gá»­i'"
              :disabled="!isSending && !hasText"
              @click="isSending ? stopGeneration() : sendMessage()"
              v-if="!isRecording && (isSending || hasText)"
            >
              <svg v-if="isSending" viewBox="0 0 24 24" aria-hidden="true" class="icon">
                <rect x="6" y="6" width="12" height="12" rx="2" fill="#ffffff" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true" class="icon">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="#ffffff" />
              </svg>
            </button>
          </div>
        </div>
        <div
          v-if="suggestions.length && !isSending"
          class="suggestions"
          aria-live="polite"
        >
          <button
            v-for="(s, i) in suggestions"
            :key="i"
            type="button"
            class="suggestion-chip"
            @click="useSuggestion(s)"
          >
            {{ s }}
          </button>
        </div>
      </form>
    </main>

    <transition name="modal-fade">
      <div
        v-if="isAccountModalOpen"
        class="account-modal__backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-title"
        @click.self="closeAccountModal"
      >
        <div class="account-modal">
          <header class="account-modal__header">
            <h2 id="account-modal-title">Cáº­p nháº­t thÃ´ng tin</h2>
            <button
              class="account-modal__close"
              type="button"
              aria-label="ÄÃ³ng há»™p thoáº¡i"
              @click="closeAccountModal"
            >
              <span aria-hidden="true">X</span>
            </button>
          </header>

          <form class="account-modal__form" @submit.prevent="submitAccountForm">
            <div class="account-modal__field">
              <label class="account-modal__label" for="account-full-name">TÃªn</label>
              <input
                id="account-full-name"
                type="text"
                class="account-modal__input"
                v-model="accountForm.fullName"
                placeholder="Nháº­p tÃªn cá»§a báº¡n"
                autocomplete="name"
              />
              <p v-if="accountErrors.fullName" class="account-modal__error">
                {{ accountErrors.fullName }}
              </p>
            </div>

            <div class="account-modal__field">
              <label class="account-modal__label" for="account-age">Tuá»•i</label>
              <input
                id="account-age"
                type="number"
                class="account-modal__input"
                min="7"
                max="60"
                v-model="accountForm.age"
                placeholder="Nháº­p tuá»•i"
              />
              <p v-if="accountErrors.age" class="account-modal__error">
                {{ accountErrors.age }}
              </p>
            </div>

            <div class="account-modal__field">
              <label class="account-modal__label" for="account-level">Cáº¥p Ä‘á»™</label>
              <select
                id="account-level"
                class="account-modal__input"
                v-model="accountForm.proficiencyLevel"
              >
                <option value="">Chá»n cáº¥p Ä‘á»™</option>
                <option
                  v-for="level in levels"
                  :key="level.id"
                  :value="level.id.toString()"
                >
                  {{ level.name }}
                </option>
              </select>
              <p v-if="accountErrors.proficiencyLevel" class="account-modal__error">
                {{ accountErrors.proficiencyLevel }}
              </p>
            </div>

            <div class="account-modal__field">
              <label class="account-modal__label" for="account-voice">
                Giá»ng Ä‘á»c Æ°a thÃ­ch
                <small class="account-modal__hint">
                  (nhÃ³m tiáº¿ng Anh - giá»ng máº·c Ä‘á»‹nh: ná»¯)
                </small>
              </label>
              <select
                id="account-voice"
                class="account-modal__input"
                v-model="accountForm.voicePreference"
              >
                <option value="">Tá»± Ä‘á»™ng chá»n</option>
                <option value="female">Ná»¯ (giá»ng Anh-Má»¹)</option>
                <option value="male">Nam (giá»ng Anh-Má»¹)</option>
                <option value="microsoft aria">Microsoft Aria (Female)</option>
                <option value="microsoft zira">Microsoft Zira (Female)</option>
                <option value="microsoft jenny">Microsoft Jenny (Female)</option>
                <option value="microsoft guy">Microsoft Guy (Male)</option>
                <option value="microsoft david">Microsoft David (Male)</option>
              </select>
            </div>

            <div class="account-modal__actions">
              <button
                type="button"
                class="account-modal__button account-modal__button--ghost"
                @click="closeAccountModal"
              >
                Huá»·
              </button>
              <button type="submit" class="account-modal__button account-modal__button--primary">
                LÆ°u thay Ä‘á»•i
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import Sidebar from "@/components/Sidebar.vue";
import { PROFICIENCY_LEVELS } from "@/constants";
import { API_DOMAIN } from "@/config/api";
import {
  clearChatHistory,
  getActiveConversationId,
  getChatConversations,
  getUserPreferences,
  hasCompletedOnboarding,
  saveActiveConversationId,
  saveChatConversations,
  saveUserPreferences,
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
const vocabPopoverRef = ref<HTMLDivElement | null>(null);
const isAccountModalOpen = ref(false);
const accountForm = reactive<{
  fullName: string;
  age: string;
  proficiencyLevel: string;
  voicePreference: string;
}>({
  fullName: "",
  age: "",
  proficiencyLevel: "",
  voicePreference: "",
});
const accountErrors = reactive<{ fullName: string; age: string; proficiencyLevel: string }>({
  fullName: "",
  age: "",
  proficiencyLevel: "",
});
const userDisplayName = ref("");
const voicePreference = ref("");
const levels = PROFICIENCY_LEVELS;
// Auto mode + Speech recognition state
const autoMode = ref(false);
const isRecording = ref(false);
const userStoppedRecording = ref(false);
const sttError = ref("");
const recognitionRef = ref<any | null>(null);
// Wait after last speech before auto-send (ms)
const AUTO_MODE_SILENCE_MS = 5000;
let silenceTimer: number | null = null;
const currentRequestController = ref<AbortController | null>(null);
// Suggestions and TTS state
const suggestions = ref<string[]>([]);
const speaking = ref(false);
const selectedVoice = ref<SpeechSynthesisVoice | null>(null);
// Audio metering for reactive wave
const audioMeterOn = ref(false);
const audioLevels = ref<number[]>([0, 0, 0, 0, 0]);
let audioCtx: (AudioContext | null) = null;
let audioAnalyser: (AnalyserNode | null) = null;
let audioDataArray: Uint8Array | null = null;
let audioRafId: number | null = null;
let audioStream: MediaStream | null = null;
let audioGain = 1; // adaptive gain for soft speech
// Per-bar phase to create gentle, out-of-sync motion
const audioPhases = ref<number[]>([0, 0, 0, 0, 0]);
// Slower, more relaxed phase speeds for gentler "breathing"
let audioPhaseSpeeds: number[] = [0.018, 0.015, 0.020, 0.016, 0.017];

interface DictionaryTranslateResponse {
  translatedText: string;
}

type TutorHistoryEntry = {
  role: "user" | "assistant";
  content: string;
};

interface ChatResponsePayload {
  reply: string;
  followUpQuestions?: string[];
}

interface VocabularyPopoverState {
  visible: boolean;
  keyword: string;
  loading: boolean;
  error: string;
  content: string;
  top: number;
  left: number;
}

const vocabPopover = reactive<VocabularyPopoverState>({
  visible: false,
  keyword: "",
  loading: false,
  error: "",
  content: "",
  top: 0,
  left: 0,
});

const canSpeakVocab = ref(false);
const isVocabSpeaking = ref(false);
let vocabSpeechUtterance: SpeechSynthesisUtterance | null = null;

const vocabPopoverStyle = computed(() => {
  if (!vocabPopover.visible) {
    return {};
  }
  return {
    top: `${vocabPopover.top}px`,
    left: `${vocabPopover.left}px`,
  };
});

// Split the AI response into paragraphs while preserving inline emphasis markup.
const formatTextAsHtml = (text: string) => {
  const segments = text
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (!segments.length) {
    return "";
  }
  return `<div>${segments
    .map((segment) => `<p>${segment.replace(/\n/g, "<br />")}</p>`)
    .join("")}</div>`;
};

const vocabPopoverHtml = computed(() => {
  if (!vocabPopover.content) {
    return "";
  }
  return formatTextAsHtml(vocabPopover.content);
});

// Recalculate the dictionary popover position so it never escapes the viewport.
const adjustPopoverPosition = () => {
  if (!vocabPopover.visible) {
    return;
  }
  const container = conversationRef.value;
  const popover = vocabPopoverRef.value;
  if (!container || !popover) {
    return;
  }

  const scrollLeft = container.scrollLeft;
  const containerWidth = container.clientWidth;
  const popoverWidth = popover.offsetWidth;
  const padding = 12;

  if (containerWidth <= 0) {
    return;
  }

  let clampedLeft: number;
  const minCenter = scrollLeft + padding + popoverWidth / 2;
  const maxCenter = scrollLeft + containerWidth - padding - popoverWidth / 2;

  if (maxCenter <= minCenter) {
    clampedLeft = scrollLeft + containerWidth / 2;
  } else {
    clampedLeft = Math.min(Math.max(vocabPopover.left, minCenter), maxCenter);
  }

  if (Math.abs(clampedLeft - vocabPopover.left) > 0.5) {
    vocabPopover.left = clampedLeft;
  }
};

let vocabPopoverAbort: AbortController | null = null;

// Immediately stop any ongoing speech synthesis for vocabulary playback.
const stopVocabSpeech = () => {
  if (!canSpeakVocab.value) {
    return;
  }
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  vocabSpeechUtterance = null;
  isVocabSpeaking.value = false;
};

// Hide the vocabulary popover and tear down any pending requests.
const closeVocabPopover = () => {
  if (vocabPopoverAbort) {
    vocabPopoverAbort.abort();
    vocabPopoverAbort = null;
  }
  stopVocabSpeech();
  vocabPopover.visible = false;
  vocabPopover.loading = false;
  vocabPopover.error = "";
  vocabPopover.content = "";
};

// Pronounce the selected vocabulary word via speech synthesis when available.
const speakVocabWord = () => {
  if (!canSpeakVocab.value || !vocabPopover.keyword.trim()) {
    return;
  }
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }
  stopVocabSpeech();
  const utterance = new SpeechSynthesisUtterance(vocabPopover.keyword);
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.onstart = () => {
    isVocabSpeaking.value = true;
  };
  utterance.onend = () => {
    isVocabSpeaking.value = false;
    vocabSpeechUtterance = null;
  };
  utterance.onerror = () => {
    isVocabSpeaking.value = false;
    vocabSpeechUtterance = null;
  };
  vocabSpeechUtterance = utterance;
  window.speechSynthesis.speak(utterance);
};

const handleWordLookup = async (word: string, event: MouseEvent) => {
  const normalized = word.trim();
  if (!normalized) {
    return;
  }

  const container = conversationRef.value;
  const target = event.currentTarget as HTMLElement | null;
  if (!container || !target) {
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const top = targetRect.bottom - containerRect.top + container.scrollTop + 8;
  const left =
    targetRect.left - containerRect.left + container.scrollLeft + targetRect.width / 2;

  if (vocabPopoverAbort) {
    vocabPopoverAbort.abort();
  }
  stopVocabSpeech();

  const controller = new AbortController();
  vocabPopoverAbort = controller;

  vocabPopover.visible = true;
  vocabPopover.keyword = normalized;
  vocabPopover.loading = true;
  vocabPopover.error = "";
  vocabPopover.content = "";
  vocabPopover.top = top;
  vocabPopover.left = left;

  await nextTick();
  adjustPopoverPosition();

  try {
    const response = await fetch(`${API_DOMAIN}/api/dictionary/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: normalized }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = (await response.json()) as DictionaryTranslateResponse;
    const translated = data.translatedText.trim();
    if (translated) {
      vocabPopover.content = translated;
      vocabPopover.error = "";
    } else {
      vocabPopover.content = "";
      vocabPopover.error = "KhÃ´ng tÃ¬m tháº¥y ná»™i dung phÃ¹ há»£p.";
    }
    await nextTick();
    adjustPopoverPosition();
  } catch (error_) {
    if ((error_ as Error).name === "AbortError") {
      return;
    }
    console.error("KhÃ´ng thá»ƒ tra cá»©u tá»«", error_);
    vocabPopover.content = "";
    vocabPopover.error =
      error_ instanceof Error ? error_.message : "KhÃ´ng thá»ƒ tra cá»©u, vui lÃ²ng thá»­ láº¡i.";
    await nextTick();
    adjustPopoverPosition();
  } finally {
    if (vocabPopoverAbort === controller) {
      vocabPopover.loading = false;
      vocabPopoverAbort = null;
      await nextTick();
      adjustPopoverPosition();
    }
  }
};

// Random English greetings used as centered, non-persistent prompts
const GREETINGS = [
  "Hi there! What would you like to learn today",
  "Hello! Ask me anything in English",
  "Ready to practice English Start with a question",
  "Letâ€™s chat in English Whatâ€™s on your mind",
  "Need help with grammar or vocabulary Iâ€™m here",
  "Say hi and tell me your goal today",
  "Ask me to explain, translate, or practice",
  "We can role-play a conversation Start anytime",
  "Tell me a topic you enjoy and weâ€™ll chat",
  "Type your first question to begin",
];

// Surface a random greeting so the welcome panel feels lively on every visit.
const pickGreeting = () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
const welcomeText = ref<string>(pickGreeting());

type MessageToken = {
  type: "word" | "text";
  display: string;
  lookup?: string;
};

const WORD_TOKEN_REGEX =
  /[\p{L}\p{M}\d]+(?:[-'â€™][\p{L}\p{M}\d]+)*/gu;

// Break the chat message into clickable word tokens and plain text spans.
const tokenizeMessageContent = (content: string): MessageToken[] => {
  if (!content) {
    return [];
  }

  const tokens: MessageToken[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(WORD_TOKEN_REGEX)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      tokens.push({
        type: "text",
        display: content.slice(lastIndex, matchIndex),
      });
    }

    const matched = match[0];
    tokens.push({
      type: "word",
      display: matched,
      lookup: matched.trim().toLowerCase(),
    });
    lastIndex = matchIndex + matched.length;
  }

  if (lastIndex < content.length) {
    tokens.push({
      type: "text",
      display: content.slice(lastIndex),
    });
  }

  return tokens;
};

// Bundle a conversation with metadata so it can be stored and rendered consistently.
const createConversation = (initialMessages: ChatMessage[] = []): ChatConversation => {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    messages: initialMessages,
    createdAt: now,
    updatedAt: now,
  };
};

// Build the short preview shown in the sidebar using the last non-empty message.
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



const hasText = computed(() => draft.value.trim().length > 0);
const isComposing = ref(false);
// Keep track of IME composition so Enter does not prematurely submit drafts.
const onCompositionStart = () => { isComposing.value = true; };
const onCompositionEnd = () => { isComposing.value = false; };
// Submit the message when Enter is pressed outside of composition mode.
const onEnterKey = (e: KeyboardEvent) => {
  if (isComposing.value) return;
  // Only send when not currently sending and there is text
  if (isSending.value) return;
  if (!draft.value.trim()) return;
  e.preventDefault();
  sendMessage();
};

const conversationSummaries = computed(() =>
  conversations.value.map((conversation) => ({
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt,
    preview: generatePreview(conversation),
  }))
);

// Create a short, human friendly conversation title from the latest user input.
const generateTitle = (text: string): string => {
  const maxLen = 32; // shorter for quick scan
  if (!text) return "New conversation";

  // Normalize whitespace
  let s = text.replace(/\s+/g, " ").trim();

  // Strip URLs
  s = s.replace(/https?:\/\/\S+/gi, "").trim();

  // Strip basic markdown and link syntax
  s = s
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[`*_>#]/g, "")
    .trim();

  // Remove most emoji/pictographs (astral plane)
  s = s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "").trim();

  if (!s) return "New conversation";

  // Split into sentences, preserving end punctuation when possible
  const sentenceMatches = s.match(/[^.!?ã€‚ï¼Ÿï¼â€¦]+[.!?ã€‚ï¼Ÿï¼â€¦]?/g) || [s];

  // Prefer the first question sentence
  const firstQuestion = sentenceMatches.find((seg) => /[?ï¼Ÿ]$/.test(seg.trim()));
  let candidateRaw = (firstQuestion || sentenceMatches[0] || s).trim();

  // Prefer the first clause before comma/colon/dash if it carries meaning
  const clause = candidateRaw.split(/[,:;\-â€“â€”]/)[0].trim();
  if (clause && clause.split(" ").length >= 2) {
    candidateRaw = clause;
  }

  // Remove leading fillers for brevity (simple heuristics, VI + EN)
  const cleaned = candidateRaw
    .replace(/^(cho (mÃ¬nh|em) há»i|mÃ¬nh muá»‘n há»i|hÃ£y|lÃ m Æ¡n|báº¡n cÃ³ thá»ƒ|vui lÃ²ng|could you|can you|would you)\s+/i, "")
    .replace(/^[:\-\s]+/, "")
    .trim();

  // Remove enclosing quotes and trailing punctuation
  const dequoted = cleaned
    .replace(/^['"â€œâ€â€˜â€™`\(\[]+|['"â€œâ€â€˜â€™`\)\]]+$/g, "")
    .replace(/[.!?ã€‚ï¼Ÿï¼â€¦]+$/, "");

  // Remove all punctuation for a cleaner, glanceable title
  const depunct = dequoted.replace(/[\.,!\?;:ã€ã€‚ï¼Œï¼Žï¼ï¼Ÿï¼šï¼›â€¦\-â€“â€”\(\)\[\]\{\}'"â€œâ€â€˜â€™]/g, "");

  // Final normalize spaces and crop
  const normalized = depunct.replace(/\s+/g, " ").trim();
  if (!normalized) return "New conversation";

  return normalized.length > maxLen ? `${normalized.slice(0, maxLen)}...` : normalized;
};

// Stable helper for ordering conversations with the freshest at the top.
const sortByUpdatedAt = (items: ChatConversation[]): ChatConversation[] =>
  [...items].sort((a, b) => b.updatedAt - a.updatedAt);

// Single place to update the reactive array and mirror the change into localStorage.
const commitConversations = (next: ChatConversation[]) => {
  const sorted = sortByUpdatedAt(next);
  conversations.value = sorted;
  saveChatConversations(sorted);
  saveActiveConversationId(activeConversationId.value);
};

// Remember which conversation the user is looking at and ensure the view scrolls.
const setActiveConversation = (id: string) => {
  activeConversationId.value = id;
  saveActiveConversationId(id);
  nextTick(() => scrollToBottom());
};

// Keep the latest assistant reply and user input in view inside the message panel.
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

// Refresh the visible name and preferred voice from whatever is stored on disk.
const syncUserNameFromPreferences = () => {
  const prefs = getUserPreferences();
  userDisplayName.value = prefs.fullName?.trim() ?? "";
  const rawVoicePref =
    typeof prefs.voicePreference === "string" && prefs.voicePreference.trim()
      ? prefs.voicePreference
      : typeof prefs.gender === "string"
        ? prefs.gender
        : "";
  voicePreference.value =
    typeof rawVoicePref === "string" ? rawVoicePref.trim().toLowerCase() : "";
  return prefs;
};

// Shared reset so every submission attempt starts with a clean validation state.
const resetAccountErrors = () => {
  accountErrors.fullName = "";
  accountErrors.age = "";
  accountErrors.proficiencyLevel = "";
};

// Populate the account modal form before showing it to the learner.
const loadAccountForm = () => {
  const prefs = syncUserNameFromPreferences();
  accountForm.fullName = prefs.fullName ?? "";
  accountForm.age =
    typeof prefs.age === "number" && !Number.isNaN(prefs.age) ? String(prefs.age) : "";
  accountForm.proficiencyLevel =
    typeof prefs.proficiencyLevel === "number" && !Number.isNaN(prefs.proficiencyLevel)
      ? String(prefs.proficiencyLevel)
      : "";
  accountForm.voicePreference = prefs.voicePreference ?? "";
  resetAccountErrors();
};

// Entry point triggered by sidebar/topbar buttons to reveal the account modal.
const openAccountModal = () => {
  loadAccountForm();
  isAccountModalOpen.value = true;
};

// Hide the account modal and clear any lingering error messages.
const closeAccountModal = () => {
  isAccountModalOpen.value = false;
  resetAccountErrors();
};

// Validate, persist, and surface errors for the account details form.
const submitAccountForm = () => {
  resetAccountErrors();

  const trimmedName = accountForm.fullName.trim();
  if (trimmedName.length < 2) {
    accountErrors.fullName = "Vui lÃ²ng nháº­p tÃªn há»£p lá»‡";
  }

  const ageNumber = Number.parseInt(accountForm.age, 10);
  if (!accountForm.age) {
    accountErrors.age = "Vui lÃ²ng nháº­p tuá»•i";
  } else if (Number.isNaN(ageNumber)) {
    accountErrors.age = "Tuá»•i khÃ´ng há»£p lá»‡";
  } else if (ageNumber < 7 || ageNumber > 60) {
    accountErrors.age = "Tuá»•i pháº£i náº±m trong khoáº£ng 7 Ä‘áº¿n 60";
  }

  const levelNumber = Number.parseInt(accountForm.proficiencyLevel, 10);
  if (!accountForm.proficiencyLevel) {
    accountErrors.proficiencyLevel = "Vui lÃ²ng chá»n cáº¥p Ä‘á»™";
  } else if (Number.isNaN(levelNumber)) {
    accountErrors.proficiencyLevel = "Cáº¥p Ä‘á»™ khÃ´ng há»£p lá»‡";
  }

  if (accountErrors.fullName || accountErrors.age || accountErrors.proficiencyLevel) {
    return;
  }

  const trimmedVoice = accountForm.voicePreference.trim();
  const normalizedVoice = trimmedVoice.toLowerCase();

  saveUserPreferences({
    fullName: trimmedName,
    age: ageNumber,
    proficiencyLevel: levelNumber,
    voicePreference: trimmedVoice || undefined,
  });

  userDisplayName.value = trimmedName;
  voicePreference.value = normalizedVoice;
  accountForm.fullName = trimmedName;
  accountForm.age = String(ageNumber);
  accountForm.proficiencyLevel = String(levelNumber);
  accountForm.voicePreference = trimmedVoice;

  selectedVoice.value = null;
  ensureVoice();

  closeAccountModal();
};

// Collapse or expand the sidebar depending on the current viewport state.
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

// Lazily pick the most suitable speech synthesis voice based on stored preferences.
const ensureVoice = () => {
  if (typeof window === "undefined") return null;
  const synth = window.speechSynthesis;
  const pickVoice = () => {
    const voices = synth.getVoices();
    if (!voices || !voices.length) return null;
    const normalizedPref = voicePreference.value.trim().toLowerCase();
    const englishVoices = voices.filter((v) => /en/i.test(v.lang));
    const byExactName = normalizedPref
      ? englishVoices.find((voice) => voice.name.toLowerCase() === normalizedPref)
      : null;
    if (byExactName) {
      return byExactName;
    }

    const femalePattern = /female|girl|woman|zira|aria|salli|lisa|jenny|joanna|amy|olivia|emma|victoria|susan|linda|michelle/i;
    const malePattern = /male|boy|man|david|guy|brian|justin|matthew|adam|arthur|james|john|paul|ryan|michael|stephen|daniel/i;

    const wantsMale =
      normalizedPref &&
      (/^male$|^nam$|^man$|^anh$/i.test(normalizedPref) || malePattern.test(normalizedPref));
    const wantsFemale =
      normalizedPref &&
      (/^female$|^nu$|^ná»¯$|^woman$|^chi$/i.test(normalizedPref) || femalePattern.test(normalizedPref));

    if (wantsMale && !wantsFemale) {
      const maleVoice = englishVoices.find((voice) => malePattern.test(voice.name));
      if (maleVoice) return maleVoice;
    }

    if (wantsFemale && !wantsMale) {
      const femaleVoice = englishVoices.find((voice) => femalePattern.test(voice.name));
      if (femaleVoice) return femaleVoice;
    }

    const defaultFemale = englishVoices.find((voice) => femalePattern.test(voice.name));
    const defaultMale = englishVoices.find((voice) => malePattern.test(voice.name));

    return defaultFemale ?? defaultMale ?? englishVoices[0] ?? voices[0] ?? null;
  };
  if (!selectedVoice.value) {
    const v = pickVoice();
    if (v) selectedVoice.value = v;
    else {
      // Some browsers populate voices asynchronously
      window.speechSynthesis.onvoiceschanged = () => {
        const vv = pickVoice();
        if (vv) selectedVoice.value = vv;
      };
    }
  }
  return selectedVoice.value;
};

// Cancel any ongoing speech synthesis playback.
const stopSpeech = () => {
  try {
    window.speechSynthesis.cancel();
  } catch {}
  speaking.value = false;
};

// Speak a chat bubble aloud using the configured voice.
const playMessage = (message: ChatMessage) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.info("[TTS] speechSynthesis not supported");
    return;
  }
  stopSpeech();
  const voice = ensureVoice();
  const utter = new SpeechSynthesisUtterance(message.content);
  utter.lang = "en-US";
  if (voice) utter.voice = voice;
  utter.rate = 1.0;
  utter.pitch = 1.0;
  utter.onstart = () => {
    speaking.value = true;
    if (autoMode.value) {
      try { stopVoiceInput(); } catch {}
    }
  };
  utter.onend = () => {
    speaking.value = false;
    if (autoMode.value && !isSending.value && !isRecording.value) {
      try { startVoiceInput(); } catch {}
    }
  };
  utter.onerror = () => (speaking.value = false);
  try {
    window.speechSynthesis.speak(utter);
  } catch (e) {
    console.error("[TTS] speak failed", e);
  }
};

// Obtain a SpeechRecognition instance when supported by the runtime.
const ensureRecognition = () => {
  if (typeof window === "undefined") return null;
  const w = window as any;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) {
    sttError.value = "TrÃ¬nh duyá»‡t khÃ´ng há»— trá»£ nháº­n dáº¡ng giá»ng nÃ³i.";
    return null;
  }
  if (!recognitionRef.value) {
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onstart = () => {
      isRecording.value = true;
      sttError.value = "";
      try { startAudioMeter(); } catch {}
    };
    rec.onend = () => {
      isRecording.value = false;
      try { stopAudioMeter(); } catch {}
      if (userStoppedRecording.value) {
        // Don't auto-restart if user explicitly stopped
        userStoppedRecording.value = false;
        return;
      }
      if (autoMode.value && !isSending.value) {
        try { startVoiceInput(); } catch {}
      }
    };
    rec.onerror = (ev: any) => {
      isRecording.value = false;
      sttError.value = ev?.error ? String(ev.error) : "Lá»—i ghi Ã¢m";
    };
    rec.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      draft.value = transcript.trim();
      // Debounce by silence before auto-sending in auto mode
      if (autoMode.value) {
        if (silenceTimer !== null) {
          try { clearTimeout(silenceTimer); } catch {}
          silenceTimer = null;
        }
        silenceTimer = window.setTimeout(() => {
          silenceTimer = null;
          if (!autoMode.value || isSending.value) return;
          const text = draft.value.trim();
          if (!text) return;
          try { stopVoiceInput(); } catch {}
          sendMessage();
        }, AUTO_MODE_SILENCE_MS);
      }
    };
    recognitionRef.value = rec;
  }
  return recognitionRef.value;
};

// Begin listening for the learner's voice and handle silence detection.
const startVoiceInput = () => {
  const rec = ensureRecognition();
  if (!rec) return;
  userStoppedRecording.value = false;
  if (silenceTimer !== null) { try { clearTimeout(silenceTimer); } catch {} ; silenceTimer = null; }
  try { startAudioMeter(); } catch {}
  try { rec.start(); } catch {}
};

// Stop listening, optionally flagging the stop as user initiated.
const stopVoiceInput = (explicit = false) => {
  const rec = recognitionRef.value;
  if (explicit) {
    userStoppedRecording.value = true;
  }
  if (silenceTimer !== null) { try { clearTimeout(silenceTimer); } catch {} ; silenceTimer = null; }
  if (rec && isRecording.value) {
    try { rec.stop(); } catch {}
  }
  try { stopAudioMeter(); } catch {}
};

// Switch the auto mode flag and bootstrap voice capture when newly enabled.
const toggleAutoMode = () => {
  autoMode.value = !autoMode.value;
  if (autoMode.value) {
    if (!isSending.value && !isRecording.value) {
      try { startVoiceInput(); } catch {}
    }
  } else {
    try { stopVoiceInput(); } catch {}
  }
};

// Drop a suggestion into the draft input and immediately send it.
const useSuggestion = (text: string) => {
  if (isSending.value) return;
  draft.value = text;
  sendMessage();
};

// Spawn a brand-new empty conversation and make it the active thread.
const startNewChat = () => {
  error.value = "";
  draft.value = "";
  const conversation = createConversation();
  commitConversations([conversation, ...conversations.value]);
  setActiveConversation(conversation.id);
};

// Append a message to whichever conversation is selected and persist the change.
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
    const hasUserMessage = conversation.messages.some((m) => m.sender === "user");
    const nextTitle = !hasUserMessage && message.sender === "user"
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

// Guarantee there is always at least one conversation to receive messages.
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
  try { stopVoiceInput(); } catch {}

  const historyPayload: TutorHistoryEntry[] = currentMessages.value.map((message) => ({
    role: message.sender === "user" ? "user" : "assistant",
    content: message.content,
  }));

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
    const controller = new AbortController();
    currentRequestController.value = controller;
    const response = await fetch(`${API_DOMAIN}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ message: text, history: historyPayload }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = (await response.json()) as ChatResponsePayload;

    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: data.reply,
      sender: "ai",
      timestamp: Date.now(),
    };

    appendMessageToActive(aiMessage);
    // Handle suggestions if provided by API; otherwise fallback
    const fallbackSuggestions = (lastUser: string): string[] => {
      const base = [
        "Could you give me an example?",
        "Can you explain it in simpler terms?",
        "How can I practice this more?",
      ];
      const trimmed = lastUser.replace(/[^a-zA-Z ]/g, "").trim();
      if (trimmed) {
        base.unshift(`Can we discuss more about "${trimmed.split(" ").slice(-3).join(" ")}"?`);
      }
      // Ensure unique and max 4
      const uniq = Array.from(new Set(base)).filter(Boolean).slice(0, 4);
      return uniq;
    };
    suggestions.value = Array.isArray(data.followUpQuestions) && data.followUpQuestions.length
      ? data.followUpQuestions.slice(0, 4)
      : fallbackSuggestions(text);
    // Optionally auto speak AI reply for pronunciation
    try { playMessage(aiMessage); } catch {}
    // In auto mode, listening will resume after TTS ends (see utter.onend)
  } catch (error_) {
    console.error("Cannot send message", error_);
    const name = (error_ as any)?.name ?? "";
    if (name !== "AbortError") {
      error.value =
        error_ instanceof Error
          ? error_.message
          : "May chu dang ban, vui long thu lai sau.";
    }
  } finally {
    isSending.value = false;
    currentRequestController.value = null;
  }
};

// Abort the current streaming response and reset the sending indicator.
const stopGeneration = () => {
  // Abort in-flight request
  const ctl = currentRequestController.value;
  if (ctl) {
    try { ctl.abort(); } catch {}
  }
  // Stop any ongoing speech
  try { stopSpeech(); } catch {}
  isSending.value = false;
  currentRequestController.value = null;
  if (autoMode.value && !isRecording.value) {
    try { startVoiceInput(); } catch {}
  }
};

// Wipe the current conversation thread while keeping the chat session alive.
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
          messages: [],
          updatedAt: now,
        }
      : item
  );

  commitConversations(next);
  error.value = "";
  nextTick(() => scrollToBottom());
};

// Remove a conversation from the list and fall back to a new one when empty.
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

// Remove every conversation and start the user off with a blank slate.
const clearAllConversations = () => {
  clearChatHistory();
  const conversation = createConversation();
  commitConversations([conversation]);
  setActiveConversation(conversation.id);
  draft.value = "";
  error.value = "";
};

// Change the active conversation via the sidebar selection.
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

// Format message timestamps so they respect the user's locale.
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
  syncUserNameFromPreferences();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    canSpeakVocab.value = true;
  } else {
    canSpeakVocab.value = false;
  }

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

onBeforeUnmount(() => {
  stopVocabSpeech();
  if (vocabPopoverAbort) {
    vocabPopoverAbort.abort();
    vocabPopoverAbort = null;
  }
});

// Refresh greeting when switching to an empty conversation
watch(
  () => [activeConversationId.value, currentMessages.value.length],
  ([, len]) => {
    if (len === 0) {
      welcomeText.value = pickGreeting();
    }
  }
);

// Web Audio API based mic level meter (best effort; falls back if unavailable)
const startAudioMeter = async () => {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx || !navigator.mediaDevices?.getUserMedia) return;

    // Request mic stream (separate from SpeechRecognition; may fail on some browsers)
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    });

    audioCtx = new AudioCtx();
    try { await audioCtx.resume(); } catch {}
    const source = audioCtx.createMediaStreamSource(audioStream);
    audioAnalyser = audioCtx.createAnalyser();
    audioAnalyser.fftSize = 512;
    source.connect(audioAnalyser);
    audioDataArray = new Uint8Array(audioAnalyser.fftSize);

    audioMeterOn.value = true;

    const tick = () => {
      if (!audioAnalyser || !audioDataArray) return;
      audioAnalyser.getByteTimeDomainData(audioDataArray);
      // Compute RMS volume 0..1
      let sum = 0;
      for (let i = 0; i < audioDataArray.length; i++) {
        const v = audioDataArray[i] - 128;
        sum += v * v;
      }
      // Boost sensitivity further for clearer motion
      let rms = Math.min(1, Math.sqrt(sum / audioDataArray.length) / 18);
      // Adaptive gain: boost when too quiet, decay when loud
      const target = 0.45; // target normalized level
      const eff = rms * audioGain;
      if (eff < target) {
        audioGain = Math.min(4.0, audioGain * 1.02);
      } else if (eff > 0.7) {
        audioGain = Math.max(1.0, audioGain * 0.995);
      } else {
        audioGain = Math.max(1.0, audioGain * 0.999);
      }
      // Gentle non-linear gain to lift quieter speech
      rms = Math.min(1, Math.pow(rms * audioGain, 0.65) * 1.2);

      // Update bar phases for desynchronized, breathing motion
      const phases = audioPhases.value.slice();
      for (let i = 0; i < phases.length; i++) {
        phases[i] += audioPhaseSpeeds[i];
        if (phases[i] > Math.PI * 2) phases[i] -= Math.PI * 2;
      }
      audioPhases.value = phases;

      // Base per-bar gains (center slightly amplified)
      const baseGains = [1.0, 1.35, 1.75, 1.35, 1.1];
      const targets = baseGains.map((g, i) => {
        const wave = 0.85 + 0.15 * Math.sin(phases[i]);
        return Math.max(0, Math.min(1, rms * g * wave));
      });

      // Per-bar smoothing: faster attack, slower (softer) release; varied per bar
      const attack = [0.5, 0.52, 0.48, 0.52, 0.5]; // a bit slower attack
      const release = [0.93, 0.92, 0.94, 0.92, 0.93]; // slower decay for softer motion
      const maxDelta = 0.05; // tighter per-frame cap for smoothness

      const nextLevels = audioLevels.value.map((prev, i) => {
        const target = targets[i];
        const a = target > prev ? attack[i] : release[i];
        let next = prev * a + target * (1 - a);
        const delta = next - prev;
        if (delta > maxDelta) next = prev + maxDelta;
        else if (delta < -maxDelta) next = prev - maxDelta;
        return next;
      });
      audioLevels.value = nextLevels;
      audioRafId = window.requestAnimationFrame(tick);
    };
    audioRafId = window.requestAnimationFrame(tick);
  } catch (e) {
    // If metering fails (permissions or device busy), keep fallback animation
    audioMeterOn.value = false;
  }
};

// Tear down the waveform animation loop when recording stops.
const stopAudioMeter = () => {
  audioMeterOn.value = false;
  if (audioRafId != null) {
    try { cancelAnimationFrame(audioRafId); } catch {}
    audioRafId = null;
  }
  if (audioCtx) {
    try { audioCtx.close(); } catch {}
    audioCtx = null;
  }
  if (audioStream) {
    try { audioStream.getTracks().forEach((t) => t.stop()); } catch {}
    audioStream = null;
  }
  audioAnalyser = null;
  audioDataArray = null;
};
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
  position: relative;
}

/* Centered welcome prompt when a conversation is empty */
.welcome {
  min-height: 46vh;
  display: grid;
  place-items: center;
}
.welcome__card {
  text-align: center;
  max-width: 560px;
  padding: 1.25rem 1.5rem;
  border-radius: 18px;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
}
.welcome__title {
  margin: 0 0 0.35rem 0;
  font-weight: 800;
  letter-spacing: 0.02em;
}
.welcome__text {
  margin: 0;
  font-size: 1.05rem;
  opacity: 0.9;
}

/* Mobile navbar (only visible on small screens when sidebar is collapsed) */
.mobile-navbar {
  display: none;
}

.mobile-navbar .icon { width: 20px; height: 20px; }

.mobile-navbar__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.mobile-navbar .brand__icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
}

.mobile-navbar__toggle {
  border: none;
  background: rgba(241, 245, 249, 0.9);
  border-radius: 10px;
  padding: 0.5rem;
  cursor: pointer;
  color: #0f172a;
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
  position: relative;
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

.bubble__token {
  display: inline;
  font: inherit;
  color: inherit;
}

.bubble__token--text {
  white-space: pre-wrap;
}

.bubble__token--word {
  border: none;
  background: transparent;
  padding: 0 0.08rem;
  margin: -0.05rem 0;
  font: inherit;
  color: inherit;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.bubble__token--word:hover,
.bubble__token--word:focus-visible {
  outline: none;
  background: rgba(99, 102, 241, 0.12);
  box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.25);
}

.bubble--user .bubble__token--word:hover,
.bubble--user .bubble__token--word:focus-visible {
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.35);
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

.vocab-popover {
  position: absolute;
  width: min(320px, calc(100% - 24px));
  min-width: min(220px, calc(100% - 24px));
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  padding: 0.85rem 1rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(148, 163, 184, 0.25);
  transform: translate(-50%, 0);
  z-index: 30;
}

.vocab-popover::before {
  content: "";
  position: absolute;
  top: -6px;
  left: 50%;
  width: 12px;
  height: 12px;
  background: inherit;
  border-left: 1px solid rgba(148, 163, 184, 0.25);
  border-top: 1px solid rgba(148, 163, 184, 0.25);
  transform: translate(-50%, -50%) rotate(45deg);
  z-index: -1;
}

.vocab-popover__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}

.vocab-popover__title {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.vocab-popover__title strong {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

.vocab-popover__audio {
  border: none;
  background: rgba(99, 102, 241, 0.12);
  border-radius: 8px;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  color: #4338ca;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.vocab-popover__audio:hover {
  background: rgba(99, 102, 241, 0.22);
  color: #312e81;
  transform: translateY(-1px);
}

.vocab-popover__audio:focus-visible {
  outline: 2px solid rgba(99, 102, 241, 0.5);
  outline-offset: 2px;
}

.vocab-popover__audio:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.vocab-popover__close {
  border: none;
  background: rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  color: #1f2937;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.vocab-popover__close:hover {
  background: rgba(148, 163, 184, 0.32);
  transform: translateY(-1px);
}

.vocab-popover__body {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.vocab-popover__status {
  margin: 0;
  font-size: 0.9rem;
  color: #475569;
}

.vocab-popover__status--error {
  color: #dc2626;
}

.vocab-popover__content {
  font-size: 0.92rem;
  color: #0f172a;
  line-height: 1.6;
}

.vocab-popover__content :deep(p) {
  margin: 0 0 0.5rem;
}

.vocab-popover__content :deep(p:last-child) {
  margin-bottom: 0;
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
  align-items: center;
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
  /* keep textarea full-height even when grid centers items */
  align-self: stretch;
}

textarea:focus {
  outline: none;
}

.composer__tools {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  /* ensure vertical centering in the grid cell */
  align-self: center;
}

/* Subtle audio wave shown while recording */
/* Disable audio-wave visual to reduce distraction */
.audio-wave {
  display: none;
}
.audio-wave__bar {
  width: 3px;
  height: 6px;
  background: linear-gradient(180deg, #dbeafe, #3b82f6);
  border-radius: 2px;
  animation: none;
  opacity: 0.9;
}
.audio-wave__bar:nth-child(2) { animation-duration: 1.05s; }
.audio-wave__bar:nth-child(3) { animation-duration: 1.1s; }
.audio-wave__bar:nth-child(4) { animation-duration: 0.95s; }
.audio-wave__bar:nth-child(5) { animation-duration: 1.15s; }

@keyframes audioWave {
  0%, 100% { height: 6px; opacity: 0.6; }
  50% { height: 18px; opacity: 1; }
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

/* Primary variant for Send button: match + New conversation gradient */
.icon-button--primary {
  border-color: transparent;
  background: linear-gradient(135deg, #1e40af, #3730a3); /* darker blue/indigo */
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(55, 48, 163, 0.35);
}
.icon-button--primary:hover {
  background: linear-gradient(135deg, #1e3a8a, #312e81); /* slightly deeper on hover */
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(55, 48, 163, 0.45);
}
/* Keyboard focus ring for accessibility */
.icon-button--primary:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(99, 102, 241, 0.45),
    0 8px 18px rgba(99, 102, 241, 0.35);
}

  .icon {
    width: 20px;
    height: 20px;
    display: block;
    fill: currentColor;
  }

  .suggestions {
    margin-top: 0.75rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .suggestion-chip {
    border: 1px solid rgba(148, 163, 184, 0.45);
    background: #f8fafc;
    color: #334155;
    padding: 0.35rem 0.6rem;
    border-radius: 999px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }
  .suggestion-chip:hover {
    background: #eef2ff;
    border-color: rgba(99, 102, 241, 0.45);
    color: #4338ca;
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

/* Recording input glow */
/* inline stop removed; mic button is the single stop control */
.composer__input--listening {
  border: 1px solid rgba(59, 130, 246, 0.6);
  border-radius: 16px;
  padding-top: 0.5rem;
  box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.25);
  animation: glowPulse 1.5s infinite ease-in-out;
}
@keyframes glowPulse {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.25); }
  50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.14); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.25); }
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
  background: #1e3a8a; /* deep primary */
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

  /* Show a pinned navbar when sidebar is collapsed on mobile */
  .chat-screen--sidebar-collapsed .mobile-navbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  }
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

/* Recording button: primary green while listening */
.icon-button--recording {
  border-color: transparent;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(34, 197, 94, 0.28);
}
.icon-button--recording:hover {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(34, 197, 94, 0.38);
}

/* Recording button: primary green while listening */
.icon-button--recording {
  border-color: transparent;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(34, 197, 94, 0.28);
}
.icon-button--recording:hover {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(34, 197, 94, 0.38);
}
.icon {
  width: 20px;
  height: 20px;
  display: block;
  fill: currentColor;
}


/* Auto mode toggle: black when idle, green when active */
.auto-toggle {
  background: #0f172a; /* slate-900 */
  color: #ffffff;
  border-color: transparent;
}
.auto-toggle:hover {
  background: #1f2937; /* slate-800 */
  color: #ffffff;
  border-color: transparent;
}

/* Recording button: primary green while listening */
.icon-button--recording {
  border-color: transparent;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(34, 197, 94, 0.28);
}
.icon-button--recording:hover {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(34, 197, 94, 0.38);
}

/* Recording button: primary green while listening */
.icon-button--recording {
  border-color: transparent;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(34, 197, 94, 0.28);
}
.icon-button--recording:hover {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(34, 197, 94, 0.38);
}


/* Auto mode toggle: black when idle, green when active */
.auto-toggle {
  background: #0f172a; /* slate-900 */
  color: #ffffff;
  border-color: transparent;
}
.auto-toggle:hover {
  background: #1f2937; /* slate-800 */
  color: #ffffff;
  border-color: transparent;
}

/* Recording button: primary green while listening */
.icon-button--recording {
  border-color: transparent;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(34, 197, 94, 0.28);
}
.icon-button--recording:hover {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(34, 197, 94, 0.38);
}

/* Recording button: primary green while listening */
.icon-button--recording {
  border-color: transparent;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(34, 197, 94, 0.28);
}
.icon-button--recording:hover {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(34, 197, 94, 0.38);
}

@keyframes recordingPulse {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.25); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.14); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.25); }
}
/* Recording button: primary blue while listening */
.icon-button--recording {
  border-color: transparent;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(99, 102, 241, 0.28);
}
.icon-button--recording:hover {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(99, 102, 241, 0.38);
}

/* Ensure Send button gradient overrides later base .icon-button */
.icon-button.icon-button--primary {
  border-color: transparent;
  background: linear-gradient(135deg, #5A6CF2, #5A6CF2);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(55, 48, 163, 0.35);
}
.icon-button.icon-button--primary:hover {
  background: linear-gradient(135deg, #5A6CF2, #5A6CF2);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(55, 48, 163, 0.45);
}
.icon-button.icon-button--primary:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(55, 48, 163, 0.45),
    0 8px 18px rgba(55, 48, 163, 0.35);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.account-modal__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  padding: 1.5rem;
  z-index: 1200;
}

.account-modal {
  width: min(100%, 420px);
  background: #ffffff;
  border-radius: 18px;
  padding: 1.75rem;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.35);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.account-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.account-modal__header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #0f172a;
  letter-spacing: 0.01em;
}

.account-modal__close {
  border: none;
  background: rgba(148, 163, 184, 0.2);
  color: #0f172a;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.account-modal__close:hover {
  background: rgba(148, 163, 184, 0.35);
  transform: translateY(-1px);
}

.account-modal__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.account-modal__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.account-modal__label {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.95rem;
}

.account-modal__hint {
  display: block;
  font-weight: 400;
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.2rem;
}

.account-modal__hint code {
  font-family: "Fira Code", "Consolas", "SFMono-Regular", monospace;
  font-size: 0.78rem;
  background: rgba(148, 163, 184, 0.2);
  padding: 0.05rem 0.25rem;
  border-radius: 6px;
  color: #0f172a;
}

.account-modal__input {
  width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  padding: 0.65rem 0.75rem;
  font-size: 0.95rem;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.95);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.account-modal__input:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.75);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.account-modal__error {
  margin: 0;
  font-size: 0.8rem;
  color: #dc2626;
}

.account-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.account-modal__button {
  border: none;
  border-radius: 12px;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.account-modal__button--ghost {
  background: rgba(148, 163, 184, 0.2);
  color: #0f172a;
}

.account-modal__button--ghost:hover {
  background: rgba(148, 163, 184, 0.35);
  transform: translateY(-1px);
}

.account-modal__button--primary {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.3);
}

.account-modal__button--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(99, 102, 241, 0.4);
}

@media (max-width: 640px) {
  .account-modal {
    width: 100%;
    padding: 1.25rem;
  }

  .account-modal__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .account-modal__button {
    width: 100%;
  }
}
</style>



