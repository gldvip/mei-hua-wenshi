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

const AI_SECTION_TITLES = ["局势", "阻碍", "转机", "应对", "结果倾向"];
const AI_SECTION_PATTERN = AI_SECTION_TITLES.join("|");
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

const els = {
  question: document.querySelector("#question"),
  categoryGroup: document.querySelector("#categoryGroup"),
  methodGroup: document.querySelector("#methodGroup"),
  numberPanel: document.querySelector("#numberPanel"),
  numA: document.querySelector("#numA"),
  numB: document.querySelector("#numB"),
  numC: document.querySelector("#numC"),
  castButton: document.querySelector("#castButton"),
  resultPanel: document.querySelector("#resultPanel"),
  errorText: document.querySelector("#errorText"),
  openHistory: document.querySelector("#openHistory"),
  closeHistory: document.querySelector("#closeHistory"),
  historyDrawer: document.querySelector("#historyDrawer"),
  historyList: document.querySelector("#historyList"),
  clearHistory: document.querySelector("#clearHistory")
};

const state = {
  category: "事业",
  method: "time",
  current: null,
  history: loadHistory(),
  aiSessions: loadAiSessions(),
  aiTypingRun: 0
};

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

function castByTime(question, category) {
  const now = new Date();
  const seed = getTraditionalTimeSeed(now);
  const upper = TRIGRAMS[normalizeModulo(seed.seedA, 8)];
  const lower = TRIGRAMS[normalizeModulo(seed.seedB, 8)];
  const movingLine = normalizeModulo(seed.seedMove, 6);
  return makeDivination({
    question,
    category,
    methodLabel: "时间起卦",
    seedLabel: seed.label,
    upper,
    lower,
    movingLine,
    createdAt: now
  });
}

