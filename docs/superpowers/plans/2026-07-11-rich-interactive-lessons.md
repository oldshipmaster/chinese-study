# 全量丰富互动课堂 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 12 册 564 课增加多知识点、课型互动、创新问题、错因解析和拓展内容。

**Architecture:** 以现有逐课 `LessonSeed` 为内容事实源，新增纯函数丰富课堂构建器和七种课型互动配置；React 课堂只渲染结构化八站课程并保存交互状态。全量数据测试保证每课达到同一质量下限，课型测试保证互动不再同质化。

**Tech Stack:** TypeScript、React 19、Node test、vinext、Vite、GitHub Pages

## Global Constraints

- 覆盖 12 册全部 564 课，不做只服务示范课的特殊实现。
- 不复制教材正文与插图，只使用原创讲解、例子和题目。
- 拼音语音必须由用户点击触发，禁止自动播放。
- 保留现有课程 id、进度和单课重置行为。
- 一二年级 15–20 分钟，三四年级 20–25 分钟，五六年级 25–30 分钟。

---

### Task 1: 丰富课堂数据契约

**Files:**
- Create: `app/data/richLesson.ts`
- Modify: `app/data/curriculum.ts`
- Test: `tests/rich-lessons.test.mjs`

- [ ] 写失败测试，检查 564 课的知识点、互动、开放任务、五题、错因和拓展字段。
- [ ] 运行测试，确认丰富课堂字段尚不存在。
- [ ] 定义知识点、互动任务、开放任务、分层问题和拓展卡接口。
- [ ] 实现按种子、课型和年级构建丰富课堂的纯函数。
- [ ] 运行数据测试并提交。

### Task 2: 七种课型互动引擎

**Files:**
- Modify: `app/data/richLesson.ts`
- Test: `tests/rich-lessons.test.mjs`

- [ ] 写失败测试，要求七种课型至少覆盖六种不同互动模式。
- [ ] 为拼音、识字、阅读、古诗、口语、习作、园地配置不同互动组合和提示。
- [ ] 校验每课至少两项互动且内容引用该课种子。
- [ ] 运行测试并提交。

### Task 3: 八站互动课堂界面

**Files:**
- Modify: `app/components/LessonView.tsx`
- Modify: `app/globals.css`
- Test: `tests/rendered-html.test.mjs`

- [ ] 写失败测试，要求八站导航、知识卡、互动实验、开放表达、五题闯关和错因反馈。
- [ ] 实现八站导航以及选择、排序、翻卡和开放表达状态。
- [ ] 完成条件改为互动任务完成、开放表达已提交、五题全对。
- [ ] 添加移动端和减少动态效果样式。
- [ ] 运行组件测试并提交。

### Task 4: 全量分年级质量门槛

**Files:**
- Modify: `app/data/curriculum.ts`
- Modify: `tests/curriculum.test.mjs`
- Modify: `tests/rich-lessons.test.mjs`

- [ ] 写失败测试，要求三档课时和文字复杂度随年级提升。
- [ ] 实现分年级课时与高阶问题配置。
- [ ] 审计 564 课无缺口、id 唯一、核心内容唯一、互动字段完整。
- [ ] 运行全部测试并提交。

### Task 5: 完整验证与发布

**Files:**
- Modify: `docs/superpowers/plans/2026-07-11-rich-interactive-lessons.md`

- [ ] 运行 `npm run lint`。
- [ ] 运行 `npm test`。
- [ ] 提交到 `main` 并推送。
- [ ] 等待 GitHub Pages 工作流成功。
- [ ] 在线抽查低、中、高年级课程的新互动与无自动播放行为。

