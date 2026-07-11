import assert from "node:assert/strict";
import test from "node:test";

import { emptyLessonDraft, parseLessonDrafts, removeLessonDraft, upsertLessonDraft } from "../app/lib/lessonDraft.ts";

test("lesson drafts survive reload and stay isolated by course", () => {
  const first = { ...emptyLessonDraft(), stage: 5, openResponse: "我发现了证据", answers: ["甲"] };
  const second = { ...emptyLessonDraft(), stage: 2, warmChoice: "认真观察" };
  const stored = upsertLessonDraft(upsertLessonDraft({}, "course-a", first), "course-b", second);
  const restored = parseLessonDrafts(JSON.stringify(stored));

  assert.deepEqual(restored["course-a"], first);
  assert.deepEqual(restored["course-b"], second);
  assert.deepEqual(removeLessonDraft(restored, "course-a"), { "course-b": second });
});

test("invalid lesson draft storage falls back safely", () => {
  assert.deepEqual(parseLessonDrafts(null), {});
  assert.deepEqual(parseLessonDrafts("not json"), {});
  assert.deepEqual(parseLessonDrafts("[]"), {});
  assert.deepEqual(parseLessonDrafts('{"bad":{"stage":99}}'), {});
});

test("one damaged course draft does not erase other courses", () => {
  const good = emptyLessonDraft();
  const restored = parseLessonDrafts(JSON.stringify({ good, bad: { stage: 99 } }));
  assert.deepEqual(restored, { good });
});

test("older drafts migrate with an empty knowledge self-check", () => {
  const legacy = { stage: 2, warmChoice: "观察", interactionAnswers: {}, openResponse: "", openSubmitted: false, wrongAttempts: {}, answers: [] };
  assert.deepEqual(parseLessonDrafts(JSON.stringify({ old: legacy })).old.masteredKnowledge, []);
  assert.deepEqual(parseLessonDrafts(JSON.stringify({ old: legacy })).old.inquiryPredictions, {});
  assert.deepEqual(parseLessonDrafts(JSON.stringify({ old: legacy })).old.openChecks, []);
});
