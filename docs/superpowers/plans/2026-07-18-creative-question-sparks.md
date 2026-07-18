# Creative Question Sparks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five lesson-specific, grade-adaptive, clickable creative questions with reference thinking and follow-up prompts to all 564 courses.

**Architecture:** Extend the existing rich lesson data contract with a focused `CreativeQuestion` model and generate a deterministic five-question set inside the seven course-type engines. Adapt language depth in `adaptRichLessonForGrade`, then render independent reveal cards in `LessonView`; strengthen the existing all-course audit and online verifier so omissions cannot deploy.

**Tech Stack:** TypeScript, React, Vinext/Vite, Node test runner, esbuild curriculum audit, GitHub Pages Actions.

## Global Constraints

- Every one of 564 lessons contains exactly five creative questions.
- The five kinds are `what-if`, `compare`, `counterexample`, `transfer`, and `create` with no duplicates per lesson.
- Every card includes `prompt`, `hint`, `reference`, and `followUp` with meaningful lesson-bound content.
- Reference thinking is hidden until the learner clicks; it is labeled as one possible approach, not a unique answer.
- Lower, middle, and upper grades use visibly different cognitive and language depth.
- All seven course types produce distinct question structures.
- Reveals do not autoplay, do not affect completion, and reset on page reload.
- No external AI or runtime network dependency is added.

---

### Task 1: Creative question data contract and seven-engine generator

**Files:**
- Modify: `app/data/richLesson.ts`
- Modify: `app/data/curriculum.ts`
- Test: `tests/rich-lessons.test.mjs`

**Interfaces:**
- Produces: `CreativeQuestionKind`, `CreativeQuestion`, and `RichLessonData.creativeQuestions: CreativeQuestion[]`.
- Produces: deterministic `buildCreativeQuestions(context: RichLessonContext): CreativeQuestion[]` used by `buildRichLesson`.

- [ ] **Step 1: Write the failing generator test**

Add a test that builds all seven course types and asserts five unique kinds, complete fields, title/seed binding, and seven distinct signatures:

```js
test("seven course engines build five distinct creative question sparks", async () => {
  const { buildRichLesson } = await import("../app/data/richLesson.ts");
  const kinds = ["what-if", "compare", "counterexample", "transfer", "create"];
  const signatures = [];
  for (const type of ["pinyin", "literacy", "reading", "poetry", "speaking", "writing", "garden"]) {
    const lesson = buildRichLesson({
      id: `creative-${type}`,
      title: "创想课",
      type,
      objective: "会发散思考",
      action: "提出新问题",
      seed: { knowledge: "本课核心发现", example: "本课具体证据", checkPrompt: "怎样判断？", checkAnswer: "根据证据判断" },
    });
    assert.deepEqual(lesson.creativeQuestions.map((item) => item.kind), kinds);
    assert.ok(lesson.creativeQuestions.every((item) => item.prompt.length >= 12 && item.hint.length >= 10 && item.reference.length >= 18 && item.followUp.length >= 10));
    assert.ok(lesson.creativeQuestions.every((item) => JSON.stringify(item).includes("创想课") || JSON.stringify(item).includes("本课核心发现") || JSON.stringify(item).includes("本课具体证据")));
    signatures.push(lesson.creativeQuestions.map((item) => item.prompt).join("|"));
  }
  assert.equal(new Set(signatures).size, 7);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/rich-lessons.test.mjs`

Expected: FAIL because `lesson.creativeQuestions` is undefined.

- [ ] **Step 3: Implement the contract and generator**

Add the exact public types:

```ts
export type CreativeQuestionKind = "what-if" | "compare" | "counterexample" | "transfer" | "create";

export interface CreativeQuestion {
  kind: CreativeQuestionKind;
  label: string;
  prompt: string;
  hint: string;
  reference: string;
  followUp: string;
}
```

Add `creativeQuestions: CreativeQuestion[]` to `RichLessonData` and `LessonContent`. Implement a type-specific blueprint record whose five entries reference `context.title`, `context.seed.knowledge`, or `context.seed.example`, and return them from `buildRichLesson` as `creativeQuestions: buildCreativeQuestions(context)`.

- [ ] **Step 4: Run the generator tests and verify GREEN**

Run: `node --test tests/rich-lessons.test.mjs`

Expected: every test passes.

- [ ] **Step 5: Commit the data layer**

```bash
git add app/data/richLesson.ts app/data/curriculum.ts tests/rich-lessons.test.mjs
git commit -m "feat: generate five creative questions per lesson"
```

### Task 2: Grade-adaptive creative thinking depth

**Files:**
- Modify: `app/data/richLesson.ts`
- Test: `tests/rich-lessons.test.mjs`

**Interfaces:**
- Consumes: `CreativeQuestion[]` from Task 1.
- Produces: grade-adapted `prompt`, `hint`, `reference`, and `followUp` via `adaptRichLessonForGrade`.

- [ ] **Step 1: Write the failing grade-depth test**

```js
test("creative question references deepen from lower to upper grades", async () => {
  const { buildRichLesson, adaptRichLessonForGrade } = await import("../app/data/richLesson.ts");
  const base = buildRichLesson({ id: "grade-sparks", title: "层级课", type: "reading", objective: "思辨", action: "推理", seed: { knowledge: "人物选择影响结局", example: "人物在困难中坚持", checkPrompt: "为什么？", checkAnswer: "因为有行动证据" } });
  const lower = adaptRichLessonForGrade(base, 1);
  const middle = adaptRichLessonForGrade(base, 3);
  const upper = adaptRichLessonForGrade(base, 6);
  assert.notEqual(lower.creativeQuestions[0].reference, middle.creativeQuestions[0].reference);
  assert.notEqual(middle.creativeQuestions[0].reference, upper.creativeQuestions[0].reference);
  assert.match(lower.creativeQuestions[0].hint, /画|说|指/);
  assert.match(upper.creativeQuestions[2].followUp, /反例|条件|证据/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/rich-lessons.test.mjs`

