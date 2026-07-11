export const LESSON_DRAFT_STORAGE_KEY = "chinese-study-lesson-drafts-v1";

export interface LessonDraft {
  stage: number;
  warmChoice: string;
  interactionAnswers: Record<string, string[]>;
  openResponse: string;
  openRoute: number | null;
  openSubmitted: boolean;
  wrongAttempts: Record<number, string[]>;
  answers: string[];
  masteredKnowledge: number[];
  inquiryPredictions: Record<number, string>;
}

export type LessonDrafts = Record<string, LessonDraft>;

export const emptyLessonDraft = (): LessonDraft => ({
  stage: 0,
  warmChoice: "",
  interactionAnswers: {},
  openResponse: "",
  openRoute: null,
  openSubmitted: false,
  wrongAttempts: {},
  answers: [],
  masteredKnowledge: [],
  inquiryPredictions: {},
});

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");
const isNumberArray = (value: unknown): value is number[] => Array.isArray(value) && value.every((item) => Number.isInteger(item) && item >= 0 && item <= 4);
const isAnswerRecord = (value: unknown): value is Record<string, string[]> => Boolean(value) && typeof value === "object" && !Array.isArray(value)
  && Object.values(value).every(isStringArray);
const isPredictionRecord = (value: unknown): value is Record<string, string> => Boolean(value) && typeof value === "object" && !Array.isArray(value)
  && Object.values(value).every((item) => typeof item === "string");

const isLessonDraft = (value: unknown): value is LessonDraft => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const draft = value as Partial<LessonDraft>;
  return Number.isInteger(draft.stage) && Number(draft.stage) >= 0 && Number(draft.stage) <= 7
    && typeof draft.warmChoice === "string"
    && isAnswerRecord(draft.interactionAnswers)
    && typeof draft.openResponse === "string"
    && (draft.openRoute === undefined || draft.openRoute === null || (Number.isInteger(draft.openRoute) && Number(draft.openRoute) >= 0 && Number(draft.openRoute) <= 2))
    && typeof draft.openSubmitted === "boolean"
    && isAnswerRecord(draft.wrongAttempts)
    && isStringArray(draft.answers)
    && (draft.masteredKnowledge === undefined || isNumberArray(draft.masteredKnowledge))
    && (draft.inquiryPredictions === undefined || isPredictionRecord(draft.inquiryPredictions));
};

export function parseLessonDrafts(raw: string | null): LessonDrafts {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const entries = Object.entries(parsed).filter((entry) => isLessonDraft(entry[1])).map(([id, value]) => {
      const draft = value as LessonDraft;
      return [id, { ...draft, openRoute: draft.openRoute ?? null, masteredKnowledge: draft.masteredKnowledge ?? [], inquiryPredictions: draft.inquiryPredictions ?? {} }] as [string, LessonDraft];
    });
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
