"use client";

import { useState } from "react";
import { books, getBook, getCourse } from "../data/curriculum";
import { completeCourse, defaultProgress, parseProgress, PROGRESS_STORAGE_KEY, resetCourse, visitCourse } from "../lib/progress";
import { LESSON_DRAFT_STORAGE_KEY, parseLessonDrafts, removeLessonDraft, type LessonDrafts } from "../lib/lessonDraft";
import { CurriculumView } from "./CurriculumView";
import { HomeView } from "./HomeView";
import { LessonView } from "./LessonView";

type View = "home" | "curriculum" | "lesson";

export function CourseApp() {
  const [view, setView] = useState<View>("home");
  const [bookId, setBookId] = useState("g1-upper");
  const [courseId, setCourseId] = useState("a-o-e");
  const [progress, setProgress] = useState(() => {
    if (typeof window === "undefined") return defaultProgress();
    return parseProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY));
  });
  const [lessonDrafts, setLessonDrafts] = useState<LessonDrafts>(() => typeof window === "undefined" ? {} : parseLessonDrafts(window.localStorage.getItem(LESSON_DRAFT_STORAGE_KEY)));

  const persist = (next: ReturnType<typeof defaultProgress>) => {
    setProgress(next);
    try { window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next)); } catch { /* Learning remains available without storage. */ }
  };
  const openBook = (id: string) => { setBookId(id); setView("curriculum"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openCourse = (id: string) => { persist(visitCourse(progress, id)); setCourseId(id); setView("lesson"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const returnToCurriculum = () => { setLessonDrafts(parseLessonDrafts(window.localStorage.getItem(LESSON_DRAFT_STORAGE_KEY))); setView("curriculum"); };
  const handleReset = (id: string) => {
    const selected = getCourse(id);
    const wasCompleted = progress.completedCourseIds.includes(id);
    const storedDrafts = parseLessonDrafts(window.localStorage.getItem(LESSON_DRAFT_STORAGE_KEY));
    if (!wasCompleted && !storedDrafts[id]) return false;
    const confirmed = window.confirm(wasCompleted
      ? `确定重置《${selected?.title ?? "这节课"}》吗？\n\n完成记录和本课草稿会被删除，并扣回 3 片竹叶。此操作不可撤销。`
      : `确定清空《${selected?.title ?? "这节课"}》的学习草稿吗？\n\n这节课会从情境导入重新开始，其他课程不受影响。`);
    if (!confirmed) return false;
    if (wasCompleted) persist(resetCourse(progress, id));
    const nextDrafts = removeLessonDraft(storedDrafts, id);
    setLessonDrafts(nextDrafts);
    try { window.localStorage.setItem(LESSON_DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts)); } catch { /* Reset completion still succeeds without draft storage. */ }
    return true;
  };
  const currentBook = getBook(bookId) ?? books[0];
  const currentCourse = getCourse(courseId) ?? getCourse("a-o-e")!;

  return (
    <div className="site-shell">
      {view !== "lesson" && <header className="site-header"><button className="brand" onClick={() => setView("home")} aria-label="返回字里少年宫首页"><span>字</span><div><strong>字里少年宫</strong><small>在山水间，读懂中国字</small></div></button><div className="header-status"><span>统编版 · 一至六年级</span><b>竹叶 {progress.leaves}</b></div></header>}
      {view === "home" && <main className="home-page"><HomeView progress={progress} onOpenBook={openBook} onStart={openCourse} /></main>}
      {view === "curriculum" && <CurriculumView book={currentBook} completed={progress.completedCourseIds} draftStages={Object.fromEntries(Object.entries(lessonDrafts).map(([id, draft]) => [id, draft.stage]))} onBack={() => setView("home")} onOpenCourse={openCourse} onResetCourse={handleReset} />}
      {view === "lesson" && <LessonView course={currentCourse} completed={progress.completedCourseIds.includes(currentCourse.id)} onBack={returnToCurriculum} onComplete={() => persist(completeCourse(progress, currentCourse.id))} onReset={() => handleReset(currentCourse.id)} />}
      {view !== "lesson" && <footer className="site-footer"><div><strong>字里少年宫</strong><span>原创小学语文动画课程</span></div><p>依据课程标准与统编教材结构设计，不复制教材正文与插图。</p></footer>}
    </div>
  );
}
