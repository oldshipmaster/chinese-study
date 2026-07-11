"use client";

import { useState } from "react";
import { books, getBook, getCourse } from "../data/curriculum";
import { completeCourse, defaultProgress, parseProgress, PROGRESS_STORAGE_KEY, resetCourse } from "../lib/progress";
import { AoeLesson } from "./AoeLesson";
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

  const persist = (next: ReturnType<typeof defaultProgress>) => {
    setProgress(next);
    try { window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next)); } catch { /* Learning remains available without storage. */ }
  };
  const openBook = (id: string) => { setBookId(id); setView("curriculum"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openCourse = (id: string) => { setCourseId(id); setView("lesson"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const handleReset = (id: string) => {
    const selected = getCourse(id);
    if (!progress.completedCourseIds.includes(id)) return false;
    const confirmed = window.confirm(`确定重置《${selected?.title ?? "这节课"}》吗？\n\n完成记录会被删除，并扣回 3 片竹叶。此操作不可撤销。`);
    if (!confirmed) return false;
    persist(resetCourse(progress, id));
    return true;
  };
  const currentBook = getBook(bookId) ?? books[0];
  const currentCourse = getCourse(courseId) ?? getCourse("a-o-e")!;

  return (
    <div className="site-shell">
      {view !== "lesson" && <header className="site-header"><button className="brand" onClick={() => setView("home")} aria-label="返回字里少年宫首页"><span>字</span><div><strong>字里少年宫</strong><small>在山水间，读懂中国字</small></div></button><div className="header-status"><span>统编版 · 一至六年级</span><b>竹叶 {progress.leaves}</b></div></header>}
      {view === "home" && <main className="home-page"><HomeView progress={progress} onOpenBook={openBook} onStart={() => openCourse("a-o-e")} /></main>}
      {view === "curriculum" && <CurriculumView book={currentBook} completed={progress.completedCourseIds} onBack={() => setView("home")} onOpenCourse={openCourse} onResetCourse={handleReset} />}
      {view === "lesson" && courseId === "a-o-e" && <AoeLesson completed={progress.completedCourseIds.includes("a-o-e")} onBack={() => setView("curriculum")} onComplete={() => persist(completeCourse(progress, "a-o-e"))} onReset={() => handleReset("a-o-e")} />}
      {view === "lesson" && courseId !== "a-o-e" && <LessonView course={currentCourse} completed={progress.completedCourseIds.includes(currentCourse.id)} onBack={() => setView("curriculum")} onComplete={() => persist(completeCourse(progress, currentCourse.id))} onReset={() => handleReset(currentCourse.id)} />}
      {view !== "lesson" && <footer className="site-footer"><div><strong>字里少年宫</strong><span>原创小学语文动画课程</span></div><p>依据课程标准与统编教材结构设计，不复制教材正文与插图。</p></footer>}
    </div>
  );
}
