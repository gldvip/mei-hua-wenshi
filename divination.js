const TRIGRAMS = [
  null,
  { number: 1, name: "乾", image: "天", element: "金", lines: [1, 1, 1], nature: "刚健、主动、上行" },
  { number: 2, name: "兑", image: "泽", element: "金", lines: [1, 1, 0], nature: "悦动、沟通、缺口" },
  { number: 3, name: "离", image: "火", element: "火", lines: [1, 0, 1], nature: "明朗、依附、显现" },
  { number: 4, name: "震", image: "雷", element: "木", lines: [1, 0, 0], nature: "发动、惊动、开端" },
  { number: 5, name: "巽", image: "风", element: "木", lines: [0, 1, 1], nature: "进入、消息、反复" },
  { number: 6, name: "坎", image: "水", element: "水", lines: [0, 1, 0], nature: "险阻、隐情、流动" },
  { number: 7, name: "艮", image: "山", element: "土", lines: [0, 0, 1], nature: "停止、边界、等待" },
  { number: 8, name: "坤", image: "地", element: "土", lines: [0, 0, 0], nature: "承载、顺势、积累" }
];

const CATEGORY_TEXT = {
  事业: {
    focus: "看推进节奏、上级/客户态度、阻碍点与可行动窗口。",
    advice: "先定边界，再推关键节点；不要在信息不明时一次押重。"
  },
  感情: {
    focus: "看彼此状态、沟通意愿、关系阻滞与后续回温可能。",
    advice: "先看对方是否有回应之象，再决定主动还是缓一缓。"
  },
  财运: {
    focus: "看资金流动、风险暴露、进退时机与收益是否稳定。",
    advice: "重视回款、合同和现金流，不宜只看表面机会。"
  },
  合作: {
    focus: "看对方诚意、分工是否顺、暗处变量与最终成局概率。",
    advice: "把口头承诺落到条款，先小步验证再扩大投入。"
  },
  出行: {
    focus: "看阻滞、延误、方向是否顺，以及临时变动。",
    advice: "提前留余量，遇到坎艮之象尤其要查证路线与时间。"
  },
  其他: {
    focus: "看此事当前气机、主客关系、阻力与转机。",
    advice: "先抓住最确定的一环，等动象明朗后再加码。"
  }
};

const EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const LUNAR_MONTH_NUMBERS = {
  正: 1,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  冬: 11,
  腊: 12,
  十一: 11,
  十二: 12
};

function castDivination(payload) {
  const question = String(payload.question || "").trim();
  const category = CATEGORY_TEXT[payload.category] ? payload.category : "其他";
  const method = payload.method === "number" ? "number" : "time";
  const tags = normalizeTags(payload.tags);
  const error = validateCastInput({ ...payload, question, method });

  if (error) {
    return { error };
  }

  const result = method === "number"
    ? castByNumbers(question, category, payload.numbers || {}, tags)
    : castByTime(question, category, tags);

  return { result };
}

function validateCastInput(input) {
  if (!input.question) return "先写下你要问的具体事情。";
  if (input.question.length < 6) return "问题再具体一点，至少写清对象和事项。";

  if (input.method === "number") {
    const a = Number(input.numbers?.a);
    const b = Number(input.numbers?.b);
    if (!Number.isFinite(a) || a < 1 || !Number.isFinite(b) || b < 1) {
      return "数字起卦至少需要填写上数和下数。";
    }
  }

  return "";
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))].slice(0, 8);
}

function normalizeModulo(value, base) {
  const mod = Number(value) % base;
  return mod === 0 ? base : mod;
}

function getChineseHour(date) {
  const hour = date.getHours();
  return Math.floor(((hour + 1) % 24) / 2) + 1;
}

function getChineseHourInfo(date) {
  const number = getChineseHour(date);
  return {
    number,
    branch: EARTHLY_BRANCHES[number - 1],
    label: `${EARTHLY_BRANCHES[number - 1]}时`
  };
}

function getTraditionalTimeSeed(date) {
  const hour = getChineseHourInfo(date);
  const lunar = getLunarDateParts(date);

  if (!lunar) {
    const seedA = date.getFullYear() + date.getMonth() + 1 + date.getDate();
    const seedB = seedA + hour.number;
    return {
      seedA,
      seedB,
      seedMove: seedB,
      label: `${formatDate(date)}，公历取数，${hour.label}数 ${hour.number}`
    };
  }

  const seedA = lunar.yearBranchNumber + lunar.monthNumber + lunar.dayNumber;
  const seedB = seedA + hour.number;
  return {
    seedA,
    seedB,
    seedMove: seedB,
    label: `${formatDate(date)}，农历${lunar.yearName}年${lunar.monthName}${lunar.dayLabel}，${hour.label}数 ${hour.number}`
  };
}

