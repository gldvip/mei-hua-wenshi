const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const webpush = require("web-push");
const { castDivination } = require("./divination");
const { castDailyOracle } = require("./dailyOracle");
const { castAdvancedDivination } = require("./advancedDivination");
const userStore = require("./userStore");

const PORT = Number(process.env.PORT || 8787);
const MAX_BODY_SIZE = 1024 * 1024;
const MINI_PROGRAM_REVIEW_MODE = String(process.env.MINI_PROGRAM_REVIEW_MODE || "").toLowerCase() === "true";
const DATA_DIR = path.dirname(process.env.DATA_FILE || path.join(__dirname, "app-data.json"));
const VAPID_KEY_FILE = process.env.VAPID_KEY_FILE || path.join(DATA_DIR, "vapid-keys.json");
let cachedVapidKeys = null;

function getAiEndpoint() {
  const baseUrl = String(process.env.AI_BASE_URL || "").replace(/\/$/, "");
  if (!baseUrl) return "";
  return baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function getVapidKeys() {
  if (cachedVapidKeys) return cachedVapidKeys;
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    cachedVapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY
    };
  } else {
    try {
      cachedVapidKeys = JSON.parse(fs.readFileSync(VAPID_KEY_FILE, "utf8"));
    } catch {
      cachedVapidKeys = webpush.generateVAPIDKeys();
      fs.mkdirSync(path.dirname(VAPID_KEY_FILE), { recursive: true });
      fs.writeFileSync(VAPID_KEY_FILE, JSON.stringify(cachedVapidKeys, null, 2));
    }
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@wenshi.cccode.com.cn",
    cachedVapidKeys.publicKey,
    cachedVapidKeys.privateKey
  );
  return cachedVapidKeys;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = "";

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new Error("请求内容过大"));
        request.destroy();
        return;
      }
      body += chunk;
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function pickMessages(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((message) => message && ["system", "user", "assistant"].includes(message.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").slice(0, 12000)
    }))
    .filter((message) => message.content);
}

async function requestAiCompletion({ messages, temperature = 0.72 }) {
  const endpoint = getAiEndpoint();
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!endpoint || !apiKey || !model) {
    throw new Error("AI 服务端配置未填写完整。");
  }

  const upstreamPayload = {
    model,
    temperature: Number(process.env.AI_TEMPERATURE || temperature),
    messages
  };

  const upstream = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(upstreamPayload)
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    let message = text;
    try {
      message = JSON.parse(text).error?.message || JSON.parse(text).error || text;
    } catch {}
    throw new Error(String(message || `AI 接口返回 ${upstream.status}`).slice(0, 300));
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("AI 返回不是有效 JSON。");
  }
}

async function handleChatCompletion(request, response) {
  if (!getAiEndpoint() || !process.env.AI_API_KEY || !process.env.AI_MODEL) {
    sendJson(response, 500, { error: "AI 服务端配置未填写完整。" });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(request));
  } catch (error) {
    sendJson(response, 400, { error: error.message || "请求体不是有效 JSON。" });
    return;
  }

  const messages = pickMessages(payload.messages);
  if (!messages.length) {
    sendJson(response, 400, { error: "缺少可用的 messages。" });
    return;
  }

  try {
    const data = await requestAiCompletion({ messages, temperature: payload.temperature || 0.72 });
    sendJson(response, 200, data);
  } catch (error) {
    sendJson(response, 502, { error: `AI 上游请求失败：${error.message}` });
  }
}

function extractJsonObject(text) {
  const raw = String(text || "").trim();
  try {
    return JSON.parse(raw);
  } catch {}
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {}
  }
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {}
  }
  return null;
}

function normalizeOnboardingMessages(value) {
  return pickMessages(value).slice(-12).map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content.slice(0, 1200)
  }));
}