function castByNumbers(question, category) {
  const a = Number(els.numA.value);
  const b = Number(els.numB.value);
  const c = Number(els.numC.value || a + b);
  const now = new Date();
  return makeDivination({
    question,
    category,
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
    reading: buildReading({ relation, categoryText, movingLine: input.movingLine, original, mutual, changed, body, use })
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
    `${data.categoryText.focus}此卦建议：${data.categoryText.advice}`
  ];
}

function validate() {
  const question = els.question.value.trim();
  if (!question) return "先写下你要问的具体事情。";
  if (question.length < 6) return "问题再具体一点，至少写清对象和事项。";
  if (state.method === "number") {
    const a = Number(els.numA.value);
    const b = Number(els.numB.value);
    if (!Number.isFinite(a) || a < 1 || !Number.isFinite(b) || b < 1) {
      return "数字起卦至少需要填写上数和下数。";
    }
  }
  return "";
}

function renderResult(result) {
  state.current = result;
  els.resultPanel.classList.remove("is-empty");
  els.resultPanel.innerHTML = `
    <div class="result-inner">
      <div class="result-title">
        <div>
          <h2>${escapeHtml(result.question)}</h2>
          <p class="meta">${result.category} · ${result.methodLabel} · ${formatDate(new Date(result.createdAt))}</p>
        </div>
        <span class="verdict-badge">${result.verdict}</span>
      </div>

      <div class="hexagram-grid">
        ${renderHexCard("本卦", result.original, result.movingLine)}
        ${renderHexCard("互卦", result.mutual)}
        ${renderHexCard("变卦", result.changed)}
      </div>

      <div class="analysis-grid">
        <div class="fact-row"><span>起卦</span><span>${escapeHtml(result.seedLabel)}</span></div>
        <div class="fact-row"><span>动爻</span><span>第 ${result.movingLine} 爻动</span></div>
        <div class="fact-row"><span>体用</span><span>体为${result.body.name}${result.body.image}属${result.body.element}，用为${result.use.name}${result.use.image}属${result.use.element}</span></div>
        <div class="fact-row"><span>生克</span><span>${result.relation.type}：${result.relation.title}</span></div>
      </div>

      <div class="reading">
        <h3>白话断语</h3>
        <ul>
          ${result.reading.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>

      <div class="ai-box">
        <button class="ai-action" id="aiButton" type="button">
          <span>AI 深断</span>
          <i></i>
        </button>
        <div class="ai-output" id="aiOutput"></div>
      </div>

      <div class="followup-panel">
        <div class="followup-head">
          <h3>继续追问</h3>
          <p>围绕当前这一卦问不懂的地方；若是新事情，建议重新起卦。</p>
        </div>
        <div class="chat-list" id="chatList"></div>
        <div class="chat-composer">
          <textarea id="followupInput" rows="2" placeholder="比如：阻碍具体指什么？我接下来该主动还是等？"></textarea>
          <button class="send-button" id="followupButton" type="button" aria-label="发送追问">
            <span></span>
          </button>
        </div>
        <p class="chat-error" id="chatError" aria-live="polite"></p>
      </div>
    </div>
  `;
  document.querySelector("#aiButton").addEventListener("click", () => requestAiReading(result));
  document.querySelector("#followupButton").addEventListener("click", () => requestFollowup(result));
  renderFollowup(result);
}

function renderHexCard(label, hexagram, movingLine = null) {
  return `
    <article class="hex-card">
      <small>${label}</small>
      <div class="lines" aria-hidden="true">
        ${hexagram.lines
          .map((line, index) => `<b class="line ${line ? "yang" : "yin"} ${movingLine === index + 1 ? "is-moving" : ""}"></b>`)
          .join("")}
      </div>
      <strong>${hexagram.name}<br />${hexagram.fullName}</strong>
    </article>
  `;
}

async function requestAiReading(result) {
  const config = window.MEI_HUA_AI_CONFIG || {};
  const button = document.querySelector("#aiButton");
  const output = document.querySelector("#aiOutput");
  const aiTarget = getAiTarget(config);

  if (!aiTarget.url) {
    output.classList.add("is-visible");
    renderAiNote(output, "AI 后端服务还没配置好。请检查服务端 .env。");
    return;
  }

  button.disabled = true;
  button.querySelector("span").textContent = "正在深断";
  output.classList.add("is-visible");
  renderAiNote(output, "正在整理卦象与问题...");

  try {
    const response = await fetch(aiTarget.url, {
      method: "POST",
      headers: aiTarget.headers,
      body: JSON.stringify({
        model: aiTarget.model,
        temperature: aiTarget.temperature,
        messages: [
          {
            role: "system",
            content:
              "你是传统梅花易数问事助手。只根据用户提供的卦象、体用、生克、动爻和问题做白话分析。不要使用 Markdown，不要输出星号、井号、粗体符号。不要宣称绝对准确，不要给医疗、法律、投资等高风险决定下定论。"
          },
          {
            role: "user",
            content: buildAiPrompt(result)
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`接口返回 ${response.status}`);
    }

    const data = await response.json();
    const content = cleanAiText(data.choices?.[0]?.message?.content?.trim() || "AI 没有返回可读内容。");
    setAiReading(result.id, content);
    renderFollowup(result);
    await typeAiOutput(output, content);
  } catch (error) {
    renderAiNote(output, `AI 请求失败：${error.message}`);
  } finally {
    button.disabled = false;
    button.querySelector("span").textContent = "AI 深断";
  }
}

async function requestFollowup(result) {
  const input = document.querySelector("#followupInput");
  const button = document.querySelector("#followupButton");
  const error = document.querySelector("#chatError");
  const question = input.value.trim();
  const config = window.MEI_HUA_AI_CONFIG || {};
  const aiTarget = getAiTarget(config);

  error.textContent = "";
  if (!question) {
    error.textContent = "先写下你要追问的点。";
    return;
  }

  if (!aiTarget.url) {
    error.textContent = "AI 后端服务还没配置好。";
    return;
  }

  const session = getAiSession(result.id);
  session.messages.push({ role: "user", content: question, createdAt: new Date().toISOString() });
  saveAiSessions();
  input.value = "";
  renderFollowup(result);

  const pending = appendChatMessage("assistant", "正在沿着这卦往下看...");
  button.disabled = true;

  try {
    const answer = await requestChatCompletion({
      ...aiTarget,
      messages: buildFollowupMessages(result, session)
    });

    pending.remove();
    session.messages.push({ role: "assistant", content: answer, createdAt: new Date().toISOString() });
    saveAiSessions();
    const messageNode = appendChatMessage("assistant", "");
    await typePlainText(messageNode.querySelector(".chat-bubble"), answer);
  } catch (errorValue) {
    pending.remove();
    error.textContent = `追问失败：${errorValue.message}`;
  } finally {
    button.disabled = false;
  }
}

async function requestChatCompletion(payload) {
  const response = await fetch(payload.url, {
    method: "POST",
    headers: payload.headers,
    body: JSON.stringify({
      model: payload.model,
      temperature: payload.temperature,
      messages: payload.messages
    })
  });

  if (!response.ok) {
    throw new Error(`接口返回 ${response.status}`);
  }

  const data = await response.json();
  return cleanAiText(data.choices?.[0]?.message?.content?.trim() || "AI 没有返回可读内容。");
}

function getAiTarget(config) {
  const proxyUrl = String(config.proxyUrl || "/api/chat/completions").trim();
  const baseUrl = String(config.baseUrl || "").replace(/\/$/, "");
  const isLocalPage = !location.hostname || location.hostname === "localhost" || location.hostname === "127.0.0.1";

  if (isLocalPage && baseUrl && config.apiKey && config.model) {
    return {
      url: baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      model: config.model,
      temperature: config.temperature ?? 0.72
    };
  }

  return {
    url: proxyUrl,
    headers: {
      "Content-Type": "application/json"
    },
    model: config.model || "",
    temperature: config.temperature ?? 0.72
  };
}

function buildFollowupMessages(result, session) {
  const recentMessages = session.messages.slice(-10).map((message) => ({
    role: message.role,
    content: message.content
  }));

  return [
    {
      role: "system",
      content:
        "你是传统梅花易数追问助手。当前卦已经起好，不要重新起卦。围绕原卦解释用户不懂的地方，给出清晰、克制、可执行的判断。若用户明显问另一个独立新事件，提醒一事一卦，建议重新起卦。不要使用 Markdown，不要输出星号、井号、粗体符号。不要宣称绝对准确，不要给医疗、法律、投资等高风险决定下定论。"
    },
    {
      role: "user",
      content: buildFollowupContext(result, session)
    },
    ...recentMessages
  ];
}

function buildFollowupContext(result, session) {
  return [
    "当前卦上下文：",
    `原问题：${result.question}`,
    `事项：${result.category}`,
    `起卦：${result.methodLabel}，${result.seedLabel}`,
    `本卦：${result.original.name}（${result.original.fullName}）`,
    `互卦：${result.mutual.name}（${result.mutual.fullName}）`,
    `变卦：${result.changed.name}（${result.changed.fullName}）`,
    `动爻：第 ${result.movingLine} 爻`,
    `体卦：${result.body.name}${result.body.image}，五行${result.body.element}`,
    `用卦：${result.use.name}${result.use.image}，五行${result.use.element}`,
    `体用关系：${result.relation.type}，${result.relation.text}`,
    session.reading ? `此前 AI 深断：${session.reading}` : "此前 AI 深断：暂无，按卦象和规则断语回答。",
    "回答要求：直接回答用户追问，不要重复完整排盘。"
  ].join("\n");
}

function renderFollowup(result) {
  const list = document.querySelector("#chatList");
  if (!list) return;

  const session = getAiSession(result.id);
  if (!session.messages.length) {
    list.innerHTML = `
      <div class="chat-empty">
        <p>可以追问“为什么这样断”“我该怎么做”“应期怎么看”。</p>
      </div>
    `;
    return;
  }

  list.innerHTML = session.messages
    .map((message) => renderChatMessage(message.role, message.content))
    .join("");
  list.scrollTop = list.scrollHeight;
}

function renderChatMessage(role, content) {
  return `
    <div class="chat-message ${role === "user" ? "is-user" : "is-assistant"}">
      <div class="chat-bubble">${escapeHtml(cleanAiText(content)).replace(/\n/g, "<br />")}</div>
    </div>
  `;
}

function appendChatMessage(role, content) {
  const list = document.querySelector("#chatList");
  const wrapper = document.createElement("div");
  wrapper.className = `chat-message ${role === "user" ? "is-user" : "is-assistant"}`;
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.textContent = content;
  wrapper.appendChild(bubble);
  list.appendChild(wrapper);
  list.scrollTop = list.scrollHeight;
  return wrapper;
}

async function typePlainText(target, text) {
  const cleaned = cleanAiText(text);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    target.textContent = cleaned;
    return;
  }

  const runId = state.aiTypingRun + 1;
  state.aiTypingRun = runId;
  target.textContent = "";
  target.classList.add("is-typing");

  const baseDelay = cleaned.length > 500 ? 8 : 12;
  for (const char of [...cleaned]) {
    if (state.aiTypingRun !== runId) return;
    target.textContent += char;
    await wait(getTypeDelay(char, baseDelay));
  }

  target.classList.remove("is-typing");
}

function renderAiNote(target, message) {
  state.aiTypingRun += 1;
  target.innerHTML = `<div class="ai-note">${escapeHtml(message)}</div>`;
}

function renderAiOutput(target, text) {
  const sections = parseAiSections(text);
  target.innerHTML = `
    <div class="ai-report">
      ${sections
        .map(
          (section, index) => `
          <article class="ai-section" style="--index: ${index}">
            <h4>${escapeHtml(section.title)}</h4>
            ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          </article>
        `
        )
        .join("")}
    </div>
  `;
}

async function typeAiOutput(target, text) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    renderAiOutput(target, text);
    return;
  }

  const runId = state.aiTypingRun + 1;
  state.aiTypingRun = runId;
  const sections = parseAiSections(text);
  const report = document.createElement("div");
  report.className = "ai-report";
  target.innerHTML = "";
  target.appendChild(report);

  const paragraphQueue = [];
  sections.forEach((section, index) => {
    const article = document.createElement("article");
    article.className = "ai-section";
    article.style.setProperty("--index", index);

    const title = document.createElement("h4");
    title.textContent = section.title;
    article.appendChild(title);

    section.paragraphs.forEach((paragraph) => {
      const paragraphNode = document.createElement("p");
      article.appendChild(paragraphNode);
      paragraphQueue.push({ node: paragraphNode, text: paragraph });
    });

    report.appendChild(article);
  });

  const totalLength = paragraphQueue.reduce((sum, item) => sum + item.text.length, 0);
  const baseDelay = totalLength > 900 ? 7 : totalLength > 500 ? 10 : 14;

  for (const item of paragraphQueue) {
    if (state.aiTypingRun !== runId) return;
    item.node.classList.add("is-typing");

    for (const char of [...item.text]) {
      if (state.aiTypingRun !== runId) return;
      item.node.textContent += char;
      await wait(getTypeDelay(char, baseDelay));
    }

    item.node.classList.remove("is-typing");
    await wait(80);
  }
}

function getTypeDelay(char, baseDelay) {
  if ("。！？".includes(char)) return baseDelay + 90;
  if ("，、；：".includes(char)) return baseDelay + 36;
  return baseDelay;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function parseAiSections(text) {
  const cleaned = normalizeAiSectionText(text);
  const pattern = new RegExp(`(?:^|\\n)[ \\t]*(?:\\d+[.、][ \\t]*)?(${AI_SECTION_PATTERN})[ \\t]*[:：]?[ \\t]*`, "g");
  const matches = [...cleaned.matchAll(pattern)];

  if (matches.length) {
    return matches.map((match, index) => {
      const start = match.index + match[0].length;
      const end = matches[index + 1]?.index ?? cleaned.length;
      return {
        title: match[1],
        paragraphs: splitAiParagraphs(cleaned.slice(start, end))
      };
    }).filter((section) => section.paragraphs.length);
  }

  return AI_SECTION_TITLES.map((title, index) => {
    const chunks = splitAiParagraphs(cleaned);
    return {
      title: index === 0 ? "AI 深断" : title,
      paragraphs: index === 0 ? chunks : []
    };
  }).filter((section) => section.paragraphs.length);
}

function splitAiParagraphs(text) {
  return cleanAiText(text)
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-]\s*/, "").replace(/^\s*\d+[.、]\s*/, "").trim())
    .filter(Boolean);
}