function getLunarDateParts(date) {
  try {
    const formatter = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    const parts = formatter.formatToParts(date);
    const yearName = parts.find((part) => part.type === "yearName")?.value;
    const monthName = parts.find((part) => part.type === "month")?.value;
    const dayName = parts.find((part) => part.type === "day")?.value;
    const yearBranchNumber = parseYearBranchNumber(yearName);
    const monthNumber = parseLunarMonth(monthName);
    const dayNumber = parseLunarDay(dayName);

    if (!yearName || !monthName || !dayName || !yearBranchNumber || !monthNumber || !dayNumber) {
      return null;
    }

    return {
      yearName,
      monthName,
      dayName,
      dayLabel: formatLunarDayName(dayNumber, dayName),
      yearBranchNumber,
      monthNumber,
      dayNumber
    };
  } catch {
    return null;
  }
}

function parseYearBranchNumber(yearName) {
  const branch = String(yearName || "").match(/[子丑寅卯辰巳午未申酉戌亥]/)?.[0];
  const index = EARTHLY_BRANCHES.indexOf(branch);
  return index >= 0 ? index + 1 : 0;
}

function parseLunarMonth(monthName) {
  const normalized = String(monthName || "").replace(/^闰/, "").replace(/月$/, "");
  return LUNAR_MONTH_NUMBERS[normalized] || Number(normalized) || 0;
}

function parseLunarDay(dayName) {
  const normalized = String(dayName || "").replace(/日$/, "");
  const numeric = Number(normalized);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;

  const digits = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  if (normalized.startsWith("初")) return digits[normalized.slice(1)] || 0;
  if (normalized === "十") return 10;
  if (normalized.startsWith("十")) return 10 + (digits[normalized.slice(1)] || 0);
  if (normalized.startsWith("廿")) return 20 + (digits[normalized.slice(1)] || 0);
  if (normalized === "三十") return 30;
  return 0;
}

function formatLunarDayName(dayNumber, fallback) {
  const dayNames = [
    "",
    "初一",
    "初二",
    "初三",
    "初四",
    "初五",
    "初六",
    "初七",
    "初八",
    "初九",
    "初十",
    "十一",
    "十二",
    "十三",
    "十四",
    "十五",
    "十六",
    "十七",
    "十八",
    "十九",
    "二十",
    "廿一",
    "廿二",
    "廿三",
    "廿四",
    "廿五",
    "廿六",
    "廿七",
    "廿八",
    "廿九",
    "三十"
  ];
  return dayNames[dayNumber] || fallback;
}

function linesKey(lines) {
  return lines.join("");
}

function trigramFromLines(lines) {
  return TRIGRAMS.find((item) => item && linesKey(item.lines) === linesKey(lines));
}

function buildHexagram(upper, lower) {
  const lines = [...lower.lines, ...upper.lines];
  return {
    upper,
    lower,
    name: `${upper.image}${lower.image}`,
    fullName: `${upper.name}${lower.name}`,
    lines
  };
}

function changeHexagram(hexagram, movingLine) {
  const changedLines = [...hexagram.lines];
  changedLines[movingLine - 1] = changedLines[movingLine - 1] ? 0 : 1;
  return buildHexagram(
    trigramFromLines(changedLines.slice(3, 6)),
    trigramFromLines(changedLines.slice(0, 3))
  );
}

function mutualHexagram(hexagram) {
  return buildHexagram(
    trigramFromLines(hexagram.lines.slice(2, 5)),
    trigramFromLines(hexagram.lines.slice(1, 4))
  );
}

