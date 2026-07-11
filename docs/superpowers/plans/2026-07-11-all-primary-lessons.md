# 全量小学语文课程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将字里少年宫升级为一至六年级 12 册所有课程均可进入自学课堂的版本。

**Architecture:** `app/data/curriculum.ts` 提供全量课程目录并为每课生成原创 `LessonContent`；`LessonView` 消费统一学习包，负责非 AOE 课程的五步课堂与闯关完成；`CourseApp` 连接完成、重置和本地进度。

**Tech Stack:** React 19、TypeScript、vinext、Vite Pages、CSS 动画、Node test runner、localStorage。

## Global Constraints

- 课程目录参考统编版小学语文 12 册 PDF 目录。
- 不复制教材正文、插图或整页排版。
- 所有课程状态为可学习，不再显示建设中占位。
- 保留 `a o e` 专属发音课，语音只在点击时播放。
- 通用课堂必须支持动画导入、知识锦囊、例子演练、动手练习、三题闯关、完成奖励和重置。

---

### Task 1: Red Tests

**Files:**
- Modify: `tests/curriculum.test.mjs`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces failing assertions for full-course coverage and generic lesson completion.

- [x] Add tests requiring at least 220 course entries, no `building`, lesson package fields, and generic lesson completion.
- [x] Run `node --test tests/curriculum.test.mjs tests/rendered-html.test.mjs`.
- [x] Confirm failure on course count, lesson package, and placeholder `LessonView`.

### Task 2: Curriculum Data

**Files:**
- Modify: `app/data/curriculum.ts`

**Interfaces:**
- Produces `LessonContent`, all-ready `Course`, and 12 books with full unit lists.

- [ ] Replace representative data with full 12-book directory data.
- [ ] Add `buildLesson(course)` to generate original self-study content.
- [ ] Keep `getBook` and `getCourse` stable.
- [ ] Run `node --test tests/curriculum.test.mjs`.

### Task 3: Generic Lesson Classroom

**Files:**
- Modify: `app/components/LessonView.tsx`
- Modify: `app/components/CourseApp.tsx`
- Modify: `app/components/CurriculumView.tsx`

**Interfaces:**
- Consumes `Course.lesson`.
- Produces five-stage non-AOE classroom with completion and reset.

- [ ] Replace placeholder lesson page with staged classroom.
- [ ] Wire `onComplete` and `onReset` for non-AOE lessons.
- [ ] Remove building-state copy from curriculum cards.
- [ ] Run `node --test tests/rendered-html.test.mjs`.

### Task 4: Styling And Full Verification

**Files:**
- Modify: `app/globals.css`
- Modify: generated Pages output through build scripts.

**Interfaces:**
- Produces responsive styles for generic lesson cards and quizzes.

- [ ] Add CSS for lesson packs, example cards, practice choices, and quiz state.
- [ ] Run `npm test`.
- [ ] Fix build, type, or assertion failures until green.

### Task 5: Ship

**Files:**
- All modified project files.

**Interfaces:**
- Produces pushed `main` commit and GitHub Pages deployment.

- [ ] Commit the implementation.
- [ ] Push to `origin/main`.
- [ ] Verify the GitHub Pages workflow finishes successfully.