function normalizeAiSectionText(value) {
  let text = cleanAiText(value);
  const titleRegex = new RegExp(`(?:^|\\n)[ \\t]*(?:\\d+[.、][ \\t]*)?(${AI_SECTION_PATTERN})[ \\t]*[:：]?[ \\t]*`, "g");
  text = text.replace(titleRegex, "\n$1：");
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function cleanAiText(value) {
  let text = String(value || "").replace(/\r/g, "").trim();
  const titleRegex = new RegExp(`\\*+\\s*(${AI_SECTION_PATTERN})\\s*\\*+\\s*[:：]?`, "g");
  const trailingTitleRegex = new RegExp(`(${AI_SECTION_PATTERN})\\s*\\*+\\s*[:：]?`, "g");
  text = text
    .replace(titleRegex, "\n$1：")
    .replace(trailingTitleRegex, "\n$1：")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*[-]\s*/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text;
}

function buildAiPrompt(result) {
  return [
    `问题：${result.question}`,
    `事项：${result.category}`,
    `起卦：${result.methodLabel}，${result.seedLabel}`,
    `本卦：${result.original.name}（${result.original.fullName}）`,
    `互卦：${result.mutual.name}（${result.mutual.fullName}）`,
    `变卦：${result.changed.name}（${result.changed.fullName}）`,
    `动爻：第 ${result.movingLine} 爻`,
    `体卦：${result.body.name}${result.body.image}，五行${result.body.element}`,
    `用卦：${result.use.name}${result.use.image}，五行${result.use.element}`,
    `体用关系：${result.relation.type}，${result.relation.text}`,
    "请按以下结构输出，标题必须用中文冒号，不要使用 Markdown，不要输出星号或粗体符号：局势：、阻碍：、转机：、应对：、结果倾向：。语气直接一点，别太玄。"
  ].join("\n");
}

function getAiSession(resultId) {
  if (!state.aiSessions[resultId]) {
    state.aiSessions[resultId] = { reading: "", messages: [] };
  }
  return state.aiSessions[resultId];
}

function setAiReading(resultId, content) {
  const session = getAiSession(resultId);
  session.reading = content;
  saveAiSessions();
}

function saveAiSessions() {
  localStorage.setItem("mei-hua-ai-sessions", JSON.stringify(state.aiSessions));
}

function loadAiSessions() {
  try {
    return JSON.parse(localStorage.getItem("mei-hua-ai-sessions") || "{}");
  } catch {
    return {};
  }
}

function saveResult(result) {
  state.history = [result, ...state.history.filter((item) => item.id !== result.id)].slice(0, 50);
  localStorage.setItem("mei-hua-history", JSON.stringify(state.history));
  renderHistory();
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem("mei-hua-history") || "[]");
  } catch {
    return [];
  }
}

