export const LESSON_DRAFT_STORAGE_KEY = "chinese-study-lesson-drafts-v1";

export interface LessonDraft {
  stage: number;
  warmChoice: string;
  interactionAnswers: Record<string, string[]>;
  openResponse: string;
  openSubmitted: boolean;
  wrongAttempts: Record<number, string[]>;
  answers: string[];
}

export type LessonDrafts = Record<string, LessonDraft>;

export const emptyLessonDraft = (): LessonDraft => ({
  stage: 0,
  warmChoice: "",
  interactionAnswers: {},
  openResponse: "",
  openSubmitted: false,
  wrongAttempts: {},
  answers: [],
});

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");
const isAnswerRecord = (value: unknown): value is Record<string, string[]> => Boolean(value) && typeof value === "object" && !Array.isArray(value)
  && Object.values(value).every(isStringArray);

const isLessonDraft = (value: unknown): value is LessonDraft => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const draft = value as Partial<LessonDraft>;
  return Number.isInteger(draft.stage) && Number(draft.stage) >= 0 && Number(draft.stage) <= 7
    && typeof draft.warmChoice === "string"
    && isAnswerRecord(draft.interactionAnswers)
    && typeof draft.openResponse === "string"
    && typeof draft.openSubmitted === "boolean"
    && isAnswerRecord(draft.wrongAttempts)
    && isStringArray(draft.answers);
};

export function parseLessonDrafts(raw: string | null): LessonDrafts {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const entries = Object.entries(parsed).filter((entry): entry is [string, LessonDraft] => isLessonDraft(entry[1]));
    if (entries.length !== Object.keys(parsed).length) return {};
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

export const upsertLessonDraft = (drafts: LessonDrafts, courseId: string, draft: LessonDraft): LessonDrafts => ({ ...drafts, [courseId]: draft });

export function removeLessonDraft(drafts: LessonDrafts, courseId: string): LessonDrafts {
  const next = { ...drafts };
  delete next[courseId];
  return next;
}
