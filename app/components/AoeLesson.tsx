"use client";

import { useEffect, useState } from "react";

const stages = ["动画导入", "发音秘诀", "四声小路", "动手练习", "三题闯关"];
const letters = [
  { letter: "a", mouth: "嘴巴张大 a a a", clue: "像小朋友张大嘴巴" },
  { letter: "o", mouth: "嘴巴圆圆 o o o", clue: "像圆圆的小泡泡" },
  { letter: "e", mouth: "嘴巴扁扁 e e e", clue: "像水里的小白鹅" },
];
const questions = [
  { prompt: "嘴巴张得最大时，读哪个韵母？", options: ["a", "o", "e"], answer: "a" },
  { prompt: "哪一个韵母读的时候嘴巴圆圆？", options: ["e", "a", "o"], answer: "o" },
  { prompt: "给 a 戴上第二声小帽子，选哪一个？", options: ["ā", "á", "ǎ"], answer: "á" },
];

interface AoeLessonProps { onBack: () => void; onComplete: () => void; }

export function AoeLesson({ onBack, onComplete }: AoeLessonProps) {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [letter, setLetter] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [message, setMessage] = useState("跟着动画，轻轻读一遍");

  useEffect(() => {
    if (!playing || stage > 2) return;
    const timer = window.setInterval(() => setLetter((current) => (current + 1) % 3), 1800);
    return () => window.clearInterval(timer);
  }, [playing, stage]);

  const choose = (questionIndex: number, value: string) => {
    const next = [...answers];
    next[questionIndex] = value;
    setAnswers(next);
    if (value === questions[questionIndex].answer) {
      setMessage(questionIndex === 2 ? "三题全对！你收获了 3 片竹叶。" : "答对啦，继续向前！");
      if (questionIndex === 2 && questions.every((q, index) => (index === questionIndex ? value : next[index]) === q.answer)) onComplete();
    } else setMessage("再观察一下口形，换一个答案试试。");
  };

  return (
    <main className="lesson-page">
      <header className="lesson-toolbar">
        <button className="back-button" onClick={onBack}>← 课程地图</button>
        <div className="lesson-title"><span>一年级上册 · 汉语拼音</span><strong>a o e</strong></div>
        <div className="leaf-pill">叶 {answers.filter((value, index) => value === questions[index]?.answer).length} / 3</div>
      </header>

      <nav className="stage-nav" aria-label="课程步骤">
        {stages.map((name, index) => <button key={name} className={index === stage ? "active" : index < stage ? "done" : ""} onClick={() => setStage(index)}><span>{index < stage ? "✓" : index + 1}</span>{name}</button>)}
      </nav>

      <section className="classroom-stage" aria-live="polite">
        <div className="lesson-landscape" aria-hidden="true"><div className="lesson-sun" /><div className="lesson-hill one" /><div className="lesson-hill two" /><div className="lesson-water" /></div>
        {stage === 0 && <div className="stage-content intro-content"><span className="eyebrow">听，山谷里是谁在唱歌？</span><h1>三个单韵母朋友</h1><div className={`letter-trio ${playing ? "is-playing" : ""}`}>{letters.map((item, index) => <button key={item.letter} className={letter === index ? "current" : ""} onClick={() => setLetter(index)}>{item.letter}</button>)}</div><p>{letters[letter].clue}</p></div>}
        {stage === 1 && <div className="stage-content pronunciation"><span className="eyebrow">看口形，再开口</span><h1>{letters[letter].letter}</h1><div className={`mouth mouth-${letters[letter].letter}`} aria-hidden="true"><i /></div><p>{letters[letter].mouth}</p><div className="letter-switch">{letters.map((item, index) => <button className={letter === index ? "active" : ""} key={item.letter} onClick={() => setLetter(index)}>{item.letter}</button>)}</div></div>}
        {stage === 2 && <div className="stage-content tones"><span className="eyebrow">小帽子的方向，会改变声音</span><h1>跟着小路读四声</h1><div className="tone-path"><span className="tone-one">ā</span><span className="tone-two">á</span><span className="tone-three">ǎ</span><span className="tone-four">à</span></div><p>一声平，二声扬，三声拐弯，四声降。</p></div>}
        {stage === 3 && <div className="stage-content practice"><span className="eyebrow">用眼睛找一找</span><h1>声音和图形牵牵手</h1><div className="match-grid">{letters.map((item) => <button key={item.letter} onClick={() => setMessage(`${item.letter}：${item.mouth}`)}><strong>{item.letter}</strong><span>{item.clue}</span></button>)}</div><p>{message}</p></div>}
        {stage === 4 && <div className="stage-content quiz"><span className="eyebrow">最后一站</span><h1>三题闯关</h1><div className="quiz-list">{questions.map((question, qIndex) => <fieldset key={question.prompt}><legend>{qIndex + 1}. {question.prompt}</legend><div>{question.options.map((option) => <button className={answers[qIndex] === option ? option === question.answer ? "correct" : "wrong" : ""} key={option} onClick={() => choose(qIndex, option)}>{option}</button>)}</div></fieldset>)}</div><p className="quiz-message">{message}</p></div>}
      </section>

      <footer className="lesson-controls">
        <button onClick={() => { setPlaying(!playing); setMessage(playing ? "动画暂停了，你可以慢慢观察。" : "动画继续，我们一起读。"); }}>{playing ? "暂停" : "播放"}</button>
        <button onClick={() => { setLetter(0); setPlaying(true); setMessage("从头再看一遍"); }}>重播</button>
        <div className="control-spacer" />
        <button disabled={stage === 0} onClick={() => setStage((value) => Math.max(0, value - 1))}>上一步</button>
        <button className="primary-button" disabled={stage === 4} onClick={() => setStage((value) => Math.min(4, value + 1))}>下一步 →</button>
      </footer>
    </main>
  );
}
