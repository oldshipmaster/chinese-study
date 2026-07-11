export type CourseType =
  | "pinyin"
  | "literacy"
  | "reading"
  | "poetry"
  | "speaking"
  | "writing"
  | "garden";

export type CourseStatus = "ready" | "building";

export interface Course {
  id: string;
  title: string;
  type: CourseType;
  minutes: number;
  objective: string;
  status: CourseStatus;
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

const course = (
  id: string,
  title: string,
  type: CourseType,
  objective: string,
  minutes = 12,
  status: CourseStatus = "building",
): Course => ({ id, title, type, objective, minutes, status });

const edition = "统编版·依据 2022 年课程标准分年级修订";

export const books: Book[] = [
  {
    bookId: "g1-upper",
    grade: 1,
    term: "上册",
    edition,
    color: "jade",
    units: [
      {
        id: "g1u-pinyin",
        title: "汉语拼音",
        theme: "听声音，看口形，拼出第一个音节",
        courses: [
          { ...course("a-o-e", "a o e", "pinyin", "认读 a、o、e，观察口形并读准四声", 10, "ready"), featured: true },
          course("i-u-v", "i u ü y w", "pinyin", "认读单韵母与声母，发现整体认读音节"),
          course("b-p-m-f", "b p m f", "pinyin", "借助气流和口形辨清四个声母"),
          course("ai-ei-ui", "ai ei ui", "pinyin", "把两个单韵母连起来读准复韵母"),
        ],
      },
      {
        id: "g1u-literacy",
        title: "识字与阅读",
        theme: "从天地万物走进汉字和短诗",
        courses: [
          course("tian-di-ren", "天地人", "literacy", "在生活场景中认识常用汉字", 9, "ready"),
          course("ri-yue-shui-huo", "日月水火", "literacy", "观察图形与古文字，理解象形字"),
          course("xiao-xiao-de-chuan", "小小的船", "reading", "借助想象读出短诗的画面"),
          course("g1u-garden", "语文园地：词语开花", "garden", "分类积累词语并用完整句表达"),
        ],
      },
    ],
  },
  {
    bookId: "g1-lower",
    grade: 1,
    term: "下册",
    edition,
    color: "sky",
    units: [
      {
        id: "g1l-spring",
        title: "春天来了",
        theme: "在儿歌和童话里发现春天",
        courses: [
          course("chun-xia-qiu-dong", "春夏秋冬", "literacy", "借助季节图景认识词语"),
          course("xing-shi-ge", "姓氏歌", "literacy", "发现姓氏中的合体字结构"),
          course("cun-ju", "古诗二首·村居", "poetry", "读准节奏，想象早春放风筝的画面", 12, "ready"),
          course("ting-gu-shi", "口语交际：听故事", "speaking", "抓住人物和事件，把故事讲清楚"),
        ],
      },
    ],
  },
  {
    bookId: "g2-upper",
    grade: 2,
    term: "上册",
    edition,
    color: "apricot",
    units: [
      {
        id: "g2u-nature",
        title: "自然会说话",
        theme: "观察变化，按顺序表达",
        courses: [
          course("xiao-ke-dou", "小蝌蚪找妈妈", "reading", "按变化顺序复述故事", 14, "ready"),
          course("wo-shi-shui", "我是什么", "reading", "从线索中推断事物并说明理由"),
          course("shu-zhi-ge", "树之歌", "literacy", "借助形声字规律认识树木名称"),
          course("you-qu-dong-wu", "口语交际：有趣的动物", "speaking", "围绕特点有条理地介绍动物"),
        ],
      },
    ],
  },
  {
    bookId: "g2-lower",
    grade: 2,
    term: "下册",
    edition,
    color: "bamboo",
    units: [
      {
        id: "g2l-care",
        title: "心里有别人",
        theme: "读故事，懂得关心与合作",
        courses: [
          course("lei-feng", "雷锋叔叔，你在哪里", "reading", "联系生活理解关心他人的行动"),
          course("qian-ren-gao", "千人糕", "reading", "借助流程图理解劳动合作"),
          course("cai-se-de-meng", "彩色的梦", "reading", "发现想象的颜色和变化", 13, "ready"),
          course("tu-shu-jiao", "口语交际：图书借阅公约", "speaking", "倾听意见并共同形成规则"),
        ],
      },
    ],
  },
  {
    bookId: "g3-upper",
    grade: 3,
    term: "上册",
    edition,
    color: "jade",
    units: [
      {
        id: "g3u-campus",
        title: "成长与发现",
        theme: "用有新鲜感的词句记录生活",
        courses: [
          course("da-qing-shu", "大青树下的小学", "reading", "圈画有新鲜感的词句并交流感受", 15, "ready"),
          course("hua-de-xue-xiao", "花的学校", "reading", "借助拟人想象花儿的生活"),
          course("gu-shi-san-shou-autumn", "古诗三首·秋", "poetry", "从景物和色彩体会秋意"),
          course("cai-cai-ta-shi-shui", "习作：猜猜他是谁", "writing", "选择突出特点的事例描写人物"),
        ],
      },
    ],
  },
  {
    bookId: "g3-lower",
    grade: 3,
    term: "下册",
    edition,
    color: "sky",
    units: [
      {
        id: "g3l-tradition",
        title: "中华优秀传统文化",
        theme: "从节日、艺术和发明中读文化",
        courses: [
          course("yuan-ri", "古诗三首·元日", "poetry", "抓住节日习俗理解诗意", 13, "ready"),
          course("zhi-jiang", "纸的发明", "reading", "用时间轴梳理发明改进过程"),
          course("zhao-zhou-qiao", "赵州桥", "reading", "围绕中心意思理解段落"),
          course("chuan-tong-jie-ri", "综合性学习：传统节日", "writing", "搜集资料并清楚介绍一种节日"),
        ],
      },
    ],
  },
  {
    bookId: "g4-upper",
    grade: 4,
    term: "上册",
    edition,
    color: "apricot",
    units: [
      {
        id: "g4u-nature",
        title: "自然之声",
        theme: "边读边想象，感受自然奇观",
        courses: [
          course("guan-chao", "观潮", "reading", "按时间与位置顺序想象潮来景象", 16, "ready"),
          course("zou-yue-liang", "走月亮", "reading", "调动多种感官体会画面与情感"),
          course("mu-jiang-yin", "古诗三首·暮江吟", "poetry", "从色彩变化理解诗中画面"),
          course("tui-jian-hao-di-fang", "习作：推荐一个好地方", "writing", "围绕推荐理由安排材料"),
        ],
      },
    ],
  },
  {
    bookId: "g4-lower",
    grade: 4,
    term: "下册",
    edition,
    color: "bamboo",
    units: [
      {
        id: "g4l-country",
        title: "乡村与自然",
        theme: "抓住关键语句，体会乡村生活",
        courses: [
          course("su-xin-shi", "古诗词三首·宿新市徐公店", "poetry", "在动作与景物中想象儿童生活", 14, "ready"),
          course("xiang-xia-ren-jia", "乡下人家", "reading", "借助关键语句体会独特景致"),
          course("tian-chuang", "天窗", "reading", "理解想象如何让普通事物变丰富"),
          course("wo-de-le-yuan", "习作：我的乐园", "writing", "按空间顺序写清乐园与活动"),
        ],
      },
    ],
  },
  {
    bookId: "g5-upper",
    grade: 5,
    term: "上册",
    edition,
    color: "jade",
    units: [
      {
        id: "g5u-things",
        title: "万物有情",
        theme: "借具体事物表达真挚感情",
        courses: [
          course("bai-lu", "白鹭", "reading", "品味描写，体会事物中的情感", 17, "ready"),
          course("luo-hua-sheng", "落花生", "reading", "分清主要与次要内容，理解借物喻理"),
          course("niu-lang-zhi-nv", "牛郎织女", "reading", "提取关键情节，创造性复述故事"),
          course("wo-de-xin-ai-zhi-wu", "习作：我的心爱之物", "writing", "用细节写出喜爱之情"),
        ],
      },
    ],
  },
  {
    bookId: "g5-lower",
    grade: 5,
    term: "下册",
    edition,
    color: "sky",
    units: [
      {
        id: "g5l-classics",
        title: "走近中国古典名著",
        theme: "借助资料和情节读懂经典",
        courses: [
          course("cao-chuan-jie-jian", "草船借箭", "reading", "梳理起因、经过、结果和人物谋略", 18, "ready"),
          course("jing-yang-gang", "景阳冈", "reading", "用情节变化分析人物特点"),
          course("hou-wang-chu-shi", "猴王出世", "reading", "联系语境猜测古典词语意思"),
          course("du-hou-gan", "习作：写读后感", "writing", "先概括内容，再联系实际表达感受"),
        ],
      },
    ],
  },
  {
    bookId: "g6-upper",
    grade: 6,
    term: "上册",
    edition,
    color: "apricot",
    units: [
      {
        id: "g6u-land",
        title: "触摸山河",
        theme: "展开联想，在文字中看见山河",
        courses: [
          course("cao-yuan", "草原", "reading", "抓住景物与人物活动体会情感", 18, "ready"),
          course("ding-xiang-jie", "丁香结", "reading", "理解象征与联想带来的含义"),
          course("su-jian-de-jiang", "古诗词三首", "poetry", "结合意象体会不同的山水情怀"),
          course("bian-xing-ji", "习作：变形记", "writing", "转换视角，让想象合乎自身特点"),
        ],
      },
    ],
  },
  {
    bookId: "g6-lower",
    grade: 6,
    term: "下册",
    edition,
    color: "bamboo",
    units: [
      {
        id: "g6l-tradition",
        title: "民风民俗",
        theme: "分清内容主次，体会文化意味",
        courses: [
          course("bei-jing-de-chun-jie", "北京的春节", "reading", "借助时间轴分清详写与略写", 18, "ready"),
          course("la-ba-zhou", "腊八粥", "reading", "从细节描写体会人物心理"),
          course("han-shi", "古诗三首·寒食", "poetry", "结合背景理解节日意象"),
          course("jia-xiang-feng-su", "习作：家乡的风俗", "writing", "抓住重点介绍风俗并写出体验"),
        ],
      },
    ],
  },
];

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
