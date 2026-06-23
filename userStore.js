const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const SESSION_DAYS = 30;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "app-data.json");
const CAST_COOLDOWN_ENABLED = String(process.env.CAST_COOLDOWN_ENABLED || "").toLowerCase() === "true";

function readData() {
  try {
    return normalizeData(JSON.parse(fs.readFileSync(DATA_FILE, "utf8")));
  } catch {
    return normalizeData({});
  }
}

function normalizeData(data) {
  return {
    users: Array.isArray(data.users) ? data.users : [],
    profiles: Array.isArray(data.profiles) ? data.profiles : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    dailyOracles: Array.isArray(data.dailyOracles) ? data.dailyOracles : [],
    divinationRecords: Array.isArray(data.divinationRecords) ? data.divinationRecords : []
  };
}

function writeData(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function publicUser(user) {
  return {
    id: user.id,
    phone: user.phone,
    personalInfo: normalizePersonalInfo(user.personalInfo),
    createdAt: user.createdAt
  };
}

function normalizePersonalInfo(value = {}) {
  return {
    name: String(value.name || "").trim().slice(0, 30),
    birthDate: /^\d{4}-\d{2}-\d{2}$/.test(String(value.birthDate || "")) ? String(value.birthDate) : "",
    birthTime: /^\d{2}:\d{2}$/.test(String(value.birthTime || "")) ? String(value.birthTime) : "12:00",
    note: String(value.note || "").trim().slice(0, 240)
  };
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\s+/g, "");
}

function validatePassword(password) {
  return String(password || "").length >= 6;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, user) {
  const input = hashPassword(password, user.passwordSalt);
  return crypto.timingSafeEqual(Buffer.from(input.hash, "hex"), Buffer.from(user.passwordHash, "hex"));
}

function createToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function createSession(data, userId) {
  const token = createToken();
  const now = Date.now();
  const session = {
    token,
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  };
  data.sessions = data.sessions.filter((item) => new Date(item.expiresAt).getTime() > now);
  data.sessions.push(session);
  return session;
}

function register({ phone, password }) {
  const data = readData();
  const normalizedPhone = normalizePhone(phone);
  if (!/^1\d{10}$/.test(normalizedPhone)) {
    return { error: "请输入 11 位手机号。" };
  }
  if (!validatePassword(password)) {
    return { error: "密码至少 6 位。" };
  }
  if (data.users.some((item) => item.phone === normalizedPhone)) {
    return { error: "这个手机号已经注册，请直接登录。" };
  }

  const passwordData = hashPassword(password);
  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    phone: normalizedPhone,
    passwordSalt: passwordData.salt,
    passwordHash: passwordData.hash,
    currentProfileId: "",
    personalInfo: normalizePersonalInfo({ name: "我自己" }),
    createdAt: now
  };
  const profile = {
    id: crypto.randomUUID(),
    userId: user.id,
    name: "我自己",
    relation: "本人",
    note: "",
    createdAt: now
  };
  user.currentProfileId = profile.id;
  data.users.push(user);
  data.profiles.push(profile);
  const session = createSession(data, user.id);
  writeData(data);

  return {
    token: session.token,
    user: publicUser(user)
  };
}

function login({ phone, password }) {
  const data = readData();
  const normalizedPhone = normalizePhone(phone);
  const user = data.users.find((item) => item.phone === normalizedPhone);
  if (!user || !verifyPassword(password, user)) {
    return { error: "手机号或密码不正确。" };
  }

  const session = createSession(data, user.id);
  writeData(data);

  return {
    token: session.token,
    user: publicUser(user)
  };
}

function getUserByToken(token) {
  const data = readData();
  const session = data.sessions.find((item) => item.token === token);
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    return { error: "登录已失效，请重新登录。" };
  }
  const user = data.users.find((item) => item.id === session.userId);
  if (!user) return { error: "用户不存在。" };
  return { data, user };
}

function getCurrentProfile(data, user) {
  return data.profiles.find((item) => item.userId === user.id && item.id === user.currentProfileId)
    || data.profiles.find((item) => item.userId === user.id)
    || null;
}

function getShanghaiDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function getMe(token) {
  const auth = getUserByToken(token);
  if (auth.error) return auth;
  return {
    user: publicUser(auth.user)
  };
}

