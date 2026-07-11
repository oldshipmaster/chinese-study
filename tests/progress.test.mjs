import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("progress is versioned and invalid storage has a safe fallback", async () => {
  const source = await readFile("app/lib/progress.ts", "utf8");

  assert.match(source, /version: 1/);
  assert.match(source, /JSON\.parse/);
  assert.match(source, /catch/);
  assert.match(source, /defaultProgress/);
  assert.match(source, /new Set\(value\.completedCourseIds/);
});

test("course completion is immutable and idempotent", async () => {
  const source = await readFile("app/lib/progress.ts", "utf8");

  assert.match(source, /new Set\(progress\.completedCourseIds\)/);
  assert.match(source, /alreadyCompleted/);
  assert.match(source, /alreadyCompleted \? 0 : 3/);
  assert.match(source, /recentCourseId: courseId/);
});

test("opening a course updates the resumable recent course without rewards", async () => {
  const source = await readFile("app/lib/progress.ts", "utf8");
  assert.match(source, /export function visitCourse/);
  assert.match(source, /recentCourseId === courseId \? progress/);
  assert.doesNotMatch(source.match(/export function visitCourse[\s\S]*?\n\}/)?.[0] ?? "", /leaves:/);
});

test("single-course reset removes completion and safely returns its reward", async () => {
  const source = await readFile("app/lib/progress.ts", "utf8");

  assert.match(source, /export function resetCourse/);
  assert.match(source, /if \(!progress\.completedCourseIds\.includes\(courseId\)\) return progress/);
  assert.match(source, /filter\(\(id\) => id !== courseId\)/);
  assert.match(source, /Math\.max\(0, progress\.leaves - 3\)/);
});
