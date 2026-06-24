const crypto = require("node:crypto");

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const ZODIACS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
const STEM_ELEMENTS = { 甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水" };
const ELEMENT_PROFILE = {
  木: {
    core: "靠成长、学习、连接和持续扩张起势",
    assets: "资产更适合靠长期技能、客户资源、内容/产品复利积累，不宜追短线暴利。",
    career: "事业主线在开拓、教育、策划、产品、咨询、资源整合一类更容易走出来。",
    health: "健康风险偏在肝胆、眼疲劳、筋膜紧张和情绪郁结；关键是规律运动和少熬夜。",
    relation: "关系里重视共同成长，怕被压制；长期要找能一起升级的人。",
    move: "适合去更有机会密度、学习资源和人脉流动的地方。"
  },
  火: {
    core: "靠表达、曝光、判断力和影响力起势",
    assets: "资产更适合来自品牌、流量、销售、管理溢价，不宜情绪化重仓。",
    career: "事业主线在传播、销售、管理、审美、技术呈现、公众表达上更容易见成绩。",
    health: "健康风险偏在心火、睡眠、炎症和压力上头；关键是降燥、稳定作息。",
    relation: "关系里热得快也容易急，长期要避免强势推进和情绪压迫。",
    move: "适合去曝光机会多、竞争强但上升通道清晰的环境。"
  },
  土: {
    core: "靠稳定、承载、管理和资源沉淀起势",
    assets: "资产更适合不动产、稳健现金流、组织资源和长期配置，不宜频繁换方向。",
    career: "事业主线在运营、管理、地产、供应链、财务、人事、平台型岗位更容易沉淀。",
    health: "健康风险偏在脾胃、代谢、湿气和久坐；关键是饮食节制和体重管理。",
    relation: "关系里重责任和安全感，但容易把压力都扛在自己身上。",
    move: "适合在稳定城市或稳定组织里做深，不宜长期漂浮。"
  },
  金: {
    core: "靠规则、专业、效率和决断力起势",
    assets: "资产更适合靠专业壁垒、制度红利、清晰交易和纪律配置，不宜人情式投资。",
    career: "事业主线在技术、金融、法务、风控、工程、数据、管理制度上更容易出头。",
    health: "健康风险偏在呼吸道、皮肤、肩颈和过度紧绷；关键是放松和有氧。",
    relation: "关系里标准高、边界强，长期要学会表达柔软，不只讲对错。",
    move: "适合规则清楚、效率高、资源分配透明的城市和行业。"
  },
  水: {
    core: "靠信息、流动、洞察和顺势判断起势",
    assets: "资产更适合信息差、跨区域机会、流动性配置和灵活副业，不宜被单一资产锁死。",
    career: "事业主线在信息、交易、研究、技术、跨境、物流、服务和变化型行业更容易打开。",
    health: "健康风险偏在肾水、泌尿、内分泌、焦虑和寒湿；关键是保暖、睡眠和稳定节律。",
    relation: "关系里敏感、会观察，但容易想太多；长期要把话说清楚。",
    move: "适合流动性强、信息开放、水边或交通便利的地方。"
  }
};
const TRIGRAMS = [
  { name: "坤", image: "地", lines: "000", element: "土" },
  { name: "艮", image: "山", lines: "001", element: "土" },
  { name: "坎", image: "水", lines: "010", element: "水" },
  { name: "巽", image: "风", lines: "011", element: "木" },
  { name: "震", image: "雷", lines: "100", element: "木" },
  { name: "离", image: "火", lines: "101", element: "火" },
  { name: "兑", image: "泽", lines: "110", element: "金" },
  { name: "乾", image: "天", lines: "111", element: "金" }
];

const METHODS = {
  xiaoliuren: "小六壬",
  liuyao: "六爻",
  qimen: "奇门",
  personal: "个人盘"
};

function castAdvancedDivination(payload) {
  const oracleType = METHODS[payload.oracleType] ? payload.oracleType : "xiaoliuren";
  if (oracleType === "personal") return castPersonal(payload);

  const question = normalizeQuestion(payload.question);
  if (!question) return { error: "先写下要问的具体事情。" };
  if (question.length < 6) return { error: "问题再具体一点，至少写清对象和事项。" };

  if (oracleType === "liuyao") return { result: castLiuYao(payload, question) };
  if (oracleType === "qimen") return { result: castQiMen(payload, question) };
  return { result: castXiaoLiuRen(payload, question) };
}

function castXiaoLiuRen(payload, question) {
  const now = new Date();
  const states = [
    { name: "大安", score: 5, nature: "稳、守、安定", advice: "宜稳中推进，先守住已有条件，再谈扩大。" },
    { name: "留连", score: 2, nature: "拖、缠、反复", advice: "先处理卡点和旧账，不宜催得太急。" },
    { name: "速喜", score: 5, nature: "快、喜、消息", advice: "宜主动联系，抓住短窗口快速确认。" },
    { name: "赤口", score: 1, nature: "口舌、冲突、争执", advice: "少争辩，多留证据，把话说短说清。" },
    { name: "小吉", score: 4, nature: "小成、贵人、渐顺", advice: "适合小步试探，先求一个明确回应。" },
    { name: "空亡", score: 1, nature: "虚、落空、不实", advice: "先验真伪和资源，不宜把预期押满。" }
  ];
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = getChineseHour(now);
  const index = normalizeIndex(month + day + hour - 3, states.length);
  const state = states[index];

  return baseResult({
    type: "xiaoliuren",
    methodLabel: "小六壬",
    question,
    payload,
    verdict: state.score >= 4 ? "可快问快断" : state.score === 2 ? "拖延反复" : "先缓勿冲",
    summary: `以月日时取数，落「${state.name}」。此法重在快断当前气机，适合判断来不来、成不成、等不等。`,
    facts: [
      ["取数", `${month}月 + ${day}日 + ${BRANCHES[hour - 1]}时数${hour}`],
      ["落宫", `${state.name}：${state.nature}`],
      ["倾向", state.score >= 4 ? "有回应和推进空间" : "阻滞较重，先查卡点"]
    ],
    reading: [
      `所问「${question}」落${state.name}，当前气机偏${state.nature}。`,
      state.advice,
      "小六壬适合快速判断，不适合展开复杂细节；若此事重大，可再用六爻或奇门细看结构。"
    ],
    extra: { state }
  });
}

function castLiuYao(payload, question) {
  const manualYaoValues = normalizeYaoValues(payload.yaoValues);
  const seed = hashText(`${question}|${Date.now()}|${Math.random()}|${normalizeTags(payload.tags).join(",")}`);
  const yaoValues = manualYaoValues || Array.from({ length: 6 }, (_, index) => 6 + normalizeIndex(seed + index * 7919, 4));
  const lines = yaoValues.map((value) => (value === 7 || value === 9 ? 1 : 0));
  const changedLines = lines.map((line, index) => (yaoValues[index] === 6 || yaoValues[index] === 9 ? 1 - line : line));
  const moving = yaoValues.map((value, index) => (value === 6 || value === 9 ? index + 1 : 0)).filter(Boolean);
  const original = hexagramFromLines(lines);
  const changed = hexagramFromLines(changedLines);
  const score = moving.length ? 3 + Math.min(moving.length, 2) : 3;

  return baseResult({
    type: "liuyao",
    methodLabel: "六爻",
    question,
    payload,
    verdict: moving.length ? "有动象可看" : "静卦宜守",
    summary: `${original.name}之${changed.name}，${moving.length ? `动爻在第${moving.join("、")}爻` : "无动爻"}。`,
    facts: [
      ["取爻", manualYaoValues ? "手摇六次成卦" : "系统随机起爻"],
      ["本卦", `${original.name}（${original.fullName}）`],
      ["变卦", `${changed.name}（${changed.fullName}）`],
      ["动爻", moving.length ? `第 ${moving.join("、")} 爻` : "无动爻"],
      ["六爻值", yaoValues.map(formatYao).join(" / ")]
    ],
    reading: [
      moving.length ? "此卦有动，事情不是静止状态，重点看动爻所处阶段。" : "此卦无动，宜先守现状、观察条件变化。",
      `本卦${original.name}看当前局面，变卦${changed.name}看后续走向。`,
      score >= 4 ? "可顺势推进，但要抓动爻对应的关键人或关键节点。" : "不宜急推，先补条件、等明确回应。"
    ],
    extra: {
      source: manualYaoValues ? "manual-shake" : "system-random",
      original,
      changed,
      lines: yaoValues.map((value, index) => ({
        line: index + 1,
        value,
        name: formatYao(value),
        moving: value === 6 || value === 9
      }))
    }
  });
}

function normalizeYaoValues(value) {
  if (!Array.isArray(value) || value.length !== 6) return null;
  const values = value.map((item) => Number(item));
  return values.every((item) => Number.isInteger(item) && item >= 6 && item <= 9) ? values : null;
}

function castQiMen(payload, question) {
  const now = new Date();
  const doors = ["休门", "生门", "伤门", "杜门", "景门", "死门", "惊门", "开门"];
  const stars = ["天蓬", "天任", "天冲", "天辅", "天英", "天芮", "天柱", "天心"];
  const gods = ["值符", "腾蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天"];
  const palaces = ["坎一", "坤二", "震三", "巽四", "中五", "乾六", "兑七", "艮八", "离九"];
  const seed = hashText(`${formatDate(now)}|${question}|${payload.category || ""}`);
  const start = normalizeIndex(seed + getChineseHour(now), 8);
  const usefulDoor = getUsefulDoor(payload.category);
  const plate = palaces.map((palace, index) => {
    const door = doors[normalizeIndex(start + index, doors.length)];
    const star = stars[normalizeIndex(start + index * 2, stars.length)];
    const god = gods[normalizeIndex(start + index * 3, gods.length)];
    const score = scoreDoor(door) + (door === usefulDoor ? 2 : 0);
    return { palace, door, star, god, score };
  });
  const best = [...plate].sort((a, b) => b.score - a.score)[0];

  return baseResult({
    type: "qimen",
    methodLabel: "奇门",
    question,
    payload,
    verdict: best.score >= 5 ? "有可用门" : "先避锋芒",
    summary: `当前可取「${best.palace}」之${best.door}，值${best.star}、${best.god}。`,
    facts: [
      ["起局", `${formatDate(now)}，${BRANCHES[getChineseHour(now) - 1]}时`],
      ["用门", usefulDoor],
      ["建议方位", `${best.palace}：${best.door}`],
      ["局势", best.score >= 5 ? "有门可用，宜选路径推进" : "门气偏弱，宜先避风险"]
    ],
    reading: [
      `所问「${question}」以${usefulDoor}为参考，当前最可用的是${best.palace}${best.door}。`,
      best.score >= 5 ? "宜从可沟通、可见光、可落地的路径入手，不宜散开多线。" : "先不要硬冲，避开争执和不确定条件，等门气转明再动。",
      "奇门偏重行动策略，此处给的是简化时局，后续可继续细化九宫、三奇六仪、值符值使。"
    ],
    extra: { plate, best }
  });
}

function castPersonal(payload) {
  const birthDate = String(payload.birthDate || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return { error: "个人盘需要填写出生日期。" };
  }
  const date = new Date(`${birthDate}T${payload.birthTime || "12:00"}:00`);
  if (Number.isNaN(date.getTime())) return { error: "出生日期格式不正确。" };

  const year = date.getFullYear();
  const stem = STEMS[normalizeIndex(year - 4, 10)];
  const branch = BRANCHES[normalizeIndex(year - 4, 12)];
  const zodiac = ZODIACS[normalizeIndex(year - 4, 12)];
  const element = STEM_ELEMENTS[stem];
  const season = getSeasonElement(date.getMonth() + 1);
  const question = normalizeQuestion(payload.question) || "个人阶段趋势";
  const age = Math.max(0, new Date().getFullYear() - year);
  const profile = ELEMENT_PROFILE[element] || ELEMENT_PROFILE.土;
  const seasonRelation = element === season ? "同气较旺" : `${element}遇${season}，需要借环境调节`;
  const phase = getLifePhase(age);
  const lifeDomains = buildLifeDomains({ profile, element, season, age, phase, payload });
  const timeline = buildLifeTimeline({ age, profile, phase });

  return {
    result: baseResult({
      type: "personal",
      methodLabel: "个人盘",
      question,
      payload,
      verdict: element === season ? "人生主线偏主动开局" : "人生主线靠节奏调配",
      summary: `${stem}${branch}年，生肖${zodiac}，年干五行为${element}，出生季节偏${season}。主线是：${profile.core}。当前处在${phase.name}。`,
      facts: [
        ["出生", `${birthDate} ${payload.birthTime || "12:00"}`],
        ["年龄阶段", `${age}岁，${phase.name}`],
        ["年柱", `${stem}${branch}`],
        ["生肖", zodiac],
        ["五行提示", seasonRelation],
        ["人生主线", profile.core]
      ],
      reading: [
        `直接看，你的底盘不是靠运气突然暴富型，而是「${profile.core}」的路线。`,
        `${phase.name}的重点是：${phase.focus}`,
        `资产：${profile.assets}`,
        `事业：${profile.career}`,
        `健康：${profile.health}`,
        `关系：${profile.relation}`,
        `迁移/环境：${profile.move}`,
        `后续轨迹：${timeline.map((item) => `${item.range}${item.verdict}`).join("；")}`
      ],
      extra: { stem, branch, zodiac, element, season, age, phase, lifeDomains, timeline }
    })
  };
}

function getLifePhase(age) {
  if (age < 18) return { name: "根基形成期", focus: "先把学习、身体和家庭支持打稳，不急着定终局。" };
  if (age < 25) return { name: "方向试错期", focus: "多试方向，尽快找到能长期积累的能力，不要过早被单一路径锁死。" };
  if (age < 35) return { name: "事业定盘期", focus: "要把专业、城市、圈层和赚钱方式定下来，少频繁重开。" };
  if (age < 45) return { name: "资产放大期", focus: "重点从单纯赚钱转向资产结构、团队杠杆和抗风险。" };
  if (age < 60) return { name: "守成转化期", focus: "减少无效消耗，把资源放到稳定现金流、健康和下一代/传承。" };
  return { name: "收束享用期", focus: "以健康、稳定现金流和家庭关系为主，不再做高波动赌局。" };
}

function buildLifeDomains({ profile, element, season, age, phase, payload }) {
  const focusAreas = Array.isArray(payload.tags) ? payload.tags : [];
  const currentFocus = String(payload.question || "").trim();
  return [
    { name: "资产", verdict: profile.assets, priority: focusAreas.includes("财运") || currentFocus.includes("钱") ? "high" : "normal" },
    { name: "事业", verdict: profile.career, priority: focusAreas.includes("事业") || currentFocus.includes("事业") || currentFocus.includes("工作") ? "high" : "normal" },
    { name: "健康", verdict: profile.health, priority: currentFocus.includes("健康") ? "high" : age >= 35 ? "medium" : "normal" },
    { name: "关系", verdict: profile.relation, priority: focusAreas.includes("感情") || currentFocus.includes("感情") ? "high" : "normal" },
    { name: "迁移", verdict: profile.move, priority: currentFocus.includes("城市") || currentFocus.includes("换") ? "high" : "normal" },
    { name: "阶段", verdict: `${phase.name}：${phase.focus}`, priority: "high" },
    { name: "风险", verdict: element === season ? "最大风险是过旺而急，容易一条路冲太猛。" : `最大风险是节奏不稳，${element}气要借${season}气调平。`, priority: "high" }
  ];
}

function buildLifeTimeline({ age, profile, phase }) {
  const nextAge = age + 3;
  const midAge = age + 7;
  const corePath = profile.core.replace(/^靠/, "").replace(/起势$/, "");
  return [
    {
      range: "近1-3年：",
      verdict: `${phase.focus}不宜频繁推翻重来，先把一条能复利的线做实。`
    },
    {
      range: "3-7年：",
      verdict: `适合把${corePath}转成稳定收入、职位权重或资产结构。`
    },
    {
      range: "7年后：",
      verdict: `${nextAge >= 35 || midAge >= 35 ? "重点会从拼机会转向守资产、控风险和健康管理。" : "真正的上升窗口会来自前面几年积累出的能力和圈层。"}`
    }
  ];
}

function baseResult({ type, methodLabel, question, payload, verdict, summary, facts, reading, extra }) {
  const now = new Date();
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type,
    question,
    category: payload.category || "其他",
    tags: normalizeTags(payload.tags),
    methodLabel,
    createdAt: now.toISOString(),
    verdict,
    summary,
    facts,
    reading,
    extra
  };
}

