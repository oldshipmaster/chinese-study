import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Chinese learning product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /字里少年宫/);
  assert.match(html, /一年级/);
  assert.match(html, /六年级/);
  assert.match(html, /开始今天的学习/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("ships the selected visual system and accessible motion fallback", async () => {
  const [page, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /CourseApp/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /小学语文动画课程/);
  assert.match(css, /#f7f3e8/i);
  assert.match(css, /#29766b/i);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});

test("exposes reset controls and device pinyin speech", async () => {
  const [app, curriculum, lesson] = await Promise.all([
    readFile(new URL("../app/components/CourseApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/CurriculumView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/LessonView.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(app, /resetCourse/);
  assert.match(app, /confirm/);
  assert.match(curriculum, /重置进度/);
  assert.match(lesson, /speechSynthesis/);
  assert.match(lesson, /SpeechSynthesisUtterance/);
  assert.match(lesson, /utterance\.lang = "zh-CN"/);
  assert.match(lesson, /点击听音/);
  assert.match(lesson, /音频播放失败，请检查设备是否静音/);
  assert.match(lesson, /new Audio/);
  assert.match(lesson, /audio\/pinyin-/);
  assert.match(lesson, /audio\.play\(\)/);
  assert.match(lesson, /onended/);
  assert.doesNotMatch(lesson, /useEffect\(\(\) => \{\s*(?:speak|speakPinyin|speakWithDevice)/);
});

test("enables rich course completion after all requirements are satisfied", async () => {
  const lesson = await readFile(new URL("../app/components/LessonView.tsx", import.meta.url), "utf8");

  assert.match(lesson, /const quizPassed = course\.lesson\.quiz\.every/);
  assert.match(lesson, /const lessonPassed = interactionsPassed && openSubmitted && quizPassed/);
  assert.match(lesson, /disabled=\{stage === 7 && !lessonPassed\}/);
  assert.match(lesson, /stage === 7 \? "完成课程" : "下一步 →"/);
});

test("generic lessons are complete rich self-study classrooms", async () => {
  const [app, lesson, curriculum] = await Promise.all([
    readFile(new URL("../app/components/CourseApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/LessonView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/CurriculumView.tsx", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(lesson, /课程正在生长/);
  assert.match(lesson, /知识探秘/);
  assert.match(lesson, /例子拆解/);
  assert.match(lesson, /五题闯关/);
  assert.match(lesson, /const quizPassed = course\.lesson\.quiz\.every/);
  assert.match(lesson, /disabled=\{stage === 7 && !lessonPassed\}/);
  assert.match(lesson, /onComplete\(\)/);
  assert.match(app, /view === "lesson" && <LessonView/);
  assert.doesNotMatch(app, /<AoeLesson/);
  assert.match(app, /onComplete=\{\(\) => persist\(completeCourse\(progress, currentCourse\.id\)\)\}/);
  assert.doesNotMatch(curriculum, /看看学习目标/);
});

test("curated classrooms identify their richer editorial quality", async () => {
  const lesson = await readFile(new URL("../app/components/LessonView.tsx", import.meta.url), "utf8");

  assert.match(lesson, /丰富互动版/);
});

test("rich classrooms expose eight learning stations and varied interaction state", async () => {
  const lesson = await readFile(new URL("../app/components/LessonView.tsx", import.meta.url), "utf8");

  for (const station of ["情境导入", "旧知热身", "知识探秘", "例子拆解", "互动实验", "创新挑战", "五题闯关", "错因拓展"]) {
    assert.match(lesson, new RegExp(station));
  }
  assert.match(lesson, /interactionAnswers/);
  assert.match(lesson, /openResponse/);
  assert.match(lesson, /course\.lesson\.knowledgePoints/);
  assert.match(lesson, /course\.lesson\.extension/);
});

test("the rich pinyin classroom keeps pronunciation click-only", async () => {
  const lesson = await readFile(new URL("../app/components/LessonView.tsx", import.meta.url), "utf8");

  assert.match(lesson, /speechSynthesis/);
  assert.match(lesson, /new Audio/);
  assert.match(lesson, /audio\/pinyin-/);
  assert.match(lesson, /onClick=\{\(\) => speakPinyin/);
  assert.match(lesson, /慢速辨音/);
  assert.match(lesson, /audio\.playbackRate/);
  assert.doesNotMatch(lesson, /useEffect\([^)]*speakPinyin/s);
});

test("rich lessons reveal knowledge, remember misconceptions, and ask for reflection", async () => {
  const lesson = await readFile(new URL("../app/components/LessonView.tsx", import.meta.url), "utf8");

  assert.match(lesson, /revealedKnowledge/);
  assert.match(lesson, /点击翻开方法提示/);
  assert.match(lesson, /wrongAttempts/);
  assert.match(lesson, /masteredKnowledge/);
  assert.match(lesson, /标记为已掌握/);
  assert.match(lesson, /我的错因回顾/);
  assert.match(lesson, /confidence/);
  assert.match(lesson, /我能讲给别人听/);
});

test("every lesson intro runs a pausable three-beat HTML storyboard", async () => {
  const [lesson, css] = await Promise.all([
    readFile(new URL("../app/components/LessonView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(lesson, /animation-frames.*is-playing/);
  assert.match(lesson, /story-beat/);
  assert.match(lesson, /activeStoryBeat/);
  assert.match(lesson, /点击定格观察/);
  assert.match(css, /@keyframes storyBeat/);
  assert.match(css, /nth-child\(2\).*animation-delay/);
  assert.match(css, /prefers-reduced-motion/);
});

test("final station gives a personalized next-study prescription", async () => {
  const lesson = await readFile(new URL("../app/components/LessonView.tsx", import.meta.url), "utf8");
  assert.match(lesson, /studyPrescription/);
  assert.match(lesson, /我的下一步学习处方/);
  assert.match(lesson, /wrongAttempts/);
  assert.match(lesson, /回到互动实验/);
  assert.match(lesson, /挑战拓展任务/);
  assert.match(lesson, /retryWrongQuestions/);
  assert.match(lesson, /只重做错过的题/);
  assert.match(lesson, /回知识卡复习/);
  assert.match(lesson, /30 秒复述卡/);
  assert.match(lesson, /course\.lesson\.summary/);
});
