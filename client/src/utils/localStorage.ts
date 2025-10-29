import {
  CHAT_ACTIVE_CONVERSATION_KEY,
  CHAT_HISTORY_KEY,
} from "@/constants";

export interface UserPreferences {
  fullName?: string;
  gender?: string;
  age?: number;
  proficiencyLevel?: number;
  hasCompletedOnboarding?: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: number;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const USER_PREFERENCES_KEY = "user-preferences";

const isBrowser = () => typeof window !== "undefined";

export const getUserPreferences = (): UserPreferences => {
  if (!isBrowser()) {
    return {};
  }

  try {
    const raw = localStorage.getItem(USER_PREFERENCES_KEY);
    return raw ? (JSON.parse(raw) as UserPreferences) : {};
  } catch (error) {
    console.error("Failed to read user preferences", error);
    return {};
  }
};

export const saveUserPreferences = (
  preferences: UserPreferences
): UserPreferences => {
  if (!isBrowser()) {
    return preferences;
  }

  try {
    const current = getUserPreferences();
    const next = { ...current, ...preferences };
    localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    console.error("Failed to write user preferences", error);
    return preferences;
  }
};

export const hasCompletedOnboarding = (): boolean => {
  return Boolean(getUserPreferences().hasCompletedOnboarding);
};

const normalizeConversations = (
  value: unknown
): ChatConversation[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const looksLikeConversation = (entry: unknown): entry is ChatConversation => {
    if (!entry || typeof entry !== "object") {
      return false;
    }
    const candidate = entry as Record<string, unknown>;
    return (
      typeof candidate.id === "string" &&
      typeof candidate.title === "string" &&
      Array.isArray(candidate.messages) &&
      typeof candidate.createdAt === "number" &&
      typeof candidate.updatedAt === "number"
    );
  };

  if (value.every(looksLikeConversation)) {
    return value as ChatConversation[];
  }

  const looksLikeMessage = (entry: unknown): entry is ChatMessage => {
    if (!entry || typeof entry !== "object") {
      return false;
    }
    const candidate = entry as Record<string, unknown>;
    return (
      typeof candidate.id === "string" &&
      typeof candidate.content === "string" &&
      (candidate.sender === "user" || candidate.sender === "ai") &&
      typeof candidate.timestamp === "number"
    );
  };

  if (value.every(looksLikeMessage)) {
    const now = Date.now();
    return [
      {
        id: crypto.randomUUID(),
        title: "Cuoc tro chuyen",
        messages: value as ChatMessage[],
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  return undefined;
};

export const getChatConversations = (): ChatConversation[] => {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return normalizeConversations(parsed) ?? [];
  } catch (error) {
    console.error("Failed to read chat conversations", error);
    return [];
  }
};

export const saveChatConversations = (conversations: ChatConversation[]) => {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Failed to write chat conversations", error);
  }
};

export const getActiveConversationId = (): string => {
  if (!isBrowser()) {
    return "";
  }

  return localStorage.getItem(CHAT_ACTIVE_CONVERSATION_KEY) ?? "";
};

export const saveActiveConversationId = (id: string) => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(CHAT_ACTIVE_CONVERSATION_KEY, id);
};

export const clearChatHistory = () => {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(CHAT_HISTORY_KEY);
  localStorage.removeItem(CHAT_ACTIVE_CONVERSATION_KEY);
};
