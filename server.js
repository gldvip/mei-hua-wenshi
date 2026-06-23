const http = require("node:http");
const { castDivination } = require("./divination");
const { castDailyOracle } = require("./dailyOracle");
const { castAdvancedDivination } = require("./advancedDivination");
const userStore = require("./userStore");

const PORT = Number(process.env.PORT || 8787);
const MAX_BODY_SIZE = 1024 * 1024;
const MINI_PROGRAM_REVIEW_MODE = String(process.env.MINI_PROGRAM_REVIEW_MODE || "").toLowerCase() === "true";

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

async function handleChatCompletion(request, response) {
  const endpoint = getAiEndpoint();
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!endpoint || !apiKey || !model) {
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

  const upstreamPayload = {
    model,
    temperature: Number(process.env.AI_TEMPERATURE || payload.temperature || 0.72),
    messages
  };

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(upstreamPayload)
    });

    const text = await upstream.text();
    response.writeHead(upstream.status, {
      "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    response.end(text);
  } catch (error) {
    sendJson(response, 502, { error: `AI 上游请求失败：${error.message}` });
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

  if (request.method === "GET" && pathname === "/api/personal-memory") {
    handlePersonalMemory(request, response);
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
