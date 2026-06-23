const AI_SECTION_TITLES = ["局势", "阻碍", "转机", "应对", "结果倾向"];
const AI_SECTION_PATTERN = AI_SECTION_TITLES.join("|");

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
  castFromServer();
});

async function castFromServer() {
  const message = validate();
  els.errorText.textContent = message;
  if (message) return;

  els.castButton.disabled = true;
  els.castButton.querySelector("span").textContent = "正在起卦";

  try {
    const response = await fetch("/api/divination/cast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(getCastPayload())
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `接口返回 ${response.status}`);
    }

    renderResult(data);
    saveResult(data);
  } catch (error) {
    els.errorText.textContent = `起卦失败：${error.message}`;
  } finally {
    els.castButton.disabled = false;
    els.castButton.querySelector("span").textContent = "起卦问事";
  }
}

function getCastPayload() {
  return {
    question: els.question.value.trim(),
    category: state.category,
    method: state.method,
    numbers: {
      a: els.numA.value,
      b: els.numB.value,
      c: els.numC.value
    }
  };
}

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
