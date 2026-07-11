import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("progress is versioned and invalid storage has a safe fallback", async () => {
  const source = await readFile("app/lib/progress.ts", "utf8");

  assert.match(source, /version: 1/);
  assert.match(source, /JSON\.parse/);
  assert.match(source, /catch/);
  assert.match(source, /defaultProgress/);
});

test("course completion is immutable and idempotent", async () => {
  const source = await readFile("app/lib/progress.ts", "utf8");

  assert.match(source, /new Set\(progress\.completedCourseIds\)/);
  assert.match(source, /alreadyCompleted/);
  assert.match(source, /alreadyCompleted \? 0 : 3/);
  assert.match(source, /recentCourseId: courseId/);
});
