import { CHAT_HISTORY_KEY } from "@/constants";

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

const STORAGE_KEY = "user-preferences";

export const getUserPreferences = (): UserPreferences => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserPreferences) : {};
  } catch (error) {
    console.error("Không thể đọc thông tin người dùng từ localStorage", error);
    return {};
  }
};

export const saveUserPreferences = (
  preferences: UserPreferences
): UserPreferences => {
  if (typeof window === "undefined") {
    return preferences;
  }

  try {
    const current = getUserPreferences();
    const next = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    console.error("Không thể lưu thông tin người dùng", error);
    return preferences;
  }
};

export const hasCompletedOnboarding = (): boolean => {
  return Boolean(getUserPreferences().hasCompletedOnboarding);
};

export const getChatHistory = (): ChatMessage[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch (error) {
    console.error("Không thể đọc lịch sử trò chuyện", error);
    return [];
  }
};

export const saveChatHistory = (history: ChatMessage[]) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Không thể lưu lịch sử trò chuyện", error);
  }
};

export const clearChatHistory = () => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(CHAT_HISTORY_KEY);
};
