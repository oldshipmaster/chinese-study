# 字里少年宫 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建并发布一个覆盖小学语文 12 册课程地图、包含完整 `a o e` HTML 动画课与本地学习进度的儿童独立学习网站。

**Architecture:** 课程目录、学习状态和视图组件分离。`app/data` 提供统一课程数据，`app/lib` 处理可测试的进度状态，`app/components` 组合首页、课程地图和动画课堂，`app/page.tsx` 只负责顶层状态与页面切换。

**Tech Stack:** vinext、Next.js 16、React 19、TypeScript、CSS 动画、Node test runner、localStorage、Sites。

## Global Constraints

- 对齐统编版、人民教育出版社小学语文一至六年级上下册，共 12 册。
- 教学内容、例句、练习与动画脚本必须原创，不复制教材正文或插图。
- 视觉采用“东方自然乐园”：宣纸米白、玉青、竹绿、杏黄、天青。
- 第一版必须完成 `a o e` 五阶段动画课，并展示 12 册课程地图与其他课程类型。
- 无需注册；进度只保存在当前设备，结构必须版本化。
- 支持触控、键盘和 `prefers-reduced-motion`。

---

### Task 1: 课程数据与查询接口

**Files:**
- Create: `app/data/curriculum.ts`
- Create: `tests/curriculum.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `CourseType`、`Course`、`Book`、`books`、`getBook(id)`、`getCourse(id)`。
- Each book id uses `g{grade}-{upper|lower}`; the 12-book dataset must include at least one unit and representative course cards for each book.

- [ ] **Step 1: Write the failing data-contract test**

```js
test("curriculum exposes twelve books and unique course ids", async () => {
  const source = await readFile("app/data/curriculum.ts", "utf8");
  assert.equal((source.match(/bookId:/g) ?? []).length >= 12, true);
  assert.match(source, /g1-upper/);
  assert.match(source, /g6-lower/);
  assert.match(source, /a-o-e/);
});
```

- [ ] **Step 2: Run test and verify failure**

Run: `node --test tests/curriculum.test.mjs`
Expected: FAIL because `app/data/curriculum.ts` does not exist.

- [ ] **Step 3: Implement the typed curriculum**

Define exact unions:

```ts
export type CourseType = "pinyin" | "literacy" | "reading" | "poetry" | "speaking" | "writing" | "garden";
export type CourseStatus = "ready" | "building";
export interface Course { id: string; title: string; type: CourseType; minutes: number; objective: string; status: CourseStatus; }
export interface Unit { id: string; title: string; theme: string; courses: Course[]; }
export interface Book { bookId: string; grade: number; term: "上册" | "下册"; edition: string; units: Unit[]; }
```

Create all 12 `Book` records, a complete representative map across the six course types, and mark `a-o-e` ready. Export pure lookup helpers that return `undefined` for unknown ids.

- [ ] **Step 4: Run test and verify pass**

Run: `node --test tests/curriculum.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/data/curriculum.ts tests/curriculum.test.mjs package.json
git commit -m "feat: add twelve-book curriculum map"
```

### Task 2: Versioned local learning progress

**Files:**
- Create: `app/lib/progress.ts`
- Create: `tests/progress.test.mjs`

**Interfaces:**
- Consumes: course ids from `app/data/curriculum.ts`.
- Produces: `LearningProgressV1`, `defaultProgress()`, `parseProgress(raw)`, `completeCourse(progress, courseId)`.

- [ ] **Step 1: Write failing progress tests**

```js
test("invalid storage falls back and completion is idempotent", async () => {
  const source = await readFile("app/lib/progress.ts", "utf8");
  assert.match(source, /version: 1/);
  assert.match(source, /completedCourseIds/);
  assert.match(source, /new Set/);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/progress.test.mjs`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement progress helpers**

Use this shape:

```ts
export interface LearningProgressV1 {
  version: 1;
  completedCourseIds: string[];
  leaves: number;
  streak: number;
  recentCourseId: string;
}
```

`parseProgress` accepts nullable JSON and catches parsing/schema errors. `completeCourse` adds one id once, adds 3 leaves only for a newly completed course, and updates `recentCourseId` without mutating the input.

- [ ] **Step 4: Run and verify pass**

Run: `node --test tests/progress.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/lib/progress.ts tests/progress.test.mjs
git commit -m "feat: add local learning progress model"
```

### Task 3: Build the responsive learning experience

**Files:**
- Create: `app/components/CourseApp.tsx`
- Create: `app/components/HomeView.tsx`
- Create: `app/components/CurriculumView.tsx`
- Create: `app/components/LessonView.tsx`
- Create: `app/components/AoeLesson.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Delete: `app/_sites-preview/SkeletonPreview.tsx`
- Delete: `app/_sites-preview/skeleton.css`
- Test: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `books`, `getBook`, `getCourse`, `parseProgress`, `completeCourse`.
- Produces: one client-side app with views `home | curriculum | lesson`, accessible native buttons, and localStorage key `zili-progress-v1`.

- [ ] **Step 1: Tighten rendered HTML test**

Require the built document to contain `字里少年宫`, `一年级`, `六年级`, `开始今天的学习`, and no starter preview metadata.

- [ ] **Step 2: Run test and verify failure**

Run: `npm test`
Expected: FAIL because the starter page does not contain the product content.

- [ ] **Step 3: Implement semantic React views**

`CourseApp` owns selection state and persistence. `HomeView` renders the continue-learning hero, six grade selectors, progress and ability path. `CurriculumView` renders term tabs, units, course metadata, ready/building states and usable back navigation. Use text labels with every icon or decorative CSS shape.

- [ ] **Step 4: Implement the complete `a o e` lesson**

`AoeLesson` contains five stages with deterministic state: `导入`, `发音`, `声调`, `练习`, `闯关`. Provide play/pause, previous, next and replay controls. Include three locally checked questions and call `onComplete("a-o-e")` only when all questions are answered correctly. Other ready lesson cards use `LessonView`; building courses explain their objective and offer return navigation.

- [ ] **Step 5: Apply the selected visual system**

Implement the exact tokens `#F7F3E8`, `#29766B`, `#557E48`, `#F2C76F`, `#B9DBE0`, responsive grid breakpoints at 1024px and 720px, minimum 44px controls, CSS mountains/pond/bamboo, and reduced-motion overrides that disable loops and transforms.

- [ ] **Step 6: Replace starter metadata and dependencies**

Set `lang="zh-CN"`, title `字里少年宫｜小学语文动画课程`, product description, and request-host-derived Open Graph metadata without a generic image. Remove `react-loading-skeleton` after deleting the preview module and refresh `package-lock.json`.

- [ ] **Step 7: Run tests and verify pass**

Run: `npm test`
Expected: build succeeds and rendered HTML assertions pass.

- [ ] **Step 8: Commit**

```bash
git add app tests package.json package-lock.json public
git commit -m "feat: build animated Chinese learning experience"
```

### Task 4: Product verification and publish preparation

**Files:**
- Modify: `.openai/hosting.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: successful production build and the existing Sites project layout.
- Produces: a validated Cloudflare Worker-compatible archive for Sites.

- [ ] **Step 1: Run focused verification**

Run: `node --test tests/curriculum.test.mjs tests/progress.test.mjs`
Expected: all tests PASS.

- [ ] **Step 2: Run deployment build**

Run: `npm run build`
Expected: exit 0 and `dist/server/index.js` exists.

- [ ] **Step 3: Check source hygiene**

Run: `rg -n "codex-preview|Your site is taking shape|react-loading-skeleton" app package.json || true`
Expected: no output.

- [ ] **Step 4: Document the first release**

Update `README.md` with the product purpose, current first-release coverage, originality boundary, local development command and the next content-expansion order.

- [ ] **Step 5: Commit**

```bash
git add README.md .openai/hosting.json
git commit -m "docs: prepare first course release"
```

### Task 5: Save and privately deploy with Sites

**Files:**
- Modify: `.openai/hosting.json` with the opaque `project_id` returned by Sites.
- Create outside repo: `/tmp/chinese-study-sites.tar.gz`

**Interfaces:**
- Consumes: exact validated Git HEAD and packaged `dist` output.
- Produces: a saved Sites version and owner-only production URL.

- [ ] **Step 1: Create the Sites project once**

Create title `字里少年宫`, description `小学一至六年级统编版语文动画课程`, slug `zili-shaoniangong`; immediately persist the returned project id.

- [ ] **Step 2: Commit and push the exact source state**

Commit the project-id change, push the configured branch using the short-lived per-command credential, and record `git rev-parse HEAD` as `commit_sha`.

- [ ] **Step 3: Package the validated build**

Run the Sites `package-site.sh` helper with the project root and `/tmp/chinese-study-sites.tar.gz`; expect archive validation success.

- [ ] **Step 4: Save and deploy privately**

Save one version using the exact `commit_sha` and archive, then call the private deployment operation. Poll its deployment id until `succeeded` or `failed`.

- [ ] **Step 5: Open and hand off**

On success, open the exact deployed URL in Codex and return it as the primary deliverable.
