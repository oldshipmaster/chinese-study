# GitHub Pages Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the existing course app at `https://oldshipmaster.github.io/chinese-study/` with automatic deployment from `main`.

**Architecture:** A small Vite client entry reuses the existing React components and CSS, producing static files in `pages-dist`. A GitHub Actions Pages workflow builds and deploys that directory on every main-branch push.

**Tech Stack:** React 19, Vite 8, TypeScript, GitHub Actions, GitHub Pages.

## Global Constraints

- Preserve all existing course behavior and localStorage progress.
- Use `/chinese-study/` as the production asset base.
- Keep the existing vinext build and six tests passing.
- Deploy only from the public `oldshipmaster/chinese-study` repository.

---

### Task 1: Static Pages build

**Files:** Create `pages/index.html`, `pages/main.tsx`, `vite.pages.config.ts`, `tests/pages-build.test.mjs`; modify `package.json`.

**Interfaces:** `pages/main.tsx` mounts `CourseApp`; `npm run build:pages` writes `pages-dist` with base `/chinese-study/`.

- [ ] Write a failing test asserting the config, build script, client entry, and `.nojekyll` output.
- [ ] Run `node --test tests/pages-build.test.mjs`; expect failure because the files do not exist.
- [ ] Add the Vite entry and config, plus `build:pages` and `postbuild:pages` scripts.
- [ ] Run `npm run build:pages && node --test tests/pages-build.test.mjs`; expect pass.
- [ ] Commit with `feat: add GitHub Pages static build`.

### Task 2: GitHub Actions deployment

**Files:** Create `.github/workflows/pages.yml`; modify `README.md`.

**Interfaces:** Workflow uploads `pages-dist` and deploys it using the official Pages actions.

- [ ] Extend the Pages test to require `configure-pages`, `upload-pages-artifact`, `deploy-pages`, and Pages write permissions; run it and confirm failure.
- [ ] Add the workflow and document the public URL.
- [ ] Run `npm test && npm run build:pages && node --test tests/pages-build.test.mjs`; expect all checks pass.
- [ ] Commit with `ci: deploy course to GitHub Pages`.

### Task 3: Repository and production deployment

**Files:** No new product files.

**Interfaces:** GitHub repository `oldshipmaster/chinese-study` receives `main`; Pages returns the deployed URL.

- [ ] Create the public repository if absent and set it as `origin`.
- [ ] Configure Pages build type to `workflow`, push `main`, and monitor the Pages workflow to success.
- [ ] Verify `https://oldshipmaster.github.io/chinese-study/` returns HTTP 200 and contains `字里少年宫`.
- [ ] Report the production URL and repository URL.