Expected: FAIL because the three grade outputs are currently identical.

- [ ] **Step 3: Implement grade adaptation**

Map all five questions in `adaptRichLessonForGrade`. Lower-grade copy adds concrete action such as drawing or pointing; middle-grade copy requires a complete finding plus evidence; upper-grade copy requires evidence comparison, conditions, counterexamples, or alternative interpretations. Preserve the lesson-bound base content instead of replacing it with generic text.

- [ ] **Step 4: Run and verify GREEN**

Run: `node --test tests/rich-lessons.test.mjs`

Expected: every test passes.

- [ ] **Step 5: Commit grade adaptation**

```bash
git add app/data/richLesson.ts tests/rich-lessons.test.mjs
git commit -m "feat: deepen creative questions by grade"
```

### Task 3: Click-to-reveal creative question cards

**Files:**
- Modify: `app/components/LessonView.tsx`
- Modify: `app/globals.css`
- Test: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `course.lesson.creativeQuestions`.
- Produces: independent local reveal state `revealedCreativeQuestions: number[]`; no draft or completion dependency.

- [ ] **Step 1: Write the failing UI contract test**

```js
test("creative question sparks reveal hints and reference thinking only on click", async () => {
  const lesson = await readFile(new URL("../app/components/LessonView.tsx", import.meta.url), "utf8");
  assert.match(lesson, /revealedCreativeQuestions/);
  assert.match(lesson, /思维火花/);
  assert.match(lesson, /查看参考思路/);
  assert.match(lesson, /这是一种思路，不是唯一答案/);
  assert.match(lesson, /aria-expanded/);
  assert.match(lesson, /followUp/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/rendered-html.test.mjs`

Expected: FAIL because the creative question card UI does not exist.

- [ ] **Step 3: Implement reveal cards**

Add `revealedCreativeQuestions` and `creativeHints` local state. Render five cards after the existing inquiry lab. Each card always shows `label` and `prompt`, provides a non-answer hint toggle, and uses an `aria-expanded` button to reveal:

```tsx
<aside>
  <strong>参考思路</strong>
  <p>{question.reference}</p>
  <small>这是一种思路，不是唯一答案。</small>
  <b>继续追问：{question.followUp}</b>
</aside>
```

Use responsive CSS with two columns on desktop and one column below 760px. Give revealed cards a clear but calm visual state and preserve reduced-motion behavior.

- [ ] **Step 4: Run UI tests, Lint, and static build**

Run: `node --test tests/rendered-html.test.mjs && npm run lint && npm run build:pages`

Expected: all tests pass, Lint has zero errors, and Vite produces `pages-dist/index.html`.

- [ ] **Step 5: Commit the interaction**

```bash
git add app/components/LessonView.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "feat: reveal creative thinking sparks on click"
```

### Task 4: Prove all-course coverage and publish

**Files:**
- Modify: `scripts/audit-rich-lessons.mjs`
- Modify: `scripts/verify-pages.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: compiled `curriculum.books` and deployed GitHub Pages bundle.
- Produces: hard deployment gates for 564 unique five-question sets and online UI markers.

- [ ] **Step 1: Add failing all-course audit assertions**

Track `creativeQuestionSignatures` and assert for every course:

```js
assert.equal(course.lesson.creativeQuestions.length, 5, `${course.id} 创新问题数量不足`);
assert.equal(new Set(course.lesson.creativeQuestions.map((item) => item.kind)).size, 5, `${course.id} 创新问题类型不完整`);
assert.ok(course.lesson.creativeQuestions.every((item) => item.prompt.length >= 12 && item.hint.length >= 10 && item.reference.length >= 18 && item.followUp.length >= 10), `${course.id} 创新问题内容过短`);
creativeQuestionSignatures.add(course.lesson.creativeQuestions.map((item) => `${item.prompt}|${item.reference}`).join("||"));
```

After iterating, require `creativeQuestionSignatures.size === 564`.

- [ ] **Step 2: Run audit and verify RED before completing implementation**

Run: `npm run audit:lessons`

Expected: FAIL until all new coverage rules are met.

- [ ] **Step 3: Extend documentation and online verification**

Document “每课 5 道可点击揭晓的思维火花题” in `README.md`. Add production bundle markers `思维火花`, `查看参考思路`, and `这是一种思路，不是唯一答案` to `scripts/verify-pages.mjs`.

- [ ] **Step 4: Run the complete local gate**

Run: `npm run audit:lessons && npm test && npm run lint && git diff --check`

Expected: 12 books, 95 units, 564 courses, 564 unique creative-question signatures, all tests passing, and no Lint or whitespace errors.

- [ ] **Step 5: Commit and push main**

```bash
git add scripts/audit-rich-lessons.mjs scripts/verify-pages.mjs README.md
git commit -m "test: enforce creative questions in every lesson"
git push origin main
```

- [ ] **Step 6: Verify deployment**

Run `gh run watch <latest-run-id> --exit-status`, then `npm run verify:pages`.

Expected: GitHub Pages workflow concludes `success`; online verifier confirms all required markers and audio assets.