function hexagramFromLines(lines) {
  const lower = trigramFromLines(lines.slice(0, 3));
  const upper = trigramFromLines(lines.slice(3, 6));
  return {
    name: `${upper.image}${lower.image}`,
    fullName: `${upper.name}${lower.name}`,
    lines,
    upper,
    lower
  };
}

function trigramFromLines(lines) {
  const key = lines.join("");
  return TRIGRAMS.find((item) => item.lines === key) || TRIGRAMS[0];
}

function formatYao(value) {
  return ({ 6: "老阴", 7: "少阳", 8: "少阴", 9: "老阳" })[value] || "少阳";
}

function getUsefulDoor(category) {
  return ({
    财运: "生门",
    合作: "开门",
    感情: "休门",
    出行: "开门",
    事业: "开门"
  })[category] || "生门";
}

function scoreDoor(door) {
  return ({ 开门: 4, 生门: 4, 休门: 3, 景门: 3, 杜门: 2, 惊门: 2, 伤门: 1, 死门: 1 })[door] || 2;
}

function getSeasonElement(month) {
  if ([3, 4, 5].includes(month)) return "木";
  if ([6, 7, 8].includes(month)) return "火";
  if ([9, 10, 11].includes(month)) return "金";
  return "水";
}

function normalizeQuestion(value) {
  return String(value || "").trim().slice(0, 240);
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))].slice(0, 8);
}

function normalizeIndex(value, base) {
  return ((Number(value) % base) + base) % base;
}

function getChineseHour(date) {
  const hour = date.getHours();
  return Math.floor(((hour + 1) % 24) / 2) + 1;
}

function hashText(text) {
  let hash = 2166136261;
  for (const char of String(text)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

module.exports = {
  castAdvancedDivination
};
