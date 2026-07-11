import { getLessonSeed } from "./lessonSeeds";
import {
  buildRichLesson,
  adaptRichLessonForGrade,
  type ExtensionCard,
  type InteractionTask,
  type InquiryPrompt,
  type KnowledgePoint,
  type LearningTool,
  type OpenTask,
  type QuestionDifficulty,
} from "./richLesson";

export type CourseType =
  | "pinyin"
  | "literacy"
  | "reading"
  | "poetry"
  | "speaking"
  | "writing"
  | "garden";

export type CourseStatus = "ready";

export interface LessonQuestion {
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: QuestionDifficulty;
  feedback: Record<string, string>;
}

export interface LessonPractice {
  prompt: string;
  options: string[];
  answer: string;
  feedback: string;
}

export interface LessonContent {
  curated: boolean;
  kindLabel: string;
  symbol: string;
  hook: string;
  focus: string;
  concept: string;
  animationFrames: string[];
  examples: string[];
  practice: LessonPractice;
  warmUp: InteractionTask;
  knowledgePoints: KnowledgePoint[];
  interactions: InteractionTask[];
  openTask: OpenTask;
  inquiries: InquiryPrompt[];
  toolkit: LearningTool[];
  quiz: LessonQuestion[];
  extension: ExtensionCard;
  summary: string;
}

export interface Course {
  id: string;
  title: string;
  type: CourseType;
  minutes: number;
  objective: string;
  status: CourseStatus;
  lesson: LessonContent;
  featured?: boolean;
}

export interface Unit {
  id: string;
  title: string;
  theme: string;
  courses: Course[];
}

export interface Book {
  bookId: string;
  grade: number;
  term: "上册" | "下册";
  edition: string;
  color: string;
  units: Unit[];
}

type LessonProfile = {
  kindLabel: string;
  symbol: string;
  focus: string;
  skill: string;
  action: string;
  practiceAnswer: string;
};

const profiles: Record<CourseType, LessonProfile> = {
  pinyin: {
    kindLabel: "拼音",
    symbol: "声",
    focus: "听清声音，看准口形，再把音节拼出来。",
    skill: "读准音、认清形、会拼读",
    action: "先听，再观察口形，最后轻声跟读",
    practiceAnswer: "先听声音，再看口形",
  },
  literacy: {
    kindLabel: "识字",
    symbol: "字",
    focus: "看图想意思，拆部件，给汉字找到生活里的朋友。",
    skill: "认识汉字、理解字义、积累词语",
    action: "先看字形，再说意思，最后组一个词",
    practiceAnswer: "先看字形，再联系生活",
  },
  reading: {
    kindLabel: "阅读",
    symbol: "读",
    focus: "抓住关键词句，理清顺序，说出自己的理解。",
    skill: "读懂内容、提取信息、说清理由",
    action: "先读题目，再找关键词，最后说理由",
    practiceAnswer: "先找关键词，再说理由",
  },
  poetry: {
    kindLabel: "古诗",
    symbol: "诗",
    focus: "读出节奏，找意象，想象诗里的画面。",
    skill: "读准节奏、理解词句、想象画面",
    action: "先划节奏，再找景物，最后说画面",
    practiceAnswer: "先读节奏，再想画面",
  },
  speaking: {
    kindLabel: "口语",
    symbol: "说",
    focus: "先想清楚要点，再有礼貌、有顺序地表达。",
    skill: "认真倾听、清楚表达、礼貌回应",
    action: "先听别人说，再补充自己的想法",
    practiceAnswer: "先倾听，再有顺序地说",
  },
  writing: {
    kindLabel: "习作",
    symbol: "写",
    focus: "选材料，排顺序，用细节把意思写清楚。",
    skill: "确定中心、组织材料、写出细节",
    action: "先列提纲，再补细节，最后读一读修改",
    practiceAnswer: "先列提纲，再写细节",
  },
  garden: {
    kindLabel: "园地",
    symbol: "园",
    focus: "整理本单元的词句、方法和阅读收获。",
    skill: "归类积累、迁移运用、整理方法",
    action: "先分类，再比较，最后自己用一用",
    practiceAnswer: "先分类整理，再迁移运用",
  },
};

function buildLesson(id: string, title: string, type: CourseType, objective: string): LessonContent {
  const profile = profiles[type];
  const seed = getLessonSeed(id);
  const rich = buildRichLesson({
    id,
    title,
    type,
    objective,
    action: profile.action,
    seed: seed ?? {
      knowledge: `${profile.skill}，并围绕《${title}》说清自己的发现。`,
      example: objective,
      checkPrompt: `学习《${title}》最重要的方法是什么？`,
      checkAnswer: profile.practiceAnswer,
    },
  });
  if (seed) {
    return {
      curated: true,
      kindLabel: profile.kindLabel,
      symbol: profile.symbol,
      hook: `先看一个和《${title}》有关的发现：${seed.example}`,
      focus: seed.knowledge,
      concept: `学习这一课，要把“看到什么”和“明白什么”连起来。${seed.knowledge}`,
      animationFrames: [
        `画面出现《${title}》的关键场景：${seed.example}`,
        `放大镜圈出本课发现：${seed.knowledge}`,
        `问题卡跳出来：${seed.checkPrompt}`,
      ],
      examples: [
        seed.example,
        `我从例子中发现：${seed.knowledge}`,
        `我能用自己的话回答：“${seed.checkPrompt}”——${seed.checkAnswer}。`,
      ],
      practice: {
        prompt: seed.checkPrompt,
        options: [seed.checkAnswer, "只看标题不找线索", "跳过内容直接猜"],
        answer: seed.checkAnswer,
        feedback: `答对了！${seed.knowledge}`,
      },
      quiz: [
        {
          prompt: seed.checkPrompt,
          options: [seed.checkAnswer, "和课文线索无关", "课文没有告诉我们"],
          answer: seed.checkAnswer,
          explanation: `${seed.example} 这个例子给出了答案线索。`,
        },
        {
          prompt: `学习《${title}》时，最值得记住的知识是什么？`,
          options: [seed.knowledge, "只记住课题的字数", "不观察也不思考"],
          answer: seed.knowledge,
          explanation: "这正是本课知识锦囊里的核心发现。",
        },
        {
          prompt: "怎样证明自己真正理解了这一课？",
          options: ["找到线索并用自己的话说明", "只把页面翻到最后", "照着标题重复一遍"],
          answer: "找到线索并用自己的话说明",
          explanation: "能找到线索并说明理由，才是真正理解。",
        },
      ],
      summary: `你已经学会《${title}》的关键方法：${seed.knowledge}`,
      ...rich,
    };
  }
  return {
    curated: false,
    kindLabel: profile.kindLabel,
    symbol: profile.symbol,
    hook: `今天走进《${title}》，先把目标装进小书包：${objective}`,
    focus: profile.focus,
    concept: `${profile.skill}。学习时不要急着背答案，要先观察题目和材料，再用自己的话说出发现。`,
    animationFrames: [
      `山风翻开《${title}》的学习牌，出现本课目标。`,
      `竹叶把关键方法排成三步：${profile.action}。`,
      `小池塘亮起练习任务，提醒你边想边回答。`,
    ],
    examples: [
      `我会先说：这节课的关键词是“${title}”。`,
      `我会再想：它和本单元主题有什么关系？`,
      `我会最后试着表达：${objective}`,
    ],
    practice: {
      prompt: `学习《${title}》时，哪一种做法最适合？`,
      options: [profile.practiceAnswer, "只看一眼就跳过", "不读题目直接猜"],
      answer: profile.practiceAnswer,
      feedback: `好方法！${profile.practiceAnswer}，就能更稳地完成这节课。`,
    },
    quiz: [
      {
        prompt: `《${title}》这节课主要训练什么？`,
        options: [objective, "随便点击按钮", "只记住页码"],
        answer: objective,
        explanation: "课程目标就是本节课最重要的学习方向。",
      },
      {
        prompt: "遇到不懂的地方，先做什么最合适？",
        options: [profile.action, "马上放弃", "只看最后答案"],
        answer: profile.action,
        explanation: "先按方法走一遍，孩子就能自己找到线索。",
      },
      {
        prompt: "完成学习后，怎样说明自己真的学会了？",
        options: ["用自己的话讲出发现", "只说我看完了", "把页面关掉"],
        answer: "用自己的话讲出发现",
        explanation: "能说出发现，说明理解已经从眼睛走到了心里。",
      },
    ],
    summary: `完成《${title}》后，你已经练过：${profile.skill}。把这个方法带到下一课，会越读越有底气。`,
    ...rich,
  };
}

