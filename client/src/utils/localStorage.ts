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

// Read the persisted user preferences from localStorage with a safe fallback.
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

// Merge the incoming preference updates with the current snapshot and persist them.
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

// Remove every stored preference key (used on logout or onboarding reset).
export const clearUserPreferences = () => {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.removeItem(USER_PREFERENCES_KEY);
  } catch (error) {
    console.error("Failed to clear user preferences", error);
  }
};

// Ensure we always have a user id available by reusing the stored value or generating a new one.
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

// Convenience helper that answers whether the onboarding flow was already finished.
export const hasCompletedOnboarding = (): boolean => {
  return Boolean(getUserPreferences().hasCompletedOnboarding);
};

// Guard every read from localStorage so corrupted or legacy data never crashes the app.
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

// Fetch every saved conversation snapshot, shaping legacy data on the fly.
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

// Overwrite the chat history cache with the provided conversation list.
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

// Return which conversation was marked as active in the sidebar.
export const getActiveConversationId = (): string => {
  if (!isBrowser()) {
    return "";
  }

  return localStorage.getItem(CHAT_ACTIVE_CONVERSATION_KEY) ?? "";
};

// Persist the active conversation id so the UI can restore selection after reload.
export const saveActiveConversationId = (id: string) => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(CHAT_ACTIVE_CONVERSATION_KEY, id);
};

// Remove both the chat history payload and the pointer to the active conversation.
export const clearChatHistory = () => {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(CHAT_HISTORY_KEY);
  localStorage.removeItem(CHAT_ACTIVE_CONVERSATION_KEY);
};

// Verify assignments pulled from storage still resemble the expected schema.
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

// Centralised reader that gracefully handles corrupted assignment payloads.
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

// Persist a full assignment collection, ignoring the call when storage is unavailable.
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

// Collect every assignment for the given user, creating an id when none exists yet.
export const getAssignments = (userId?: string): AssignmentRecord[] => {
  const targetId = userId ?? getOrCreateUserId();
  if (!targetId) {
    return [];
  }
  return readAssignmentsStore().filter((record) => record.userId === targetId);
};

// Replace assignments for a user while keeping unrelated users untouched.
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

// Append a single assignment entry while stamping timestamps and ids automatically.
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
