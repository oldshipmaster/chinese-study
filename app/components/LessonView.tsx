"use client";

import { useState } from "react";
import type { Course } from "../data/curriculum";

const stages = ["动画导入", "知识锦囊", "例子演练", "动手练习", "三题闯关"];

interface LessonViewProps {
  course: Course;
  completed: boolean;
  onBack: () => void;
  onComplete: () => void;
  onReset: () => boolean;
}

export function LessonView({ course, completed, onBack, onComplete, onReset }: LessonViewProps) {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [practiceChoice, setPracticeChoice] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [message, setMessage] = useState("跟着动画，把本课目标看清楚。");
  const [notified, setNotified] = useState(completed);
  const quizPassed = course.lesson.quiz.every((question, index) => answers[index] === question.answer);

  const completeIfReady = (nextAnswers: string[]) => {
    const passed = course.lesson.quiz.every((question, index) => nextAnswers[index] === question.answer);
    if (passed && !notified) {
      setNotified(true);
      onComplete();
    }
    return passed;
  };

  const choosePractice = (value: string) => {
    setPracticeChoice(value);
    setMessage(value === course.lesson.practice.answer ? course.lesson.practice.feedback : "换个角度想一想：先按这节课的方法走一遍。");
  };

  const chooseQuiz = (questionIndex: number, value: string) => {
    const next = [...answers];
    next[questionIndex] = value;
    setAnswers(next);
    const correct = value === course.lesson.quiz[questionIndex].answer;
    if (!correct) {
      setMessage("这一题还没对。回到知识锦囊看一眼，再试一次。");
      return;
    }
    setMessage(completeIfReady(next) ? "三题全对！你收获了 3 片竹叶。" : "答对啦，继续完成下一题。");
  };

  const resetLesson = () => {
    if (!onReset()) return;
    setStage(0);
    setPlaying(true);
    setPracticeChoice("");
    setAnswers([]);
    setMessage("这节课已重置，从动画导入重新开始。");
    setNotified(false);
  };

  const replay = () => {
    setStage(0);
    setPlaying(true);
    setPracticeChoice("");
    setAnswers([]);
    setMessage("从头再看一遍，慢慢来。");
  };

  const goNext = () => {
    if (stage === 4) onBack();
    else setStage((value) => Math.min(4, value + 1));
  };

  return (
    <main className={`lesson-page generic-lesson type-${course.type}`}>
      <header className="lesson-toolbar">
        <button className="back-button" onClick={onBack}>← 课程地图</button>
        <div className="lesson-title"><span>{course.lesson.kindLabel} · {course.minutes} 分钟</span><strong>{course.title}</strong></div>
        <div className="lesson-toolbar-actions">
          {completed && <button className="reset-button lesson-reset" onClick={resetLesson}>重置进度</button>}
          <div className="leaf-pill">叶 {answers.filter((value, index) => value === course.lesson.quiz[index]?.answer).length} / 3</div>
        </div>
      </header>

      <nav className="stage-nav" aria-label="课程步骤">
        {stages.map((name, index) => (
          <button key={name} className={index === stage ? "active" : index < stage ? "done" : ""} onClick={() => setStage(index)}>
            <span>{index < stage ? "✓" : index + 1}</span>{name}
          </button>
        ))}
      </nav>

      <section className="classroom-stage" aria-live="polite">
        <div className="lesson-landscape" aria-hidden="true"><div className="lesson-sun" /><div className="lesson-hill one" /><div className="lesson-hill two" /><div className="lesson-water" /></div>
        {stage === 0 && (
          <div className="stage-content generic-intro">
            <span className="eyebrow">动画导入</span>
            <div className={`lesson-symbol ${playing ? "is-playing" : ""}`} aria-hidden="true">{course.lesson.symbol}</div>
            <h1>{course.title}</h1>
            <p>{course.lesson.hook}</p>
            <ol className="animation-frames">
              {course.lesson.animationFrames.map((frame) => <li key={frame}>{frame}</li>)}
            </ol>
          </div>
        )}
        {stage === 1 && (
          <div className="stage-content lesson-explain">
            <span className="eyebrow">知识锦囊</span>
            <h1>{course.lesson.focus}</h1>
            <div className="knowledge-card"><strong>今天的方法</strong><p>{course.lesson.concept}</p></div>
            <p>{course.objective}</p>
          </div>
        )}
        {stage === 2 && (
          <div className="stage-content example-stage">
            <span className="eyebrow">例子演练</span>
            <h1>跟着三个小例子走一遍</h1>
            <div className="example-grid">
              {course.lesson.examples.map((example, index) => <article key={example}><span>{index + 1}</span><p>{example}</p></article>)}
            </div>
            <p>先看例子，再试着换成自己的话。</p>
          </div>
        )}
        {stage === 3 && (
          <div className="stage-content practice">
            <span className="eyebrow">动手练习</span>
            <h1>{course.lesson.practice.prompt}</h1>
            <div className="practice-options">
              {course.lesson.practice.options.map((option) => (
                <button className={practiceChoice === option ? option === course.lesson.practice.answer ? "correct" : "wrong" : ""} key={option} onClick={() => choosePractice(option)}>{option}</button>
              ))}
            </div>
            <p>{message}</p>
          </div>
        )}
        {stage === 4 && (
          <div className="stage-content quiz generic-quiz">
            <span className="eyebrow">最后一站</span>
            <h1>三题闯关</h1>
            <div className="quiz-list">
              {course.lesson.quiz.map((question, qIndex) => (
                <fieldset key={question.prompt}>
                  <legend>{qIndex + 1}. {question.prompt}</legend>
                  <div>
                    {question.options.map((option) => (
                      <button className={answers[qIndex] === option ? option === question.answer ? "correct" : "wrong" : ""} key={option} onClick={() => chooseQuiz(qIndex, option)}>{option}</button>
                    ))}
                  </div>
                  {answers[qIndex] === question.answer && <small>{question.explanation}</small>}
                </fieldset>
              ))}
            </div>
            <p className="quiz-message">{message}</p>
          </div>
        )}
      </section>

      <footer className="lesson-controls">
        <button onClick={() => { setPlaying(!playing); setMessage(playing ? "动画暂停了，你可以慢慢观察。" : "动画继续，我们一起学。"); }}>{playing ? "暂停" : "播放"}</button>
        <button onClick={replay}>重播</button>
        <div className="control-spacer" />
        <button disabled={stage === 0} onClick={() => setStage((value) => Math.max(0, value - 1))}>上一步</button>
        <button className="primary-button" disabled={stage === 4 && !quizPassed} onClick={goNext}>{stage === 4 ? "完成课程" : "下一步 →"}</button>
      </footer>
    </main>
  );
}
