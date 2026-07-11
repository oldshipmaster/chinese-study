import assert from "node:assert/strict";
import test from "node:test";

import { emptyLessonDraft, parseLessonDrafts, removeLessonDraft, upsertLessonDraft } from "../app/lib/lessonDraft.ts";

test("lesson drafts survive reload and stay isolated by course", () => {
  const first = { ...emptyLessonDraft(), stage: 5, openResponse: "我发现了证据", answers: ["甲"], customQuestion: "为什么这样判断？", customAnswer: "因为有具体证据", customReason: "答案能回到材料核对" };
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
  assert.deepEqual(parseLessonDrafts(JSON.stringify({ bad: { ...emptyLessonDraft(), confidence: "随便填" } })), {});
});

test("one damaged course draft does not erase other courses", () => {
  const good = emptyLessonDraft();
  const restored = parseLessonDrafts(JSON.stringify({ good, bad: { stage: 99 } }));
  assert.deepEqual(restored, { good });
});

test("duplicate self-check values cannot inflate restored progress", () => {
  const duplicated = { ...emptyLessonDraft(), masteredKnowledge: [1, 1, 2], openChecks: [0, 0], quizHints: [4, 4], selectedTerms: ["证据", "证据"] };
  const restored = parseLessonDrafts(JSON.stringify({ course: duplicated })).course;
  assert.deepEqual(restored.masteredKnowledge, [1, 2]);
  assert.deepEqual(restored.openChecks, [0]);
  assert.deepEqual(restored.quizHints, [4]);
  assert.deepEqual(restored.selectedTerms, ["证据"]);
});

test("older drafts migrate with an empty knowledge self-check", () => {
  const legacy = { stage: 2, warmChoice: "观察", interactionAnswers: {}, openResponse: "", openSubmitted: false, wrongAttempts: {}, answers: [] };
  assert.deepEqual(parseLessonDrafts(JSON.stringify({ old: legacy })).old.masteredKnowledge, []);
  assert.deepEqual(parseLessonDrafts(JSON.stringify({ old: legacy })).old.inquiryPredictions, {});
  assert.deepEqual(parseLessonDrafts(JSON.stringify({ old: legacy })).old.openChecks, []);
  assert.equal(parseLessonDrafts(JSON.stringify({ old: legacy })).old.confidence, "");
  assert.deepEqual(parseLessonDrafts(JSON.stringify({ old: legacy })).old.quizHints, []);
  assert.deepEqual(parseLessonDrafts(JSON.stringify({ old: legacy })).old.selectedTerms, []);
  assert.equal(parseLessonDrafts(JSON.stringify({ old: legacy })).old.customQuestion, "");
  assert.equal(parseLessonDrafts(JSON.stringify({ old: legacy })).old.customAnswer, "");
  assert.equal(parseLessonDrafts(JSON.stringify({ old: legacy })).old.customReason, "");
});
