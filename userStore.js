const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "app-data.json");
const SESSION_DAYS = 30;

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
    currentProfileId: user.currentProfileId || "",
    createdAt: user.createdAt
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
    user: publicUser(user),
    profiles: [profile]
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
    user: publicUser(user),
    profiles: getProfilesForUser(data, user.id)
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

function getProfilesForUser(data, userId) {
  return data.profiles.filter((item) => item.userId === userId);
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
    user: publicUser(auth.user),
    profiles: getProfilesForUser(auth.data, auth.user.id)
  };
}

function createProfile(token, payload) {
  const auth = getUserByToken(token);
  if (auth.error) return auth;

  const name = String(payload.name || "").trim();
  if (!name) return { error: "请填写档案名称。" };
  const now = new Date().toISOString();
  const profile = {
    id: crypto.randomUUID(),
    userId: auth.user.id,
    name: name.slice(0, 30),
    relation: String(payload.relation || "").trim().slice(0, 30),
    note: String(payload.note || "").trim().slice(0, 200),
    createdAt: now
  };
  auth.data.profiles.push(profile);
  auth.user.currentProfileId = profile.id;
  writeData(auth.data);
  return {
    user: publicUser(auth.user),
    profiles: getProfilesForUser(auth.data, auth.user.id)
  };
}

function setCurrentProfile(token, profileId) {
  const auth = getUserByToken(token);
  if (auth.error) return auth;

  const profile = auth.data.profiles.find((item) => item.userId === auth.user.id && item.id === profileId);
  if (!profile) return { error: "档案不存在。" };
  auth.user.currentProfileId = profile.id;
  writeData(auth.data);
  return {
    user: publicUser(auth.user),
    profiles: getProfilesForUser(auth.data, auth.user.id)
  };
}

function castDailyOracle(token, payload, castFn) {
  const auth = getUserByToken(token);
  if (auth.error) return auth;

  const profile = getCurrentProfile(auth.data, auth.user);
  if (!profile) return { error: "请先创建问卜档案。" };

  const dateKey = getShanghaiDateKey();
  const existing = auth.data.dailyOracles.find((item) =>
    item.userId === auth.user.id
    && item.profileId === profile.id
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
  if (!profile) return { error: "请先创建问卜档案。" };

  const now = Date.now();
  const recent = auth.data.divinationRecords
    .filter((item) => item.userId === auth.user.id && item.profileId === profile.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  if (recent) {
    const nextAt = new Date(recent.createdAt).getTime() + 60 * 60 * 1000;
    if (nextAt > now) {
      const minutes = Math.ceil((nextAt - now) / 60000);
      return { error: `同一档案梅花问事建议一小时后再问，还需约 ${minutes} 分钟。` };
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
    method: payload.method,
    createdAt: output.result.createdAt || new Date().toISOString()
  });
  writeData(auth.data);
  return output;
}

module.exports = {
  castDailyOracle,
  castDivination,
  createProfile,
  getMe,
  login,
  register,
  setCurrentProfile
};
