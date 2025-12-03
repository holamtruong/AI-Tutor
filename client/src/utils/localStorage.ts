import {
  CHAT_ACTIVE_CONVERSATION_KEY,
  CHAT_HISTORY_KEY,
  ASSIGNMENTS_HISTORY_KEY,
} from "@/constants";

// Dinh nghia thong tin nguoi dung luu tren localStorage
export interface UserPreferences {
  fullName?: string;
  gender?: string;
  age?: number;
  proficiencyLevel?: number;
  voicePreference?: string;
  hasCompletedOnboarding?: boolean;
  userId?: string;
}

// Cau truc cuoc tro chuyen va tin nhan
export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: number;
}

// Cau truc toan bo cuoc tro chuyen
export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// Cau truc ban ghi bai tap
export interface AssignmentRecord {
  id: string;
  type: string;
  topic: string;
  score: number;
  createdAt: number;
  userId: string;
}

// Khoa luu tru thoi quen nguoi dung
const USER_PREFERENCES_KEY = "user-preferences";

// Kiem tra xem ma nguon co chay tren trinh duyet khong
const isBrowser = () => typeof window !== "undefined";

// Doc toan bo thoi quen nguoi dung tu localStorage
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

// Gop nhung cap nhat thoi quen nguoi dung vao ban ghi hien tai va luu lai.
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

// Xoa toan bo thoi quen nguoi dung khoi localStorage
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

// Dam bao luon co mot user id bang cach su dung lai gia tri da luu hoac tao moi
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

// Kiem tra xem nguoi dung da hoan thanh huong dan ban dau chua
export const hasCompletedOnboarding = (): boolean => {
  return Boolean(getUserPreferences().hasCompletedOnboarding);
};

// Xac thuc va chuan hoa cac cuoc tro chuyen duoc luu tru de tuong thich nguoi dung cu
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

// Ham doc toan bo lich su cuoc tro chuyen tu localStorage
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

// Ghi de toan bo lich su cuoc tro chuyen, bo qua neu khong co localStorage
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

// Ham lay id cua cuoc tro chuyen dang hoat dong
export const getActiveConversationId = (): string => {
  if (!isBrowser()) {
    return "";
  }

  return localStorage.getItem(CHAT_ACTIVE_CONVERSATION_KEY) ?? "";
};

// Luu id cua cuoc tro chuyen dang hoat dong de UI co the khoi phuc sau khi tai lai trang
export const saveActiveConversationId = (id: string) => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(CHAT_ACTIVE_CONVERSATION_KEY, id);
};

// Xoa toan bo lich su cuoc tro chuyen va chi so cuoc tro chuyen dang hoat dong
export const clearChatHistory = () => {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(CHAT_HISTORY_KEY);
  localStorage.removeItem(CHAT_ACTIVE_CONVERSATION_KEY);
};

// Xac thuc va chuan hoa cac ban ghi bai tap duoc luu tru de tuong thich voi nguoi dung cu
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

// Ham doc toan bo lich su bai tap tu localStorage
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

// Ham ghi de toan bo lich su bai tap, bo qua neu khong co localStorage
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

// Ham lay lich su bai tap cho mot nguoi dung, mac dinh la nguoi dung hien tai
export const getAssignments = (userId?: string): AssignmentRecord[] => {
  const targetId = userId ?? getOrCreateUserId();
  if (!targetId) {
    return [];
  }
  return readAssignmentsStore().filter((record) => record.userId === targetId);
};

// Ham luu toan bo lich su bai tap cho mot nguoi dung, mac dinh la nguoi dung hien tai
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

// Ham them mot ban ghi bai tap moi cho nguoi dung hien tai
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
  // Lay lich su hien tai de them vao
  const history = getAssignments(userId);
  const record: AssignmentRecord = {
    id: assignment.id ?? crypto.randomUUID(),
    type: assignment.type,
    topic: assignment.topic,
    score: assignment.score,
    createdAt: Date.now(),
    userId,
  };
  // Them ban ghi moi vao dau danh sach
  const next = [record, ...history];
  saveAssignments(next, userId);
  return record;
};
