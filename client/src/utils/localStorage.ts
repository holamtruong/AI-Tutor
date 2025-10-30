import {
  CHAT_ACTIVE_CONVERSATION_KEY,
  CHAT_HISTORY_KEY,
  ASSIGNMENTS_HISTORY_KEY,
} from "@/constants";

export interface UserPreferences {
  fullName?: string;
  gender?: string;
  age?: number;
  proficiencyLevel?: number;
  voicePreference?: string;
  hasCompletedOnboarding?: boolean;
  userId?: string;
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

export interface AssignmentRecord {
  id: string;
  type: string;
  topic: string;
  score: number;
  createdAt: number;
  userId: string;
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

export const getOrCreateUserId = (): string => {
  if (!isBrowser()) {
    return "";
  }

  const prefs = getUserPreferences();
  if (prefs.userId) {
    return prefs.userId;
  }

  const generated = crypto.randomUUID();
  saveUserPreferences({ userId: generated });
  return generated;
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

const normalizeAssignments = (value: unknown): AssignmentRecord[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const isAssignment = (entry: unknown): entry is AssignmentRecord => {
    if (!entry || typeof entry !== "object") {
      return false;
    }

    const candidate = entry as Record<string, unknown>;
    return (
      typeof candidate.id === "string" &&
      typeof candidate.type === "string" &&
      typeof candidate.topic === "string" &&
      typeof candidate.score === "number" &&
      typeof candidate.createdAt === "number" &&
      typeof candidate.userId === "string"
    );
  };

  if (value.every(isAssignment)) {
    return value as AssignmentRecord[];
  }

  return undefined;
};

const readAssignmentsStore = (): AssignmentRecord[] => {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(ASSIGNMENTS_HISTORY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return normalizeAssignments(parsed) ?? [];
  } catch (error) {
    console.error("Failed to read assignments history", error);
    return [];
  }
};

const writeAssignmentsStore = (records: AssignmentRecord[]) => {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.setItem(ASSIGNMENTS_HISTORY_KEY, JSON.stringify(records));
  } catch (error) {
    console.error("Failed to write assignments history", error);
  }
};

export const getAssignments = (userId?: string): AssignmentRecord[] => {
  const targetId = userId ?? getOrCreateUserId();
  if (!targetId) {
    return [];
  }
  return readAssignmentsStore().filter((record) => record.userId === targetId);
};

export const saveAssignments = (assignments: AssignmentRecord[], userId?: string) => {
  const targetId = userId ?? getOrCreateUserId();
  if (!targetId) {
    return;
  }

  const others = readAssignmentsStore().filter((record) => record.userId !== targetId);
  writeAssignmentsStore([
    ...assignments.map((record) => ({ ...record, userId: targetId })),
    ...others,
  ]);
};

export const addAssignmentRecord = (assignment: {
  id?: string;
  type: string;
  topic: string;
  score: number;
}) => {
  const userId = getOrCreateUserId();
  if (!userId) {
    return undefined;
  }

  const history = getAssignments(userId);
  const record: AssignmentRecord = {
    id: assignment.id ?? crypto.randomUUID(),
    type: assignment.type,
    topic: assignment.topic,
    score: assignment.score,
    createdAt: Date.now(),
    userId,
  };

  const next = [record, ...history];
  saveAssignments(next, userId);
  return record;
};