function relationOf(bodyElement, useElement) {
  const generates = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
  const controls = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

  if (bodyElement === useElement) {
    return {
      type: "比和",
      score: 3,
      title: "气势相同",
      text: "事情有同频之象，阻力不算重，但也容易原地打转，需要一个明确动作来推动。"
    };
  }

  if (generates[useElement] === bodyElement) {
    return {
      type: "用生体",
      score: 5,
      title: "外势助我",
      text: "外部条件对你有助力，事情较容易得到回应或资源支持，可顺势推进。"
    };
  }

  if (generates[bodyElement] === useElement) {
    return {
      type: "体生用",
      score: 2,
      title: "我去生事",
      text: "你需要投入精力、时间或资源来成事，能动但较耗，不宜一厢情愿。"
    };
  }

  if (controls[useElement] === bodyElement) {
    return {
      type: "用克体",
      score: 1,
      title: "外势压我",
      text: "外部阻力较明显，容易被条件、对方态度或制度约束，不宜硬冲。"
    };
  }

  return {
    type: "体克用",
    score: 4,
    title: "我能制事",
    text: "你对局面仍有掌控力，但需要主动拿规则、节奏或方案，不可放任其自然发展。"
  };
}

function castByTime(question, category, tags) {
  const now = new Date();
  const seed = getTraditionalTimeSeed(now);
  return makeDivination({
    question,
    category,
    tags,
    methodLabel: "时间起卦",
    seedLabel: seed.label,
    upper: TRIGRAMS[normalizeModulo(seed.seedA, 8)],
    lower: TRIGRAMS[normalizeModulo(seed.seedB, 8)],
    movingLine: normalizeModulo(seed.seedMove, 6),
    createdAt: now
  });
}

function castByNumbers(question, category, numbers, tags) {
  const a = Number(numbers.a);
  const b = Number(numbers.b);
  const c = Number(numbers.c || a + b);
  const now = new Date();
  return makeDivination({
    question,
    category,
    tags,
    methodLabel: "数字起卦",
    seedLabel: `上数 ${a}，下数 ${b}，动数 ${c}`,
    upper: TRIGRAMS[normalizeModulo(a, 8)],
    lower: TRIGRAMS[normalizeModulo(b, 8)],
    movingLine: normalizeModulo(c, 6),
    createdAt: now
  });
}

function makeDivination(input) {
  const original = buildHexagram(input.upper, input.lower);
  const changed = changeHexagram(original, input.movingLine);
  const mutual = mutualHexagram(original);
  const body = input.movingLine > 3 ? original.lower : original.upper;
  const use = input.movingLine > 3 ? original.upper : original.lower;
  const relation = relationOf(body.element, use.element);
  const categoryText = CATEGORY_TEXT[input.category] || CATEGORY_TEXT["其他"];
  const verdict = getVerdict(relation.score, input.movingLine, changed);

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    question: input.question,
    category: input.category,
    tags: input.tags || [],
    methodLabel: input.methodLabel,
    seedLabel: input.seedLabel,
    createdAt: input.createdAt.toISOString(),
    movingLine: input.movingLine,
    original,
    mutual,
    changed,
    body,
    use,
    relation,
    verdict,
    reading: buildReading({ relation, categoryText, tags: input.tags || [], movingLine: input.movingLine, original, mutual, changed, body, use })
  };
}

function getVerdict(score, movingLine, changed) {
  if (score >= 5) return "可顺势推进";
  if (score === 4) return movingLine === 6 ? "可控但宜收束" : "主动可成";
  if (score === 3) return changed.lower.name === "艮" || changed.upper.name === "艮" ? "先停后动" : "平稳待机";
  if (score === 2) return "有耗宜谨慎";
  return "阻力偏重";
}

function buildReading(data) {
  const movingText = {
    1: "初爻动，事情还在起点，先看根基是否稳。",
    2: "二爻动，人与资源开始介入，适合先求配合。",
    3: "三爻动，进退之间最易反复，不宜急于定局。",
    4: "四爻动，外部压力或机会已经靠近，需要及时应对。",
    5: "五爻动，关键位置被触发，可看主事人、核心条件。",
    6: "上爻动，事情接近一轮结果，宜收束、转向或复盘。"
  };

  return [
    `本卦为${data.original.name}，上${data.original.upper.name}下${data.original.lower.name}，主象是${data.original.upper.nature}与${data.original.lower.nature}相叠。`,
    `体卦为${data.body.name}${data.body.image}，属${data.body.element}；用卦为${data.use.name}${data.use.image}，属${data.use.element}。${data.relation.type}，${data.relation.text}`,
    `互卦为${data.mutual.name}，看中间过程；变卦为${data.changed.name}，看后势走向。${movingText[data.movingLine]}`,
    data.tags.length ? `本次标签为：${data.tags.join("、")}，断事时优先按这些方向收束判断。` : "",
    `${data.categoryText.focus}此卦建议：${data.categoryText.advice}`
  ].filter(Boolean);
}

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

module.exports = {
  castDivination
};