function fallbackProfileOnboarding({ messages, currentInfo }) {
  const joined = messages.map((message) => message.content).join("\n");
  const info = {
    name: currentInfo.name || "",
    birthDate: currentInfo.birthDate || "",
    birthTime: currentInfo.birthTime || "12:00",
    birthCalendar: currentInfo.birthCalendar || "solar",
    gender: currentInfo.gender || "unknown",
    birthPlace: currentInfo.birthPlace || "",
    currentCity: currentInfo.currentCity || "",
    focusAreas: Array.isArray(currentInfo.focusAreas) ? currentInfo.focusAreas : [],
    note: currentInfo.note || ""
  };
  const dateMatch = joined.match(/(19|20)\d{2}[-/.年](0?[1-9]|1[0-2])[-/.月](0?[1-9]|[12]\d|3[01])/);
  if (dateMatch && !info.birthDate) {
    info.birthDate = `${dateMatch[0].match(/(19|20)\d{2}/)[0]}-${String(dateMatch[2]).padStart(2, "0")}-${String(dateMatch[3]).padStart(2, "0")}`;
  }
  const timeMatch = joined.match(/([01]?\d|2[0-3])[:点时]([0-5]\d)?/);
  if (timeMatch) info.birthTime = `${String(timeMatch[1]).padStart(2, "0")}:${String(timeMatch[2] || "00").padStart(2, "0")}`;

  const missing = [];
  if (!info.name) missing.push("称呼");
  if (!info.birthDate) missing.push("出生日期");
  if (!info.currentCity) missing.push("常住城市");
  if (!info.note) missing.push("近期状态");

  return {
    reply: missing.length
      ? `我先帮你建个人盘。请告诉我：${missing.slice(0, 2).join("、")}。如果出生时间不确定，可以说大概时辰。`
      : "基本资料已经够用了，你可以先保存；后面问卜越多，我会继续补充记忆。",
    done: missing.length === 0,
    missing,
    personalInfo: info
  };
}

async function handleProfileOnboarding(request, response) {
  const auth = userStore.getMe(getBearerToken(request));
  if (auth.error) {
    sendJson(response, 401, { error: auth.error });
    return;
  }

  const payload = await readJsonPayload(request, response);
  if (!payload) return;

  const messages = normalizeOnboardingMessages(payload.messages);
  const currentInfo = auth.user.personalInfo || {};
  if (!messages.length && !getAiEndpoint()) {
    sendJson(response, 200, fallbackProfileOnboarding({ messages, currentInfo }));
    return;
  }

  try {
    const data = await requestAiCompletion({
      temperature: 0.45,
      messages: [
        {
          role: "system",
          content:
            "你是玄问临占的个人盘建档助手。目标是用自然、克制的中文对话收集占卜所需个人资料：称呼、阳历/农历出生日期、出生时间或大概时辰、性别/称谓偏好、出生地、常住地、近期主要关注领域和一两句当前状态。一次最多问两个问题，不要像表格审问。每次必须只返回 JSON，不要 markdown：{\"reply\":\"下一句要对用户说的话\",\"done\":false,\"missing\":[\"还缺的字段\"],\"personalInfo\":{\"name\":\"\",\"birthDate\":\"YYYY-MM-DD 或空\",\"birthTime\":\"HH:mm 或 12:00\",\"birthCalendar\":\"solar|lunar|unknown\",\"gender\":\"male|female|other|unknown\",\"birthPlace\":\"\",\"currentCity\":\"\",\"focusAreas\":[\"事业\"],\"note\":\"不超过120字的自然摘要\"}}。如果信息足够用于个人盘，done=true。不要编造用户没说的信息。"
        },
        {
          role: "user",
          content: `当前已保存资料：${JSON.stringify(currentInfo)}`
        },
        ...messages
      ]
    });
    const content = data.choices?.[0]?.message?.content || "";
    const parsed = extractJsonObject(content);
    if (!parsed?.reply || !parsed.personalInfo) {
      sendJson(response, 200, fallbackProfileOnboarding({ messages, currentInfo }));
      return;
    }
    sendJson(response, 200, {
      reply: String(parsed.reply || "").slice(0, 500),
      done: Boolean(parsed.done),
      missing: Array.isArray(parsed.missing) ? parsed.missing.map((item) => String(item).slice(0, 30)).slice(0, 8) : [],
      personalInfo: parsed.personalInfo
    });
  } catch (error) {
    sendJson(response, 200, fallbackProfileOnboarding({ messages, currentInfo }));
  }
}

async function handleCastDivination(request, response) {
  let payload;
  try {
    payload = JSON.parse(await readBody(request));
  } catch (error) {
    sendJson(response, 400, { error: error.message || "请求体不是有效 JSON。" });
    return;
  }

  const output = userStore.castDivination(getBearerToken(request), payload, castDivination);
  if (output.error) {
    sendJson(response, output.error.includes("登录") ? 401 : 400, { error: output.error });
    return;
  }

  sendJson(response, 200, output.result);
}

async function handleCastDailyOracle(request, response) {
  let payload;
  try {
    payload = JSON.parse(await readBody(request));
  } catch (error) {
    sendJson(response, 400, { error: error.message || "请求体不是有效 JSON。" });
    return;
  }

  const output = userStore.castDailyOracle(getBearerToken(request), payload, castDailyOracle);
  sendJson(response, output.error ? 401 : 200, output);
}

async function handleCastAdvancedDivination(request, response) {
  let payload;
  try {
    payload = JSON.parse(await readBody(request));
  } catch (error) {
    sendJson(response, 400, { error: error.message || "请求体不是有效 JSON。" });
    return;
  }

  const output = userStore.castDivination(getBearerToken(request), payload, castAdvancedDivination);
  if (output.error) {
    sendJson(response, output.error.includes("登录") ? 401 : 400, { error: output.error });
    return;
  }

  sendJson(response, 200, output.result);
}

