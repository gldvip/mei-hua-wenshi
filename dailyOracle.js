const DAILY_SIGNS = [
  {
    name: "晨灯照路",
    fortune: "小吉",
    keywords: ["明朗", "先行", "贵在早定"],
    poem: "灯起东方路渐明，先收散意再前行。",
    suitable: "适合定计划、发消息、开启一个小动作。",
    avoid: "忌临时改口、反复观望、把小事拖成大事。",
    advice: "今日先抓最清楚的一步，不必一次求全。越早把边界说清，后面越省力。"
  },
  {
    name: "云遮半月",
    fortune: "平",
    keywords: ["信息不全", "缓判", "留余地"],
    poem: "半月藏云未尽明，问人问事且徐行。",
    suitable: "适合收集信息、复核条件、观察对方态度。",
    avoid: "忌急着表态、重仓投入、凭情绪下判断。",
    advice: "今日不宜把话说满。先确认缺失信息，再决定是否推进。"
  },
  {
    name: "风过竹庭",
    fortune: "小吉",
    keywords: ["消息", "沟通", "顺势"],
    poem: "风来竹动声先至，一句通时百结开。",
    suitable: "适合沟通、递话、约时间、做轻量推进。",
    avoid: "忌绕弯试探、话里有话、让误会继续发酵。",
    advice: "今日成败多在一句话。表达越清楚，阻力越小。"
  },
  {
    name: "石上生泉",
    fortune: "中吉",
    keywords: ["慢成", "耐心", "暗中有源"],
    poem: "石冷泉微终有脉，静听深处水声来。",
    suitable: "适合长期事项、积累资源、等待关键回应。",
    avoid: "忌因一时无声就放弃，也忌催得过急。",
    advice: "今日看似慢，其实有暗线在动。守住节奏，等一个自然流出的口子。"
  },
  {
    name: "火照寒枝",
    fortune: "吉",
    keywords: ["显现", "被看见", "转暖"],
    poem: "寒枝一点火光近，旧意新机并可寻。",
    suitable: "适合展示成果、主动说明、修复冷场关系。",
    avoid: "忌过度炫耀、急求承诺、把好意说成压力。",
    advice: "今日适合让别人看见你的真实准备。温和但明确，会比强推更有效。"
  },
  {
    name: "舟临浅滩",
    fortune: "小凶",
    keywords: ["阻滞", "检查", "减速"],
    poem: "舟至浅滩须看水，一篙失度便成迟。",
    suitable: "适合检查合同、路线、时间、细节风险。",
    avoid: "忌赶时间、赌运气、忽略小错误。",
    advice: "今日不怕慢，怕没看清。先排障，再行动。"
  },
  {
    name: "山门待启",
    fortune: "平吉",
    keywords: ["等待", "门槛", "条件"],
    poem: "山门未启人先立，钥在他方莫硬推。",
    suitable: "适合等通知、补条件、找关键人确认。",
    avoid: "忌硬闯规则、越级推进、对方未回应就加码。",
    advice: "今日的关键不是力气，而是门在哪里、钥匙在谁手里。"
  },
  {
    name: "金声入耳",
    fortune: "中吉",
    keywords: ["承诺", "规则", "钱款"],
    poem: "金声一响分轻重，字字落处见真章。",
    suitable: "适合谈规则、确认价格、落文字、看回款。",
    avoid: "忌口头含糊、轻信漂亮话、忽略凭证。",
    advice: "今日凡事要落到明确数字和文字。能写下来，就少一半风险。"
  },
  {
    name: "雨润焦土",
    fortune: "吉",
    keywords: ["缓和", "补救", "回温"],
    poem: "久旱逢霖土气苏，旧局将开待一扶。",
    suitable: "适合道歉、修复、补材料、给对方台阶。",
    avoid: "忌翻旧账、逼问结果、把缓和当彻底成局。",
    advice: "今日有回温之象。先让局面软下来，后面才谈得动。"
  },
  {
    name: "镜中有尘",
    fortune: "平",
    keywords: ["偏见", "自省", "校准"],
    poem: "镜明不怕微尘在，拂去方知本色真。",
    suitable: "适合复盘、调整预期、请第三方给意见。",
    avoid: "忌只按自己的想法解释一切。",
    advice: "今日最该防的是误判。先问自己：我是不是只看到了想看的部分。"
  },
  {
    name: "雷动门前",
    fortune: "小吉",
    keywords: ["突发", "机会", "快应"],
    poem: "雷声近户惊人起，动处方知有转机。",
    suitable: "适合处理突发消息、快速回应、抓短窗口。",
    avoid: "忌拖延、装没看见、错过第一回应。",
    advice: "今日可能有突然变化。先回应，再细谈。"
  },
  {
    name: "藤缠旧木",
    fortune: "小凶",
    keywords: ["牵扯", "旧账", "消耗"],
    poem: "藤绕旧枝难自解，先分根脉再修枝。",
    suitable: "适合清理历史问题、拆分责任、设边界。",
    avoid: "忌继续人情绑架、把不相干的事混在一起。",
    advice: "今日要先拆结。边界不清，越做越累。"
  },
  {
    name: "鹤立清池",
    fortune: "吉",
    keywords: ["清醒", "独立", "高处看"],
    poem: "清池一鹤临风立，不逐群声自有程。",
    suitable: "适合独立判断、做取舍、拒绝杂音。",
    avoid: "忌随大流、被情绪裹挟、为了合群而答应。",
    advice: "今日需要站高一点看。你不必解释给所有人听。"
  },
  {
    name: "门内藏灯",
    fortune: "中吉",
    keywords: ["内助", "隐秘资源", "家宅"],
    poem: "门内一灯虽不显，照人归处也分明。",
    suitable: "适合向熟人求助、整理内部资源、处理家中事。",
    avoid: "忌舍近求远、忽略身边已有支持。",
    advice: "今日帮助可能来自近处。先看已有的人和资源。"
  },
  {
    name: "沙里寻针",
    fortune: "平凶",
    keywords: ["费力", "筛选", "不急"],
    poem: "沙中有针非无物，只恐心急手更忙。",
    suitable: "适合筛选、排查、做细活。",
    avoid: "忌在杂乱信息中立刻下结论。",
    advice: "今日事情不一定坏，但会费眼力。把范围缩小再找答案。"
  },
  {
    name: "花开背阴",
    fortune: "平吉",
    keywords: ["暗喜", "未公开", "低调"],
    poem: "背阴花发无人见，香到深时自有人。",
    suitable: "适合低调推进、私下沟通、准备未公开事项。",
    avoid: "忌过早声张、没成前先邀功。",
    advice: "今日宜藏锋。先把事情做实，再让别人看见。"
  },
  {
    name: "急水回湾",
    fortune: "小凶转平",
    keywords: ["变向", "避险", "转弯"],
    poem: "急水回湾非退势，避石之后路更长。",
    suitable: "适合调整方案、换路径、临时避开冲突。",
    avoid: "忌一条路走到黑。",
    advice: "今日转弯不是失败。避开硬点，事情反而能继续。"
  },
  {
    name: "玉扣将合",
    fortune: "吉",
    keywords: ["配合", "成约", "关系"],
    poem: "玉扣相逢将欲合，轻声慢语莫惊缘。",
    suitable: "适合合作、确认关系、推进约定。",
    avoid: "忌逼迫对方立刻给最终答案。",
    advice: "今日有合意之象。保持分寸，给对方一点空间，反而更容易成。"
  },
  {
    name: "孤灯守夜",
    fortune: "平凶",
    keywords: ["独撑", "疲惫", "减负"],
    poem: "孤灯不灭人先倦，莫把长夜一肩担。",
    suitable: "适合休整、分工、降低承诺。",
    avoid: "忌硬撑、逞强、把所有责任揽到自己身上。",
    advice: "今日要先保精力。能分出去的事，不必都自己扛。"
  },
  {
    name: "青鸟衔书",
    fortune: "中吉",
    keywords: ["消息", "回应", "远方"],
    poem: "青鸟衔书过远山，一封来处见机缘。",
    suitable: "适合等回复、发邮件、联系远方或线上对象。",
    avoid: "忌信息发出后反复催促。",
    advice: "今日消息运较强。把话发准，剩下的留给时间。"
  },
  {
    name: "井底见星",
    fortune: "平",
    keywords: ["局限", "换角度", "求证"],
    poem: "井底亦能窥星影，只因天地未全开。",
    suitable: "适合请教、查资料、换人问问。",
    avoid: "忌困在单一视角里。",
    advice: "今日不是没有答案，而是视角还窄。换个位置看。"
  },
  {
    name: "丹炉待火",
    fortune: "中吉",
    keywords: ["准备", "时机", "蓄力"],
    poem: "丹炉药足火未催，一候风来便可开。",
    suitable: "适合准备材料、磨方案、等启动时机。",
    avoid: "忌准备不足就急着上线。",
    advice: "今日重点在补足条件。火候到时，启动会更顺。"
  },
  {
    name: "落叶归根",
    fortune: "平吉",
    keywords: ["收束", "复盘", "回归"],
    poem: "叶落归根非寂寞，一番收拾见来春。",
    suitable: "适合结项、复盘、归档、回到根本问题。",
    avoid: "忌拖着尾巴不处理。",
    advice: "今日适合把一件事收干净。收束好了，才有新局。"
  },
  {
    name: "白石藏金",
    fortune: "大吉",
    keywords: ["潜力", "贵人", "后劲"],
    poem: "白石不言金在腹，识得其质自生光。",
    suitable: "适合识别机会、谈长期合作、看隐藏价值。",
    avoid: "忌只看表面价格或一时反馈。",
    advice: "今日有暗藏价值。慢一点看清本质，可能比眼前收益更重要。"
  }
];

