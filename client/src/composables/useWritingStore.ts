import { ref, computed } from "vue";
import { WRITING_HISTORY_KEY } from "@/constants";
import { getOrCreateUserId } from "@/utils/localStorage";

export interface WritingSubmission {
  id: string;
  userId: string;
  title: string;
  content: string;
  charCount: number;
  score: number;
  feedback: string;
  createdAt: number;
}

const isBrowser = () => typeof window !== "undefined";

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeEntries = (value: unknown): WritingSubmission[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const looksLikeSubmission = (entry: unknown): entry is WritingSubmission => {
    if (!entry || typeof entry !== "object") {
      return false;
    }

    const candidate = entry as Record<string, unknown>;
    return (
      typeof candidate.id === "string" &&
      typeof candidate.userId === "string" &&
      typeof candidate.title === "string" &&
      typeof candidate.content === "string" &&
      typeof candidate.charCount === "number" &&
      typeof candidate.score === "number" &&
      typeof candidate.feedback === "string" &&
      typeof candidate.createdAt === "number"
    );
  };

  if (value.every(looksLikeSubmission)) {
    return value as WritingSubmission[];
  }

  return undefined;
};

const readAllSubmissions = (): WritingSubmission[] => {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(WRITING_HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return normalizeEntries(parsed) ?? [];
  } catch (error) {
    console.error("Failed to read writing history", error);
    return [];
  }
};

const writeAllSubmissions = (submissions: WritingSubmission[]) => {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.setItem(WRITING_HISTORY_KEY, JSON.stringify(submissions));
  } catch (error) {
    console.error("Failed to write writing history", error);
  }
};

export const useWritingStore = () => {
  const userId = getOrCreateUserId();
  const submissions = ref<WritingSubmission[]>([]);

  const load = () => {
    if (!userId) {
      submissions.value = [];
      return;
    }
    submissions.value = readAllSubmissions()
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  };

  const persist = () => {
    if (!userId) {
      return;
    }

    const others = readAllSubmissions().filter((entry) => entry.userId !== userId);
    writeAllSubmissions([...submissions.value, ...others]);
  };

  const addSubmission = (entry: Omit<WritingSubmission, "id" | "createdAt" | "userId">) => {
    if (!userId) {
      return undefined;
    }

    const record: WritingSubmission = {
      id: createId(),
      createdAt: Date.now(),
      userId,
      ...entry,
    };

    submissions.value = [record, ...submissions.value];
    persist();
    return record;
  };

  const updateSubmission = (id: string, update: Partial<WritingSubmission>) => {
    const index = submissions.value.findIndex((item) => item.id === id);
    if (index === -1) {
      return;
    }
    submissions.value.splice(index, 1, { ...submissions.value[index], ...update });
    persist();
  };

  load();

  return {
    submissions: computed(() => submissions.value),
    addSubmission,
    updateSubmission,
    reload: load,
  };
};
