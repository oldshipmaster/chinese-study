import assert from "node:assert/strict";
import { existsSync } from "node:fs";
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
const quizSignatures = new Set();
const sceneSignatures = new Set();
const creativeQuestionSignatures = new Set();
const answerPositions = [0, 0, 0];
const report = [];

for (const book of curriculum.books) {
  const courses = book.units.flatMap((unit) => unit.courses);
  const typeCounts = [...new Set(courses.map((course) => course.type))].map((type) => `${type}:${courses.filter((course) => course.type === type).length}`).join(" · ");
  for (const course of courses) {
    const expressive = course.type === "writing" || course.type === "speaking";
    const expectedMinutes = book.grade <= 2 ? (expressive ? 20 : 18) : book.grade <= 4 ? (expressive ? 25 : 23) : expressive ? 30 : 28;
    assert.ok(!ids.has(course.id), `重复课程 ID：${course.id}`);
    ids.add(course.id);
    quizSignatures.add(course.lesson.quiz.map((question) => `${question.prompt}|${question.answer}`).join("||"));
    for (const question of course.lesson.quiz) answerPositions[question.options.indexOf(question.answer)] += 1;
    sceneSignatures.add(course.lesson.animationFrames.join("||"));
    creativeQuestionSignatures.add(course.lesson.creativeQuestions.map((item) => `${item.prompt}|${item.reference}`).join("||"));
    assert.equal(course.lesson.curated, true, `${course.id} 缺少独立编辑内容`);
    assert.ok(!/待补充|敬请期待|课程正在生长|占位/.test(JSON.stringify(course.lesson)), `${course.id} 仍含占位内容`);
    assert.equal(course.lesson.lessonId, course.id, `${course.id} 课程内容标识错位`);
    assert.equal(course.lesson.courseKind, course.type, `${course.id} 课型引擎错位`);
    assert.equal(course.minutes, expectedMinutes, `${course.id} 课时长度未按年级适配`);
    if (course.type === "pinyin") {
      for (const token of course.title.split(/\s+/).filter(Boolean)) {
        const audioToken = token.replaceAll("ü", "v");
        assert.ok(existsSync(`static-site/public/audio/pinyin-${audioToken}.wav`), `${course.id} 缺少 ${token} 发音`);
        if (["a", "o", "e", "i", "u", "ü"].includes(token)) {
          for (const tone of [1, 2, 3, 4]) assert.ok(existsSync(`static-site/public/audio/pinyin-tone-${audioToken}${tone}.wav`), `${course.id} 缺少 ${token} 第 ${tone} 声`);
        }
      }
    }
    assert.ok(course.lesson.focus.length >= 10, `${course.id} 核心知识过短`);
    assert.ok(course.lesson.hook.includes(course.title), `${course.id} 情境导入没有连接课题`);
    assert.ok(course.lesson.summary.includes(course.title), `${course.id} 总结没有连接课题`);
    assert.equal(new Set(course.lesson.animationFrames).size, 3, `${course.id} 动画分镜重复`);
    assert.equal(new Set(course.lesson.examples).size, 3, `${course.id} 例子拆解重复`);
    assert.equal(course.lesson.knowledgePoints.length, 5, `${course.id} 知识卡数量不足`);
    assert.equal(course.lesson.inquiries.length, 3, `${course.id} 探究问题数量不足`);
    assert.equal(course.lesson.creativeQuestions.length, 5, `${course.id} 创新问题数量不足`);
    assert.equal(new Set(course.lesson.creativeQuestions.map((item) => item.kind)).size, 5, `${course.id} 创新问题类型不完整`);
    assert.ok(course.lesson.creativeQuestions.every((item) => item.prompt.length >= 12 && item.hint.length >= 10 && item.reference.length >= 18 && item.followUp.length >= 10), `${course.id} 创新问题内容过短`);
    assert.equal(course.lesson.toolkit.length, 4, `${course.id} 能力工具数量不足`);
    assert.equal(course.lesson.glossary.length, 3, `${course.id} 语文概念数量不足`);
    assert.equal(course.lesson.openTask.routes.length, 3, `${course.id} 自主挑战路线不足`);
    assert.equal(course.lesson.openTask.rubric.length, 3, `${course.id} 表达自检标准不足`);
    assert.equal(course.lesson.openTask.organizer.length, 3, `${course.id} 缺少三步思考组织器`);
    assert.equal(new Set(course.lesson.openTask.organizer.map((step) => step.label)).size, 3, `${course.id} 思考组织器步骤重复`);
    assert.ok(course.lesson.openTask.organizer.every((step) => step.prompt.includes(course.title) || step.prompt.length >= 18), `${course.id} 思考组织器提示过于空泛`);
    assert.equal(course.lesson.questionStudio.stems.length, 3, `${course.id} 出题工坊题干支架不足`);
    assert.ok(course.lesson.questionStudio.mission.includes(course.title), `${course.id} 出题任务没有连接课题`);
    assert.ok(course.lesson.questionStudio.qualityCheck.length >= 16, `${course.id} 出题质量标准不足`);
    assert.ok(course.lesson.contrastCase.repair.length >= 12, `${course.id} 缺少误区修正`);
    assert.ok(course.lesson.extension.connection.insight.length >= 20, `${course.id} 缺少跨学科连接`);
    assert.ok(course.lesson.interactions.length >= 2, `${course.id} 互动数量不足`);
    assert.ok([course.lesson.warmUp, ...course.lesson.interactions].every((task) => task.reflection.length >= 12), `${course.id} 互动后缺少自我解释`);
    assert.equal(course.lesson.quiz.length, 5, `${course.id} 分层题数量不足`);
    assert.equal(new Set(course.lesson.quiz.map((question) => question.difficulty)).size, 5, `${course.id} 分层题难度不完整`);
    assert.ok(course.lesson.quiz.every((question) => question.options.includes(question.answer)), `${course.id} 存在无答案题目`);
  }
  report.push({ book: `${book.grade}年级${book.term}`, units: book.units.length, courses: courses.length, types: typeCounts, result: "通过" });
}

assert.equal(curriculum.books.length, 12, "教材册数不是 12");
assert.equal(curriculum.books.reduce((sum, book) => sum + book.units.length, 0), 95, "单元总数不是 95");
assert.equal(ids.size, 564, "课程总数不是 564");
assert.equal(quizSignatures.size, 564, "存在重复的整套五题闯关");
assert.equal(sceneSignatures.size, 564, "存在重复的整套动画分镜");
assert.equal(creativeQuestionSignatures.size, 564, "存在重复的整套创新问题");
assert.ok(answerPositions.every((count) => count >= 700), `正确答案位置分布不均：${answerPositions.join(",")}`);
console.table(report);
console.log(`逐册审计通过：12 册、95 个单元、${ids.size} 课；564 套动画、分层闯关和创新问题均唯一；每课 5 张知识卡、3 个正式概念、3 个探究问题、5 道可揭晓创新问题、4 件能力工具、3 步思考组织器、3 条自主挑战路线、误区修正、跨学科连接和至少 2 项互动。`);
console.log(`五题正确答案位置分布：第1位 ${answerPositions[0]} 题，第2位 ${answerPositions[1]} 题，第3位 ${answerPositions[2]} 题。`);
