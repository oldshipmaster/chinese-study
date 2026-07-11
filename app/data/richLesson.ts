import type { LessonSeed } from "./lessonSeeds";

export type CourseKind = "pinyin" | "literacy" | "reading" | "poetry" | "speaking" | "writing" | "garden";
export type InteractionMode = "match" | "sort" | "evidence" | "scenario" | "classify" | "revise";
export type QuestionDifficulty = "remember" | "understand" | "apply" | "reason" | "transfer";

export interface KnowledgePoint {
  label: string;
  title: string;
  detail: string;
  tip: string;
}

export interface InteractionTask {
  id: string;
  mode: InteractionMode;
  title: string;
  prompt: string;
  options: string[];
  answer: string | string[];
  explanation: string;
}

export interface OpenTask {
  prompt: string;
  support: string[];
  example: string;
}

export interface RichQuestion {
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: QuestionDifficulty;
  feedback: Record<string, string>;
}

export interface ExtensionCard {
  title: string;
  fact: string;
  challenge: string;
}

export interface RichLessonData {
  gradeBand: "lower" | "middle" | "upper";
  learningGuide: string;
  warmUp: InteractionTask;
  knowledgePoints: KnowledgePoint[];
  interactions: InteractionTask[];
  openTask: OpenTask;
  quiz: RichQuestion[];
  extension: ExtensionCard;
}

interface RichLessonContext {
  id: string;
  title: string;
  type: CourseKind;
  objective: string;
  action: string;
  seed: LessonSeed;
}

type Engine = {
  method: string;
  extension: string;
  interactions: (context: RichLessonContext) => InteractionTask[];
};

const choice = (
  id: string,
  mode: Exclude<InteractionMode, "sort">,
  title: string,
  prompt: string,
  answer: string,
  distractors: [string, string],
  explanation: string,
): InteractionTask => ({ id, mode, title, prompt, options: [answer, ...distractors], answer, explanation });

const sequence = (
  id: string,
  title: string,
  prompt: string,
  answer: [string, string, string],
  explanation: string,
): InteractionTask => ({ id, mode: "sort", title, prompt, options: [answer[1], answer[2], answer[0]], answer, explanation });

