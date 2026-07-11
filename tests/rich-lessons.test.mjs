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
  assert.match(rich, /const interactions = engine\.interactions/);
  assert.match(rich, /interactions,/);
  assert.match(rich, /const quiz = \[/);
  assert.match(rich, /quiz,/);
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

test("every interaction provides option-specific coaching", async () => {
  const { buildRichLesson } = await import("../app/data/richLesson.ts");
  for (const type of ["pinyin", "literacy", "reading", "poetry", "speaking", "writing", "garden"]) {
    const lesson = buildRichLesson({
      id: `feedback-${type}`,
      title: `${type}反馈课`,
      type,
      objective: "独立发现并说明理由",
      action: "观察、比较、表达",
      seed: { knowledge: "关键知识", example: "具体证据", checkPrompt: "怎样判断？", checkAnswer: "用证据判断" },
    });
    for (const task of [lesson.warmUp, ...lesson.interactions]) {
      assert.deepEqual(Object.keys(task.feedback).sort(), task.options.slice().sort(), `${type}:${task.id}`);
      assert.ok(task.options.every((option) => task.feedback[option].length >= 8), `${type}:${task.id}`);
    }
  }
});

test("lesson duration grows with grade and expressive course types", async () => {
  const curriculum = await readFile("app/data/curriculum.ts", "utf8");

  assert.match(curriculum, /function adaptiveLessonMinutes/);
  assert.match(curriculum, /grade <= 2/);
  assert.match(curriculum, /grade <= 4/);
  assert.match(curriculum, /type === "writing" \|\| type === "speaking"/);
  assert.match(curriculum, /course\.minutes = adaptiveLessonMinutes/);
});

test("runtime engine builds complete and distinct lessons for all seven course types", async () => {
  const { buildRichLesson } = await import("../app/data/richLesson.ts");
  const types = ["pinyin", "literacy", "reading", "poetry", "speaking", "writing", "garden"];
  const modes = new Set();

  for (const type of types) {
    const lesson = buildRichLesson({
      id: `sample-${type}`,
      title: `示例${type}`,
      type,
      objective: "观察、理解并迁移本课方法",
      action: "先观察，再找证据，最后表达",
      seed: { knowledge: `${type}独立核心知识`, example: `${type}独立证据例子`, checkPrompt: `${type}创新问题？`, checkAnswer: `${type}合理答案` },
    });

    assert.ok(lesson.knowledgePoints.length >= 3 && lesson.knowledgePoints.length <= 5);
    assert.ok(lesson.interactions.length >= 2);
    assert.equal(lesson.quiz.length, 5);
    assert.ok(lesson.openTask.support.length >= 3);
    assert.ok(lesson.extension.fact.length > 15);
    for (const interaction of lesson.interactions) modes.add(interaction.mode);
    for (const question of lesson.quiz) {
      assert.equal(Object.keys(question.feedback).length, question.options.length);
      assert.ok(question.options.every((option) => question.feedback[option]?.length > 0));
    }
  }

  assert.ok(modes.size >= 6, `expected at least six interaction modes, got ${[...modes].join(", ")}`);
});

test("grade adaptation changes support and challenge depth", async () => {
  const { adaptRichLessonForGrade, buildRichLesson } = await import("../app/data/richLesson.ts");
  const base = buildRichLesson({
    id: "sample-reading",
    title: "示例阅读",
    type: "reading",
    objective: "理解内容并迁移",
    action: "找证据再表达",
    seed: { knowledge: "核心知识", example: "证据例子", checkPrompt: "为什么？", checkAnswer: "因为有证据" },
  });
  const lower = adaptRichLessonForGrade(base, 1);
  const upper = adaptRichLessonForGrade(base, 6);

  assert.equal(lower.gradeBand, "lower");
  assert.equal(upper.gradeBand, "upper");
  assert.notEqual(lower.openTask.prompt, upper.openTask.prompt);
  assert.ok(lower.openTask.support[0].length < upper.openTask.support[0].length);
  assert.notEqual(lower.extension.challenge, upper.extension.challenge);
});

test("all 564 runtime courses satisfy the rich lesson quality floor", async () => {
  const { build } = await import("esbuild");
  const result = await build({ entryPoints: ["app/data/curriculum.ts"], bundle: true, platform: "node", format: "esm", write: false, logLevel: "silent" });
  const bundled = result.outputFiles[0].text;
  const curriculum = await import(`data:text/javascript;base64,${Buffer.from(bundled).toString("base64")}`);
  const courses = curriculum.books.flatMap((book) => book.units.flatMap((unit) => unit.courses.map((course) => ({ ...course, grade: book.grade }))));
  const modes = new Set(courses.flatMap((course) => course.lesson.interactions.map((interaction) => interaction.mode)));

  assert.equal(curriculum.books.length, 12);
  assert.equal(courses.length, 564);
  assert.equal(new Set(courses.map((course) => course.id)).size, 564);
  assert.ok(modes.size >= 6);
  for (const course of courses) {
    assert.ok(course.lesson.knowledgePoints.length >= 3 && course.lesson.knowledgePoints.length <= 5, course.id);
    assert.ok(course.lesson.interactions.length >= 2, course.id);
    assert.equal(course.lesson.quiz.length, 5, course.id);
    assert.ok(course.lesson.openTask.prompt.length > 10, course.id);
    assert.ok(course.lesson.extension.fact.length > 15, course.id);
    assert.ok(course.lesson.quiz.every((question) => question.options.every((option) => question.feedback[option]?.length > 0)), course.id);
    assert.equal(course.lesson.gradeBand, course.grade <= 2 ? "lower" : course.grade <= 4 ? "middle" : "upper", course.id);
  }
});

test("choice positions are deterministic without always putting answers first", async () => {
  const { buildRichLesson } = await import("../app/data/richLesson.ts");
  const context = {
    id: "stable-reading-course",
    title: "稳定选项测试",
    type: "reading",
    objective: "寻找证据并解释",
    action: "先观察再推理",
    seed: { knowledge: "核心知识", example: "证据例子", checkPrompt: "创新问题？", checkAnswer: "合理答案" },
  };
  const first = buildRichLesson(context);
  const second = buildRichLesson(context);

  assert.deepEqual(first.quiz.map((question) => question.options), second.quiz.map((question) => question.options));
  assert.ok(first.quiz.some((question) => question.options[0] !== question.answer));
  assert.ok(first.interactions.some((interaction) => !Array.isArray(interaction.answer) && interaction.options[0] !== interaction.answer));
});

test("high-order questions are designed for each course type", async () => {
  const { buildRichLesson } = await import("../app/data/richLesson.ts");
  const pairs = ["pinyin", "literacy", "reading", "poetry", "speaking", "writing", "garden"].map((type) => {
    const lesson = buildRichLesson({
      id: `deep-${type}`,
      title: "同名课程",
      type,
      objective: "形成语文能力",
      action: "完成挑战",
      seed: { knowledge: "同一核心", example: "同一例子", checkPrompt: "同一问题？", checkAnswer: "同一答案" },
    });
    return lesson.quiz.slice(3).map((question) => `${question.prompt}|${question.answer}`).join("||");
  });
  assert.equal(new Set(pairs).size, 7);
});
