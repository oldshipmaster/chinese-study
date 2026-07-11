import assert from "node:assert/strict";
import { build } from "esbuild";

const result = await build({
  entryPoints: ["app/data/curriculum.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
  logLevel: "silent",
});
const curriculum = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
const ids = new Set();
const report = [];

for (const book of curriculum.books) {
  const courses = book.units.flatMap((unit) => unit.courses);
  const typeCounts = Object.fromEntries([...new Set(courses.map((course) => course.type))].map((type) => [type, courses.filter((course) => course.type === type).length]));
  for (const course of courses) {
    assert.ok(!ids.has(course.id), `重复课程 ID：${course.id}`);
    ids.add(course.id);
    assert.equal(course.lesson.curated, true, `${course.id} 缺少独立编辑内容`);
    assert.equal(course.lesson.knowledgePoints.length, 5, `${course.id} 知识卡数量不足`);
    assert.equal(course.lesson.inquiries.length, 3, `${course.id} 探究问题数量不足`);
    assert.equal(course.lesson.toolkit.length, 4, `${course.id} 能力工具数量不足`);
    assert.equal(course.lesson.openTask.routes.length, 3, `${course.id} 自主挑战路线不足`);
    assert.ok(course.lesson.contrastCase.repair.length >= 12, `${course.id} 缺少误区修正`);
    assert.ok(course.lesson.extension.connection.insight.length >= 20, `${course.id} 缺少跨学科连接`);
    assert.ok(course.lesson.interactions.length >= 2, `${course.id} 互动数量不足`);
    assert.equal(course.lesson.quiz.length, 5, `${course.id} 分层题数量不足`);
    assert.equal(new Set(course.lesson.quiz.map((question) => question.difficulty)).size, 5, `${course.id} 分层题难度不完整`);
    assert.ok(course.lesson.quiz.every((question) => question.options.includes(question.answer)), `${course.id} 存在无答案题目`);
  }
  report.push({ book: `${book.grade}年级${book.term}`, units: book.units.length, courses: courses.length, types: typeCounts, result: "通过" });
}

assert.equal(curriculum.books.length, 12, "教材册数不是 12");
assert.equal(ids.size, 564, "课程总数不是 564");
console.table(report);
console.log(`逐册审计通过：12 册，${ids.size} 课；每课 5 张知识卡、3 个探究问题、4 件能力工具、3 条自主挑战路线、误区修正、跨学科连接、至少 2 项互动、5 道分层题。`);