const edition = "统编版·人民教育出版社小学语文";

const defaultMinutes: Record<CourseType, number> = {
  pinyin: 10,
  literacy: 10,
  reading: 14,
  poetry: 12,
  speaking: 10,
  writing: 15,
  garden: 12,
};

function adaptiveLessonMinutes(grade: number, type: CourseType): number {
  const base = grade <= 2 ? 18 : grade <= 4 ? 23 : 28;
  const expressiveBoost = type === "writing" || type === "speaking" ? 2 : 0;
  return base + expressiveBoost;
}

function defaultObjective(title: string, type: CourseType): string {
  const profile = profiles[type];
  return `${profile.skill}，围绕“${title}”完成观察、理解和表达`;
}

const course = (
  id: string,
  title: string,
  type: CourseType,
  objective = defaultObjective(title, type),
  minutes = defaultMinutes[type],
): Course => ({
  id,
  title,
  type,
  objective,
  minutes,
  status: "ready",
  lesson: buildLesson(id, title, type, objective),
});

const c = course;

const u = (id: string, title: string, theme: string, courses: Course[]): Unit => ({
  id,
  title,
  theme,
  courses,
});

export const books: Book[] = [
  {
    bookId: "g1-upper",
    grade: 1,
    term: "上册",
    edition,
    color: "jade",
    units: [
      u("g1u-start", "我上学了", "认识学校生活，学会听、说、读、写的基本习惯", [
        c("g1u-start-01", "我上学了", "speaking", "认识课堂规则，能用完整句介绍自己和学校生活", 9),
      ]),
      u("g1u-literacy-1", "识字一", "从天地人和自然万物认识第一个汉字世界", [
        c("tian-di-ren", "天地人", "literacy", "在生活场景中认识常用汉字", 9),
        c("g1u-lit-02", "金木水火土", "literacy"),
        c("g1u-lit-03", "口耳目", "literacy"),
        c("ri-yue-shui-huo", "日月水火", "literacy", "观察图形与古文字，理解象形字"),
        c("g1u-lit-05", "对韵歌", "literacy"),
        c("g1u-speak-01", "口语交际：我说你做", "speaking"),
        c("g1u-garden-01", "语文园地一", "garden"),
        c("g1u-readbar-01", "快乐读书吧：读书真快乐", "garden"),
      ]),
      u("g1u-pinyin-1", "汉语拼音一", "听声音，看口形，认识单韵母和声母", [
        { ...course("a-o-e", "a o e", "pinyin", "认读 a、o、e，观察口形并读准四声", 10), featured: true },
        c("i-u-v", "i u ü y w", "pinyin", "认读单韵母与整体认读音节"),
        c("b-p-m-f", "b p m f", "pinyin", "借助气流和口形辨清四个声母"),
        c("g1u-pin-04", "d t n l", "pinyin"),
        c("g1u-pin-05", "g k h", "pinyin"),
        c("g1u-pin-06", "j q x", "pinyin"),
        c("g1u-pin-07", "z c s", "pinyin"),
        c("g1u-pin-08", "zh ch sh r", "pinyin"),
        c("g1u-garden-02", "语文园地二", "garden"),
      ]),
      u("g1u-pinyin-2", "汉语拼音二", "复韵母和鼻韵母连起来读", [
        c("ai-ei-ui", "ai ei ui", "pinyin", "把两个单韵母连起来读准复韵母"),
        c("g1u-pin-10", "ao ou iu", "pinyin"),
        c("g1u-pin-11", "ie üe er", "pinyin"),
        c("g1u-pin-12", "an en in un ün", "pinyin"),
        c("g1u-pin-13", "ang eng ing ong", "pinyin"),
        c("g1u-garden-03", "语文园地三", "garden"),
      ]),
      u("g1u-text-1", "课文一", "在短诗和儿歌里想象四季与生活", [
        c("g1u-text-01", "秋天", "reading"),
        c("xiao-xiao-de-chuan", "小小的船", "reading", "借助想象读出短诗的画面"),
        c("g1u-text-03", "江南", "poetry"),
        c("g1u-text-04", "四季", "reading"),
        c("g1u-speak-02", "口语交际：我们做朋友", "speaking"),
        c("g1u-garden-04", "语文园地四", "garden"),
      ]),
      u("g1u-literacy-2", "识字二", "用图像、部件和生活物品继续识字", [
        c("g1u-lit-06", "画", "poetry"),
        c("g1u-lit-07", "大小多少", "literacy"),
        c("g1u-lit-08", "小书包", "literacy"),
        c("g1u-lit-09", "日月明", "literacy"),
        c("g1u-lit-10", "升国旗", "literacy"),
        c("g1u-garden-05", "语文园地五", "garden"),
      ]),
      u("g1u-text-2", "课文二", "观察身边小事，读懂人物和声音", [
        c("g1u-text-05", "影子", "reading"),
        c("g1u-text-06", "比尾巴", "reading"),
        c("g1u-text-07", "青蛙写诗", "reading"),
        c("g1u-text-08", "雨点儿", "reading"),
        c("g1u-speak-03", "口语交际：用多大的声音", "speaking"),
        c("g1u-garden-06", "语文园地六", "garden"),
      ]),
      u("g1u-text-3", "课文三", "在童话和生活故事中练习表达", [
        c("g1u-text-09", "明天要远足", "reading"),
        c("g1u-text-10", "大还是小", "reading"),
        c("g1u-text-11", "项链", "reading"),
        c("g1u-garden-07", "语文园地七", "garden"),
        c("g1u-text-12", "雪地里的小画家", "reading"),
        c("g1u-text-13", "乌鸦喝水", "reading"),
        c("g1u-text-14", "小蜗牛", "reading"),
        c("g1u-speak-04", "口语交际：小兔运南瓜", "speaking"),
        c("g1u-garden-08", "语文园地八", "garden"),
      ]),
    ],
  },
  {
    bookId: "g1-lower",
    grade: 1,
    term: "下册",
    edition,
    color: "sky",
    units: [
      u("g1l-u1", "识字一", "在春天、姓氏和字谜里继续认识汉字", [
        c("chun-xia-qiu-dong", "春夏秋冬", "literacy", "借助季节图景认识词语"),
        c("xing-shi-ge", "姓氏歌", "literacy", "发现姓氏中的合体字结构"),
        c("g1l-u1-03", "小青蛙", "literacy"),
        c("g1l-u1-04", "猜字谜", "literacy"),
        c("ting-gu-shi", "口语交际：听故事，讲故事", "speaking", "抓住人物和事件，把故事讲清楚"),
        c("g1l-u1-garden", "语文园地一", "garden"),
        c("g1l-u1-readbar", "快乐读书吧：读读童谣和儿歌", "garden"),
      ]),
      u("g1l-u2", "课文一", "读懂心愿、太阳和接连发生的事", [
        c("g1l-u2-01", "吃水不忘挖井人", "reading"),
        c("g1l-u2-02", "我多想去看看", "reading"),
        c("g1l-u2-03", "一个接一个", "reading"),
        c("g1l-u2-04", "四个太阳", "reading"),
        c("g1l-u2-garden", "语文园地二", "garden"),
      ]),
      u("g1l-u3", "课文二", "在伙伴故事里学习合作与请求", [
        c("g1l-u3-01", "小公鸡和小鸭子", "reading"),
        c("g1l-u3-02", "树和喜鹊", "reading"),
        c("g1l-u3-03", "怎么都快乐", "reading"),
        c("g1l-u3-speak", "口语交际：请你帮个忙", "speaking"),
        c("g1l-u3-garden", "语文园地三", "garden"),
      ]),
      u("g1l-u4", "课文三", "读诗歌和节日故事，体会想念与童趣", [
        c("g1l-u4-01", "静夜思", "poetry"),
        c("g1l-u4-02", "夜色", "reading"),
        c("g1l-u4-03", "端午粽", "reading"),
        c("g1l-u4-04", "彩虹", "reading"),
        c("g1l-u4-garden", "语文园地四", "garden"),
      ]),
      u("g1l-u5", "识字二", "在动物、时间和运动中积累词语", [
        c("g1l-u5-01", "动物儿歌", "literacy"),
        c("g1l-u5-02", "古对今", "literacy"),
        c("g1l-u5-03", "操场上", "literacy"),
        c("g1l-u5-04", "人之初", "literacy"),
        c("g1l-u5-speak", "口语交际：打电话", "speaking"),
        c("g1l-u5-garden", "语文园地五", "garden"),
      ]),
      u("g1l-u6", "课文四", "读自然景象，学习观察变化", [
        c("g1l-u6-01", "古诗二首：池上 小池", "poetry"),
        c("g1l-u6-02", "荷叶圆圆", "reading"),
        c("g1l-u6-03", "要下雨了", "reading"),
        c("g1l-u6-garden", "语文园地六", "garden"),
      ]),
      u("g1l-u7", "课文五", "在生活故事里学习整理和守时", [
        c("g1l-u7-01", "文具的家", "reading"),
        c("g1l-u7-02", "一分钟", "reading"),
        c("g1l-u7-03", "动物王国开大会", "reading"),
        c("g1l-u7-04", "小猴子下山", "reading"),
        c("g1l-u7-speak", "口语交际：一起做游戏", "speaking"),
        c("g1l-u7-garden", "语文园地七", "garden"),
      ]),
      u("g1l-u8", "课文六", "读动物童话，学习借助图文推断", [
        c("g1l-u8-01", "棉花姑娘", "reading"),
        c("g1l-u8-02", "咕咚", "reading"),
        c("g1l-u8-03", "小壁虎借尾巴", "reading"),
        c("g1l-u8-garden", "语文园地八", "garden"),
      ]),
    ],
  },
  {
    bookId: "g2-upper",
    grade: 2,
    term: "上册",
    edition,
    color: "apricot",
    units: [
      u("g2u-u1", "自然会说话", "观察变化，按顺序表达", [
        c("xiao-ke-dou", "小蝌蚪找妈妈", "reading", "按变化顺序复述故事", 14),
        c("wo-shi-shui", "我是什么", "reading", "从线索中推断事物并说明理由"),
        c("g2u-u1-03", "植物妈妈有办法", "reading"),
        c("you-qu-dong-wu", "口语交际：有趣的动物", "speaking", "围绕特点有条理地介绍动物"),
        c("g2u-u1-garden", "语文园地一", "garden"),
        c("g2u-u1-readbar", "快乐读书吧：读读童话故事", "garden"),
      ]),
      u("g2u-u2", "识字一", "在场景、树木和四季里积累词语", [
        c("g2u-u2-01", "场景歌", "literacy"),
        c("shu-zhi-ge", "树之歌", "literacy", "借助形声字规律认识树木名称"),
        c("g2u-u2-03", "拍手歌", "literacy"),
        c("g2u-u2-04", "田家四季歌", "literacy"),
        c("g2u-u2-garden", "语文园地二", "garden"),
      ]),
      u("g2u-u3", "儿童生活", "读故事，学习看图和顺序表达", [
        c("g2u-u3-01", "曹冲称象", "reading"),
        c("g2u-u3-02", "玲玲的画", "reading"),
        c("g2u-u3-03", "一封信", "reading"),
        c("g2u-u3-04", "妈妈睡了", "reading"),
        c("g2u-u3-speak", "口语交际：做手工", "speaking"),
        c("g2u-u3-garden", "语文园地三", "garden"),
      ]),
      u("g2u-u4", "家乡与风景", "在古诗和景物里学习抓特点", [
        c("g2u-u4-01", "古诗二首：登鹳雀楼 望庐山瀑布", "poetry"),
        c("g2u-u4-02", "黄山奇石", "reading"),
        c("g2u-u4-03", "日月潭", "reading"),
        c("g2u-u4-04", "葡萄沟", "reading"),
        c("g2u-u4-garden", "语文园地四", "garden"),
      ]),
      u("g2u-u5", "思维寓言", "从故事中明白看问题的方法", [
        c("g2u-u5-01", "坐井观天", "reading"),
        c("g2u-u5-02", "寒号鸟", "reading"),
        c("g2u-u5-03", "我要的是葫芦", "reading"),
        c("g2u-u5-speak", "口语交际：商量", "speaking"),
        c("g2u-u5-garden", "语文园地五", "garden"),
      ]),
      u("g2u-u6", "革命故事", "认识人物行动，学习看图讲故事", [
        c("g2u-u6-01", "八角楼上", "reading"),
        c("g2u-u6-02", "朱德的扁担", "reading"),
        c("g2u-u6-03", "难忘的泼水节", "reading"),
        c("g2u-u6-04", "刘胡兰", "reading"),
        c("g2u-u6-speak", "口语交际：看图讲故事", "speaking"),
        c("g2u-u6-garden", "语文园地六", "garden"),
      ]),
      u("g2u-u7", "想象故事", "在诗歌和童话里发现想象", [
        c("g2u-u7-01", "古诗二首：夜宿山寺 敕勒歌", "poetry"),
        c("g2u-u7-02", "雾在哪里", "reading"),
        c("g2u-u7-03", "雪孩子", "reading"),
        c("g2u-u7-garden", "语文园地七", "garden"),
      ]),
      u("g2u-u8", "相处之道", "读故事，理解朋友之间的帮助", [
        c("g2u-u8-01", "狐假虎威", "reading"),
        c("g2u-u8-02", "纸船和风筝", "reading"),
        c("g2u-u8-03", "风娃娃", "reading"),
        c("g2u-u8-garden", "语文园地八", "garden"),
      ]),
    ],
  },
  {
    bookId: "g2-lower",
    grade: 2,
    term: "下册",
    edition,
    color: "bamboo",
    units: [
      u("g2l-u1", "春天来了", "在春天诗文里学习想象和语气", [
        c("g2l-u1-01", "古诗二首：村居 咏柳", "poetry"),
        c("g2l-u1-02", "找春天", "reading"),
        c("g2l-u1-03", "开满鲜花的小路", "reading"),
        c("g2l-u1-04", "邓小平爷爷植树", "reading"),
        c("g2l-u1-speak", "口语交际：注意说话的语气", "speaking"),
        c("g2l-u1-garden", "语文园地一", "garden"),
        c("g2l-u1-readbar", "快乐读书吧：读读儿童故事", "garden"),
      ]),
      u("g2l-u2", "心里有别人", "读故事，懂得关心与合作", [
        c("lei-feng", "雷锋叔叔，你在哪里", "reading", "联系生活理解关心他人的行动"),
        c("qian-ren-gao", "千人糕", "reading", "借助流程图理解劳动合作"),
        c("g2l-u2-03", "一匹出色的马", "reading"),
        c("g2l-u2-garden", "语文园地二", "garden"),
      ]),
      u("g2l-u3", "识字二", "在祖国、节日和美食里识字", [
        c("g2l-u3-01", "神州谣", "literacy"),
        c("g2l-u3-02", "传统节日", "literacy"),
        c("g2l-u3-03", "“贝”的故事", "literacy"),
        c("g2l-u3-04", "中国美食", "literacy"),
        c("g2l-u3-speak", "口语交际：长大以后做什么", "speaking"),
        c("g2l-u3-garden", "语文园地三", "garden"),
      ]),
      u("g2l-u4", "童心想象", "用颜色、童话和角色读想象", [
        c("cai-se-de-meng", "彩色的梦", "reading", "发现想象的颜色和变化", 13),
        c("g2l-u4-02", "枫树上的喜鹊", "reading"),
        c("g2l-u4-03", "沙滩上的童话", "reading"),
        c("g2l-u4-04", "我是一只小虫子", "reading"),
        c("g2l-u4-garden", "语文园地四", "garden"),
      ]),
      u("g2l-u5", "办法与规则", "在寓言和故事中学习判断", [
        c("g2l-u5-01", "寓言二则：亡羊补牢 揠苗助长", "reading"),
        c("g2l-u5-02", "画杨桃", "reading"),
        c("g2l-u5-03", "小马过河", "reading"),
        c("tu-shu-jiao", "口语交际：图书借阅公约", "speaking", "倾听意见并共同形成规则"),
        c("g2l-u5-garden", "语文园地五", "garden"),
      ]),
      u("g2l-u6", "自然秘密", "在自然与科学短文里找线索", [
        c("g2l-u6-01", "古诗二首：晓出净慈寺送林子方 绝句", "poetry"),
        c("g2l-u6-02", "雷雨", "reading"),
        c("g2l-u6-03", "要是你在野外迷了路", "reading"),
        c("g2l-u6-04", "太空生活趣事多", "reading"),
        c("g2l-u6-garden", "语文园地六", "garden"),
      ]),
      u("g2l-u7", "童话成长", "读动物故事，理清起因经过结果", [
        c("g2l-u7-01", "大象的耳朵", "reading"),
        c("g2l-u7-02", "蜘蛛开店", "reading"),
        c("g2l-u7-03", "青蛙卖泥塘", "reading"),
        c("g2l-u7-04", "小毛虫", "reading"),
        c("g2l-u7-garden", "语文园地七", "garden"),
      ]),
      u("g2l-u8", "神话与想象", "在祖先故事和神话里感受想象力", [
        c("g2l-u8-01", "祖先的摇篮", "reading"),
        c("g2l-u8-02", "当世界年纪还小的时候", "reading"),
        c("g2l-u8-03", "羿射九日", "reading"),
        c("g2l-u8-speak", "口语交际：推荐一部动画片", "speaking"),
        c("g2l-u8-garden", "语文园地八", "garden"),
      ]),
    ],
  },
  {
    bookId: "g3-upper",
    grade: 3,
    term: "上册",
    edition,
    color: "jade",
    units: [
      u("g3u-u1", "第一单元", "关注有新鲜感的词句，体会习作乐趣", [
        c("da-qing-shu", "大青树下的小学", "reading", "圈画有新鲜感的词句并交流感受", 15),
        c("g3u-u1-02", "花的学校", "reading"),
        c("g3u-u1-03", "不懂就要问", "reading"),
        c("g3u-u1-speak", "口语交际：我的暑假生活", "speaking"),
        c("cai-cai-ta-shi-shui", "习作：猜猜他是谁", "writing", "选择突出特点的事例描写人物"),
        c("g3u-u1-garden", "语文园地", "garden"),
      ]),
      u("g3u-u2", "第二单元", "读秋天，写日记，积累景物词句", [
        c("g3u-u2-01", "古诗三首：山行 赠刘景文 夜书所见", "poetry"),
        c("g3u-u2-02", "铺满金色巴掌的水泥道", "reading"),
        c("g3u-u2-03", "秋天的雨", "reading"),
        c("g3u-u2-04", "听听，秋的声音", "reading"),
        c("g3u-u2-writing", "习作：写日记", "writing"),
        c("g3u-u2-garden", "语文园地", "garden"),
      ]),
      u("g3u-u3", "第三单元", "走进童话，学习编故事", [
        c("g3u-u3-01", "卖火柴的小女孩", "reading"),
        c("g3u-u3-02", "那一定会很好", "reading"),
        c("g3u-u3-03", "在牛肚子里旅行", "reading"),
        c("g3u-u3-04", "一块奶酪", "reading"),
        c("g3u-u3-writing", "习作：我来编童话", "writing"),
        c("g3u-u3-garden", "语文园地", "garden"),
        c("g3u-u3-readbar", "快乐读书吧：在那奇妙的王国里", "garden"),
      ]),
      u("g3u-u4", "第四单元", "预测故事发展，续写故事", [
        c("g3u-u4-01", "总也倒不了的老屋", "reading"),
        c("g3u-u4-02", "胡萝卜先生的长胡子", "reading"),
        c("g3u-u4-03", "小狗学叫", "reading"),
        c("g3u-u4-speak", "口语交际：名字里的故事", "speaking"),
        c("g3u-u4-writing", "习作：续写故事", "writing"),
        c("g3u-u4-garden", "语文园地", "garden"),
      ]),
      u("g3u-u5", "第五单元", "观察事物，写出变化和发现", [
        c("g3u-u5-01", "搭船的鸟", "reading"),
        c("g3u-u5-02", "金色的草地", "reading"),
        c("g3u-u5-ex-01", "习作例文：我家的小狗", "writing"),
        c("g3u-u5-ex-02", "习作例文：我爱故乡的杨梅", "writing"),
        c("g3u-u5-writing", "习作：我们眼中的缤纷世界", "writing"),
      ]),
      u("g3u-u6", "第六单元", "借助关键句理解一段话的意思", [
        c("g3u-u6-01", "古诗三首：望天门山 饮湖上初晴后雨 望洞庭", "poetry"),
        c("g3u-u6-02", "富饶的西沙群岛", "reading"),
        c("g3u-u6-03", "海滨小城", "reading"),
        c("g3u-u6-04", "美丽的小兴安岭", "reading"),
        c("g3u-u6-writing", "习作：这儿真美", "writing"),
        c("g3u-u6-garden", "语文园地", "garden"),
      ]),
      u("g3u-u7", "第七单元", "感受自然声音，表达自己的想法", [
        c("g3u-u7-01", "大自然的声音", "reading"),
        c("g3u-u7-02", "读不完的大书", "reading"),
        c("g3u-u7-03", "父亲、树林和鸟", "reading"),
        c("g3u-u7-speak", "口语交际：身边的“小事”", "speaking"),
        c("g3u-u7-writing", "习作：我有一个想法", "writing"),
        c("g3u-u7-garden", "语文园地", "garden"),
      ]),
      u("g3u-u8", "第八单元", "认识美好品质，讲清一次经历", [
        c("g3u-u8-01", "司马光", "reading"),
        c("g3u-u8-02", "灰雀", "reading"),
        c("g3u-u8-03", "手术台就是阵地", "reading"),
        c("g3u-u8-04", "一个粗瓷大碗", "reading"),
        c("g3u-u8-speak", "口语交际：请教", "speaking"),
        c("g3u-u8-writing", "习作：那次玩得真高兴", "writing"),
        c("g3u-u8-garden", "语文园地", "garden"),
      ]),
    ],
  },
  {
    bookId: "g3-lower",
    grade: 3,
    term: "下册",
    edition,
    color: "sky",
    units: [
      u("g3l-u1", "第一单元", "一边读一边想象画面，写清观察到的事物", [
        c("g3l-u1-01", "古诗三首：绝句 惠崇春江晚景 三衢道中", "poetry"),
        c("g3l-u1-02", "燕子", "reading"),
        c("g3l-u1-03", "荷花", "reading"),
        c("g3l-u1-04", "昆虫备忘录", "reading"),
        c("g3l-u1-speak", "口语交际：春游去哪儿玩", "speaking"),
        c("g3l-u1-writing", "习作：我的植物朋友", "writing"),
        c("g3l-u1-garden", "语文园地", "garden"),
      ]),
      u("g3l-u2", "第二单元", "读寓言故事，明白其中的道理", [
        c("g3l-u2-01", "守株待兔", "reading"),
        c("g3l-u2-02", "陶罐和铁罐", "reading"),
        c("g3l-u2-03", "鹿角和鹿腿", "reading"),
        c("g3l-u2-04", "池子与河流", "reading"),
        c("g3l-u2-speak", "口语交际：该不该实行班干部轮流制", "speaking"),
        c("g3l-u2-writing", "习作：看图画，写一写", "writing"),
        c("g3l-u2-garden", "语文园地", "garden"),
        c("g3l-u2-readbar", "快乐读书吧：小故事大道理", "garden"),
      ]),
      u("g3l-u3", "第三单元", "走近中华传统文化，学会搜集资料", [
        c("yuan-ri", "古诗三首：元日 清明 九月九日忆山东兄弟", "poetry", "抓住节日习俗理解诗意", 13),
        c("zhi-jiang", "纸的发明", "reading", "用时间轴梳理发明改进过程"),
        c("zhao-zhou-qiao", "赵州桥", "reading", "围绕中心意思理解段落"),
        c("g3l-u3-04", "一幅名扬中外的画", "reading"),
        c("chuan-tong-jie-ri", "综合性学习：中华传统节日", "writing", "搜集资料并清楚介绍一种节日"),
        c("g3l-u3-garden", "语文园地", "garden"),
      ]),
      u("g3l-u4", "第四单元", "观察事物变化，写清实验过程", [
        c("g3l-u4-01", "花钟", "reading"),
        c("g3l-u4-02", "蜜蜂", "reading"),
        c("g3l-u4-03", "小虾", "reading"),
        c("g3l-u4-writing", "习作：我做了一项小实验", "writing"),
        c("g3l-u4-garden", "语文园地", "garden"),
      ]),
      u("g3l-u5", "第五单元", "展开大胆想象，写出奇妙故事", [
        c("g3l-u5-01", "宇宙的另一边", "reading"),
        c("g3l-u5-02", "我变成了一棵树", "reading"),
        c("g3l-u5-ex-01", "习作例文：一支铅笔的梦想", "writing"),
        c("g3l-u5-ex-02", "习作例文：尾巴它有一只猫", "writing"),
        c("g3l-u5-writing", "习作：奇妙的想象", "writing"),
      ]),
      u("g3l-u6", "第六单元", "体会童年生活，写有特点的人", [
        c("g3l-u6-01", "童年的水墨画", "reading"),
        c("g3l-u6-02", "剃头大师", "reading"),
        c("g3l-u6-03", "肥皂泡", "reading"),
        c("g3l-u6-04", "我不能失信", "reading"),
        c("g3l-u6-writing", "习作：身边那些有特点的人", "writing"),
        c("g3l-u6-garden", "语文园地", "garden"),
      ]),
      u("g3l-u7", "第七单元", "了解奇妙世界，学习劝告和介绍", [
        c("g3l-u7-01", "我们奇妙的世界", "reading"),
        c("g3l-u7-02", "海底世界", "reading"),
        c("g3l-u7-03", "火烧云", "reading"),
        c("g3l-u7-speak", "口语交际：劝告", "speaking"),
        c("g3l-u7-writing", "习作：国宝大熊猫", "writing"),
        c("g3l-u7-garden", "语文园地", "garden"),
      ]),
      u("g3l-u8", "第八单元", "读有趣故事，编奇妙想象", [
        c("g3l-u8-01", "慢性子裁缝和急性子顾客", "reading"),
        c("g3l-u8-02", "方帽子店", "reading"),
        c("g3l-u8-03", "漏", "reading"),
        c("g3l-u8-04", "枣核", "reading"),
        c("g3l-u8-speak", "口语交际：趣味故事会", "speaking"),
        c("g3l-u8-writing", "习作：这样想象真有趣", "writing"),
        c("g3l-u8-garden", "语文园地", "garden"),
      ]),
    ],
  },
  {
    bookId: "g4-upper",
    grade: 4,
    term: "上册",
    edition,
    color: "apricot",
    units: [
      u("g4u-u1", "第一单元", "边读边想象画面，感受自然之美", [
        c("guan-chao", "观潮", "reading", "按时间与位置顺序想象潮来景象", 16),
        c("zou-yue-liang", "走月亮", "reading", "调动多种感官体会画面与情感"),
        c("g4u-u1-03", "现代诗二首：秋晚的江上 花牛歌", "poetry"),
        c("g4u-u1-04", "繁星", "reading"),
        c("g4u-u1-speak", "口语交际：我们与环境", "speaking"),
        c("tui-jian-hao-di-fang", "习作：推荐一个好地方", "writing", "围绕推荐理由安排材料"),
        c("g4u-u1-garden", "语文园地", "garden"),
      ]),
      u("g4u-u2", "第二单元", "边读边提问，理解科学和想象", [
        c("g4u-u2-01", "一个豆荚里的五粒豆", "reading"),
        c("g4u-u2-02", "夜间飞行的秘密", "reading"),
        c("g4u-u2-03", "呼风唤雨的世纪", "reading"),
        c("g4u-u2-04", "蝴蝶的家", "reading"),
        c("g4u-u2-writing", "习作：小小“动物园”", "writing"),
        c("g4u-u2-garden", "语文园地", "garden"),
      ]),
      u("g4u-u3", "第三单元", "连续观察，写观察日记", [
        c("mu-jiang-yin", "古诗三首：暮江吟 题西林壁 雪梅", "poetry", "从色彩变化理解诗中画面"),
        c("g4u-u3-02", "爬山虎的脚", "reading"),
        c("g4u-u3-03", "蟋蟀的住宅", "reading"),
        c("g4u-u3-speak", "口语交际：爱护眼睛，保护视力", "speaking"),
        c("g4u-u3-writing", "习作：写观察日记", "writing"),
        c("g4u-u3-garden", "语文园地", "garden"),
      ]),
      u("g4u-u4", "第四单元", "读神话故事，感受想象和人物形象", [
        c("g4u-u4-01", "盘古开天地", "reading"),
        c("g4u-u4-02", "精卫填海", "reading"),
        c("g4u-u4-03", "普罗米修斯", "reading"),
        c("g4u-u4-04", "女娲补天", "reading"),
        c("g4u-u4-writing", "习作：我和神话人物过一天", "writing"),
        c("g4u-u4-garden", "语文园地", "garden"),
        c("g4u-u4-readbar", "快乐读书吧：很久很久以前", "garden"),
      ]),
      u("g4u-u5", "第五单元", "把事情写清楚，学习按顺序叙述", [
        c("g4u-u5-01", "麻雀", "reading"),
        c("g4u-u5-02", "爬天都峰", "reading"),
        c("g4u-u5-ex-01", "习作例文：我家的杏熟了", "writing"),
        c("g4u-u5-ex-02", "习作例文：小木船", "writing"),
        c("g4u-u5-writing", "习作：生活万花筒", "writing"),
      ]),
      u("g4u-u6", "第六单元", "体会成长故事，学习安慰别人", [
        c("g4u-u6-01", "牛和鹅", "reading"),
        c("g4u-u6-02", "一只窝囊的大老虎", "reading"),
        c("g4u-u6-03", "陀螺", "reading"),
        c("g4u-u6-speak", "口语交际：安慰", "speaking"),
        c("g4u-u6-writing", "习作：记一次游戏", "writing"),
        c("g4u-u6-garden", "语文园地", "garden"),
      ]),
      u("g4u-u7", "第七单元", "关注人物品质，学习写信", [
        c("g4u-u7-01", "古诗三首：出塞 凉州词 夏日绝句", "poetry"),
        c("g4u-u7-02", "为中华之崛起而读书", "reading"),
        c("g4u-u7-03", "梅兰芳蓄须", "reading"),
        c("g4u-u7-04", "延安，我把你追寻", "reading"),
        c("g4u-u7-writing", "习作：写信", "writing"),
        c("g4u-u7-garden", "语文园地", "garden"),
      ]),
      u("g4u-u8", "第八单元", "读历史故事，简要复述", [
        c("g4u-u8-01", "王戎不取道旁李", "reading"),
        c("g4u-u8-02", "西门豹治邺", "reading"),
        c("g4u-u8-03", "故事二则：扁鹊治病 纪昌学射", "reading"),
        c("g4u-u8-speak", "口语交际：讲历史人物故事", "speaking"),
        c("g4u-u8-writing", "习作：我的心儿怦怦跳", "writing"),
        c("g4u-u8-garden", "语文园地", "garden"),
      ]),
    ],
  },
  {
    bookId: "g4-lower",
    grade: 4,
    term: "下册",
    edition,
    color: "bamboo",
    units: [
      u("g4l-u1", "第一单元", "抓住关键语句，体会乡村生活", [
        c("su-xin-shi", "古诗词三首：四时田园杂兴 宿新市徐公店 清平乐·村居", "poetry", "在动作与景物中想象儿童生活", 14),
        c("xiang-xia-ren-jia", "乡下人家", "reading", "借助关键语句体会独特景致"),
        c("tian-chuang", "天窗", "reading", "理解想象如何让普通事物变丰富"),
        c("g4l-u1-04", "三月桃花水", "reading"),
        c("g4l-u1-speak", "口语交际：转述", "speaking"),
        c("wo-de-le-yuan", "习作：我的乐园", "writing", "按空间顺序写清乐园与活动"),
        c("g4l-u1-garden", "语文园地", "garden"),
      ]),
      u("g4l-u2", "第二单元", "阅读科普文章，遇到问题会提问", [
        c("g4l-u2-01", "琥珀", "reading"),
        c("g4l-u2-02", "飞向蓝天的恐龙", "reading"),
        c("g4l-u2-03", "纳米技术就在我们身边", "reading"),
        c("g4l-u2-04", "千年梦圆在今朝", "reading"),
        c("g4l-u2-speak", "口语交际：说新闻", "speaking"),
        c("g4l-u2-writing", "习作：我的奇思妙想", "writing"),
        c("g4l-u2-garden", "语文园地", "garden"),
        c("g4l-u2-readbar", "快乐读书吧：十万个为什么", "garden"),
      ]),
      u("g4l-u3", "第三单元", "读现代诗，尝试写诗", [
        c("g4l-u3-01", "短诗三首", "poetry"),
        c("g4l-u3-02", "绿", "poetry"),
        c("g4l-u3-03", "白桦", "poetry"),
        c("g4l-u3-04", "在天晴了的时候", "poetry"),
        c("g4l-u3-project", "综合性学习：轻叩诗歌大门", "garden"),
        c("g4l-u3-garden", "语文园地", "garden"),
      ]),
      u("g4l-u4", "第四单元", "体会作家怎样表达对动物的喜爱", [
        c("g4l-u4-01", "猫", "reading"),
        c("g4l-u4-02", "母鸡", "reading"),
        c("g4l-u4-03", "白鹅", "reading"),
        c("g4l-u4-writing", "习作：我的动物朋友", "writing"),
        c("g4l-u4-garden", "语文园地", "garden"),
      ]),
      u("g4l-u5", "第五单元", "按游览顺序写景物", [
        c("g4l-u5-01", "海上日出", "reading"),
        c("g4l-u5-02", "记金华的双龙洞", "reading"),
        c("g4l-u5-ex-01", "习作例文：颐和园", "writing"),
        c("g4l-u5-ex-02", "习作例文：七月的天山", "writing"),
        c("g4l-u5-writing", "习作：游记", "writing"),
      ]),
      u("g4l-u6", "第六单元", "学习把握长文章的主要内容", [
        c("g4l-u6-01", "文言文二则：囊萤夜读 铁杵成针", "reading"),
        c("g4l-u6-02", "小英雄雨来（节选）", "reading"),
        c("g4l-u6-03", "我们家的男子汉", "reading"),
        c("g4l-u6-04", "芦花鞋", "reading"),
        c("g4l-u6-speak", "口语交际：朋友相处的秘诀", "speaking"),
        c("g4l-u6-writing", "习作：我学会了", "writing"),
        c("g4l-u6-garden", "语文园地", "garden"),
      ]),
      u("g4l-u7", "第七单元", "从人物语言动作感受品质", [
        c("g4l-u7-01", "古诗三首：芙蓉楼送辛渐 塞下曲 墨梅", "poetry"),
        c("g4l-u7-02", "“诺曼底号”遇难记", "reading"),
        c("g4l-u7-03", "黄继光", "reading"),
        c("g4l-u7-04", "挑山工", "reading"),
        c("g4l-u7-speak", "口语交际：自我介绍", "speaking"),
        c("g4l-u7-writing", "习作：我的“自画像”", "writing"),
        c("g4l-u7-garden", "语文园地", "garden"),
      ]),
      u("g4l-u8", "第八单元", "读童话，按自己的想法新编故事", [
        c("g4l-u8-01", "宝葫芦的秘密（节选）", "reading"),
        c("g4l-u8-02", "巨人的花园", "reading"),
        c("g4l-u8-03", "海的女儿", "reading"),
        c("g4l-u8-writing", "习作：故事新编", "writing"),
        c("g4l-u8-garden", "语文园地", "garden"),
      ]),
    ],
  },
  {
    bookId: "g5-upper",
    grade: 5,
    term: "上册",
    edition,
    color: "jade",
    units: [
      u("g5u-u1", "第一单元", "借具体事物表达真挚感情", [
        c("bai-lu", "白鹭", "reading", "品味描写，体会事物中的情感", 17),
        c("luo-hua-sheng", "落花生", "reading", "分清主要与次要内容，理解借物喻理"),
        c("g5u-u1-03", "桂花雨", "reading"),
        c("g5u-u1-04", "珍珠鸟", "reading"),
        c("g5u-u1-speak", "口语交际：制定班级公约", "speaking"),
        c("wo-de-xin-ai-zhi-wu", "习作：我的心爱之物", "writing", "用细节写出喜爱之情"),
        c("g5u-u1-garden", "语文园地", "garden"),
      ]),
      u("g5u-u2", "第二单元", "学习提高阅读速度，概括信息", [
        c("g5u-u2-01", "搭石", "reading"),
        c("g5u-u2-02", "将相和", "reading"),
        c("g5u-u2-03", "什么比猎豹的速度更快", "reading"),
        c("g5u-u2-04", "冀中的地道战", "reading"),
        c("g5u-u2-writing", "习作：“漫画”老师", "writing"),
        c("g5u-u2-garden", "语文园地", "garden"),
      ]),
      u("g5u-u3", "第三单元", "创造性复述民间故事", [
        c("g5u-u3-01", "猎人海力布", "reading"),
        c("g5u-u3-02", "牛郎织女（一）", "reading"),
        c("niu-lang-zhi-nv", "牛郎织女（二）", "reading", "提取关键情节，创造性复述故事"),
        c("g5u-u3-speak", "口语交际：讲民间故事", "speaking"),
        c("g5u-u3-writing", "习作：缩写故事", "writing"),
        c("g5u-u3-garden", "语文园地", "garden"),
        c("g5u-u3-readbar", "快乐读书吧：从前有座山", "garden"),
      ]),
      u("g5u-u4", "第四单元", "结合资料体会课文表达的情感", [
        c("g5u-u4-01", "古诗三首：示儿 题临安邸 己亥杂诗", "poetry"),
        c("g5u-u4-02", "少年中国说（节选）", "reading"),
        c("g5u-u4-03", "圆明园的毁灭", "reading"),
        c("g5u-u4-04", "小岛", "reading"),
        c("g5u-u4-writing", "习作：二十年后的家乡", "writing"),
        c("g5u-u4-garden", "语文园地", "garden"),
      ]),
      u("g5u-u5", "第五单元", "阅读说明性文章，介绍一种事物", [
        c("g5u-u5-01", "太阳", "reading"),
        c("g5u-u5-02", "松鼠", "reading"),
        c("g5u-u5-ex-01", "习作例文：鲸", "writing"),
        c("g5u-u5-ex-02", "习作例文：风向袋的制作", "writing"),
        c("g5u-u5-writing", "习作：介绍一种事物", "writing"),
      ]),
      u("g5u-u6", "第六单元", "体会作者描写场景、细节中的感情", [
        c("g5u-u6-01", "慈母情深", "reading"),
        c("g5u-u6-02", "父爱之舟", "reading"),
        c("g5u-u6-03", "“精彩极了”和“糟糕透了”", "reading"),
        c("g5u-u6-speak", "口语交际：父母之爱", "speaking"),
        c("g5u-u6-writing", "习作：我想对您说", "writing"),
        c("g5u-u6-garden", "语文园地", "garden"),
      ]),
      u("g5u-u7", "第七单元", "感受静态描写和动态描写", [
        c("g5u-u7-01", "古诗词三首：山居秋暝 枫桥夜泊 长相思", "poetry"),
        c("g5u-u7-02", "四季之美", "reading"),
        c("g5u-u7-03", "鸟的天堂", "reading"),
        c("g5u-u7-04", "月迹", "reading"),
        c("g5u-u7-writing", "习作：即景", "writing"),
        c("g5u-u7-garden", "语文园地", "garden"),
      ]),
      u("g5u-u8", "第八单元", "根据要求梳理信息，推荐一本书", [
        c("g5u-u8-01", "古人谈读书", "reading"),
        c("g5u-u8-02", "忆读书", "reading"),
        c("g5u-u8-03", "我的“长生果”", "reading"),
        c("g5u-u8-speak", "口语交际：我最喜欢的人物形象", "speaking"),
        c("g5u-u8-writing", "习作：推荐一本书", "writing"),
        c("g5u-u8-garden", "语文园地", "garden"),
      ]),
    ],
  },
  {
    bookId: "g5-lower",
    grade: 5,
    term: "下册",
    edition,
    color: "sky",
    units: [
      u("g5l-u1", "第一单元", "体会思想感情，把重点部分写具体", [
        c("g5l-u1-01", "古诗三首：四时田园杂兴 稚子弄冰 村晚", "poetry"),
        c("g5l-u1-02", "祖父的园子", "reading"),
        c("g5l-u1-03", "月是故乡明", "reading"),
        c("g5l-u1-04", "梅花魂", "reading"),
        c("g5l-u1-speak", "口语交际：走进他们的童年岁月", "speaking"),
        c("g5l-u1-writing", "习作：那一刻，我长大了", "writing"),
        c("g5l-u1-garden", "语文园地", "garden"),
      ]),
      u("g5l-u2", "第二单元", "走近中国古典名著", [
        c("cao-chuan-jie-jian", "草船借箭", "reading", "梳理起因、经过、结果和人物谋略", 18),
        c("jing-yang-gang", "景阳冈", "reading", "用情节变化分析人物特点"),
        c("hou-wang-chu-shi", "猴王出世", "reading", "联系语境猜测古典词语意思"),
        c("g5l-u2-04", "红楼春趣", "reading"),
        c("g5l-u2-speak", "口语交际：怎么表演课本剧", "speaking"),
        c("du-hou-gan", "习作：写读后感", "writing", "先概括内容，再联系实际表达感受"),
        c("g5l-u2-garden", "语文园地", "garden"),
        c("g5l-u2-readbar", "快乐读书吧：读古典名著，品百味人生", "garden"),
      ]),
      u("g5l-u3", "第三单元", "综合性学习：遨游汉字王国", [
        c("g5l-u3-project", "综合性学习：遨游汉字王国", "garden"),
        c("g5l-u3-01", "汉字真有趣", "literacy"),
        c("g5l-u3-02", "我爱你，汉字", "literacy"),
      ]),
      u("g5l-u4", "第四单元", "通过动作、语言、神态体会人物内心", [
        c("g5l-u4-01", "古诗三首：从军行 秋夜将晓出篱门迎凉有感 闻官军收河南河北", "poetry"),
        c("g5l-u4-02", "青山处处埋忠骨", "reading"),
        c("g5l-u4-03", "军神", "reading"),
        c("g5l-u4-04", "清贫", "reading"),
        c("g5l-u4-writing", "习作：他陶醉了", "writing"),
        c("g5l-u4-garden", "语文园地", "garden"),
      ]),
      u("g5l-u5", "第五单元", "学习描写人物的基本方法", [
        c("g5l-u5-01", "人物描写一组", "reading"),
        c("g5l-u5-02", "刷子李", "reading"),
        c("g5l-u5-ex-01", "习作例文：我的朋友容容", "writing"),
        c("g5l-u5-ex-02", "习作例文：小守门员和他的观众们", "writing"),
        c("g5l-u5-writing", "习作：形形色色的人", "writing"),
      ]),
      u("g5l-u6", "第六单元", "了解人物思维过程，写探险故事", [
        c("g5l-u6-01", "自相矛盾", "reading"),
        c("g5l-u6-02", "田忌赛马", "reading"),
        c("g5l-u6-03", "跳水", "reading"),
        c("g5l-u6-writing", "习作：神奇的探险之旅", "writing"),
        c("g5l-u6-garden", "语文园地", "garden"),
      ]),
      u("g5l-u7", "第七单元", "体会静态描写和动态描写的表达效果", [
        c("g5l-u7-01", "威尼斯的小艇", "reading"),
        c("g5l-u7-02", "牧场之国", "reading"),
        c("g5l-u7-03", "金字塔", "reading"),
        c("g5l-u7-speak", "口语交际：我是小小讲解员", "speaking"),
        c("g5l-u7-writing", "习作：中国的世界文化遗产", "writing"),
        c("g5l-u7-garden", "语文园地", "garden"),
      ]),
      u("g5l-u8", "第八单元", "感受语言风趣，学习漫画启示", [
        c("g5l-u8-01", "杨氏之子", "reading"),
        c("g5l-u8-02", "手指", "reading"),
        c("g5l-u8-03", "童年的发现", "reading"),
        c("g5l-u8-speak", "口语交际：我们都来讲笑话", "speaking"),
        c("g5l-u8-writing", "习作：漫画的启示", "writing"),
        c("g5l-u8-garden", "语文园地", "garden"),
      ]),
    ],
  },
  {
    bookId: "g6-upper",
    grade: 6,
    term: "上册",
    edition,
    color: "apricot",
    units: [
      u("g6u-u1", "第一单元", "从所读内容想开去，把想象写详细", [
        c("cao-yuan", "草原", "reading", "抓住景物与人物活动体会情感", 18),
        c("ding-xiang-jie", "丁香结", "reading", "理解象征与联想带来的含义"),
        c("su-jian-de-jiang", "古诗词三首：宿建德江 六月二十七日望湖楼醉书 西江月·夜行黄沙道中", "poetry", "结合意象体会不同的山水情怀"),
        c("g6u-u1-04", "花之歌", "reading"),
        c("bian-xing-ji", "习作：变形记", "writing", "转换视角，让想象合乎自身特点"),
        c("g6u-u1-garden", "语文园地", "garden"),
      ]),
      u("g6u-u2", "第二单元", "了解革命岁月，学习演讲表达", [
        c("g6u-u2-01", "七律·长征", "poetry"),
        c("g6u-u2-02", "狼牙山五壮士", "reading"),
        c("g6u-u2-03", "开国大典", "reading"),
        c("g6u-u2-04", "灯光", "reading"),
        c("g6u-u2-05", "我的战友邱少云", "reading"),
        c("g6u-u2-speak", "口语交际：演讲", "speaking"),
        c("g6u-u2-writing", "习作：多彩的活动", "writing"),
        c("g6u-u2-garden", "语文园地", "garden"),
      ]),
      u("g6u-u3", "第三单元", "有目的地阅读，按任务选方法", [
        c("g6u-u3-01", "竹节人", "reading"),
        c("g6u-u3-02", "宇宙生命之谜", "reading"),
        c("g6u-u3-03", "故宫博物院", "reading"),
        c("g6u-u3-writing", "习作：让生活更美好", "writing"),
        c("g6u-u3-garden", "语文园地", "garden"),
      ]),
      u("g6u-u4", "第四单元", "读小说，关注情节、环境和人物", [
        c("g6u-u4-01", "桥", "reading"),
        c("g6u-u4-02", "穷人", "reading"),
        c("g6u-u4-03", "金色的鱼钩", "reading"),
        c("g6u-u4-speak", "口语交际：请你支持我", "speaking"),
        c("g6u-u4-writing", "习作：笔尖流出的故事", "writing"),
        c("g6u-u4-garden", "语文园地", "garden"),
        c("g6u-u4-readbar", "快乐读书吧：笑与泪，经历与成长", "garden"),
      ]),
      u("g6u-u5", "第五单元", "围绕中心意思表达", [
        c("g6u-u5-01", "夏天里的成长", "reading"),
        c("g6u-u5-02", "盼", "reading"),
        c("g6u-u5-ex-01", "习作例文：爸爸的计划", "writing"),
        c("g6u-u5-ex-02", "习作例文：小站", "writing"),
        c("g6u-u5-writing", "习作：围绕中心意思写", "writing"),
      ]),
      u("g6u-u6", "第六单元", "珍惜资源，学写倡议书", [
        c("g6u-u6-01", "古诗三首：浪淘沙 江南春 书湖阴先生壁", "poetry"),
        c("g6u-u6-02", "只有一个地球", "reading"),
        c("g6u-u6-03", "青山不老", "reading"),
        c("g6u-u6-04", "三黑和土地", "reading"),
        c("g6u-u6-speak", "口语交际：意见不同怎么办", "speaking"),
        c("g6u-u6-writing", "习作：学写倡议书", "writing"),
        c("g6u-u6-garden", "语文园地", "garden"),
      ]),
      u("g6u-u7", "第七单元", "借助语言文字展开艺术联想", [
        c("g6u-u7-01", "文言文二则：伯牙鼓琴 书戴嵩画牛", "reading"),
        c("g6u-u7-02", "月光曲", "reading"),
        c("g6u-u7-03", "京剧趣谈", "reading"),
        c("g6u-u7-speak", "口语交际：聊聊书法", "speaking"),
        c("g6u-u7-writing", "习作：我的拿手好戏", "writing"),
        c("g6u-u7-garden", "语文园地", "garden"),
      ]),
      u("g6u-u8", "第八单元", "走近鲁迅，借资料理解文本", [
        c("g6u-u8-01", "少年闰土", "reading"),
        c("g6u-u8-02", "好的故事", "reading"),
        c("g6u-u8-03", "我的伯父鲁迅先生", "reading"),
        c("g6u-u8-04", "有的人：纪念鲁迅有感", "poetry"),
        c("g6u-u8-writing", "习作：有你，真好", "writing"),
        c("g6u-u8-garden", "语文园地", "garden"),
      ]),
    ],
  },
  {
    bookId: "g6-lower",
    grade: 6,
    term: "下册",
    edition,
    color: "bamboo",
    units: [
      u("g6l-u1", "第一单元", "分清内容主次，体会民风民俗", [
        c("bei-jing-de-chun-jie", "北京的春节", "reading", "借助时间轴分清详写与略写", 18),
        c("la-ba-zhou", "腊八粥", "reading", "从细节描写体会人物心理"),
        c("han-shi", "古诗三首：寒食 迢迢牵牛星 十五夜望月", "poetry", "结合背景理解节日意象"),
        c("g6l-u1-04", "藏戏", "reading"),
        c("g6l-u1-speak", "口语交际：即兴发言", "speaking"),
        c("jia-xiang-feng-su", "习作：家乡的风俗", "writing", "抓住重点介绍风俗并写出体验"),
        c("g6l-u1-garden", "语文园地", "garden"),
      ]),
      u("g6l-u2", "第二单元", "漫步世界名著花园，学写梗概", [
        c("g6l-u2-01", "鲁滨逊漂流记（节选）", "reading"),
        c("g6l-u2-02", "骑鹅旅行记（节选）", "reading"),
        c("g6l-u2-03", "汤姆·索亚历险记（节选）", "reading"),
        c("g6l-u2-speak", "口语交际：同读一本书", "speaking"),
        c("g6l-u2-writing", "习作：写作品梗概", "writing"),
        c("g6l-u2-garden", "语文园地", "garden"),
        c("g6l-u2-readbar", "快乐读书吧：漫步世界名著花园", "garden"),
      ]),
      u("g6l-u3", "第三单元", "让真情自然流露", [
        c("g6l-u3-01", "匆匆", "reading"),
        c("g6l-u3-02", "那个星期天", "reading"),
        c("g6l-u3-ex-01", "习作例文：别了，语文课", "writing"),
        c("g6l-u3-ex-02", "习作例文：阳光的两种用法", "writing"),
        c("g6l-u3-writing", "习作：让真情自然流露", "writing"),
      ]),
      u("g6l-u4", "第四单元", "阅读革命志士故事，学习综合整理", [
        c("g6l-u4-01", "古诗三首：马诗 石灰吟 竹石", "poetry"),
        c("g6l-u4-02", "十六年前的回忆", "reading"),
        c("g6l-u4-03", "为人民服务", "reading"),
        c("g6l-u4-04", "董存瑞舍身炸暗堡", "reading"),
        c("g6l-u4-project", "综合性学习：奋斗的历程", "garden"),
        c("g6l-u4-garden", "语文园地", "garden"),
      ]),
      u("g6l-u5", "第五单元", "用具体事例说明观点，展开科学想象", [
        c("g6l-u5-01", "文言文二则：学弈 两小儿辩日", "reading"),
        c("g6l-u5-02", "真理诞生于一百个问号之后", "reading"),
        c("g6l-u5-03", "表里的生物", "reading"),
        c("g6l-u5-04", "他们那时候多有趣啊", "reading"),
        c("g6l-u5-speak", "口语交际：辩论", "speaking"),
        c("g6l-u5-writing", "习作：插上科学的翅膀飞", "writing"),
        c("g6l-u5-garden", "语文园地", "garden"),
      ]),
      u("g6l-u6", "第六单元", "综合性学习：难忘小学生活", [
        c("g6l-u6-project", "综合性学习：难忘小学生活", "garden"),
        c("g6l-u6-01", "回忆往事", "writing"),
        c("g6l-u6-02", "依依惜别", "writing"),
      ]),
      u("g6l-poems", "古诗词诵读", "回望小学阶段的重要诗词积累", [
        c("g6l-poem-01", "采薇（节选）", "poetry"),
        c("g6l-poem-02", "送元二使安西", "poetry"),
        c("g6l-poem-03", "春夜喜雨", "poetry"),
        c("g6l-poem-04", "早春呈水部张十八员外", "poetry"),
        c("g6l-poem-05", "江上渔者", "poetry"),
        c("g6l-poem-06", "泊船瓜洲", "poetry"),
        c("g6l-poem-07", "游园不值", "poetry"),
        c("g6l-poem-08", "卜算子·送鲍浩然之浙东", "poetry"),
        c("g6l-poem-09", "浣溪沙", "poetry"),
        c("g6l-poem-10", "清平乐", "poetry"),
      ]),
    ],
  },
];

for (const book of books) {
  for (const unit of book.units) {
    for (const course of unit.courses) {
      course.minutes = adaptiveLessonMinutes(book.grade, course.type);
      course.lesson = adaptRichLessonForGrade(course.lesson, book.grade);
    }
  }
}

export function getBook(id: string): Book | undefined {
  return books.find((book) => book.bookId === id);
}

export function getCourse(id: string): Course | undefined {
  for (const book of books) {
    for (const unit of book.units) {
      const found = unit.courses.find((item) => item.id === id);
      if (found) return found;
    }
  }
  return undefined;
}
