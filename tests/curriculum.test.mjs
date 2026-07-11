import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("curriculum exposes twelve books and the flagship lesson", async () => {
  const source = await readFile("app/data/curriculum.ts", "utf8");

  assert.equal((source.match(/bookId: "g/g) ?? []).length, 12);
  assert.match(source, /bookId: "g1-upper"/);
  assert.match(source, /bookId: "g6-lower"/);
  assert.match(source, /course\("a-o-e"/);
});

test("curriculum opens a full primary-school course map", async () => {
  const source = await readFile("app/data/curriculum.ts", "utf8");

  assert.ok((source.match(/\bc\("/g) ?? []).length >= 220);
  assert.doesNotMatch(source, /building/);
  assert.match(source, /快乐读书吧：读书真快乐/);
  assert.match(source, /综合性学习：难忘小学生活/);
  assert.match(source, /古诗词诵读/);
});

test("every generated course carries a self-study lesson package", async () => {
  const source = await readFile("app/data/curriculum.ts", "utf8");

  assert.match(source, /export interface LessonContent/);
  assert.match(source, /lesson: buildLesson/);
  assert.match(source, /quiz: \[/);
  assert.match(source, /animationFrames/);
});

test("curriculum defines every supported learning mode", async () => {
  const source = await readFile("app/data/curriculum.ts", "utf8");

  for (const type of ["pinyin", "literacy", "reading", "poetry", "speaking", "writing", "garden"]) {
    assert.match(source, new RegExp(`"${type}"`));
  }
});
