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
  assert.notEqual(lower.quiz[3].prompt, upper.quiz[3].prompt);
  assert.notEqual(lower.inquiries[0].guide, upper.inquiries[0].guide);
  assert.match(lower.quiz[3].prompt, /看一看|读一读|试一试/);
  assert.match(upper.quiz[3].prompt, /证据|反例|条件/);
  assert.match(lower.openTask.routes[0].prompt, /画一画|说一两句/);
  assert.match(upper.openTask.routes[0].prompt, /两条证据|反例|适用条件/);
});

test("all 564 runtime courses satisfy the rich lesson quality floor", async () => {
  const { build } = await import("esbuild");
  const result = await build({ entryPoints: ["app/data/curriculum.ts"], bundle: true, platform: "node", format: "esm", write: false, logLevel: "silent" });
  const bundled = result.outputFiles[0].text;
  const curriculum = await import(`data:text/javascript;base64,${Buffer.from(bundled).toString("base64")}`);
  const courses = curriculum.books.flatMap((book) => book.units.flatMap((unit) => unit.courses.map((course) => ({ ...course, grade: book.grade }))));
  const modes = new Set(courses.flatMap((course) => course.lesson.interactions.map((interaction) => interaction.mode)));
  const inquirySignatures = new Set();

  assert.equal(curriculum.books.length, 12);
  assert.equal(courses.length, 564);
  assert.equal(new Set(courses.map((course) => course.id)).size, 564);
  assert.ok(modes.size >= 6);
  for (const course of courses) {
    inquirySignatures.add(course.lesson.inquiries.map((inquiry) => `${inquiry.question}|${inquiry.guide}`).join("||"));
    assert.ok(course.lesson.knowledgePoints.length >= 3 && course.lesson.knowledgePoints.length <= 5, course.id);
    assert.ok(course.lesson.interactions.length >= 2, course.id);
    assert.equal(course.lesson.quiz.length, 5, course.id);
    assert.ok(course.lesson.openTask.prompt.length > 10, course.id);
    assert.ok(course.lesson.extension.fact.length > 15, course.id);
    assert.ok(course.lesson.quiz.every((question) => question.options.every((option) => question.feedback[option]?.length > 0)), course.id);
    assert.equal(course.lesson.gradeBand, course.grade <= 2 ? "lower" : course.grade <= 4 ? "middle" : "upper", course.id);
    for (const task of [course.lesson.warmUp, ...course.lesson.interactions]) {
      assert.equal(new Set(task.options).size, task.options.length, `${course.id}:${task.id}:duplicate-option`);
      const taskAnswers = Array.isArray(task.answer) ? task.answer : [task.answer];
      assert.ok(taskAnswers.every((answer) => task.options.includes(answer)), `${course.id}:${task.id}:missing-answer`);
    }
    for (const question of course.lesson.quiz) {
      assert.equal(new Set(question.options).size, question.options.length, `${course.id}:${question.difficulty}:duplicate-option`);
      assert.equal(question.options.filter((option) => option === question.answer).length, 1, `${course.id}:${question.difficulty}:answer-count`);
      assert.match(question.reviewTarget, /核心|证据|方法|迁移/, `${course.id}:${question.difficulty}:review-target`);
    }
  }
  assert.equal(inquirySignatures.size, 564, "each course should have a unique inquiry set");
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

test("all courses include three inquiry prompts beyond the quiz", async () => {
  const { build } = await import("esbuild");
  const result = await build({ entryPoints: ["app/data/curriculum.ts"], bundle: true, platform: "node", format: "esm", write: false, logLevel: "silent" });
  const { books } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
  for (const course of books.flatMap((book) => book.units).flatMap((unit) => unit.courses)) {
    assert.equal(course.lesson.inquiries.length, 3, course.id);
    assert.equal(new Set(course.lesson.inquiries.map((item) => item.question)).size, 3, course.id);
    assert.ok(course.lesson.inquiries.every((item) => item.guide.length >= 12), course.id);
  }
});

test("seven course engines add a four-part subject toolkit", async () => {
  const { buildRichLesson } = await import("../app/data/richLesson.ts");
  const toolkitSignatures = [];
  for (const type of ["pinyin", "literacy", "reading", "poetry", "speaking", "writing", "garden"]) {
    const lesson = buildRichLesson({ id: `tools-${type}`, title: "工具课", type, objective: "会使用工具", action: "练习", seed: { knowledge: "知识", example: "例子", checkPrompt: "问题？", checkAnswer: "答案" } });
    assert.equal(lesson.toolkit.length, 4, type);
    assert.ok(lesson.toolkit.every((tool) => tool.name.length >= 2 && tool.use.length >= 8), type);
    toolkitSignatures.push(lesson.toolkit.map((tool) => tool.name).join("|"));
  }
  assert.equal(new Set(toolkitSignatures).size, 7);
});

test("warm-ups activate prior knowledge differently for seven course types", async () => {
  const { buildRichLesson } = await import("../app/data/richLesson.ts");
  const warmUps = ["pinyin", "literacy", "reading", "poetry", "speaking", "writing", "garden"].map((type) => buildRichLesson({
    id: `warm-${type}`, title: "热身课", type, objective: "唤醒旧知", action: "开始", seed: { knowledge: "知识", example: "例子", checkPrompt: "问题？", checkAnswer: "答案" },
  }).warmUp);
  assert.equal(new Set(warmUps.map((task) => `${task.prompt}|${task.answer}`)).size, 7);
  assert.ok(warmUps.every((task) => task.prompt.includes("《热身课》")));
});

test("every course type teaches through a misconception contrast case", async () => {
  const { buildRichLesson } = await import("../app/data/richLesson.ts");
  const cases = ["pinyin", "literacy", "reading", "poetry", "speaking", "writing", "garden"].map((type) => buildRichLesson({
    id: `contrast-${type}`, title: "对照课", type, objective: "辨析误区", action: "修正", seed: { knowledge: "知识", example: "证据例子", checkPrompt: "问题？", checkAnswer: "答案" },
  }).contrastCase);
  assert.equal(new Set(cases.map((item) => item.misconception)).size, 7);
  assert.ok(cases.every((item) => item.misconception.length >= 8 && item.diagnosis.length >= 12 && item.repair.length >= 12));
});

test("open challenges offer three distinct learner-choice routes", async () => {
  const { buildRichLesson } = await import("../app/data/richLesson.ts");
  const lesson = buildRichLesson({ id: "choice-routes", title: "路线课", type: "reading", objective: "自主探究", action: "选择", seed: { knowledge: "用证据说明观点", example: "人物前后发生变化", checkPrompt: "为什么？", checkAnswer: "因为有线索" } });
  assert.deepEqual(lesson.openTask.routes.map((route) => route.label), ["生活侦探", "反例挑战", "当小老师"]);
  assert.equal(new Set(lesson.openTask.routes.map((route) => route.prompt)).size, 3);
  assert.ok(lesson.openTask.routes.every((route) => route.prompt.includes("《路线课》")));
});
