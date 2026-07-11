"use client";

import { useEffect, useState } from "react";
import type { Course } from "../data/curriculum";
import type { InteractionTask } from "../data/richLesson";
import { LESSON_DRAFT_STORAGE_KEY, parseLessonDrafts, removeLessonDraft, upsertLessonDraft } from "../lib/lessonDraft";

const stages = ["情境导入", "旧知热身", "知识探秘", "例子拆解", "互动实验", "创新挑战", "五题闯关", "错因拓展"];
const difficultyLabels = { remember: "记一记", understand: "懂一懂", apply: "用一用", reason: "想一想", transfer: "闯新关" };
const interactionModeLabels = { match: "配对发现", sort: "顺序推理", evidence: "证据侦探", scenario: "情境应答", classify: "分类归纳", revise: "修改升级" };
const interactionModeGuides = { match: "比较特征，找到最严密的对应关系。", sort: "按先后点击三步，随时可以重新排序。", evidence: "先读结论，再选择能直接证明它的材料。", scenario: "想清对象、目的和现场条件后再应答。", classify: "先确定分类标准，再检查每项是否符合。", revise: "比较修改前后，看哪一项更准确、具体、连贯。" };

interface LessonViewProps {
  course: Course;
  completed: boolean;
  onBack: () => void;
  onComplete: () => void;
  onReset: () => boolean;
}

const sameOrder = (left: string[], right: string[]) => left.length === right.length && left.every((value, index) => value === right[index]);

const pinyinMouthCue = (token: string) => {
  const exact: Record<string, string> = {
    a: "嘴巴张大，舌头自然放平，声音响亮送出。",
    o: "双唇拢圆向前，舌头稍向后缩。",
    e: "嘴角向两边展开，舌位稍高。",
    i: "嘴角展开，牙齿接近，舌尖抵下齿背。",
    u: "双唇收成小圆孔，舌头向后缩。",
    ü: "先摆好 i 的舌位，再把双唇拢圆。",
  };
  if (exact[token]) return exact[token];
  if (["y", "w"].includes(token)) return "声音轻短，帮助 i、u、ü 站到音节开头；整体认读时不要拆开拼。";
  if (["b", "p", "m", "f"].includes(token)) return token === "f" ? "上齿轻触下唇，让气流从缝隙摩擦出来。" : "先闭合双唇再放开；注意比较气流强弱和鼻腔共鸣。";
  if (["d", "t", "n", "l"].includes(token)) return "舌尖抵住上齿龈再放开；留意气流从口腔还是鼻腔通过。";
  if (["g", "k", "h"].includes(token)) return "舌根抬起靠近软腭，发音位置在口腔后部。";
  if (["j", "q", "x"].includes(token)) return "舌面抬起靠近硬腭，嘴角自然展开，舌尖不要翘起。";
  if (["z", "c", "s"].includes(token)) return "舌尖平伸靠近上齿背，保持平舌，比较送气强弱。";
  if (["zh", "ch", "sh", "r"].includes(token)) return "舌尖轻轻翘起靠近硬腭前部，留出窄缝让气流通过。";
  if (["an", "en", "in", "un", "ün"].includes(token)) return "口形保持自然，结尾时舌尖抵住上齿龈，轻轻收住 n 音。";
  if (["ang", "eng", "ing", "ong"].includes(token)) return "尾音滑向后鼻音，舌根抬起并感受口腔后部共鸣。";
  return "两个音连成一体，口形从前一个音自然滑向后一个音，中间不要停。";
};

