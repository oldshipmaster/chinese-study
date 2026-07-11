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

test("curriculum defines every supported learning mode", async () => {
  const source = await readFile("app/data/curriculum.ts", "utf8");

  for (const type of ["pinyin", "literacy", "reading", "poetry", "speaking", "writing", "garden"]) {
    assert.match(source, new RegExp(`"${type}"`));
  }
});