const engines: Record<CourseKind, Engine> = {
  pinyin: {
    method: "先听音和看口形，再比较送气、舌位或声调，最后连成完整音节。",
    extension: "把发音方法带到新音节中，用耳朵验证读音，而不是只凭字母外形猜。",
    interactions: (context) => [
      choice("sound-match", "match", "听音辨线索", `哪条线索最能帮助读准《${context.title}》？`, context.seed.knowledge, ["只记字母排列，不观察发音", "把每个音都读成同一种口形"], context.seed.example),
      sequence("pinyin-sort", "拼读三步", "按正确顺序点出拼读步骤", ["看清字母和声调", "观察口形并轻声试读", "连起来读并用耳朵检查"], context.action),
    ],
  },
  literacy: {
    method: "把字形部件、偏旁提示和生活语境放在一起，才能同时记住形、音、义。",
    extension: "遇到新字时试着换偏旁、组词和造句，比较字义怎样随部件变化。",
    interactions: (context) => [
      choice("shape-match", "match", "字形侦探", `哪一项是《${context.title}》最关键的识字发现？`, context.seed.knowledge, ["只数笔画，不管意思", "看见相似字就认为意思相同"], context.seed.example),
      choice("meaning-classify", "classify", "语境分类", context.seed.checkPrompt, context.seed.checkAnswer, ["忽略偏旁随意猜", "只按读音判断"], "偏旁、部件和句子语境要互相验证。"),
    ],
  },
  reading: {
    method: "先锁定问题，再回到情节和关键词句寻找证据，最后用自己的话解释证据。",
    extension: "同一个人物或事件可以有不同理解，但每个判断都要能指出文本证据。",
    interactions: (context) => [
      choice("evidence-lab", "evidence", "证据实验室", `哪条材料最能支持本课核心发现？`, context.seed.example, ["课题一共有几个字", "没有联系内容的个人猜想"], context.seed.knowledge),
      sequence("story-sort", "思路排序", "按阅读推理顺序点选", ["找到人物或事件的关键表现", "联系前因后果解释变化", "用证据说出自己的结论"], context.action),
    ],
  },
  poetry: {
    method: "读准节奏后圈出意象和动作，把它们连成画面，再体会画面背后的情感。",
    extension: "古诗中的一个意象常带着文化记忆；比较同类诗句，能发现情感既相通又不同。",
    interactions: (context) => [
      choice("image-match", "match", "意象配画", `哪条画面最贴近《${context.title}》的学习重点？`, context.seed.example, ["与诗中景物无关的热闹场面", "只抄诗题而不想象画面"], context.seed.knowledge),
      sequence("poetry-sort", "读诗四步", "按理解古诗的顺序点选", ["划分朗读节奏", "圈出景物和动作", "想象画面并体会情感"], context.action),
    ],
  },
  speaking: {
    method: "先判断对象和场合，再组织要点与顺序，同时倾听并根据对方回应调整表达。",
    extension: "同一句话换一个对象、场合或语气，效果可能完全不同；表达要为真实交流服务。",
    interactions: (context) => [
      choice("speaking-scene", "scenario", "场景应答", context.seed.checkPrompt, context.seed.checkAnswer, ["只顾自己说，不听回应", "省去关键信息让对方猜"], context.seed.knowledge),
      sequence("speaking-sort", "表达搭桥", "按一次完整交流的顺序点选", ["礼貌开场并说明目的", "有顺序地讲清要点", "倾听回应并确认结果"], context.action),
    ],
  },
  writing: {
    method: "围绕中心筛选材料，搭好顺序，再用动作、语言、感官或心理补足关键细节。",
    extension: "好文章不是形容词越多越好；删掉不服务中心的句子，重要画面反而更清楚。",
    interactions: (context) => [
      choice("material-classify", "classify", "素材筛选", `哪一项最适合放进《${context.title}》的重点段落？`, context.seed.example, ["和中心无关的日期清单", "没有人物行动的空泛评价"], context.seed.knowledge),
      choice("sentence-revise", "revise", "细节升级", context.seed.checkPrompt, context.seed.checkAnswer, ["重复课题三遍", "只写“特别好”不举例"], "修改时要让读者看见具体画面和变化。"),
    ],
  },
  garden: {
    method: "先把词句、方法和发现分类，再比较规律，最后迁移到一个新任务中。",
    extension: "整理不是把知识抄一遍，而是建立联系；能在新题中使用，才说明真正掌握。",
    interactions: (context) => [
      choice("method-classify", "classify", "方法归档", `《${context.title}》的核心方法应放入哪张知识卡？`, context.seed.knowledge, ["随便浏览卡", "只记页码卡"], context.seed.example),
      choice("transfer-scene", "scenario", "迁移挑战", context.seed.checkPrompt, context.seed.checkAnswer, ["遇到变化就放弃", "不看条件套用旧答案"], "先辨认新任务与原方法的相同点，再决定怎样使用。"),
    ],
  },
};

const makeQuestion = (
  prompt: string,
  answer: string,
  distractors: [string, string],
  explanation: string,
  difficulty: QuestionDifficulty,
): RichQuestion => {
  const options = [answer, ...distractors];
  return {
    gradeBand: "middle",
    learningGuide: "先观察，再找证据，最后用自己的话解释。",
    prompt,
    options,
    answer,
    explanation,
    difficulty,
    feedback: {
      [answer]: `回答正确。${explanation}`,
      [distractors[0]]: "这个选项抓住了表面词语，却没有使用本课关键证据。",
      [distractors[1]]: "这个选项跳过了观察和推理，请回到知识卡再比较。",
    },
  };
};

