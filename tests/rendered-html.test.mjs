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
    readFile(new URL("../app/components/AoeLesson.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(app, /resetCourse/);
  assert.match(app, /confirm/);
  assert.match(curriculum, /重置进度/);
  assert.match(lesson, /speechSynthesis/);
  assert.match(lesson, /SpeechSynthesisUtterance/);
  assert.match(lesson, /utterance\.lang = "zh-CN"/);
  assert.match(lesson, /听发音/);
  assert.match(lesson, /音频播放失败，请检查设备是否静音/);
  assert.doesNotMatch(lesson, /speakLetter\(nextLetter\)/);
  assert.match(lesson, /onClick=\{\(\) => speakLetter\(letter, true\)\}/);
  assert.doesNotMatch(lesson, /if \(playing && stage <= 2 && speechEnabled/);
  assert.match(lesson, /new Audio/);
  assert.match(lesson, /audio\/pinyin-/);
  assert.match(lesson, /audio\.play\(\)/);
  assert.match(lesson, /onended/);
});

test("enables course completion after all three quiz answers are correct", async () => {
  const lesson = await readFile(new URL("../app/components/AoeLesson.tsx", import.meta.url), "utf8");

  assert.match(lesson, /const quizPassed = questions\.every/);
  assert.match(lesson, /disabled=\{stage === 4 && !quizPassed\}/);
  assert.match(lesson, /stage === 4 \? "完成课程" : "下一步 →"/);
  assert.match(lesson, /if \(stage === 4\) onBack\(\)/);
});

test("generic lessons are complete self-study classrooms", async () => {
  const [app, lesson, curriculum] = await Promise.all([
    readFile(new URL("../app/components/CourseApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/LessonView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/CurriculumView.tsx", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(lesson, /课程正在生长/);
  assert.match(lesson, /知识锦囊/);
  assert.match(lesson, /例子演练/);
  assert.match(lesson, /三题闯关/);
  assert.match(lesson, /const quizPassed = course\.lesson\.quiz\.every/);
  assert.match(lesson, /disabled=\{stage === 4 && !quizPassed\}/);
  assert.match(lesson, /onComplete\(\)/);
  assert.match(app, /courseId !== "a-o-e" && <LessonView/);
  assert.match(app, /onComplete=\{\(\) => persist\(completeCourse\(progress, currentCourse\.id\)\)\}/);
  assert.doesNotMatch(curriculum, /看看学习目标/);
});

test("curated classrooms identify their editorial quality", async () => {
  const lesson = await readFile(new URL("../app/components/LessonView.tsx", import.meta.url), "utf8");

  assert.match(lesson, /course\.lesson\.curated/);
  assert.match(lesson, /逐课精编/);
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