function updatePersonalInfo(token, payload) {
  const auth = getUserByToken(token);
  if (auth.error) return auth;

  auth.user.personalInfo = normalizePersonalInfo(payload);
  writeData(auth.data);
  return {
    user: publicUser(auth.user)
  };
}

function getPersonalMemory(token) {
  const auth = getUserByToken(token);
  if (auth.error) return auth;

  const profile = getCurrentProfile(auth.data, auth.user);
  if (!profile) return { error: "账号初始化失败，请重新登录或注册。" };

  return {
    memory: buildPersonalMemory(auth.data, auth.user, profile)
  };
}

function castDailyOracle(token, payload, castFn) {
  const auth = getUserByToken(token);
  if (auth.error) return auth;

  const profile = getCurrentProfile(auth.data, auth.user);
  if (!profile) return { error: "账号初始化失败，请重新登录或注册。" };

  const dateKey = getShanghaiDateKey();
  const existing = auth.data.dailyOracles.find((item) =>
    item.userId === auth.user.id
    && item.dateKey === dateKey
  );
  if (existing) return { ...existing.result, reused: true };

  const result = castFn({
    ...payload,
    profile: String(payload.profile || profile.name || "").trim(),
    personalInfo: String(payload.personalInfo || profile.note || "").trim()
  });
  auth.data.dailyOracles.push({
    id: crypto.randomUUID(),
    userId: auth.user.id,
    profileId: profile.id,
    dateKey,
    result,
    createdAt: new Date().toISOString()
  });
  writeData(auth.data);
  return result;
}

