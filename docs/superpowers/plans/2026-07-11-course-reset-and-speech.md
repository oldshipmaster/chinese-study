# Course Reset and Pinyin Speech Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let children reset one completed course with its reward and hear `a o e` pronunciations through device speech.

**Architecture:** A pure progress helper owns reset semantics. `CourseApp` coordinates confirmation and persistence, while `CurriculumView` and `AoeLesson` expose reset controls; speech remains local to `AoeLesson`.

**Tech Stack:** React 19, TypeScript, Web Speech API, localStorage, Node tests, Vite/GitHub Pages.

## Global Constraints

- Reset removes one completion and deducts 3 leaves, never below 0.
- Repeated or incomplete-course reset is a no-op.
- Reset controls appear on completed cards and in the completed lesson toolbar.
- Speech uses `zh-CN`, cancels on pause, reset, navigation, and unmount, and degrades visibly when unsupported.

---

### Task 1: Pure reset behavior

**Files:** Modify `app/lib/progress.ts`, `tests/progress.test.mjs`.

**Interfaces:** Produce `resetCourse(progress, courseId): LearningProgressV1`.

- [ ] Add failing assertions for removing a completed id, deducting 3 leaves, zero floor, and no-op repeat.
- [ ] Run `node --test tests/progress.test.mjs`; expect failure because `resetCourse` is absent.
- [ ] Implement immutable `resetCourse` with an early return for incomplete ids.
- [ ] Run the progress test and commit `feat: add single-course progress reset`.

### Task 2: Reset controls and speech

**Files:** Modify `CourseApp.tsx`, `CurriculumView.tsx`, `AoeLesson.tsx`, `globals.css`, `tests/rendered-html.test.mjs`.

**Interfaces:** `CurriculumView.onResetCourse`, `AoeLesson.onReset`; `CourseApp` confirms and persists.

- [ ] Add failing source/render assertions for both reset entry points, `speechSynthesis`, `zh-CN`, and the visible speech fallback.
- [ ] Run targeted tests and confirm failure.
- [ ] Add confirmed reset coordination, local lesson-state reset, speech controls, automatic letter speech, cancellation lifecycle, accessible labels, and destructive secondary styling.
- [ ] Run `npm test`; expect all checks pass.
- [ ] Commit `feat: reset lessons and play pinyin speech`.

### Task 3: Publish and verify

**Files:** No additional product files.

**Interfaces:** GitHub Actions publishes `main` to the existing Pages URL.

- [ ] Merge the feature branch to `main`, run `npm test`, and push.
- [ ] Monitor the Pages workflow to success.
- [ ] Verify the public page and JavaScript asset return HTTP 200 and the deployed bundle contains speech/reset strings.