function renderHistory() {
  if (!state.history.length) {
    els.historyList.innerHTML = `<div class="history-item"><p>暂无记录。</p></div>`;
    return;
  }

  els.historyList.innerHTML = state.history
    .map(
      (item) => `
      <article class="history-item">
        <button type="button" data-id="${item.id}">${escapeHtml(item.question)}</button>
        <p>${item.category} · ${item.original.name}之${item.changed.name} · ${formatDate(new Date(item.createdAt))}</p>
      </article>
    `
    )
    .join("");

  els.historyList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.history.find((record) => record.id === button.dataset.id);
      if (item) {
        renderResult(item);
        setHistoryOpen(false);
      }
    });
  });
}

function setHistoryOpen(open) {
  els.historyDrawer.classList.toggle("is-open", open);
  els.historyDrawer.setAttribute("aria-hidden", String(!open));
}

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

els.categoryGroup.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  els.categoryGroup.querySelectorAll(".chip").forEach((item) => item.classList.toggle("is-active", item === button));
});

els.methodGroup.addEventListener("click", (event) => {
  const button = event.target.closest("[data-method]");
  if (!button) return;
  state.method = button.dataset.method;
  els.methodGroup.querySelectorAll(".mode").forEach((item) => item.classList.toggle("is-active", item === button));
  els.numberPanel.hidden = state.method !== "number";
});

els.castButton.addEventListener("click", () => {
  const message = validate();
  els.errorText.textContent = message;
  if (message) return;

  const question = els.question.value.trim();
  const result = state.method === "time" ? castByTime(question, state.category) : castByNumbers(question, state.category);
  renderResult(result);
  saveResult(result);
});

els.openHistory.addEventListener("click", () => setHistoryOpen(true));
els.closeHistory.addEventListener("click", () => setHistoryOpen(false));
els.clearHistory.addEventListener("click", () => {
  state.history = [];
  state.aiSessions = {};
  localStorage.removeItem("mei-hua-history");
  localStorage.removeItem("mei-hua-ai-sessions");
  renderHistory();
});

renderHistory();