async function readJsonPayload(request, response) {
  try {
    return JSON.parse(await readBody(request));
  } catch (error) {
    sendJson(response, 400, { error: error.message || "请求体不是有效 JSON。" });
    return null;
  }
}

function getBearerToken(request) {
  const authorization = request.headers.authorization || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
}

async function handleAuth(request, response, action) {
  const payload = await readJsonPayload(request, response);
  if (!payload) return;
  const output = action(payload);
  sendJson(response, output.error ? 400 : 200, output);
}

async function handleUpdatePersonalInfo(request, response) {
  const payload = await readJsonPayload(request, response);
  if (!payload) return;
  const output = userStore.updatePersonalInfo(getBearerToken(request), payload);
  sendJson(response, output.error ? 401 : 200, output);
}

function handlePersonalMemory(request, response) {
  const output = userStore.getPersonalMemory(getBearerToken(request));
  sendJson(response, output.error ? 401 : 200, output);
}

async function handlePushSubscribe(request, response) {
  const payload = await readJsonPayload(request, response);
  if (!payload) return;
  const output = userStore.savePushSubscription(getBearerToken(request), payload);
  sendJson(response, output.error ? 401 : 200, output);
}

async function handlePushUnsubscribe(request, response) {
  const payload = await readJsonPayload(request, response);
  if (!payload) return;
  const output = userStore.removePushSubscription(getBearerToken(request), payload);
  sendJson(response, output.error ? 401 : 200, output);
}

function buildPushReminder(memory) {
  const notice = memory?.notices?.[0];
  if (notice) {
    return {
      title: notice.title || "玄问临占提醒",
      body: notice.body || "你的个人盘有新的主动提醒。",
      url: "/"
    };
  }
  return {
    title: "玄问临占提醒已开启",
    body: "之后个人盘形成新的提醒时，可以通过浏览器通知发给你。",
    url: "/"
  };
}

async function sendPushMessage(record, message, data) {
  try {
    await webpush.sendNotification(record.subscription, JSON.stringify(message));
    return { ok: true };
  } catch (error) {
    if ([404, 410].includes(error.statusCode)) {
      userStore.removePushSubscriptionByEndpoint(data, record.subscription?.endpoint);
    }
    return { ok: false, error: error.message || "发送失败" };
  }
}

async function handlePushTest(request, response) {
  getVapidKeys();
  const output = userStore.getPushSubscriptions(getBearerToken(request));
  if (output.error) {
    sendJson(response, 401, { error: output.error });
    return;
  }
  if (!output.subscriptions.length) {
    sendJson(response, 400, { error: "当前设备还没有开启推送。" });
    return;
  }
  const memoryOutput = userStore.getPersonalMemory(getBearerToken(request));
  const message = buildPushReminder(memoryOutput.memory);
  const results = await Promise.all(output.subscriptions.map((record) => sendPushMessage(record, message, output.data)));
  sendJson(response, 200, {
    sent: results.filter((item) => item.ok).length,
    failed: results.filter((item) => !item.ok).length
  });
}

const server = http.createServer(async (request, response) => {
  const { pathname } = new URL(request.url, "http://localhost");

  if (request.method === "GET" && pathname === "/api/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && pathname === "/api/app-config") {
    sendJson(response, 200, {
      miniProgramReviewMode: MINI_PROGRAM_REVIEW_MODE
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/register") {
    await handleAuth(request, response, userStore.register);
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/login") {
    await handleAuth(request, response, userStore.login);
    return;
  }

  if (request.method === "GET" && pathname === "/api/auth/me") {
    const output = userStore.getMe(getBearerToken(request));
    sendJson(response, output.error ? 401 : 200, output);
    return;
  }

  if (request.method === "POST" && pathname === "/api/user/info") {
    await handleUpdatePersonalInfo(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/onboarding/profile") {
    await handleProfileOnboarding(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/personal-memory") {
    handlePersonalMemory(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/push/public-key") {
    sendJson(response, 200, { publicKey: getVapidKeys().publicKey });
    return;
  }

  if (request.method === "POST" && pathname === "/api/push/subscribe") {
    await handlePushSubscribe(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/push/unsubscribe") {
    await handlePushUnsubscribe(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/push/test") {
    await handlePushTest(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/chat/completions") {
    await handleChatCompletion(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/divination/cast") {
    await handleCastDivination(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/daily-oracle/cast") {
    await handleCastDailyOracle(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/oracle/cast") {
    await handleCastAdvancedDivination(request, response);
    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`AI proxy listening on ${PORT}`);
});
