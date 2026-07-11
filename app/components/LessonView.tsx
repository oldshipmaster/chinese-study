"use client";

import { useEffect, useState } from "react";
import type { Course } from "../data/curriculum";
import type { InteractionTask } from "../data/richLesson";
import { LESSON_DRAFT_STORAGE_KEY, parseLessonDrafts, removeLessonDraft, upsertLessonDraft } from "../lib/lessonDraft";

const stages = ["情境导入", "旧知热身", "知识探秘", "例子拆解", "互动实验", "创新挑战", "五题闯关", "错因拓展"];
const difficultyLabels = { remember: "记一记", understand: "懂一懂", apply: "用一用", reason: "想一想", transfer: "闯新关" };
const interactionModeLabels = { match: "配对发现", sort: "顺序推理", evidence: "证据侦探", scenario: "情境应答", classify: "分类归纳", revise: "修改升级" };

interface LessonViewProps {
  course: Course;
  completed: boolean;
  onBack: () => void;
  onComplete: () => void;
  onReset: () => boolean;
}

const sameOrder = (left: string[], right: string[]) => left.length === right.length && left.every((value, index) => value === right[index]);

export function LessonView({ course, completed, onBack, onComplete, onReset }: LessonViewProps) {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [warmChoice, setWarmChoice] = useState("");
  const [interactionAnswers, setInteractionAnswers] = useState<Record<string, string[]>>({});
  const [openResponse, setOpenResponse] = useState("");
  const [openSubmitted, setOpenSubmitted] = useState(false);
  const [showOpenExample, setShowOpenExample] = useState(false);
  const [revealedKnowledge, setRevealedKnowledge] = useState<number[]>([]);
  const [revealedInquiries, setRevealedInquiries] = useState<number[]>([]);
  const [wrongAttempts, setWrongAttempts] = useState<Record<number, string[]>>({});
  const [confidence, setConfidence] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [message, setMessage] = useState("带着问题走进情境，看看今天会发现什么。");
  const [speechMessage, setSpeechMessage] = useState("点击字母或音节，听清后再跟读。");
  const [notified, setNotified] = useState(completed);
  const [draftReady, setDraftReady] = useState(false);
  const quizPassed = course.lesson.quiz.every((question, index) => answers[index] === question.answer);

  const interactionCorrect = (task: InteractionTask) => {
    const selected = interactionAnswers[task.id] ?? [];
    return Array.isArray(task.answer) ? sameOrder(selected, task.answer) : selected[0] === task.answer;
  };
  const interactionsPassed = course.lesson.interactions.every(interactionCorrect);
  const lessonPassed = interactionsPassed && openSubmitted && quizPassed;

  useEffect(() => {
    const drafts = parseLessonDrafts(window.localStorage.getItem(LESSON_DRAFT_STORAGE_KEY));
    const draft = drafts[course.id];
    const timer = window.setTimeout(() => {
      if (draft) {
        setStage(draft.stage);
        setWarmChoice(draft.warmChoice);
        setInteractionAnswers(draft.interactionAnswers);
        setOpenResponse(draft.openResponse);
        setOpenSubmitted(draft.openSubmitted);
        setWrongAttempts(draft.wrongAttempts);
        setAnswers(draft.answers);
        setMessage("已恢复上次学习位置，可以从这里继续。");
      }
      setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [course.id]);

  useEffect(() => {
    if (!draftReady) return;
    const drafts = parseLessonDrafts(window.localStorage.getItem(LESSON_DRAFT_STORAGE_KEY));
    const isEmpty = stage === 0 && !warmChoice && Object.keys(interactionAnswers).length === 0 && !openResponse && !openSubmitted && Object.keys(wrongAttempts).length === 0 && answers.length === 0;
    const next = isEmpty ? removeLessonDraft(drafts, course.id) : upsertLessonDraft(drafts, course.id, { stage, warmChoice, interactionAnswers, openResponse, openSubmitted, wrongAttempts, answers });
    try { window.localStorage.setItem(LESSON_DRAFT_STORAGE_KEY, JSON.stringify(next)); } catch { /* The lesson still works when storage is unavailable. */ }
  }, [answers, course.id, draftReady, interactionAnswers, openResponse, openSubmitted, stage, warmChoice, wrongAttempts]);

  const completeIfReady = (nextAnswers: string[]) => {
    const passedQuiz = course.lesson.quiz.every((question, index) => nextAnswers[index] === question.answer);
    const passed = passedQuiz && interactionsPassed && openSubmitted;
    if (passed && !notified) {
      setNotified(true);
      onComplete();
    }
    return passed;
  };

  const chooseWarmUp = (value: string) => {
    setWarmChoice(value);
    setMessage(value === course.lesson.warmUp.answer ? course.lesson.warmUp.explanation : "再想一想：真正的热身会让旧知识和新问题连接起来。");
  };

  const chooseInteraction = (task: InteractionTask, value: string) => {
    const current = interactionAnswers[task.id] ?? [];
    let next: string[];
    if (Array.isArray(task.answer)) {
      if (current.length >= task.answer.length || current.includes(value)) next = [value];
      else next = [...current, value];
    } else next = [value];
    setInteractionAnswers((state) => ({ ...state, [task.id]: next }));
    const correct = Array.isArray(task.answer) ? sameOrder(next, task.answer) : next[0] === task.answer;
    setMessage(correct ? task.explanation : Array.isArray(task.answer) && next.length < task.answer.length ? `已选第 ${next.length} 步。${task.feedback[value]}` : task.feedback[value]);
  };

  const chooseQuiz = (questionIndex: number, value: string) => {
    const next = [...answers];
    next[questionIndex] = value;
    setAnswers(next);
    const question = course.lesson.quiz[questionIndex];
    const correct = value === question.answer;
    if (!correct) {
      setWrongAttempts((state) => {
        const current = state[questionIndex] ?? [];
        return current.includes(value) ? state : { ...state, [questionIndex]: [...current, value] };
      });
    }
    setMessage(question.feedback[value] ?? (correct ? question.explanation : "回到知识卡再比较一次。"));
    if (correct && completeIfReady(next)) setMessage("五题全对，互动和表达也完成了！你收获了 3 片竹叶。");
  };

  const submitOpenTask = () => {
    if (openResponse.trim().length < 6) {
      setMessage("再多说一点：至少写出一个发现和一个依据。");
      return;
    }
    setOpenSubmitted(true);
    setMessage("表达已收下！开放题没有唯一答案，重点是发现清楚、依据真实。");
  };

  const clearLessonState = (resetMessage: string) => {
    setStage(0);
    setPlaying(true);
    setWarmChoice("");
    setInteractionAnswers({});
    setOpenResponse("");
    setOpenSubmitted(false);
    setShowOpenExample(false);
    setRevealedKnowledge([]);
    setRevealedInquiries([]);
    setWrongAttempts({});
    setConfidence("");
    setAnswers([]);
    setMessage(resetMessage);
  };

  const resetLesson = () => {
    if (!onReset()) return;
    clearLessonState("这节课已重置，从情境导入重新开始。");
    setNotified(false);
  };

  const replay = () => clearLessonState("从头再学一遍，这次试着发现新的线索。");

  const goNext = () => {
    if (stage === 7) {
      if (lessonPassed && !notified) {
        setNotified(true);
        onComplete();
      }
      onBack();
    }
    else setStage((value) => Math.min(7, value + 1));
  };

  const selectedCorrectCount = answers.filter((value, index) => value === course.lesson.quiz[index]?.answer).length;
  const pinyinTokens = course.type === "pinyin" ? course.title.split(/\s+/).filter(Boolean) : [];
  const wrongQuestionIndexes = Object.keys(wrongAttempts).map(Number).filter((index) => index >= 0 && index < course.lesson.quiz.length);
  const studyPrescription = [
    !interactionsPassed ? "回到互动实验，把两种玩法各做对一次，并说出判断依据。" : "互动方法已经掌握，可以试着用同一方法解决一个生活问题。",
    !openSubmitted ? "使用一个句式支架，补写“发现＋依据”，再提交开放表达。" : "把开放表达读一遍，检查观点、依据和两者的联系是否完整。",
    wrongQuestionIndexes.length > 0
      ? `重点复习${wrongQuestionIndexes.map((index) => `“${difficultyLabels[course.lesson.quiz[index].difficulty]}”`).join("、")}层级，先解释错项为什么不成立。`
      : "五个层级暂未留下错项，可以限时重答或向家人讲解其中一题。",
    lessonPassed ? "挑战拓展任务：寻找新例子或反例，检验本课方法的适用条件。" : "完成未通过的项目后，再进入带走挑战。",
  ];

  const speakWithDevice = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechMessage("当前设备不支持语音合成，请换用系统浏览器再试。");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.72;
    utterance.onstart = () => setSpeechMessage(`正在播放：${text}`);
    utterance.onend = () => setSpeechMessage(`播放完成：${text}。轮到你跟读。`);
    utterance.onerror = () => setSpeechMessage("音频播放失败，请检查设备是否静音。");
    window.speechSynthesis.speak(utterance);
  };

  const speakPinyin = (token: string) => {
    if (course.id === "a-o-e" && ["a", "o", "e"].includes(token)) {
      const audio = new Audio(`${import.meta.env.BASE_URL}audio/pinyin-${token}.wav`);
      audio.onplay = () => setSpeechMessage(`正在播放：${token}`);
      audio.onended = () => setSpeechMessage(`播放完成：${token}。轮到你跟读。`);
      audio.onerror = () => speakWithDevice(token);
      void audio.play().catch(() => speakWithDevice(token));
      return;
    }
    speakWithDevice(token);
  };

  return (
    <main className={`lesson-page generic-lesson rich-lesson type-${course.type}`}>
      <header className="lesson-toolbar">
        <button className="back-button" onClick={onBack}>← 课程地图</button>
        <div className="lesson-title">
          <span>{course.lesson.kindLabel} · {course.minutes} 分钟 <em className="curated-badge">丰富互动版 · {course.lesson.gradeBand === "lower" ? "启蒙" : course.lesson.gradeBand === "middle" ? "进阶" : "思辨"}</em></span>
          <strong>{course.title}</strong>
        </div>
        <div className="lesson-toolbar-actions">
          {completed && <button className="reset-button lesson-reset" onClick={resetLesson}>重置进度</button>}
          <div className="leaf-pill">叶 {selectedCorrectCount} / 5</div>
        </div>
      </header>

      <nav className="stage-nav rich-stage-nav" aria-label="课程步骤">
        {stages.map((name, index) => (
          <button key={name} className={index === stage ? "active" : index < stage ? "done" : ""} onClick={() => setStage(index)}>
            <span>{index < stage ? "✓" : index + 1}</span>{name}
          </button>
        ))}
      </nav>

      <section className="classroom-stage rich-classroom" aria-live="polite">
        <div className="lesson-landscape" aria-hidden="true"><div className="lesson-sun" /><div className="lesson-hill one" /><div className="lesson-hill two" /><div className="lesson-water" /></div>

        {stage === 0 && (
          <div className="stage-content generic-intro">
            <span className="eyebrow">情境导入</span>
            <div className={`lesson-symbol ${playing ? "is-playing" : ""}`} aria-hidden="true">{course.lesson.symbol}</div>
            <h1>{course.title}</h1>
            <p>{course.lesson.hook}</p>
            <p className="learning-guide">学习路线：{course.lesson.learningGuide}</p>
            {pinyinTokens.length > 0 && <div className="pinyin-soundboard" aria-label="拼音点击发音">{pinyinTokens.map((token) => <button key={token} onClick={() => speakPinyin(token)} aria-label={`听 ${token} 的发音`}>{token}<small>点击听音</small></button>)}</div>}
            {pinyinTokens.length > 0 && <p className="speech-status">{speechMessage}</p>}
            <ol className={`animation-frames ${playing ? "is-playing" : ""}`}>{course.lesson.animationFrames.map((frame, index) => <li className="story-beat" key={frame}><span>{index + 1}</span><p>{frame}</p></li>)}</ol>
          </div>
        )}

        {stage === 1 && (
          <div className="stage-content practice warm-up-stage">
            <span className="eyebrow">旧知热身</span>
            <h1>{course.lesson.warmUp.prompt}</h1>
            <div className="practice-options">{course.lesson.warmUp.options.map((option) => (
              <button className={warmChoice === option ? option === course.lesson.warmUp.answer ? "correct" : "wrong" : ""} key={option} onClick={() => chooseWarmUp(option)}>{option}</button>
            ))}</div>
            <p>{message}</p>
          </div>
        )}

        {stage === 2 && (
          <div className="stage-content knowledge-stage">
            <span className="eyebrow">知识探秘</span>
            <h1>五张知识卡，层层打开本课</h1>
            <div className="knowledge-grid">{course.lesson.knowledgePoints.map((point, index) => (
              <article key={point.title} className={revealedKnowledge.includes(index) ? "revealed" : ""}><span>{point.label}</span><h2>{point.title}</h2><p>{point.detail}</p>
                <button className="knowledge-reveal" onClick={() => setRevealedKnowledge((values) => values.includes(index) ? values.filter((value) => value !== index) : [...values, index])}>{revealedKnowledge.includes(index) ? "收起方法提示" : "点击翻开方法提示"}</button>
                {revealedKnowledge.includes(index) && <small>{point.tip}</small>}
              </article>
            ))}</div>
            <section className="inquiry-lab">
              <div><span className="eyebrow">探究问号</span><h2>没有标准套路，先大胆预测再找证据</h2></div>
              <div className="inquiry-grid">{course.lesson.inquiries.map((inquiry, index) => (
                <article key={inquiry.question} className={revealedInquiries.includes(index) ? "revealed" : ""}>
                  <strong>？</strong><p>{inquiry.question}</p>
                  <button onClick={() => setRevealedInquiries((values) => values.includes(index) ? values.filter((value) => value !== index) : [...values, index])}>{revealedInquiries.includes(index) ? "收起研究路线" : "看看怎样研究"}</button>
                  {revealedInquiries.includes(index) && <small>{inquiry.guide}</small>}
                </article>
              ))}</div>
            </section>
          </div>
        )}

        {stage === 3 && (
          <div className="stage-content example-stage">
            <span className="eyebrow">例子拆解</span>
            <h1>从现象、证据到结论</h1>
            <div className="example-grid">{course.lesson.examples.map((example, index) => (
              <article key={example}><span>{index + 1}</span><h2>{["看见什么", "说明什么", "怎样迁移"][index]}</h2><p>{example}</p></article>
            ))}</div>
            <p>读完后，试着指出“哪一句是证据，哪一句是结论”。</p>
          </div>
        )}

        {stage === 4 && (
          <div className="stage-content interaction-stage">
            <span className="eyebrow">互动实验</span>
            <h1>两种玩法，亲手把方法用起来</h1>
            <div className="interaction-grid">{course.lesson.interactions.map((task) => {
              const selected = interactionAnswers[task.id] ?? [];
              return <article key={task.id} className={interactionCorrect(task) ? "passed" : ""}>
                <header><span>{interactionModeLabels[task.mode]}</span><h2>{task.title}</h2></header><p>{task.prompt}</p>
                <div className="interaction-options">{task.options.map((option) => (
                  <button className={selected.includes(option) ? "selected" : ""} key={option} onClick={() => chooseInteraction(task, option)}>
                    {Array.isArray(task.answer) && selected.includes(option) ? `${selected.indexOf(option) + 1}. ` : ""}{option}
                  </button>
                ))}</div>
                {selected.length > 0 && <small>{interactionCorrect(task) ? `✓ ${task.explanation}` : task.feedback[selected[selected.length - 1]]}</small>}
              </article>;
            })}</div>
            <p>{message}</p>
          </div>
        )}

        {stage === 5 && (
          <div className="stage-content open-stage">
            <span className="eyebrow">创新挑战</span>
            <h1>{course.lesson.openTask.prompt}</h1>
            <div className="sentence-starters">{course.lesson.openTask.support.map((support) => <button key={support} onClick={() => setOpenResponse((value) => `${value}${value ? " " : ""}${support}`)}>{support}</button>)}</div>
            <textarea value={openResponse} onChange={(event) => setOpenResponse(event.target.value)} placeholder="在这里写下你的发现和依据……" aria-label="开放表达答案" />
            <div className="open-actions"><button onClick={() => setShowOpenExample((value) => !value)}>{showOpenExample ? "收起表达支架" : "需要一点提示"}</button><button className="primary-button" onClick={submitOpenTask}>{openSubmitted ? "已提交，可继续修改" : "提交我的表达"}</button></div>
            {showOpenExample && <aside><strong>表达支架，不是唯一答案</strong><p>{course.lesson.openTask.example}</p></aside>}
            <p>{message}</p>
          </div>
        )}

        {stage === 6 && (
          <div className="stage-content quiz generic-quiz rich-quiz">
            <span className="eyebrow">五题闯关</span>
            <h1>从记忆到迁移，一层一层挑战</h1>
            <div className="quiz-list">{course.lesson.quiz.map((question, qIndex) => (
              <fieldset key={question.prompt}><legend><em>{difficultyLabels[question.difficulty]}</em>{qIndex + 1}. {question.prompt}</legend>
                <div>{question.options.map((option) => (
                  <button className={answers[qIndex] === option ? option === question.answer ? "correct" : "wrong" : ""} key={option} onClick={() => chooseQuiz(qIndex, option)}>{option}</button>
                ))}</div>
                {answers[qIndex] && <small className={answers[qIndex] === question.answer ? "correct-feedback" : "wrong-feedback"}>{question.feedback[answers[qIndex]]}</small>}
              </fieldset>
            ))}</div>
            <p className="quiz-message">{message}</p>
          </div>
        )}

        {stage === 7 && (
          <div className="stage-content extension-stage">
            <span className="eyebrow">错因拓展</span>
            <h1>{course.lesson.extension.title}</h1>
            <div className="result-dashboard">
              <article><strong>{interactionsPassed ? "2 / 2" : `${course.lesson.interactions.filter(interactionCorrect).length} / 2`}</strong><span>互动实验</span></article>
              <article><strong>{openSubmitted ? "已表达" : "待表达"}</strong><span>创新挑战</span></article>
              <article><strong>{selectedCorrectCount} / 5</strong><span>分层问题</span></article>
            </div>
            <div className="extension-card"><strong>知识再长一片叶</strong><p>{course.lesson.extension.fact}</p><h2>带走挑战</h2><p>{course.lesson.extension.challenge}</p></div>
            <section className="mistake-review"><h2>我的错因回顾</h2>{Object.keys(wrongAttempts).length === 0 ? <p>本轮没有错答。下一次可以尝试更快说出证据。</p> : Object.entries(wrongAttempts).map(([index, values]) => {
              const question = course.lesson.quiz[Number(index)];
              return <article key={index}><strong>{question.prompt}</strong>{values.map((value) => <p key={value}>曾选“{value}”：{question.feedback[value]}</p>)}<small>正确思路：{question.explanation}</small></article>;
            })}</section>
            <section className="confidence-check"><h2>现在的我</h2><div>{["我还要复习一次", "我基本掌握了", "我能讲给别人听"].map((value) => <button className={confidence === value ? "selected" : ""} key={value} onClick={() => setConfidence(value)}>{value}</button>)}</div>{confidence && <p>已记录：{confidence}。诚实判断，比追求满分更重要。</p>}</section>
            <section className="study-prescription"><span className="eyebrow">自学导航</span><h2>我的下一步学习处方</h2><ol>{studyPrescription.map((item) => <li key={item}>{item}</li>)}</ol></section>
            {!lessonPassed && <aside className="completion-hint">要完成课程，还需要：{!interactionsPassed ? "完成两项互动；" : ""}{!openSubmitted ? "提交开放表达；" : ""}{!quizPassed ? "答对五道分层题。" : ""}</aside>}
            {lessonPassed && <p className="success-message">全部完成！点击“完成课程”返回课程地图。</p>}
          </div>
        )}
      </section>

      <footer className="lesson-controls">
        <button onClick={() => { setPlaying(!playing); setMessage(playing ? "动画暂停了，你可以慢慢观察。" : "动画继续，我们一起学。"); }}>{playing ? "暂停" : "播放"}</button>
        <button onClick={replay}>重播</button>
        <div className="control-spacer" />
        <button disabled={stage === 0} onClick={() => setStage((value) => Math.max(0, value - 1))}>上一步</button>
        <button className="primary-button" disabled={stage === 7 && !lessonPassed} onClick={goNext}>{stage === 7 ? "完成课程" : "下一步 →"}</button>
      </footer>
    </main>
  );
}
