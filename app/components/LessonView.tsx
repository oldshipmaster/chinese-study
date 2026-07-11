import type { Course } from "../data/curriculum";

interface LessonViewProps { course: Course; onBack: () => void; }

export function LessonView({ course, onBack }: LessonViewProps) {
  return (
    <main className="inner-page building-page">
      <button className="back-button" onClick={onBack}>← 返回课程地图</button>
      <section className="building-card paper-card">
        <div className="building-illustration" aria-hidden="true"><span>竹</span><i /><i /><i /></div>
        <span className="eyebrow">课程正在生长</span>
        <h1>{course.title}</h1>
        <p className="objective">这一课将带你：{course.objective}</p>
        <div className="coming-steps"><span>动画导入</span><span>知识讲解</span><span>动手练习</span><span>三题闯关</span></div>
        <p className="small-note">我们正在制作这节原创动画课。你可以先去体验已经开放的 “a o e” 课堂。</p>
        <button className="primary-button" onClick={onBack}>选择其他课程</button>
      </section>
    </main>
  );
}
