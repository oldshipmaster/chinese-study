import { books } from "../data/curriculum";
import type { LearningProgressV1 } from "../lib/progress";

interface HomeViewProps {
  progress: LearningProgressV1;
  onOpenBook: (bookId: string) => void;
  onStart: () => void;
}

const abilities = [
  ["声", "拼音发音"],
  ["字", "识字写字"],
  ["读", "阅读理解"],
  ["诗", "古诗积累"],
  ["说", "口语表达"],
  ["写", "习作创作"],
];

const totalCourses = books.reduce((sum, book) => sum + book.units.reduce((unitSum, unit) => unitSum + unit.courses.length, 0), 0);

export function HomeView({ progress, onOpenBook, onStart }: HomeViewProps) {
  return (
    <>
      <section className="hero-grid" aria-labelledby="welcome-title">
        <article className="lesson-hero paper-card">
          <div className="eyebrow">今日学习 · 10 分钟</div>
          <h1 id="welcome-title">跟着山风，读准第一个韵母</h1>
          <p className="hero-copy">看口形、听节奏、动手闯关。今天认识三个会唱歌的朋友：a、o、e。</p>
          <div className="lesson-scene" aria-label="a、o、e 在东方山水课堂中轻轻浮动">
            <div className="sun" />
            <div className="mountain mountain-back" />
            <div className="mountain mountain-front" />
            <div className="bamboo" aria-hidden="true"><i /><i /><i /></div>
            <div className="pinyin-cloud" aria-hidden="true"><span>a</span><span>o</span><span>e</span></div>
            <div className="pond" />
          </div>
          <button className="primary-button" onClick={onStart}>开始今天的学习 <span aria-hidden="true">→</span></button>
        </article>

        <aside className="today-panel paper-card" aria-label="今日学习路径">
          <div className="panel-heading"><span>今日小径</span><b>1 / 3</b></div>
          <ol className="path-list">
            <li className="current"><span>1</span><div><b>认识 a o e</b><small>动画课堂 · 10 分钟</small></div></li>
            <li><span>2</span><div><b>口形小游戏</b><small>观察与选择 · 3 分钟</small></div></li>
            <li><span>3</span><div><b>三题闯关</b><small>答对收获 3 片竹叶</small></div></li>
          </ol>
          <div className="progress-note">
            <div className="leaf-medal">叶</div>
            <div><small>我的竹叶</small><strong>{progress.leaves} 片</strong></div>
            <div><small>连续学习</small><strong>{progress.streak} 天</strong></div>
          </div>
        </aside>
      </section>

      <section className="section-block" aria-labelledby="grade-title">
        <div className="section-heading"><div><span className="eyebrow">十二册全量课程地图</span><h2 id="grade-title">从一年级走到六年级</h2></div><p>{totalCourses} 节原创自学课都可以直接开始</p></div>
        <div className="grade-grid">
          {[1, 2, 3, 4, 5, 6].map((grade) => (
            <article className={`grade-card grade-${grade}`} key={grade}>
              <div className="grade-number">{grade}</div>
              <div><h3>{grade} 年级</h3><p>{grade < 3 ? "打好拼音识字基础" : grade < 5 ? "学会阅读与表达" : "走进经典与思辨"}</p></div>
              <div className="term-actions">
                {books.filter((book) => book.grade === grade).map((book) => (
                  <button key={book.bookId} onClick={() => onOpenBook(book.bookId)}>{book.term}<span aria-hidden="true">›</span></button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ability-section section-block" aria-labelledby="ability-title">
        <div className="section-heading"><div><span className="eyebrow">能力竹林</span><h2 id="ability-title">六条成长小径</h2></div><p>不只记住，更要会理解、会表达</p></div>
        <div className="ability-row">
          {abilities.map(([symbol, label], index) => <div className="ability-item" key={label}><span style={{ "--i": index } as React.CSSProperties}>{symbol}</span><b>{label}</b></div>)}
        </div>
      </section>
    </>
  );
}
