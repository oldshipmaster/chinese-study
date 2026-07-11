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
  feedback: Record<string, string>;
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

export interface InquiryPrompt {
  question: string;
  guide: string;
}

export interface RichLessonData {
  gradeBand: "lower" | "middle" | "upper";
  learningGuide: string;
  warmUp: InteractionTask;
  knowledgePoints: KnowledgePoint[];
  interactions: InteractionTask[];
  openTask: OpenTask;
  inquiries: InquiryPrompt[];
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

type DeepQuestionBlueprint = {
  reason: [string, string, [string, string], string];
  transfer: [string, string, [string, string], string];
};

const choice = (
  id: string,
  mode: Exclude<InteractionMode, "sort">,
  title: string,
  prompt: string,
  answer: string,
  distractors: [string, string],
  explanation: string,
): InteractionTask => ({
  id,
  mode,
  title,
  prompt,
  options: [answer, ...distractors],
  answer,
  explanation,
  feedback: {
    [answer]: `判断准确。${explanation}`,
    [distractors[0]]: `“${distractors[0]}”只停在表面，没有使用这道题要求的关键线索。`,
    [distractors[1]]: `“${distractors[1]}”跳过了比较和验证，请回到知识卡重新找依据。`,
  },
});

const sequence = (
  id: string,
  title: string,
  prompt: string,
  answer: [string, string, string],
  explanation: string,
): InteractionTask => ({
  id,
  mode: "sort",
  title,
  prompt,
  options: [answer[1], answer[2], answer[0]],
  answer,
  explanation,
  feedback: Object.fromEntries(answer.map((step, index) => [step, `这是第 ${index + 1} 步：${step}。想一想它前后分别要接什么。`])),
});

const rotateOptions = (options: string[], key: string): string[] => {
  const offset = [...key].reduce((sum, character, index) => sum + character.charCodeAt(0) * (index + 1), 0) % options.length;
  return [...options.slice(offset), ...options.slice(0, offset)];
};

const arrangeInteraction = (task: InteractionTask, key: string): InteractionTask => Array.isArray(task.answer)
  ? task
  : { ...task, options: rotateOptions(task.options, key) };

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

const deepQuestions: Record<CourseKind, DeepQuestionBlueprint> = {
  pinyin: {
    reason: ["两个读音很接近时，怎样找出差别？", "对照口形、舌位或送气，再分别慢读和听辨", ["只比较字母写得大不大", "把两个音连续快读过去"], "发音差别要靠口形动作和听觉共同验证。"],
    transfer: ["遇到从没见过的新音节，怎样尝试拼读？", "拆出声母、韵母和声调，逐步拼合后再听读音", ["跳过声调直接猜", "把整个音节当图画死记"], "拆分、拼合、听辨是一套可以迁移的拼读工具。"],
  },
  literacy: {
    reason: ["两个字外形相近时，怎样判断各自的意思？", "比较不同部件，再放进词语和句子验证", ["只看它们是不是同音", "选笔画较少的那个字"], "字形部件提供线索，语境负责检验字义。"],
    transfer: ["遇到一个陌生汉字，第一轮可以怎样推测？", "观察偏旁和部件，联系熟字、组词与语境逐项验证", ["只凭第一眼随便读", "完全跳过句子查答案"], "识字迁移要把形、音、义三条线索连起来。"],
  },
  reading: {
    reason: ["两位同学对人物有不同评价，怎样判断谁更有道理？", "分别列出文本证据，比较证据能否支持各自观点", ["看谁说话声音更大", "只选择和自己感觉一样的"], "阅读观点可以不同，但证据与推理必须经得起核对。"],
    transfer: ["读一篇新文章时，怎样快速寻找关键变化？", "圈出前后表现和转折词，再解释变化的原因", ["只数每段有多少字", "直接套用旧文章的结论"], "抓前后变化与因果关系能帮助理解新的文本。"],
  },
  poetry: {
    reason: ["诗中没有直接写“思念”，为什么仍能读出这种情感？", "从意象、动作、语气和写作背景组合推断", ["因为每首古诗都写思念", "只因为诗句字数整齐"], "诗歌情感常藏在具体意象和表达方式里。"],
    transfer: ["读另一首写景诗，怎样体会景物背后的情感？", "圈出意象和动作，想象画面，再比较色彩、声音与节奏", ["只背诗人的姓名", "看见景物就一律说很快乐"], "由意象进入画面，再由画面体会情感，是可迁移的读诗方法。"],
  },
  speaking: {
    reason: ["对方没有听懂时，最有效的调整是什么？", "换一种更清楚的顺序或例子，并询问对方哪里不明白", ["原话更快地重复三遍", "责怪对方没有认真听"], "真实交流要根据听者反馈及时调整表达。"],
    transfer: ["把同一件事讲给同学和长辈听，应该怎样变化？", "根据对象调整称呼、语气和背景信息，核心事实保持准确", ["对所有人使用完全相同的话", "为了有趣随意改变事实"], "对象和场合变化时，表达方式也要随之变化。"],
  },
  writing: {
    reason: ["一段话细节很多却仍显得混乱，可能缺少什么？", "缺少围绕中心的取舍和清楚的叙述顺序", ["缺少更多形容词堆叠", "缺少把同一句话重复几遍"], "细节必须服务中心，并放在合适的位置。"],
    transfer: ["把一次普通经历写得具体，第一步怎样做？", "确定最想表达的感受，再选能表现它的关键瞬间", ["从早到晚每分钟都写", "先抄一段别人的文章"], "中心决定材料，关键瞬间承载真实细节。"],
  },
  garden: {
    reason: ["整理了很多知识卡却不会做新题，问题可能在哪里？", "只做了分类，没有比较规律并尝试迁移", ["卡片颜色不够多", "标题写得不够大"], "整理的目的在于建立联系并支持使用。"],
    transfer: ["面对综合语文任务，怎样选择合适的方法？", "先辨认任务目标和条件，再从方法库中选择、组合并检验", ["每次都固定使用同一种方法", "不读要求就直接开始"], "综合任务需要根据目标灵活组合已有方法。"],
  },
};

const buildInquiries = (context: RichLessonContext): InquiryPrompt[] => {
  const { title, type, seed } = context;
  const common: InquiryPrompt = {
    question: `如果把《${title}》最关键的条件换掉，原来的结论还成立吗？`,
    guide: `先指出原条件，再根据“${seed.knowledge}”预测变化，并说出验证办法。`,
  };
  const byType: Record<CourseKind, [InquiryPrompt, InquiryPrompt]> = {
    pinyin: [
      { question: "只看口形不听声音，可能会把哪些读音混在一起？", guide: "挑两个相近的音，比较舌位、送气或声调，亲自慢读验证。" },
      { question: "同一个字母换上不同声调，声音路线发生了什么变化？", guide: "用手势画出声调路线，边读边听起点、转折和终点。" },
    ],
    literacy: [
      { question: "给本课汉字换一个部件，字义可能怎样变化？", guide: "先保留一个熟悉部件，再换偏旁、组词，并用句子检验新字义。" },
      { question: "为什么有些字看起来很像，意思却相差很远？", guide: "找出决定意义的不同部件，再比较它们在真实词语中的作用。" },
    ],
    reading: [
      { question: "如果故事中的关键选择相反，人物和结局会怎样变化？", guide: "找到原选择的前因后果，再沿着相反选择推演新的证据链。" },
      { question: "哪一处细节删掉后，你对文章的理解会改变最多？", guide: `从“${seed.example}”附近寻找关键细节，说明它支撑了什么判断。` },
    ],
    poetry: [
      { question: "把诗中的一个核心意象换掉，情感色彩会怎样变化？", guide: "先描述原意象带来的画面和情绪，再换一个意象进行对照朗读。" },
      { question: "同一幅画面用快节奏和慢节奏朗读，感受为什么不同？", guide: "分别朗读一次，比较停顿、重音和声音长短怎样影响想象。" },
    ],
    speaking: [
      { question: "如果听者不同，同一个意思需要怎样重新组织？", guide: "分别设想同学、长辈或陌生人，调整称呼、语气和背景信息。" },
      { question: "怎样判断对方是真的理解，而不只是点头？", guide: "设计一个确认问题，请对方复述关键点，再根据回应补充说明。" },
    ],
    writing: [
      { question: "同一件事从另一个人物视角来写，会出现哪些新细节？", guide: "换一个观察位置，列出他能看到、听到、想到的三类信息。" },
      { question: "删去哪句话反而能让中心更突出？", guide: "逐句检查它是否服务中心，删掉一处后比较段落是否更紧凑。" },
    ],
    garden: [
      { question: "本单元哪两种方法可以组合成一把新工具？", guide: "分别说清两种方法解决什么问题，再设计一个必须组合使用的新任务。" },
      { question: "哪条规律有例外？遇到例外时怎样修正方法？", guide: "先举一个符合规律的例子，再找反例，补充方法适用的条件。" },
    ],
  };
  return [...byType[type], common];
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
  const deep = deepQuestions[type];
  const warmUp = arrangeInteraction(choice("warm-up", "scenario", "旧知热身", `走进《${title}》前，哪种学习状态最有帮助？`, "带着问题观察并说出理由", ["只等页面给答案", "看到长句就直接跳过"], "主动提问能唤醒旧知识，也能为新发现留下位置。"), `${context.id}-warm-up`);
  const interactions = engine.interactions(context).map((task) => arrangeInteraction(task, `${context.id}-${task.id}`));
  const quiz = [
    makeQuestion(seed.checkPrompt, seed.checkAnswer, ["只凭课题猜答案", "没有回到材料找线索"], seed.example, "remember"),
    makeQuestion(`《${title}》最重要的核心知识是什么？`, seed.knowledge, ["只记住页面颜色", "只说我已经看完"], "核心知识能概括本课真正要理解的内容。", "understand"),
    makeQuestion("哪项最适合作为核心知识的证据？", seed.example, ["与内容无关的个人偏好", "没有事实的空泛评价"], "好证据与结论之间能说清联系。", "apply"),
    makeQuestion(deep.reason[0], deep.reason[1], deep.reason[2], deep.reason[3], "reason"),
    makeQuestion(deep.transfer[0], deep.transfer[1], deep.transfer[2], deep.transfer[3], "transfer"),
  ].map((question) => ({ ...question, options: rotateOptions(question.options, `${context.id}-${question.difficulty}`) }));

  return {
    warmUp,
    knowledgePoints: [
      { label: "核心", title: "本课关键发现", detail: seed.knowledge, tip: "读完后试着不用原句复述一次。" },
      { label: "证据", title: "从例子看证据", detail: seed.example, tip: "圈出最能证明核心发现的词或动作。" },
      { label: "方法", title: "可以带走的方法", detail: engine.method, tip: action },
      { label: "迁移", title: "换个问题也会用", detail: `${seed.checkPrompt} 可以回答：${seed.checkAnswer}。`, tip: "答案后面再补一句“因为……”。" },
      { label: "目标", title: "能力坐标", detail: objective, tip: "学完后回到这里，检查自己能不能独立完成。" },
    ],
    interactions,
    openTask: {
      prompt: `请用自己的话讲清《${title}》最重要的发现，并指出一个依据。`,
      support: ["我的发现是……", "我从……看出来……", "如果换一个情境，我会……"],
      example: `我的发现是：${seed.knowledge} 依据是：${seed.example}`,
    },
    inquiries: buildInquiries(context),
    quiz,
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
