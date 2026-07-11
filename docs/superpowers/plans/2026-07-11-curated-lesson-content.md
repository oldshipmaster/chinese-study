# 逐课精编课程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按册把 563 个通用课程升级为课题对应的原创自学课堂，第一批完成一年级上下册。

**Architecture:** 在课程目录和课堂生成器之间加入可审校的 `LessonSeed` 内容层。课程构建时优先使用逐课种子，未完成册继续走兼容回退；测试按书册强制种子覆盖，完成一册后再扩大强制范围。

**Tech Stack:** TypeScript、React 19、Node test、vinext、Vite、GitHub Pages

## Global Constraints

- 不复制教材正文、插图或整页排版，只编写原创讲解与练习。
- 保留现有课程 id、进度数据和 `a o e` 专属课堂。
- 语音只能由孩子点击触发，不自动播放。
- 每完成一册必须通过内容、交互、构建测试后才能发布。

---

### Task 1: 建立可测试的精编内容层

**Files:**
- Create: `app/data/lessonSeeds.ts`
- Modify: `app/data/curriculum.ts`
- Test: `tests/curriculum.test.mjs`

- [x] 写失败测试，要求一年级课程都有精编种子并带唯一知识内容。
- [x] 运行测试，确认因种子模块缺失而失败。
- [x] 定义 `LessonSeed`、种子查询和内容完整性接口。
- [x] 运行测试，确认内容层基础约束通过。

### Task 2: 精编一年级上下册

**Files:**
- Modify: `app/data/lessonSeeds.ts`
- Modify: `app/data/curriculum.ts`
- Test: `tests/curriculum.test.mjs`

- [x] 为一年级每个课程 id 编写独立核心知识、示例和检测。
- [x] 让 `buildLesson` 用精编种子生成知识、例子、练习和三题闯关。
- [x] 校验一年级种子全覆盖且核心知识不重复。

### Task 3: 显示内容质量并完成发布验证

**Files:**
- Modify: `app/components/LessonView.tsx`
- Modify: `app/globals.css`
- Test: `tests/rendered-html.test.mjs`

- [x] 写失败测试，要求精编课堂显示“逐课精编”。
- [x] 实现质量标识和适合儿童理解的内容呈现。
- [x] 运行 `npm run lint` 与 `npm test`。
- [ ] 提交、推送并确认 GitHub Pages 发布成功。