export function buildRichLesson(context: RichLessonContext): RichLessonData {
  const { title, seed, objective, type, action } = context;
  const engine = engines[type];
  const transferAnswer = `先找线索，再用本课方法解释新问题`;

  return {
    warmUp: choice("warm-up", "scenario", "旧知热身", `走进《${title}》前，哪种学习状态最有帮助？`, "带着问题观察并说出理由", ["只等页面给答案", "看到长句就直接跳过"], "主动提问能唤醒旧知识，也能为新发现留下位置。"),
    knowledgePoints: [
      { label: "核心", title: "本课关键发现", detail: seed.knowledge, tip: "读完后试着不用原句复述一次。" },
      { label: "证据", title: "从例子看证据", detail: seed.example, tip: "圈出最能证明核心发现的词或动作。" },
      { label: "方法", title: "可以带走的方法", detail: engine.method, tip: action },
      { label: "迁移", title: "换个问题也会用", detail: `${seed.checkPrompt} 可以回答：${seed.checkAnswer}。`, tip: "答案后面再补一句“因为……”。" },
      { label: "目标", title: "能力坐标", detail: objective, tip: "学完后回到这里，检查自己能不能独立完成。" },
    ],
    interactions: engine.interactions(context),
    openTask: {
      prompt: `请用自己的话讲清《${title}》最重要的发现，并指出一个依据。`,
      support: ["我的发现是……", "我从……看出来……", "如果换一个情境，我会……"],
      example: `我的发现是：${seed.knowledge} 依据是：${seed.example}`,
    },
    quiz: [
      makeQuestion(seed.checkPrompt, seed.checkAnswer, ["只凭课题猜答案", "没有回到材料找线索"], seed.example, "remember"),
      makeQuestion(`《${title}》最重要的核心知识是什么？`, seed.knowledge, ["只记住页面颜色", "只说我已经看完"], "核心知识能概括本课真正要理解的内容。", "understand"),
      makeQuestion("哪项最适合作为核心知识的证据？", seed.example, ["与内容无关的个人偏好", "没有事实的空泛评价"], "好证据与结论之间能说清联系。", "apply"),
      makeQuestion("遇到一个答案时，怎样判断它真的合理？", engine.method, ["看哪个选项最长", "选择最先看到的答案"], "本课方法把观察、证据与解释连在一起。", "reason"),
      makeQuestion("把本课能力带到新任务，第一步应该怎样做？", transferAnswer, ["原样背诵旧答案", "不看新条件直接套用"], "迁移不是照搬，要比较新旧任务并重新寻找证据。", "transfer"),
    ],
    extension: {
      title: `${title} · 再往前一步`,
      fact: engine.extension,
      challenge: `找一个生活中的新例子，用“${seed.checkAnswer}”或本课方法解释它。`,
    },
  };
}

export function adaptRichLessonForGrade<T extends RichLessonData>(lesson: T, grade: number): T {
  const gradeBand = grade <= 2 ? "lower" : grade <= 4 ? "middle" : "upper";
  const settings = gradeBand === "lower"
    ? {
        guide: "看一看、点一点，再说一两句。",
        prompt: "请说一两句：你发现了什么？哪条线索帮助了你？",
        support: ["我发现……", "因为……", "我还想到……"],
        challenge: "在家里找一个相似例子，指给家人看并说一句理由。",
      }
    : gradeBand === "middle"
      ? {
          guide: "观察现象，圈出证据，再把理由说完整。",
          prompt: "请用完整的话说明本课发现，引用一个依据，再尝试迁移到新情境。",
          support: ["我的发现是……", "我从……看出来……", "换一个情境，我会……"],
          challenge: "找一个新的生活或阅读例子，用本课方法写两三句解释。",
        }
      : {
          guide: "提出观点，比较证据，检验逻辑，再迁移到复杂情境。",
          prompt: "请提出你的观点，引用至少一条具体证据，解释证据与观点的关系，并指出可能的另一种理解。",
          support: ["我的观点是……依据包括……", "这条证据能够支持观点，因为……", "另一种理解可能是……但我认为……"],
          challenge: "寻找一个看似相反的新案例，比较两组证据，并说明本课方法在什么条件下仍然成立。",
        };

  return {
    ...lesson,
    gradeBand,
    learningGuide: settings.guide,
    openTask: { ...lesson.openTask, prompt: settings.prompt, support: settings.support },
    extension: { ...lesson.extension, challenge: `${lesson.extension.challenge} ${settings.challenge}` },
  };
}