function castDivination(token, payload, castFn) {
  const auth = getUserByToken(token);
  if (auth.error) return auth;

  const profile = getCurrentProfile(auth.data, auth.user);
  if (!profile) return { error: "账号初始化失败，请重新登录或注册。" };

  const now = Date.now();
  const recent = auth.data.divinationRecords
    .filter((item) => item.userId === auth.user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  if (CAST_COOLDOWN_ENABLED && recent) {
    const nextAt = new Date(recent.createdAt).getTime() + 60 * 60 * 1000;
    if (nextAt > now) {
      const minutes = Math.ceil((nextAt - now) / 60000);
      return { error: `同一账号问事建议一小时后再问，还需约 ${minutes} 分钟。` };
    }
  }

  const output = castFn(payload);
  if (output.error) return output;

  auth.data.divinationRecords.push({
    id: crypto.randomUUID(),
    userId: auth.user.id,
    profileId: profile.id,
    resultId: output.result.id,
    question: output.result.question,
    category: output.result.category,
    method: payload.method || payload.oracleType || output.result.type,
    methodLabel: output.result.methodLabel,
    verdict: output.result.verdict,
    summary: output.result.summary,
    tags: Array.isArray(output.result.tags) ? output.result.tags : [],
    createdAt: output.result.createdAt || new Date().toISOString()
  });
  writeData(auth.data);
  return output;
}

function buildPersonalMemory(data, user, profile) {
  const records = data.divinationRecords
    .filter((item) => item.userId === user.id && item.profileId === profile.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const dailyRecords = data.dailyOracles
    .filter((item) => item.userId === user.id && item.profileId === profile.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const categoryStats = countBy(records.map((item) => item.category).filter(Boolean));
  const methodStats = countBy(records.map((item) => item.methodLabel || item.method).filter(Boolean));
  const tagStats = countBy(records.flatMap((item) => Array.isArray(item.tags) ? item.tags : []));
  const recentRecords = records.slice(0, 12);
  const recentDaily = dailyRecords.slice(0, 5).map((item) => item.result).filter(Boolean);
  const totalQuestions = records.length + dailyRecords.length;
  const focus = categoryStats[0]?.label || tagStats[0]?.label || "尚未形成稳定主题";
  const riskSignals = collectSignals([...recentRecords, ...recentDaily], "risk");
  const opportunitySignals = collectSignals([...recentRecords, ...recentDaily], "opportunity");
  const notices = buildPersonalNotices({ totalQuestions, focus, riskSignals, opportunitySignals, recentRecords, recentDaily, user });

  return {
    profile: {
      id: profile.id,
      name: profile.name || user.personalInfo?.name || "我自己",
      relation: profile.relation || "本人",
      birthDate: user.personalInfo?.birthDate || "",
      birthTime: user.personalInfo?.birthTime || "12:00",
      note: user.personalInfo?.note || profile.note || ""
    },
    totalQuestions,
    focus,
    categoryStats,
    methodStats,
    tagStats,
    memoryText: buildMemoryText({ totalQuestions, focus, categoryStats, methodStats, riskSignals, opportunitySignals }),
    recentSignals: recentRecords.slice(0, 6).map((item) => ({
      id: item.resultId || item.id,
      title: item.question || item.summary || "未命名问卜",
      method: item.methodLabel || item.method || "问卜",
      verdict: item.verdict || "",
      summary: item.summary || "",
      createdAt: item.createdAt
    })),
    notices,
    updatedAt: new Date().toISOString()
  };
}

function countBy(values) {
  const counts = new Map();
  for (const value of values) {
    const label = String(value || "").trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6);
}

function collectSignals(items, type) {
  const keywords = type === "risk"
    ? ["阻", "缓", "拖", "空", "赤口", "口舌", "争", "破", "落空", "避", "守", "不宜", "反复"]
    : ["顺", "吉", "喜", "开", "生门", "小吉", "速喜", "可", "推进", "贵人", "有回应", "机会"];
  return items
    .map((item) => ({
      title: item.question || item.summary || item.sign?.name || "近期问卜",
      method: item.methodLabel || item.type || "问卜",
      text: [item.verdict, item.summary, item.sign?.fortune, item.sign?.advice, ...(Array.isArray(item.reading) ? item.reading : [])].filter(Boolean).join(" ")
    }))
    .filter((item) => keywords.some((keyword) => item.text.includes(keyword)))
    .slice(0, 4);
}

function buildPersonalNotices({ totalQuestions, focus, riskSignals, opportunitySignals, recentRecords, recentDaily, user }) {
  const notices = [];
  if (!user.personalInfo?.birthDate) {
    notices.push({
      level: "warning",
      title: "个人盘资料还不完整",
      body: "先补出生日期，个人盘才能把长期背景和近期问卜放在一起看。",
      source: "profile"
    });
  }
  if (totalQuestions < 3) {
    notices.push({
      level: "info",
      title: "记忆正在建立",
      body: "多问几次后，我会更清楚你最近反复关心的主题和节奏。",
      source: "memory"
    });
  }
  if (riskSignals.length) {
    notices.push({
      level: "risk",
      title: `${focus}近期要留意阻滞`,
      body: `最近结果里多次出现偏缓、反复或需避险的信号，先把承诺、钱款、沟通边界确认清楚。`,
      source: "risk"
    });
  }
  if (opportunitySignals.length) {
    notices.push({
      level: "good",
      title: `${focus}有可推进窗口`,
      body: "近期结果里有顺势、回应或可行动的信号，适合小步验证，不要一次押满。",
      source: "opportunity"
    });
  }
  if (recentRecords.length || recentDaily.length) {
    notices.push({
      level: "info",
      title: "今日主动提醒",
      body: "如果今天要做决定，优先参考最近一次同类问题；新事情仍建议重新问卜。",
      source: "today"
    });
  }
  return notices.slice(0, 4);
}

function buildMemoryText({ totalQuestions, focus, categoryStats, methodStats, riskSignals, opportunitySignals }) {
  if (!totalQuestions) {
    return "还没有形成个人盘记忆。先补个人信息，再完成几次问卜，我会逐步总结你的关注主题、常见阻碍和可行动窗口。";
  }
  const categories = categoryStats.length ? `常问主题偏向 ${categoryStats.map((item) => `${item.label}${item.count}次`).join("、")}` : "主题还比较分散";
  const methods = methodStats.length ? `常用方式为 ${methodStats.map((item) => `${item.label}${item.count}次`).join("、")}` : "";
  const risk = riskSignals.length ? "近期有需要放慢、核实或避开冲突的信号。" : "近期暂未形成明显风险信号。";
  const good = opportunitySignals.length ? "同时也出现可小步推进的窗口。" : "机会信号还需要更多记录确认。";
  return [`已累计 ${totalQuestions} 条个人记录，当前焦点是「${focus}」。`, categories, methods, risk, good].filter(Boolean).join(" ");
}

module.exports = {
  castDailyOracle,
  castDivination,
  getPersonalMemory,
  getMe,
  login,
  register,
  updatePersonalInfo,
};
