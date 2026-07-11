import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("every curated seed is expanded into a rich lesson contract", async () => {
  const [curriculum, rich, seeds] = await Promise.all([
    readFile("app/data/curriculum.ts", "utf8"),
    readFile("app/data/richLesson.ts", "utf8"),
    readFile("app/data/lessonSeeds.ts", "utf8"),
  ]);
  const seedCount = (seeds.match(/^  "[^"]+": s\(/gm) ?? []).length;

  assert.equal(seedCount, 564);
  assert.match(curriculum, /knowledgePoints: KnowledgePoint\[\]/);
  assert.match(curriculum, /interactions: InteractionTask\[\]/);
  assert.match(curriculum, /openTask: OpenTask/);
  assert.match(curriculum, /extension: ExtensionCard/);
  assert.match(curriculum, /buildRichLesson/);
  assert.match(rich, /knowledgePoints: \[/);
  assert.match(rich, /interactions: engine\.interactions/);
  assert.match(rich, /quiz: \[/);
  assert.match(rich, /"remember"/);
  assert.match(rich, /"transfer"/);
});

test("seven course types provide diverse interaction engines", async () => {
  const rich = await readFile("app/data/richLesson.ts", "utf8");

  for (const type of ["pinyin", "literacy", "reading", "poetry", "speaking", "writing", "garden"]) {
    assert.match(rich, new RegExp(`${type}: \\{`));
  }
  for (const mode of ["match", "sort", "evidence", "scenario", "classify", "revise"]) {
    assert.match(rich, new RegExp(`"${mode}"`));
  }
});

test("rich lesson questions include option-specific misconception feedback", async () => {
  const [curriculum, rich] = await Promise.all([
    readFile("app/data/curriculum.ts", "utf8"),
    readFile("app/data/richLesson.ts", "utf8"),
  ]);

  assert.match(curriculum, /feedback: Record<string, string>/);
  assert.match(rich, /feedback: \{/);
  assert.match(rich, /extension:/);
});
