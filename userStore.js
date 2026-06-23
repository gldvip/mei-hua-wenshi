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
    createdAt: output.result.createdAt || new Date().toISOString()
  });
  writeData(auth.data);
  return output;
}

module.exports = {
  castDailyOracle,
  castDivination,
  getMe,
  login,
  register,
  updatePersonalInfo,
};