const toneExamples: Record<string, Array<{ mark: string; word: string }>> = {
  a: [{ mark: "ā", word: "妈" }, { mark: "á", word: "麻" }, { mark: "ǎ", word: "马" }, { mark: "à", word: "骂" }],
  o: [{ mark: "ō", word: "波" }, { mark: "ó", word: "婆" }, { mark: "ǒ", word: "簸" }, { mark: "ò", word: "破" }],
  e: [{ mark: "ē", word: "喝" }, { mark: "é", word: "河" }, { mark: "ě", word: "渴" }, { mark: "è", word: "课" }],
  i: [{ mark: "ī", word: "衣" }, { mark: "í", word: "姨" }, { mark: "ǐ", word: "椅" }, { mark: "ì", word: "意" }],
  u: [{ mark: "ū", word: "屋" }, { mark: "ú", word: "无" }, { mark: "ǔ", word: "五" }, { mark: "ù", word: "雾" }],
  ü: [{ mark: "ǖ", word: "迂" }, { mark: "ǘ", word: "鱼" }, { mark: "ǚ", word: "雨" }, { mark: "ǜ", word: "玉" }],
};

export function LessonView({ course, completed, onBack, onComplete, onReset }: LessonViewProps) {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [activeStoryBeat, setActiveStoryBeat] = useState<number | null>(null);
  const [warmChoice, setWarmChoice] = useState("");
  const [interactionAnswers, setInteractionAnswers] = useState<Record<string, string[]>>({});
  const [openResponse, setOpenResponse] = useState("");
  const [openRoute, setOpenRoute] = useState<number | null>(null);
  const [openSubmitted, setOpenSubmitted] = useState(false);
  const [openChecks, setOpenChecks] = useState<number[]>([]);
  const [showOpenExample, setShowOpenExample] = useState(false);
  const [revealedKnowledge, setRevealedKnowledge] = useState<number[]>([]);
  const [revealedExamples, setRevealedExamples] = useState<number[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [masteredKnowledge, setMasteredKnowledge] = useState<number[]>([]);
  const [revealedInquiries, setRevealedInquiries] = useState<number[]>([]);
  const [inquiryPredictions, setInquiryPredictions] = useState<Record<number, string>>({});
  const [wrongAttempts, setWrongAttempts] = useState<Record<number, string[]>>({});
  const [confidence, setConfidence] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [quizHints, setQuizHints] = useState<number[]>([]);
  const [message, setMessage] = useState("带着问题走进情境，看看今天会发现什么。");
  const [speechMessage, setSpeechMessage] = useState("点击字母或音节，听清后再跟读。");
  const [pinyinRate, setPinyinRate] = useState<"normal" | "slow">("normal");
  const [activePinyinToken, setActivePinyinToken] = useState("");
  const [notified, setNotified] = useState(completed);
  const [draftReady, setDraftReady] = useState(false);
  const quizPassed = course.lesson.quiz.every((question, index) => answers[index] === question.answer);

  const interactionCorrect = (task: InteractionTask) => {
    const selected = interactionAnswers[task.id] ?? [];
    return Array.isArray(task.answer) ? sameOrder(selected, task.answer) : selected[0] === task.answer;
  };
  const interactionsPassed = course.lesson.interactions.every(interactionCorrect);
  const lessonPassed = interactionsPassed && openSubmitted && quizPassed;
  const minimumResponseLength = course.lesson.gradeBand === "lower" ? 6 : course.lesson.gradeBand === "middle" ? 16 : 28;
  const hasLocalWork = stage > 0 || Boolean(warmChoice) || Object.keys(interactionAnswers).length > 0 || Boolean(openResponse) || answers.length > 0;
  const stageComplete = (index: number) => [
    stage > 0,
    warmChoice === course.lesson.warmUp.answer,
    masteredKnowledge.length === course.lesson.knowledgePoints.length,
    stage > 3,
    interactionsPassed,
    openSubmitted,
    quizPassed,
    lessonPassed,
  ][index];

  useEffect(() => {
    const drafts = parseLessonDrafts(window.localStorage.getItem(LESSON_DRAFT_STORAGE_KEY));
    const draft = drafts[course.id];
    const timer = window.setTimeout(() => {
      if (draft) {
        setStage(draft.stage);
        setWarmChoice(draft.warmChoice);
        setInteractionAnswers(draft.interactionAnswers);
        setOpenResponse(draft.openResponse);
        setOpenRoute(draft.openRoute);
        setOpenSubmitted(draft.openSubmitted);
        setWrongAttempts(draft.wrongAttempts);
        setAnswers(draft.answers);
        setMasteredKnowledge(draft.masteredKnowledge);
        setInquiryPredictions(draft.inquiryPredictions);
        setOpenChecks(draft.openChecks);
        setConfidence(draft.confidence);
        setQuizHints(draft.quizHints);
        setSelectedTerms(draft.selectedTerms);
        setMessage("已恢复上次学习位置，可以从这里继续。");
      }
      setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [course.id]);

  useEffect(() => {
    if (!draftReady) return;
    const drafts = parseLessonDrafts(window.localStorage.getItem(LESSON_DRAFT_STORAGE_KEY));
    const isEmpty = stage === 0 && !warmChoice && Object.keys(interactionAnswers).length === 0 && !openResponse && openRoute === null && !openSubmitted && openChecks.length === 0 && !confidence && quizHints.length === 0 && selectedTerms.length === 0 && Object.keys(wrongAttempts).length === 0 && answers.length === 0 && masteredKnowledge.length === 0 && Object.keys(inquiryPredictions).length === 0;
    const next = isEmpty ? removeLessonDraft(drafts, course.id) : upsertLessonDraft(drafts, course.id, { stage, warmChoice, interactionAnswers, openResponse, openRoute, openSubmitted, openChecks, confidence, quizHints, selectedTerms, wrongAttempts, answers, masteredKnowledge, inquiryPredictions });
    try { window.localStorage.setItem(LESSON_DRAFT_STORAGE_KEY, JSON.stringify(next)); } catch { /* The lesson still works when storage is unavailable. */ }
  }, [answers, confidence, course.id, draftReady, inquiryPredictions, interactionAnswers, masteredKnowledge, openChecks, openResponse, openRoute, openSubmitted, quizHints, selectedTerms, stage, warmChoice, wrongAttempts]);

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
    const feedback = course.lesson.warmUp.feedback[value] ?? course.lesson.warmUp.explanation;
    setMessage(value === course.lesson.warmUp.answer ? `${feedback} 再想一步：${course.lesson.warmUp.reflection}` : feedback);
  };

  const chooseInteraction = (task: InteractionTask, value: string) => {
    const current = interactionAnswers[task.id] ?? [];
    let next: string[];
    if (Array.isArray(task.answer)) {
      if (current.includes(value)) next = current;
      else if (current.length >= task.answer.length) next = [value];
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
    if (openRoute === null) {
      setMessage("先选择一条创新挑战路线，再开始组织自己的表达。");
      return;
    }
    if (openResponse.trim().length < minimumResponseLength) {
      setMessage(`再多说一点：本年级至少写 ${minimumResponseLength} 个字，并包含一个发现和一个依据。`);
      return;
    }
    if (openChecks.length < course.lesson.openTask.rubric.length) {
      setMessage("先完成三项表达自检：观点、证据和联系都要照顾到。");
      return;
    }
    setOpenSubmitted(true);
    setMessage("表达已收下！开放题没有唯一答案，重点是发现清楚、依据真实。");
  };

  const clearLessonState = (resetMessage: string) => {
    setStage(0);
    setPlaying(true);
    setActiveStoryBeat(null);
    setWarmChoice("");
    setInteractionAnswers({});
    setOpenResponse("");
    setOpenRoute(null);
    setOpenSubmitted(false);
    setOpenChecks([]);
    setShowOpenExample(false);
    setRevealedKnowledge([]);
    setRevealedExamples([]);
    setSelectedTerms([]);
    setMasteredKnowledge([]);
    setRevealedInquiries([]);
    setInquiryPredictions({});
    setWrongAttempts({});
    setConfidence("");
    setAnswers([]);
    setQuizHints([]);
    setActivePinyinToken("");
    setMessage(resetMessage);
  };

  const resetLesson = () => {
    if (!onReset()) return;
    clearLessonState("这节课已重置，从情境导入重新开始。");
    setNotified(false);
  };

  const replayIntro = () => {
    setStage(0);
    setPlaying(true);
    setActiveStoryBeat(null);
    setMessage("情境动画已从第一幕重播，已完成的答案和草稿都会保留。");
  };

  const retryWrongQuestions = () => {
    if (wrongQuestionIndexes.length === 0) {
      setMessage("本轮没有错题，可以选择一道高阶题讲给家人听。");
      setStage(6);
      return;
    }
    setAnswers((current) => current.map((answer, index) => wrongQuestionIndexes.includes(index) ? "" : answer));
    setStage(6);
    setMessage(`已保留答对的题，只需重新挑战 ${wrongQuestionIndexes.length} 道错题。`);
  };

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
    masteredKnowledge.length < course.lesson.knowledgePoints.length ? `还有 ${course.lesson.knowledgePoints.length - masteredKnowledge.length} 张知识卡未标记掌握，复述后再诚实检查一次。` : "五张知识卡均已自检，可以随机抽一张脱离页面复述。",
    quizHints.length > 0 ? `本轮使用了 ${quizHints.length} 次线索。复习后请尝试不打开线索再次作答。` : "本轮没有使用闯关线索，说明独立提取方法的能力正在增强。",
  ];
  const confidenceReviewPlan: Record<string, string> = {
    "我还要复习一次": "现在先回知识卡和错题页重学；明天不看提示，再做一次五题闯关。",
    "我基本掌握了": "三天后用 30 秒复述卡回忆本课；如果说不出证据，再打开对应知识卡。",
    "我能讲给别人听": "一周后把本课讲给家人听，并寻找一个新例子或反例检验方法。",
  };

  const speakWithDevice = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechMessage("当前设备不支持语音合成，请换用系统浏览器再试。");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = pinyinRate === "slow" ? 0.5 : 0.72;
    utterance.onstart = () => setSpeechMessage(`正在播放：${text}`);
    utterance.onend = () => setSpeechMessage(`播放完成：${text}。轮到你跟读。`);
    utterance.onerror = () => setSpeechMessage("音频播放失败，请检查设备是否静音。");
    window.speechSynthesis.speak(utterance);
  };

  const speakPinyin = (token: string) => {
    setActivePinyinToken(token);
    const audioToken = token.replaceAll("ü", "v");
    const audio = new Audio(`${import.meta.env.BASE_URL}audio/pinyin-${audioToken}.wav`);
    audio.playbackRate = pinyinRate === "slow" ? 0.68 : 1;
    audio.onplay = () => setSpeechMessage(`正在播放：${token}`);
    audio.onended = () => setSpeechMessage(`播放完成：${token}。轮到你跟读。`);
    audio.onerror = () => speakWithDevice(token);
    void audio.play().catch(() => speakWithDevice(token));
  };

  const speakTone = (token: string, toneIndex: number, mark: string) => {
    const audioToken = token.replaceAll("ü", "v");
    const audio = new Audio(`${import.meta.env.BASE_URL}audio/pinyin-tone-${audioToken}${toneIndex + 1}.wav`);
    audio.playbackRate = pinyinRate === "slow" ? 0.75 : 1;
    audio.onplay = () => setSpeechMessage(`正在播放：${mark}，第 ${toneIndex + 1} 声`);
    audio.onended = () => setSpeechMessage(`播放完成：${mark}。请用手势画出声音路线。`);
    audio.onerror = () => speakWithDevice(mark);
    void audio.play().catch(() => speakWithDevice(mark));
  };

  return (
    <main className={`lesson-page generic-lesson rich-lesson type-${course.type} band-${course.lesson.gradeBand}`}>
      <header className="lesson-toolbar">
        <button className="back-button" onClick={onBack}>← 课程地图</button>
        <div className="lesson-title">
          <span>{course.lesson.kindLabel} · {course.minutes} 分钟 <em className="curated-badge">丰富互动版 · {course.lesson.gradeBand === "lower" ? "启蒙" : course.lesson.gradeBand === "middle" ? "进阶" : "思辨"}</em></span>
          <strong>{course.title}</strong>
        </div>
        <div className="lesson-toolbar-actions">
          {(completed || hasLocalWork) && <button className="reset-button lesson-reset" onClick={resetLesson}>{completed ? "重置进度" : "清空本课"}</button>}
          <div className="leaf-pill">叶 {selectedCorrectCount} / 5</div>
        </div>
      </header>

      <nav className="stage-nav rich-stage-nav" aria-label="课程步骤">
        {stages.map((name, index) => {
          const done = stageComplete(index);
          return <button key={name} className={index === stage ? "active" : done ? "done" : ""} onClick={() => setStage(index)} aria-current={index === stage ? "step" : undefined}>
            <span>{done ? "✓" : index + 1}</span>{name}
          </button>;
        })}
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
            {pinyinTokens.length > 0 && <div className="pinyin-rate-control" aria-label="发音速度"><span>听音速度</span><button aria-pressed={pinyinRate === "normal"} className={pinyinRate === "normal" ? "selected" : ""} onClick={() => setPinyinRate("normal")}>标准速度</button><button aria-pressed={pinyinRate === "slow"} className={pinyinRate === "slow" ? "selected" : ""} onClick={() => setPinyinRate("slow")}>慢速辨音</button></div>}
            {pinyinTokens.length > 0 && <div className="pinyin-soundboard" aria-label="拼音点击发音">{pinyinTokens.map((token) => <button aria-pressed={activePinyinToken === token} className={activePinyinToken === token ? "active" : ""} key={token} onClick={() => speakPinyin(token)} aria-label={`听 ${token} 的发音`}>{token}<small>{activePinyinToken === token ? "正在练习" : "点击听音"}</small></button>)}</div>}
            {activePinyinToken && <aside className="mouth-cue"><div aria-hidden="true"><span>{activePinyinToken}</span><i /></div><section><strong>发音动作镜</strong><p>{pinyinMouthCue(activePinyinToken)}</p></section></aside>}
            {toneExamples[activePinyinToken] && <section className="tone-lab"><div><strong>四声路径</strong><span>点击听例字，用手画出平、升、转、降</span></div><div>{toneExamples[activePinyinToken].map((tone, index) => <button key={tone.mark} onClick={() => speakTone(activePinyinToken, index, tone.mark)}><strong>{tone.mark}</strong><span>{index + 1} 声 · {tone.word}</span></button>)}</div></section>}
            {pinyinTokens.length > 0 && <p className="speech-status">{speechMessage}</p>}
            <ol className={`animation-frames ${playing ? "is-playing" : ""}`}>{course.lesson.animationFrames.map((frame, index) => <li className={`story-beat ${activeStoryBeat === index ? "selected" : ""}`} key={frame}><span>{index + 1}</span><div><p>{frame}</p><button onClick={() => { setPlaying(false); setActiveStoryBeat(index); setMessage(`已定格第 ${index + 1} 幕。请指出这一幕里最重要的线索。`); }}>点击定格观察</button></div></li>)}</ol>
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
                <button aria-expanded={revealedKnowledge.includes(index)} className="knowledge-reveal" onClick={() => setRevealedKnowledge((values) => values.includes(index) ? values.filter((value) => value !== index) : [...values, index])}>{revealedKnowledge.includes(index) ? "收起方法提示" : "点击翻开方法提示"}</button>
                <button aria-pressed={masteredKnowledge.includes(index)} className={`knowledge-master ${masteredKnowledge.includes(index) ? "selected" : ""}`} onClick={() => setMasteredKnowledge((values) => values.includes(index) ? values.filter((value) => value !== index) : [...values, index])}>{masteredKnowledge.includes(index) ? "✓ 已掌握，点击取消" : "标记为已掌握"}</button>
                {revealedKnowledge.includes(index) && <small>{point.tip}</small>}
              </article>
            ))}</div>
            <section className="concept-glossary"><div><span className="eyebrow">语文概念词典</span><h2>会使用术语，才能把发现说得更准确</h2></div><dl>{course.lesson.glossary.map((item) => <div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}<small>{item.example}</small><button aria-pressed={selectedTerms.includes(item.term)} onClick={() => setSelectedTerms((terms) => terms.includes(item.term) ? terms.filter((term) => term !== item.term) : [...terms, item.term])}>{selectedTerms.includes(item.term) ? "✓ 已加入表达词篮" : "＋ 加入表达词篮"}</button></dd></div>)}</dl></section>
            <section className="inquiry-lab">
              <div><span className="eyebrow">探究问号</span><h2>没有标准套路，先大胆预测再找证据</h2></div>
              <div className="inquiry-grid">{course.lesson.inquiries.map((inquiry, index) => (
                <article key={inquiry.question} className={revealedInquiries.includes(index) ? "revealed" : ""}>
                  <strong>？</strong><p>{inquiry.question}</p>
                  <div className="prediction-options">{["我预测仍然成立", "我预测会发生变化", "我还不确定"].map((prediction) => <button aria-pressed={inquiryPredictions[index] === prediction} className={inquiryPredictions[index] === prediction ? "selected" : ""} key={prediction} onClick={() => { setInquiryPredictions((values) => ({ ...values, [index]: prediction })); setMessage(`已记录预测：${prediction}。接下来用证据检验，而不是急着判断对错。`); }}>{prediction}</button>)}</div>
                  <button aria-expanded={revealedInquiries.includes(index)} disabled={!inquiryPredictions[index]} onClick={() => setRevealedInquiries((values) => values.includes(index) ? values.filter((value) => value !== index) : [...values, index])}>{!inquiryPredictions[index] ? "先做预测，再看路线" : revealedInquiries.includes(index) ? "收起研究路线" : "看看怎样研究"}</button>
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
              <article className={revealedExamples.includes(index) ? "revealed" : ""} key={example}><span>{index + 1}</span><h2>{["看见什么", "说明什么", "怎样迁移"][index]}</h2><p>{revealedExamples.includes(index) ? example : ["先在脑中还原本课的具体画面。", "先猜哪条发现能解释这个画面。", "先想换一个情境还能怎样使用。"][index]}</p><button onClick={() => setRevealedExamples((values) => values.includes(index) ? values.filter((value) => value !== index) : [...values, index])}>{revealedExamples.includes(index) ? "收起例子" : "翻开例子，对照猜想"}</button></article>
            ))}</div>
            <p>读完后，试着指出“哪一句是证据，哪一句是结论”。</p>
            <section className="learning-toolkit"><div><span className="eyebrow">能力工具箱</span><h2>{course.lesson.kindLabel}学习的四件工具</h2></div><div>{course.lesson.toolkit.map((tool) => <article key={tool.name}><strong>{tool.name}</strong><p>{tool.use}</p></article>)}</div></section>
            <section className="contrast-clinic"><span className="eyebrow">正反例诊所</span><h2>{course.lesson.contrastCase.misconception}</h2><p><strong>问题在哪：</strong>{course.lesson.contrastCase.diagnosis}</p><p><strong>怎样修正：</strong>{course.lesson.contrastCase.repair}</p></section>
          </div>
        )}

        {stage === 4 && (
          <div className="stage-content interaction-stage">
            <span className="eyebrow">互动实验</span>
            <h1>两种玩法，亲手把方法用起来</h1>
            <div className="interaction-grid">{course.lesson.interactions.map((task) => {
              const selected = interactionAnswers[task.id] ?? [];
              return <article key={task.id} className={interactionCorrect(task) ? "passed" : ""}>
                <header><span>{interactionModeLabels[task.mode]}</span><h2>{task.title}</h2></header><p className="mode-guide">玩法：{interactionModeGuides[task.mode]}</p><p>{task.prompt}</p>
                <div className="interaction-options">{task.options.map((option) => (
                  <button disabled={Array.isArray(task.answer) && selected.includes(option)} className={selected.includes(option) ? "selected" : ""} key={option} onClick={() => chooseInteraction(task, option)}>
                    {Array.isArray(task.answer) && selected.includes(option) ? `${selected.indexOf(option) + 1}. ` : ""}{option}
                  </button>
                ))}</div>
                {Array.isArray(task.answer) && selected.length > 0 && <button className="sort-reset" onClick={() => { setInteractionAnswers((state) => ({ ...state, [task.id]: [] })); setMessage("顺序已清空，重新观察三步之间的先后关系。"); }}>↺ 重新排序</button>}
                {selected.length > 0 && <small>{interactionCorrect(task) ? <><span>✓ {task.explanation}</span><b className="interaction-reflection">再想一步：{task.reflection}</b></> : task.feedback[selected[selected.length - 1]]}</small>}
              </article>;
            })}</div>
            <p>{message}</p>
          </div>
        )}

        {stage === 5 && (
          <div className="stage-content open-stage">
            <span className="eyebrow">创新挑战</span>
            <h1>{course.lesson.openTask.prompt}</h1>
            <div className="challenge-routes" aria-label="选择创新挑战路线">{course.lesson.openTask.routes.map((route, index) => <button aria-pressed={openRoute === index} className={openRoute === index ? "selected" : ""} key={route.label} onClick={() => { setOpenRoute(index); setOpenSubmitted(false); setMessage(`已选择“${route.label}”，没有唯一答案，大胆提出自己的证据。`); }}><strong>{route.label}</strong><span>{route.prompt}</span></button>)}</div>
            {openRoute !== null && <aside className="chosen-route"><strong>我的挑战：</strong>{course.lesson.openTask.routes[openRoute].prompt}</aside>}
            {selectedTerms.length > 0 && <div className="term-basket"><strong>表达词篮</strong>{selectedTerms.map((term) => <button key={term} onClick={() => { setOpenSubmitted(false); setOpenResponse((value) => `${value}${value ? " " : ""}${term}：`); }}>{term} ＋</button>)}</div>}
            <div className="sentence-starters">{course.lesson.openTask.support.map((support) => <button key={support} onClick={() => { setOpenSubmitted(false); setOpenResponse((value) => `${value}${value ? " " : ""}${support}`); }}>{support}</button>)}</div>
            <textarea value={openResponse} onChange={(event) => { setOpenSubmitted(false); setOpenResponse(event.target.value); }} placeholder="在这里写下你的发现和依据……" aria-label="开放表达答案" />
            <p className={`response-count ${openResponse.trim().length >= minimumResponseLength ? "ready" : ""}`}>已写 {openResponse.trim().length} 字 · 本年级建议至少 {minimumResponseLength} 字</p>
            <section className="open-rubric"><strong>提交前，我自己检查</strong><div>{course.lesson.openTask.rubric.map((item, index) => <button aria-pressed={openChecks.includes(index)} className={openChecks.includes(index) ? "checked" : ""} key={item} onClick={() => { setOpenSubmitted(false); setOpenChecks((values) => values.includes(index) ? values.filter((value) => value !== index) : [...values, index]); }}><span>{openChecks.includes(index) ? "✓" : index + 1}</span>{item}</button>)}</div></section>
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
                <button className="quiz-hint" aria-expanded={quizHints.includes(qIndex)} onClick={() => setQuizHints((values) => values.includes(qIndex) ? values.filter((value) => value !== qIndex) : [...values, qIndex])}>{quizHints.includes(qIndex) ? `线索：回到${question.reviewTarget}，先说出判断步骤。` : "给我一个线索，不看答案"}</button>
                {answers[qIndex] && <small className={answers[qIndex] === question.answer ? "correct-feedback" : "wrong-feedback"}>{question.feedback[answers[qIndex]]}{answers[qIndex] !== question.answer && <> <b>建议返回：{question.reviewTarget}</b></>}</small>}
                {answers[qIndex] && answers[qIndex] !== question.answer && <button className="review-now" onClick={() => { setStage(2); setMessage(`请找到${question.reviewTarget}，复述后再回五题闯关。`); }}>← 马上回{question.reviewTarget}复习</button>}
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
              <article><strong>{masteredKnowledge.length} / 5</strong><span>知识自检</span></article>
              <article><strong>{interactionsPassed ? "2 / 2" : `${course.lesson.interactions.filter(interactionCorrect).length} / 2`}</strong><span>互动实验</span></article>
              <article><strong>{openSubmitted ? "已表达" : "待表达"}</strong><span>创新挑战</span></article>
              <article><strong>{selectedCorrectCount} / 5</strong><span>分层问题</span></article>
            </div>
            <div className="extension-card"><strong>知识再长一片叶</strong><p>{course.lesson.extension.fact}</p><aside className="cross-connection"><span>跨学科连接 · {course.lesson.extension.connection.field}</span><p>{course.lesson.extension.connection.insight}</p></aside><h2>带走挑战</h2><p>{course.lesson.extension.challenge}</p></div>
            <section className="retell-card"><span className="eyebrow">30 秒复述卡</span><h2>{course.lesson.summary}</h2><ol><li><strong>课题：</strong>我学习了《{course.title}》。</li><li><strong>发现：</strong>{course.lesson.knowledgePoints[0].detail}</li><li><strong>证据：</strong>{course.lesson.knowledgePoints[1].detail}</li><li><strong>迁移：</strong>下一次遇到新问题，我会使用{course.lesson.toolkit.map((tool) => tool.name).join("、")}中的合适工具。</li></ol></section>
            <section className="mistake-review"><h2>我的错因回顾</h2>{wrongQuestionIndexes.length === 0 ? <p>本轮没有错答。下一次可以尝试更快说出证据。</p> : Object.entries(wrongAttempts).filter(([index]) => course.lesson.quiz[Number(index)]).map(([index, values]) => {
              const question = course.lesson.quiz[Number(index)];
              return <article key={index}><strong>{question.prompt}</strong>{values.map((value) => <p key={value}>曾选“{value}”：{question.feedback[value]}</p>)}<small>正确思路：{question.explanation}</small></article>;
            })}<div className="mistake-actions"><button onClick={() => setStage(2)}>回知识卡复习</button><button onClick={retryWrongQuestions}>只重做错过的题</button></div></section>
            <section className="confidence-check"><h2>现在的我</h2><div>{["我还要复习一次", "我基本掌握了", "我能讲给别人听"].map((value) => <button aria-pressed={confidence === value} className={confidence === value ? "selected" : ""} key={value} onClick={() => setConfidence(value)}>{value}</button>)}</div>{confidence && <p><strong>间隔复习建议：</strong>{confidenceReviewPlan[confidence]}</p>}</section>
            <section className="study-prescription"><span className="eyebrow">自学导航</span><h2>我的下一步学习处方</h2><ol>{studyPrescription.map((item) => <li key={item}>{item}</li>)}</ol></section>
            {!lessonPassed && <aside className="completion-hint">要完成课程，还需要：{!interactionsPassed ? "完成两项互动；" : ""}{!openSubmitted ? "提交开放表达；" : ""}{!quizPassed ? "答对五道分层题。" : ""}</aside>}
            {lessonPassed && <p className="success-message">全部完成！点击“完成课程”返回课程地图。</p>}
          </div>
        )}
      </section>

      <footer className="lesson-controls">
        <button onClick={() => { setPlaying(!playing); if (!playing) setActiveStoryBeat(null); setMessage(playing ? "动画暂停了，你可以慢慢观察。" : "动画继续，我们一起学。"); }}>{playing ? "暂停" : "播放"}</button>
        <button onClick={replayIntro}>重播导入</button>
        <div className="control-spacer" />
        <button disabled={stage === 0} onClick={() => setStage((value) => Math.max(0, value - 1))}>上一步</button>
        <button className="primary-button" disabled={stage === 7 && !lessonPassed} onClick={goNext}>{stage === 7 ? lessonPassed ? "完成课程" : "还有任务未完成" : "下一步 →"}</button>
      </footer>
    </main>
  );
}