function castDailyOracle(payload) {
  const now = new Date();
  const question = String(payload.question || "").trim() || "今日总体";
  const profile = normalizeOptional(payload.profile);
  const location = normalizeOptional(payload.location);
  const personalInfo = normalizeOptional(payload.personalInfo);
  const tags = normalizeTags(payload.tags);
  const randomSalt = `${Date.now()}-${Math.random()}`;
  const basis = [
    formatDate(now),
    question,
    profile,
    location,
    personalInfo,
    tags.join(","),
    randomSalt
  ].join("|");
  const index = Math.abs(hashText(basis)) % DAILY_SIGNS.length;
  const sign = DAILY_SIGNS[index];

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type: "daily-oracle",
    dateKey: formatDateKey(now),
    createdAt: now.toISOString(),
    question,
    profile,
    location,
    personalInfo,
    tags,
    signNumber: index + 1,
    totalSigns: DAILY_SIGNS.length,
    sign,
    reading: buildReading(sign, { question, profile, location, personalInfo, tags, now })
  };
}

function buildReading(sign, context) {
  const subject = context.profile ? `以「${context.profile}」为当前问卜对象，` : "";
  const place = context.location ? `地点取「${context.location}」之气，` : "";
  const info = context.personalInfo ? `参考个人信息「${context.personalInfo}」，` : "";
  const tags = context.tags?.length ? `标签为「${context.tags.join("、")}」，` : "";

  return [
    `${subject}${place}${info}${tags}今日得「${sign.name}」签，签势为${sign.fortune}。`,
    `此签关键词为：${sign.keywords.join("、")}。${sign.advice}`,
    `所问为「${context.question}」。今日宜：${sign.suitable} 忌：${sign.avoid}`,
    "此签只看当日气机，不替代一事一卦；若要问具体成败、对方态度或后续走势，建议再用梅花易数或六爻细断。"
  ];
}

function normalizeOptional(value) {
  return String(value || "").trim().slice(0, 80);
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))].slice(0, 8);
}

function hashText(text) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash;
}

function formatDateKey(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${formatDateKey(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

module.exports = {
  castDailyOracle
};
