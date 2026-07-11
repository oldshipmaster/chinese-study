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
  assert.match(lesson, /当前设备不支持语音朗读/);
  assert.match(lesson, /speakLetter\(nextLetter\)/);
  assert.doesNotMatch(lesson, /if \(playing && stage <= 2 && speechEnabled/);
});
