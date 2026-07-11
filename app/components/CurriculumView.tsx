import type { Book } from "../data/curriculum";

const labels = { pinyin: "拼音", literacy: "识字", reading: "阅读", poetry: "古诗", speaking: "口语", writing: "习作", garden: "园地" };

interface CurriculumViewProps {
  book: Book;
  completed: string[];
  onBack: () => void;
  onOpenCourse: (courseId: string) => void;
  onResetCourse: (courseId: string) => void;
}

export function CurriculumView({ book, completed, onBack, onOpenCourse, onResetCourse }: CurriculumViewProps) {
  return (
    <main className="inner-page">
      <button className="back-button" onClick={onBack}>← 返回学习首页</button>
      <header className="book-header">
        <div><span className="eyebrow">统编版课程地图</span><h1>{book.grade} 年级 · {book.term}</h1><p>{book.edition}</p></div>
        <div className="book-seal"><strong>{book.grade}</strong><span>年级</span></div>
      </header>
      {book.units.map((unit, index) => (
        <section className="unit-section" key={unit.id}>
          <div className="unit-title"><span>第 {index + 1} 单元</span><div><h2>{unit.title}</h2><p>{unit.theme}</p></div></div>
          <div className="course-grid">
            {unit.courses.map((item, courseIndex) => {
              const done = completed.includes(item.id);
              return (
                <article className={`course-card ${item.status}`} key={item.id}>
                  <div className="course-top"><span className={`type-badge type-${item.type}`}>{labels[item.type]}</span><small>{item.minutes} 分钟</small></div>
                  <div className="course-index">{String(courseIndex + 1).padStart(2, "0")}</div>
                  <h3>{item.title}</h3><p>{item.objective}</p>
                  <button onClick={() => onOpenCourse(item.id)}>{done ? "再学一次" : "开始学习"}<span aria-hidden="true">→</span></button>
                  {done && <button className="reset-button" onClick={() => onResetCourse(item.id)}>重置进度</button>}
                  {done && <span className="done-mark">已完成</span>}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
