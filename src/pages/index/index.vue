<template>
  <view class="page-shell">
    <view class="topbar">
      <view>
        <text class="eyebrow">MEI HUA WEN SHI</text>
        <text class="title">玄问临占</text>
      </view>
      <button class="icon-button" aria-label="打开记录" @click="setHistoryOpen(true)">
        <text class="menu-line"></text>
        <text class="menu-line"></text>
        <text class="menu-line"></text>
      </button>
    </view>

    <view v-if="!user" class="auth-panel">
      <view class="panel-head">
        <view>
          <text class="panel-kicker">ACCOUNT</text>
          <text class="panel-title">{{ authMode === "login" ? "登录后使用" : "注册账号" }}</text>
        </view>
      </view>
      <view class="field">
        <text class="label">手机号</text>
        <input v-model="authPhone" class="number-input" type="number" placeholder="请输入 11 位手机号" />
      </view>
      <view class="field">
        <text class="label">密码</text>
        <input v-model="authPassword" class="number-input" password placeholder="至少 6 位" />
      </view>
      <text class="error-text">{{ authError }}</text>
      <button class="primary-action" :disabled="authLoading" @click="submitAuth">
        <text>{{ authLoading ? "处理中" : authMode === "login" ? "登录" : "注册并登录" }}</text>
        <text class="arrow-line"></text>
      </button>
      <button class="plain-wide-button" @click="toggleAuthMode">
        {{ authMode === "login" ? "还没有账号，去注册" : "已有账号，去登录" }}
      </button>
    </view>

    <template v-else>
    <view class="mobile-command-bar">
      <view class="mobile-tabs">
        <button
          v-for="item in sectionTabs"
          :key="item.key"
          class="mobile-tab"
          :class="{ 'is-active': activeSection === item.key }"
          @click="activeSection = item.key"
        >
          {{ item.label }}
        </button>
      </view>
      <view class="mobile-tag-strip">
        <button
          v-for="tag in quickTags"
          :key="tag.label"
          class="tag-chip compact"
          :class="{ 'is-active': selectedTags.includes(tag.label) }"
          @click="toggleTag(tag)"
        >
          {{ tag.label }}
        </button>
      </view>
    </view>

    <view class="profile-panel mobile-section" :class="{ 'is-active': activeSection === 'profile' }">
      <view class="panel-head">
        <view>
          <text class="panel-kicker">PROFILE</text>
          <text class="panel-title">当前档案</text>
        </view>
        <button class="plain-button" @click="logout">退出</button>
      </view>
      <view class="current-profile">
        <text class="profile-name">{{ currentProfile?.name || "未选择" }}</text>
        <text class="meta">{{ currentProfile?.relation || "切换问卜对象" }}{{ currentProfile?.note ? ` · ${currentProfile.note}` : "" }}</text>
      </view>
      <view class="profile-list">
        <button
          v-for="profile in profiles"
          :key="profile.id"
          class="profile-chip"
          :class="{ 'is-active': profile.id === user.currentProfileId }"
          @click="switchProfile(profile.id)"
        >
          {{ profile.name }}
        </button>
      </view>
      <view class="add-profile">
        <view class="daily-extra-grid">
          <view class="field compact">
            <text class="label">新增档案</text>
            <input v-model="newProfileName" class="number-input" placeholder="如 某合作方" />
          </view>
          <view class="field compact">
            <text class="label">关系</text>
            <input v-model="newProfileRelation" class="number-input" placeholder="如 合作方" />
          </view>
        </view>
        <view class="field compact">
          <text class="label">备注</text>
          <input v-model="newProfileNote" class="number-input" placeholder="可选：行业、背景、当前状态" />
        </view>
        <button class="plain-wide-button" :disabled="profileLoading" @click="createProfile">新增并切换</button>
        <text class="error-text">{{ profileError }}</text>
      </view>
    </view>

    <view class="tag-panel">
      <view class="panel-head slim-head">
        <view>
          <text class="panel-kicker">TAGS</text>
          <text class="panel-title">问卜标签</text>
        </view>
        <button class="plain-button small" @click="clearTags">清空</button>
      </view>
      <view class="tag-list">
        <button
          v-for="tag in quickTags"
          :key="tag.label"
          class="tag-chip"
          :class="{ 'is-active': selectedTags.includes(tag.label) }"
          @click="toggleTag(tag)"
        >
          {{ tag.label }}
        </button>
      </view>
    </view>

    <view class="daily-panel mobile-section" :class="{ 'is-active': activeSection === 'daily' }">
      <view class="panel-head">
        <view>
          <text class="panel-kicker">TODAY</text>
          <text class="panel-title">今日问卜</text>
        </view>
        <text class="daily-limit">{{ dailyOracle ? "今日已定" : "一日一签" }}</text>
      </view>

      <view class="field">
        <text class="label">今日所问</text>
        <textarea
          v-model="dailyQuestion"
          class="question-input daily-input"
          placeholder="可写具体一问，也可留空看今日总体。"
          :maxlength="-1"
          :disabled="Boolean(dailyOracle)"
        />
      </view>

      <view class="daily-extra-grid">
        <view class="field compact">
          <text class="label">当前对象</text>
          <input v-model="dailyProfile" class="number-input" placeholder="如 我自己" :disabled="Boolean(dailyOracle)" />
        </view>
        <view class="field compact">
          <text class="label">地点</text>
          <input v-model="dailyLocation" class="number-input" placeholder="如 上海" :disabled="Boolean(dailyOracle)" />
        </view>
      </view>

      <view class="field compact">
        <text class="label">个人信息</text>
        <input v-model="dailyPersonalInfo" class="number-input" placeholder="可选：出生年、关系、当前状态" :disabled="Boolean(dailyOracle)" />
      </view>

      <view class="shake-stage" :class="{ 'is-shaking': dailyDrawing, 'has-result': dailyOracle }">
        <view class="tube">
          <text class="stick one"></text>
          <text class="stick two"></text>
          <text class="stick three"></text>
        </view>
        <view v-if="dailyOracle" class="fallen-stick">
          <text>第 {{ dailyOracle.signNumber }} 签</text>
        </view>
      </view>

      <button class="primary-action" :disabled="dailyDrawing || Boolean(dailyOracle)" @click="drawDailyOracle">
        <text>{{ dailyOracle ? "今日签已生成" : dailyDrawing ? "正在摇签" : "摇今日签" }}</text>
        <text class="arrow-line"></text>
      </button>
      <text class="error-text">{{ dailyError }}</text>

      <view v-if="dailyOracle" class="daily-result">
        <view class="daily-sign-head">
          <view>
            <text class="daily-sign-name">{{ dailyOracle.sign.name }}</text>
            <text class="meta">{{ dailyOracle.dateKey }} · {{ dailyOracle.sign.fortune }} · 第 {{ dailyOracle.signNumber }}/{{ dailyOracle.totalSigns }} 签</text>
          </view>
          <text class="verdict-badge">{{ dailyOracle.sign.fortune }}</text>
        </view>
        <text class="daily-poem">{{ dailyOracle.sign.poem }}</text>
        <view class="keyword-row">
          <text v-for="keyword in dailyOracle.sign.keywords" :key="keyword">{{ keyword }}</text>
        </view>
        <view class="reading-list">
          <text v-for="item in dailyOracle.reading" :key="item" class="reading-item">{{ item }}</text>
        </view>
      </view>
    </view>

    <view class="method-guide mobile-section" :class="{ 'is-active': activeSection === 'methods' }">
      <view class="panel-head">
        <view>
          <text class="panel-kicker">METHODS</text>
          <text class="panel-title">问卜方式</text>
        </view>
      </view>
      <view class="method-grid">
        <view v-for="item in methodGuides" :key="item.name" class="method-card" :class="{ 'is-ready': item.ready }">
          <view class="method-row">
            <text class="method-name">{{ item.name }}</text>
            <text class="method-status">{{ item.ready ? "可用" : "后续" }}</text>
          </view>
          <text class="method-fit">{{ item.fit }}</text>
        </view>
      </view>
    </view>

    <view class="question-panel mobile-section" :class="{ 'is-active': activeSection === 'mei' }">
      <view class="panel-head compact-head">
        <view>
          <text class="panel-kicker">MEI HUA</text>
          <text class="panel-title">梅花易数问事</text>
        </view>
      </view>

      <view class="field">
        <text class="label">所问之事</text>
        <textarea
          v-model="question"
          class="question-input"
          placeholder="例如：这个项目本月能不能推进成功？"
          :maxlength="-1"
        />
        <text class="helper">一卦一问，问题越具体，断语越清晰。</text>
      </view>

      <view class="field">
        <text class="label">事项分类</text>
        <view class="chip-grid">
          <button
            v-for="item in categories"
            :key="item"
            class="chip"
            :class="{ 'is-active': category === item }"
            @click="category = item"
          >
            {{ item }}
          </button>
        </view>
      </view>

      <view class="field">
        <text class="label">起卦方式</text>
        <view class="mode-switch">
          <button class="mode" :class="{ 'is-active': method === 'time' }" @click="method = 'time'">时间起卦</button>
          <button class="mode" :class="{ 'is-active': method === 'number' }" @click="method = 'number'">数字起卦</button>
        </view>
      </view>

      <view v-if="method === 'number'" class="number-panel">
        <view class="field compact">
          <text class="label">上数</text>
          <input v-model="numA" class="number-input" type="number" placeholder="如 17" />
        </view>
        <view class="field compact">
          <text class="label">下数</text>
          <input v-model="numB" class="number-input" type="number" placeholder="如 29" />
        </view>
        <view class="field compact">
          <text class="label">动数</text>
          <input v-model="numC" class="number-input" type="number" placeholder="可空" />
        </view>
      </view>

      <text class="error-text">{{ errorText }}</text>

      <button class="primary-action" :disabled="casting" @click="cast">
        <text>{{ casting ? "正在起卦" : "起卦问事" }}</text>
        <text class="arrow-line"></text>
      </button>
    </view>

    <view class="result-panel mobile-section" :class="{ 'is-empty': !current, 'is-active': activeSection === 'mei' }">
      <view v-if="!current" class="empty-state">
        <view class="sigil"></view>
        <text>静心发问，卦象会在这里展开。</text>
      </view>

      <view v-else class="result-inner">
        <view class="result-title">
          <view class="result-title-copy">
            <text class="result-heading">{{ current.question }}</text>
            <text class="meta">{{ current.category }} · {{ current.methodLabel }} · {{ formatDate(current.createdAt) }}</text>
          </view>
          <text class="verdict-badge">{{ current.verdict }}</text>
        </view>

        <view class="hexagram-grid">
          <HexCard label="本卦" :hexagram="current.original" :moving-line="current.movingLine" />
          <HexCard label="互卦" :hexagram="current.mutual" />
          <HexCard label="变卦" :hexagram="current.changed" />
        </view>

        <view class="analysis-grid">
          <view class="fact-row"><text>起卦</text><text>{{ current.seedLabel }}</text></view>
          <view class="fact-row"><text>动爻</text><text>第 {{ current.movingLine }} 爻动</text></view>
          <view class="fact-row"><text>体用</text><text>体为{{ current.body.name }}{{ current.body.image }}属{{ current.body.element }}，用为{{ current.use.name }}{{ current.use.image }}属{{ current.use.element }}</text></view>
          <view class="fact-row"><text>生克</text><text>{{ current.relation.type }}：{{ current.relation.title }}</text></view>
        </view>

        <view class="reading">
          <text class="section-title">白话断语</text>
          <view class="reading-list">
            <text v-for="item in current.reading" :key="item" class="reading-item">{{ item }}</text>
          </view>
        </view>

        <view class="ai-box">
          <button class="ai-action" :disabled="aiLoading" @click="requestAiReading">
            <text>{{ aiLoading ? "正在深断" : "AI 深断" }}</text>
            <text class="arrow-line"></text>
          </button>
          <view v-if="aiVisible" class="ai-output">
            <view v-if="aiNote" class="ai-note">{{ aiNote }}</view>
            <view v-else class="ai-report">
              <view v-for="(section, index) in aiSections" :key="section.title + index" class="ai-section">
                <text class="ai-title">{{ section.title }}</text>
                <text v-for="paragraph in section.paragraphs" :key="paragraph" class="ai-paragraph">{{ paragraph }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="followup-panel">
          <view class="followup-head">
            <text class="section-title plain">继续追问</text>
            <text>围绕当前这一卦问不懂的地方；若是新事情，建议重新起卦。</text>
          </view>
          <view class="chat-list">
            <view v-if="!currentSession.messages.length" class="chat-empty">
              <text>可以追问“为什么这样断”“我该怎么做”“应期怎么看”。</text>
            </view>
            <view
              v-for="(message, index) in currentSession.messages"
              :key="index"
              class="chat-message"
              :class="message.role === 'user' ? 'is-user' : 'is-assistant'"
            >
              <text class="chat-bubble">{{ cleanAiText(message.content) }}</text>
            </view>
          </view>
          <view class="chat-composer">
            <textarea v-model="followupInput" class="followup-input" placeholder="比如：阻碍具体指什么？我接下来该主动还是等？" />
            <button class="send-button" :disabled="followupLoading" aria-label="发送追问" @click="requestFollowup">
              <text></text>
            </button>
          </view>
          <text class="chat-error">{{ chatError }}</text>
        </view>
      </view>
    </view>

    <view v-if="historyOpen" class="drawer">
      <view class="drawer-backdrop" @click="setHistoryOpen(false)"></view>
      <view class="drawer-panel">
        <view class="drawer-head">
          <text class="drawer-title">问事记录</text>
          <button class="plain-button" @click="clearAllHistory">清空</button>
        </view>
        <view class="history-list">
          <view v-if="!history.length" class="history-item">
            <text>暂无记录。</text>
          </view>
          <view v-for="item in history" :key="item.id" class="history-item" @click="restoreHistory(item)">
            <text class="history-question">{{ item.question }}</text>
            <text>{{ item.category }} · {{ item.original.name }}之{{ item.changed.name }} · {{ formatDate(item.createdAt) }}</text>
          </view>
        </view>
      </view>
    </view>
    </template>
  </view>
</template>

<script setup>
import { computed, defineComponent, h, ref } from "vue";

const AI_SECTION_TITLES = ["局势", "阻碍", "转机", "应对", "结果倾向"];
const AI_SECTION_PATTERN = AI_SECTION_TITLES.join("|");
const categories = ["事业", "感情", "财运", "合作", "出行", "其他"];
const sectionTabs = [
  { key: "daily", label: "今日" },
  { key: "mei", label: "问事" },
  { key: "profile", label: "档案" },
  { key: "methods", label: "方式" }
];
const quickTags = [
  { label: "事业", category: "事业" },
  { label: "感情", category: "感情" },
  { label: "财运", category: "财运" },
  { label: "合作", category: "合作" },
  { label: "出行", category: "出行" },
  { label: "抉择" },
  { label: "应期" },
  { label: "人际" },
  { label: "家宅" },
  { label: "健康" }
];
const methodGuides = [
  { name: "今日签", ready: true, fit: "适合今日状态、轻量提醒、当天宜忌与行动校准。" },
  { name: "梅花易数", ready: true, fit: "适合一事一问、临时起意、看当前气机和走势。" },
  { name: "小六壬", ready: false, fit: "适合快速判断来不来、成不成、等不等、去不去。" },
  { name: "六爻", ready: false, fit: "适合重要事项、关系复杂、要看用神细节和应期。" },
  { name: "奇门", ready: false, fit: "适合行动策略、方位选择、布局和大方向判断。" },
  { name: "个人盘", ready: false, fit: "适合长期背景、阶段趋势和个人状态，不适合临时小事。" }
];

const HexCard = defineComponent({
  props: {
    label: { type: String, required: true },
    hexagram: { type: Object, required: true },
    movingLine: { type: Number, default: null }
  },
  setup(props) {
    return () => h("view", { class: "hex-card" }, [
      h("text", { class: "hex-label" }, props.label),
      h("view", { class: "lines" }, props.hexagram.lines.map((line, index) =>
        h("text", {
          class: ["line", line ? "yang" : "yin", props.movingLine === index + 1 ? "is-moving" : ""]
        })
      )),
      h("text", { class: "hex-name" }, `${props.hexagram.name}\n${props.hexagram.fullName}`)
    ]);
  }
});

const question = ref("");
const category = ref("事业");
const method = ref("time");
const numA = ref("");
const numB = ref("");
const numC = ref("");
const errorText = ref("");
const casting = ref(false);
const dailyQuestion = ref("");
const dailyProfile = ref("");
const dailyLocation = ref("");
const dailyPersonalInfo = ref("");
const dailyOracle = ref(null);
const dailyDrawing = ref(false);
const dailyError = ref("");
const current = ref(null);
const history = ref(loadJsonStorage("mei-hua-history", []));
const aiSessions = ref(loadJsonStorage("mei-hua-ai-sessions", {}));
const aiVisible = ref(false);
const aiLoading = ref(false);
const aiNote = ref("");
const aiSections = ref([]);
const followupInput = ref("");
const followupLoading = ref(false);
const chatError = ref("");
const historyOpen = ref(false);
const activeSection = ref("daily");
const authMode = ref("login");
const authPhone = ref("");
const authPassword = ref("");
const authError = ref("");
const authLoading = ref(false);
const authToken = ref(getStorage("auth-token") || "");
const user = ref(null);
const profiles = ref([]);
const profileLoading = ref(false);
const profileError = ref("");
const newProfileName = ref("");
const newProfileRelation = ref("");
const newProfileNote = ref("");
const selectedTags = ref(loadJsonStorage("wenshi-selected-tags", []));

const currentProfile = computed(() => profiles.value.find((item) => item.id === user.value?.currentProfileId) || profiles.value[0] || null);
const selectedTagLabels = computed(() => selectedTags.value.filter((label) => quickTags.some((tag) => tag.label === label)));

const currentSession = computed(() => {
  if (!current.value) return { reading: "", messages: [] };
  return getAiSession(current.value.id);
});

dailyOracle.value = loadDailyOracle();

if (authToken.value) {
  loadMe();
}

async function submitAuth() {
  authError.value = "";
  authLoading.value = true;
  try {
    const payload = await requestJson(`/api/auth/${authMode.value === "login" ? "login" : "register"}`, {
      phone: authPhone.value,
      password: authPassword.value
    }, { skipAuth: true });
    applyAuthPayload(payload);
  } catch (error) {
    authError.value = error.message;
  } finally {
    authLoading.value = false;
  }
}

function toggleAuthMode() {
  authError.value = "";
  authMode.value = authMode.value === "login" ? "register" : "login";
}

async function loadMe() {
  try {
    const payload = await requestGet("/api/auth/me");
    applyAuthPayload(payload);
  } catch {
    logout();
  }
}

function applyAuthPayload(payload) {
  authToken.value = payload.token || authToken.value;
  if (authToken.value) setStorage("auth-token", authToken.value);
  user.value = payload.user;
  profiles.value = payload.profiles || [];
  syncProfileContext();
}

function logout() {
  authToken.value = "";
  user.value = null;
  profiles.value = [];
  removeStorage("auth-token");
  dailyOracle.value = null;
}

async function switchProfile(profileId) {
  profileError.value = "";
  try {
    const payload = await requestJson("/api/profiles/current", { profileId });
    applyAuthPayload(payload);
  } catch (error) {
    profileError.value = error.message;
  }
}

async function createProfile() {
  profileError.value = "";
  profileLoading.value = true;
  try {
    const payload = await requestJson("/api/profiles", {
      name: newProfileName.value,
      relation: newProfileRelation.value,
      note: newProfileNote.value
    });
    newProfileName.value = "";
    newProfileRelation.value = "";
    newProfileNote.value = "";
    applyAuthPayload(payload);
  } catch (error) {
    profileError.value = error.message;
  } finally {
    profileLoading.value = false;
  }
}

function syncProfileContext() {
  const profile = currentProfile.value;
  if (profile) {
    dailyProfile.value = profile.name;
    dailyPersonalInfo.value = profile.note || dailyPersonalInfo.value;
  }
  dailyOracle.value = loadDailyOracle();
}

function toggleTag(tag) {
  if (selectedTags.value.includes(tag.label)) {
    selectedTags.value = selectedTags.value.filter((item) => item !== tag.label);
  } else {
    selectedTags.value = [...selectedTags.value, tag.label];
  }
  if (tag.category) category.value = tag.category;
  setJsonStorage("wenshi-selected-tags", selectedTags.value);
}

function clearTags() {
  selectedTags.value = [];
  removeStorage("wenshi-selected-tags");
}

async function cast() {
  errorText.value = "";
  casting.value = true;
  try {
    const result = await requestJson("/api/divination/cast", {
      question: question.value.trim(),
      category: category.value,
      method: method.value,
      tags: selectedTagLabels.value,
      numbers: {
        a: numA.value,
        b: numB.value,
        c: numC.value
      }
    });
    current.value = result;
    activeSection.value = "mei";
    resetAiState();
    saveResult(result);
  } catch (error) {
    errorText.value = `起卦失败：${error.message}`;
  } finally {
    casting.value = false;
  }
}

async function drawDailyOracle() {
  dailyError.value = "";
  if (dailyOracle.value) return;

  dailyDrawing.value = true;
  try {
    await wait(1100);
    const result = await requestJson("/api/daily-oracle/cast", {
      question: dailyQuestion.value.trim(),
      profile: dailyProfile.value.trim(),
      location: dailyLocation.value.trim(),
      personalInfo: dailyPersonalInfo.value.trim(),
      tags: selectedTagLabels.value
    });
    dailyOracle.value = result;
    setJsonStorage(getDailyOracleStorageKey(), result);
  } catch (error) {
    dailyError.value = `摇签失败：${error.message}`;
  } finally {
    dailyDrawing.value = false;
  }
}

async function requestAiReading() {
  if (!current.value) return;
  aiLoading.value = true;
  aiVisible.value = true;
  aiNote.value = "正在整理卦象与问题...";
  aiSections.value = [];

  try {
    const data = await requestJson("/api/chat/completions", {
      temperature: 0.72,
      messages: [
        {
          role: "system",
          content:
            "你是传统梅花易数问事助手。只根据用户提供的卦象、体用、生克、动爻和问题做白话分析。不要使用 Markdown，不要输出星号、井号、粗体符号。不要宣称绝对准确，不要给医疗、法律、投资等高风险决定下定论。"
        },
        {
          role: "user",
          content: buildAiPrompt(current.value)
        }
      ]
    });
    const content = cleanAiText(data.choices?.[0]?.message?.content?.trim() || "AI 没有返回可读内容。");
    setAiReading(current.value.id, content);
    aiNote.value = "";
    aiSections.value = parseAiSections(content);
  } catch (error) {
    aiNote.value = `AI 请求失败：${error.message}`;
  } finally {
    aiLoading.value = false;
  }
}

async function requestFollowup() {
  if (!current.value) return;
  const text = followupInput.value.trim();
  chatError.value = "";
  if (!text) {
    chatError.value = "先写下你要追问的点。";
    return;
  }

  const session = getAiSession(current.value.id);
  session.messages.push({ role: "user", content: text, createdAt: new Date().toISOString() });
  followupInput.value = "";
  followupLoading.value = true;
  saveAiSessions();

  try {
    const data = await requestJson("/api/chat/completions", {
      temperature: 0.72,
      messages: buildFollowupMessages(current.value, session)
    });
    const answer = cleanAiText(data.choices?.[0]?.message?.content?.trim() || "AI 没有返回可读内容。");
    session.messages.push({ role: "assistant", content: answer, createdAt: new Date().toISOString() });
    saveAiSessions();
  } catch (error) {
    chatError.value = `追问失败：${error.message}`;
  } finally {
    followupLoading.value = false;
  }
}

function requestJson(url, payload, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      "Content-Type": "application/json",
      ...getAuthHeader(options)
    };
    if (typeof uni !== "undefined" && uni.request) {
      uni.request({
        url,
        method: "POST",
        data: payload,
        header: headers,
        success: (response) => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(response.data);
          } else {
            reject(new Error(response.data?.error || `接口返回 ${response.statusCode}`));
          }
        },
        fail: (error) => reject(new Error(error.errMsg || "网络请求失败"))
      });
      return;
    }

    fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `接口返回 ${response.status}`);
        return data;
      })
      .then(resolve)
      .catch(reject);
  });
}

function requestGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = getAuthHeader(options);
    if (typeof uni !== "undefined" && uni.request) {
      uni.request({
        url,
        method: "GET",
        header: headers,
        success: (response) => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(response.data);
          } else {
            reject(new Error(response.data?.error || `接口返回 ${response.statusCode}`));
          }
        },
        fail: (error) => reject(new Error(error.errMsg || "网络请求失败"))
      });
      return;
    }

    fetch(url, { headers })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `接口返回 ${response.status}`);
        return data;
      })
      .then(resolve)
      .catch(reject);
  });
}

function getAuthHeader(options) {
  if (options.skipAuth || !authToken.value) return {};
  return {
    Authorization: `Bearer ${authToken.value}`
  };
}

function loadDailyOracle() {
  const value = loadJsonStorage(getDailyOracleStorageKey(), null);
  return value?.dateKey === getTodayKey() ? value : null;
}

function getDailyOracleStorageKey() {
  return `daily-oracle:${user.value?.id || "guest"}:${currentProfile.value?.id || "default"}:${getTodayKey()}`;
}

function getTodayKey() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildAiPrompt(result) {
  return [
    `问题：${result.question}`,
    `事项：${result.category}`,
    result.tags?.length ? `标签：${result.tags.join("、")}` : "",
    `起卦：${result.methodLabel}，${result.seedLabel}`,
    `本卦：${result.original.name}（${result.original.fullName}）`,
    `互卦：${result.mutual.name}（${result.mutual.fullName}）`,
    `变卦：${result.changed.name}（${result.changed.fullName}）`,
    `动爻：第 ${result.movingLine} 爻`,
    `体卦：${result.body.name}${result.body.image}，五行${result.body.element}`,
    `用卦：${result.use.name}${result.use.image}，五行${result.use.element}`,
    `体用关系：${result.relation.type}，${result.relation.text}`,
    "请按以下结构输出，标题必须用中文冒号，不要使用 Markdown，不要输出星号或粗体符号：局势：、阻碍：、转机：、应对：、结果倾向：。语气直接一点，别太玄。"
  ].filter(Boolean).join("\n");
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
    result.tags?.length ? `标签：${result.tags.join("、")}` : "",
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
  ].filter(Boolean).join("\n");
}

function parseAiSections(text) {
  const cleaned = normalizeAiSectionText(text);
  const pattern = new RegExp(`(?:^|\\n)[ \\t]*(?:\\d+[.、][ \\t]*)?(${AI_SECTION_PATTERN})[ \\t]*[:：]?[ \\t]*`, "g");
  const matches = [...cleaned.matchAll(pattern)];

  if (matches.length) {
    return matches
      .map((match, index) => {
        const start = match.index + match[0].length;
        const end = matches[index + 1]?.index ?? cleaned.length;
        return {
          title: match[1],
          paragraphs: splitAiParagraphs(cleaned.slice(start, end))
        };
      })
      .filter((section) => section.paragraphs.length);
  }

  return [{ title: "AI 深断", paragraphs: splitAiParagraphs(cleaned) }].filter((section) => section.paragraphs.length);
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

function getAiSession(resultId) {
  if (!aiSessions.value[resultId]) {
    aiSessions.value[resultId] = { reading: "", messages: [] };
  }
  return aiSessions.value[resultId];
}

function setAiReading(resultId, content) {
  const session = getAiSession(resultId);
  session.reading = content;
  saveAiSessions();
}

function saveAiSessions() {
  setJsonStorage("mei-hua-ai-sessions", aiSessions.value);
}

function saveResult(result) {
  history.value = [result, ...history.value.filter((item) => item.id !== result.id)].slice(0, 50);
  setJsonStorage("mei-hua-history", history.value);
}

function restoreHistory(item) {
  current.value = item;
  resetAiState();
  historyOpen.value = false;
}

function clearAllHistory() {
  history.value = [];
  aiSessions.value = {};
  removeStorage("mei-hua-history");
  removeStorage("mei-hua-ai-sessions");
}

function setHistoryOpen(open) {
  historyOpen.value = open;
}

function resetAiState() {
  aiVisible.value = false;
  aiLoading.value = false;
  aiNote.value = "";
  aiSections.value = [];
  followupInput.value = "";
  chatError.value = "";
}

function loadJsonStorage(key, fallback) {
  try {
    const value = getStorage(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function setJsonStorage(key, value) {
  setStorage(key, JSON.stringify(value));
}

function getStorage(key) {
  if (typeof uni !== "undefined" && uni.getStorageSync) return uni.getStorageSync(key);
  return localStorage.getItem(key);
}

function setStorage(key, value) {
  if (typeof uni !== "undefined" && uni.setStorageSync) {
    uni.setStorageSync(key, value);
    return;
  }
  localStorage.setItem(key, value);
}

function removeStorage(key) {
  if (typeof uni !== "undefined" && uni.removeStorageSync) {
    uni.removeStorageSync(key);
    return;
  }
  localStorage.removeItem(key);
}

function formatDate(value) {
  const date = new Date(value);
  const pad = (item) => String(item).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
</script>

<style>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  min-height: 100vh;
  margin: 0;
  color: #f2ead9;
  background:
    linear-gradient(145deg, rgba(122, 169, 154, 0.14), transparent 32%),
    linear-gradient(315deg, rgba(185, 95, 78, 0.11), transparent 36%),
    radial-gradient(circle at 72% 9%, rgba(214, 173, 97, 0.18), transparent 24rem),
    #11110f;
  font-family:
    "Outfit", "Satoshi", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
    system-ui, sans-serif;
}

.page-shell {
  position: relative;
  width: min(100%, 480px);
  min-height: 100vh;
  margin: 0 auto;
  padding: max(18px, env(safe-area-inset-top)) 16px max(28px, env(safe-area-inset-bottom));
  color: #f2ead9;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 2px 18px;
}

.eyebrow,
.title,
.label,
.helper,
.result-heading,
.meta,
.section-title,
.ai-title,
.ai-paragraph,
.chat-bubble,
.drawer-title,
.history-question {
  display: block;
}

.eyebrow {
  margin: 0 0 5px;
  color: #d6ad61;
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.18em;
}

.title {
  font-size: clamp(28px, 10vw, 42px);
  font-weight: 700;
  line-height: 1;
}

button {
  border: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.icon-button {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 46px;
  justify-content: center;
  gap: 5px;
  width: 46px;
  height: 46px;
  border: 1px solid rgba(218, 190, 126, 0.18);
  border-radius: 8px;
  padding: 0;
  background: rgba(242, 234, 217, 0.06);
}

.icon-button::after {
  border: 0;
}

.menu-line {
  display: block;
  width: 19px;
  height: 2px;
  border-radius: 999px;
  background: #d6ad61;
}

.question-panel,
.auth-panel,
.profile-panel,
.tag-panel,
.daily-panel,
.method-guide,
.result-panel {
  border: 1px solid rgba(218, 190, 126, 0.18);
  border-radius: 8px;
  background: rgba(29, 28, 24, 0.74);
  box-shadow:
    0 24px 70px -36px rgba(5, 5, 4, 0.54),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
}

.mobile-command-bar {
  display: none;
}

.question-panel,
.auth-panel,
.profile-panel,
.tag-panel,
.daily-panel,
.method-guide {
  display: grid;
  gap: 18px;
  padding: 18px;
}

.daily-panel,
.auth-panel,
.profile-panel,
.tag-panel,
.method-guide {
  margin-bottom: 14px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid rgba(218, 190, 126, 0.18);
  padding-bottom: 14px;
}

.panel-head.compact-head {
  padding-bottom: 0;
  border-bottom: 0;
}

.panel-head.slim-head {
  align-items: center;
  padding-bottom: 0;
  border-bottom: 0;
}

.panel-kicker,
.panel-title,
.daily-limit {
  display: block;
}

.panel-kicker {
  margin-bottom: 5px;
  color: #7aa99a;
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.16em;
}

.panel-title {
  color: #f2ead9;
  font-size: 19px;
  font-weight: 750;
  line-height: 1.15;
}

.daily-limit {
  flex: 0 0 auto;
  border: 1px solid rgba(122, 169, 154, 0.3);
  border-radius: 999px;
  padding: 6px 9px;
  color: #7aa99a;
  font-size: 12px;
  background: rgba(122, 169, 154, 0.09);
}

.field {
  display: grid;
  gap: 8px;
}

.label {
  color: #f2ead9;
  font-size: 14px;
  font-weight: 650;
}

.helper {
  color: #746d61;
  font-size: 12px;
  line-height: 1.5;
}

.question-input,
.number-input,
.followup-input {
  width: 100%;
  border: 1px solid rgba(218, 190, 126, 0.18);
  border-radius: 8px;
  color: #f2ead9;
  outline: none;
  background: rgba(17, 17, 15, 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.question-input {
  min-height: 112px;
  padding: 13px 14px;
  line-height: 1.6;
}

.daily-input {
  min-height: 86px;
}

.number-input {
  height: 45px;
  padding: 0 12px;
}

.chip-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.chip,
.mode,
.plain-button {
  min-height: 40px;
  border: 1px solid rgba(218, 190, 126, 0.18);
  border-radius: 8px;
  color: #a9a090;
  background: rgba(242, 234, 217, 0.045);
}

.plain-button.small {
  min-height: 34px;
  padding: 0 12px;
  font-size: 12px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  min-height: 36px;
  border: 1px solid rgba(218, 190, 126, 0.18);
  border-radius: 999px;
  padding: 0 12px;
  color: #a9a090;
  background: rgba(242, 234, 217, 0.045);
}

.tag-chip.is-active {
  border-color: rgba(122, 169, 154, 0.36);
  color: #f2ead9;
  background: rgba(122, 169, 154, 0.16);
}

.tag-chip.compact {
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 11px;
  font-size: 13px;
}

.chip.is-active,
.mode.is-active {
  border-color: rgba(218, 190, 126, 0.34);
  color: #f2ead9;
  background: linear-gradient(135deg, rgba(214, 173, 97, 0.22), rgba(122, 169, 154, 0.14));
}

.mode-switch,
.number-panel {
  display: grid;
  gap: 8px;
}

.mode-switch {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.number-panel {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.daily-extra-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.compact .label {
  color: #a9a090;
  font-size: 12px;
}

.error-text,
.chat-error {
  min-height: 18px;
  color: #e8a28d;
  font-size: 13px;
}

.shake-stage {
  position: relative;
  display: grid;
  min-height: 126px;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(214, 173, 97, 0.14);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(214, 173, 97, 0.08), transparent 48%),
    rgba(17, 17, 15, 0.38);
}

.tube {
  position: relative;
  width: 78px;
  height: 88px;
  border: 1px solid rgba(214, 173, 97, 0.42);
  border-radius: 12px 12px 22px 22px;
  background:
    linear-gradient(90deg, transparent 0 18%, rgba(214, 173, 97, 0.16) 18% 22%, transparent 22% 78%, rgba(214, 173, 97, 0.12) 78% 82%, transparent 82%),
    rgba(20, 19, 16, 0.9);
  box-shadow: inset 0 -12px 20px rgba(214, 173, 97, 0.08);
  transform-origin: 50% 90%;
}

.is-shaking .tube {
  animation: shakeTube 110ms ease-in-out infinite alternate;
}

.stick {
  position: absolute;
  top: -22px;
  width: 5px;
  height: 70px;
  border-radius: 999px;
  background: linear-gradient(#f2ead9, #d6ad61);
  transform-origin: bottom center;
}

.stick.one {
  left: 24px;
  transform: rotate(-10deg);
}

.stick.two {
  left: 37px;
}

.stick.three {
  left: 50px;
  transform: rotate(11deg);
}

.is-shaking .stick.two {
  animation: jumpStick 520ms ease-in-out infinite;
}

.fallen-stick {
  position: absolute;
  right: 24px;
  bottom: 20px;
  border: 1px solid rgba(214, 173, 97, 0.34);
  border-radius: 999px;
  padding: 6px 12px;
  color: #d6ad61;
  font-size: 12px;
  background: rgba(17, 17, 15, 0.72);
  animation: stickLand 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.daily-result {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(214, 173, 97, 0.18);
  border-radius: 8px;
  padding: 14px;
  background:
    linear-gradient(135deg, rgba(214, 173, 97, 0.08), transparent 44%),
    rgba(17, 17, 15, 0.44);
}

.daily-sign-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.daily-sign-name {
  display: block;
  color: #f2ead9;
  font-size: 20px;
  font-weight: 800;
}

.daily-poem {
  display: block;
  border-left: 2px solid #d6ad61;
  padding-left: 10px;
  color: #d6ad61;
  font-size: 14px;
  line-height: 1.7;
}

.keyword-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-row text {
  border: 1px solid rgba(122, 169, 154, 0.26);
  border-radius: 999px;
  padding: 5px 8px;
  color: #7aa99a;
  font-size: 12px;
  background: rgba(122, 169, 154, 0.09);
}

.method-grid {
  display: grid;
  gap: 10px;
}

.method-card {
  display: grid;
  gap: 7px;
  border: 1px solid rgba(218, 190, 126, 0.14);
  border-radius: 8px;
  padding: 12px;
  background: rgba(17, 17, 15, 0.36);
}

.method-card.is-ready {
  border-color: rgba(122, 169, 154, 0.26);
}

.method-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.method-name {
  color: #f2ead9;
  font-size: 15px;
  font-weight: 750;
}

.method-status {
  border: 1px solid rgba(214, 173, 97, 0.22);
  border-radius: 999px;
  padding: 4px 7px;
  color: #d6ad61;
  font-size: 11px;
  background: rgba(214, 173, 97, 0.07);
}

.method-fit {
  color: #a9a090;
  font-size: 13px;
  line-height: 1.6;
}

.primary-action,
.ai-action {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  overflow: hidden;
  border-radius: 8px;
  color: #17130d;
  background: linear-gradient(135deg, #d8b56d, #b98942 64%, #8aa99d);
  box-shadow: 0 18px 45px -26px rgba(214, 173, 97, 0.75);
}

.primary-action[disabled],
.ai-action[disabled],
.send-button[disabled] {
  cursor: not-allowed;
  filter: grayscale(0.45);
  opacity: 0.66;
}

.primary-action text:first-child,
.ai-action text:first-child {
  padding-left: 18px;
  font-weight: 750;
}

.arrow-line {
  position: relative;
  width: 28px;
  height: 1px;
  margin-right: 18px;
  background: rgba(23, 19, 13, 0.74);
}

.result-panel {
  margin-top: 14px;
  overflow: hidden;
}

.result-panel.is-empty {
  display: grid;
  min-height: 210px;
  place-items: center;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 16px;
  padding: 30px;
  color: #a9a090;
  text-align: center;
}

.sigil {
  width: 92px;
  height: 92px;
  border: 1px solid rgba(218, 190, 126, 0.34);
  border-radius: 50%;
}

.result-inner {
  display: grid;
  gap: 18px;
  padding: 18px;
}

.result-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid rgba(218, 190, 126, 0.18);
  padding-bottom: 16px;
}

.result-title-copy {
  flex: 1;
  min-width: 0;
}

.result-heading {
  font-size: 20px;
  line-height: 1.28;
  word-break: break-word;
}

.meta {
  margin-top: 8px;
  color: #746d61;
  font-size: 12px;
  line-height: 1.5;
}

.verdict-badge {
  flex: 0 0 auto;
  border: 1px solid rgba(218, 190, 126, 0.34);
  border-radius: 999px;
  padding: 7px 10px;
  color: #d6ad61;
  font-size: 12px;
  background: rgba(214, 173, 97, 0.08);
}

.hexagram-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.hex-card {
  display: grid;
  min-height: 132px;
  align-content: space-between;
  border: 1px solid rgba(218, 190, 126, 0.18);
  border-radius: 8px;
  padding: 12px;
  background: rgba(17, 17, 15, 0.44);
}

.hex-label {
  color: #746d61;
  font-size: 11px;
}

.hex-name {
  color: #f2ead9;
  font-size: 16px;
  font-weight: 700;
  white-space: pre-line;
}

.lines {
  display: grid;
  gap: 5px;
  transform: rotate(180deg);
}

.line {
  height: 6px;
  border-radius: 999px;
  background: #d6ad61;
}

.line.yin {
  background: linear-gradient(90deg, #d6ad61 0 39%, transparent 39% 61%, #d6ad61 61% 100%);
}

.line.is-moving {
  box-shadow: 0 0 0 1px rgba(185, 95, 78, 0.9);
}

.analysis-grid {
  display: grid;
  gap: 10px;
}

.fact-row {
  display: grid;
  grid-template-columns: 86px 1fr;
  gap: 10px;
  border-top: 1px solid rgba(218, 190, 126, 0.18);
  padding-top: 10px;
  color: #a9a090;
  font-size: 14px;
  line-height: 1.55;
}

.fact-row text:first-child {
  color: #746d61;
}

.reading,
.ai-section,
.ai-note,
.chat-empty,
.history-item {
  border: 1px solid rgba(218, 190, 126, 0.18);
  border-radius: 8px;
  background: rgba(17, 17, 15, 0.44);
}

.reading {
  display: grid;
  gap: 10px;
  padding: 14px;
  background: rgba(122, 169, 154, 0.07);
}

.section-title,
.ai-title {
  color: #d6ad61;
  font-size: 15px;
  font-weight: 750;
}

.section-title.plain {
  color: #f2ead9;
}

.reading-list {
  display: grid;
  gap: 7px;
}

.reading-item,
.ai-paragraph,
.ai-note {
  color: #a9a090;
  font-size: 14px;
  line-height: 1.72;
}

.ai-box,
.ai-report,
.followup-panel,
.followup-head,
.chat-list,
.history-list {
  display: grid;
  gap: 12px;
}

.ai-action {
  min-height: 48px;
}

.ai-section,
.ai-note {
  display: grid;
  gap: 7px;
  padding: 13px 13px 13px 15px;
}

.followup-panel {
  border-top: 1px solid rgba(218, 190, 126, 0.18);
  padding-top: 2px;
}

.followup-head text:last-child,
.chat-empty {
  color: #746d61;
  font-size: 12px;
  line-height: 1.55;
}

.chat-list {
  max-height: 360px;
  overflow: auto;
}

.chat-empty {
  padding: 12px;
  border-style: dashed;
}

.chat-message {
  display: flex;
}

.chat-message.is-user {
  justify-content: flex-end;
}

.chat-bubble {
  max-width: 86%;
  border: 1px solid rgba(214, 173, 97, 0.14);
  border-radius: 8px;
  padding: 10px 11px;
  color: #a9a090;
  font-size: 14px;
  line-height: 1.68;
  background: rgba(17, 17, 15, 0.44);
  white-space: pre-wrap;
}

.is-user .chat-bubble {
  border-color: rgba(122, 169, 154, 0.26);
  color: #f2ead9;
  background: rgba(122, 169, 154, 0.13);
}

.chat-composer {
  display: grid;
  grid-template-columns: 1fr 48px;
  gap: 8px;
  align-items: end;
}

.followup-input {
  min-height: 48px;
  max-height: 128px;
  padding: 11px 12px;
}

.send-button {
  position: relative;
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border: 1px solid rgba(218, 190, 126, 0.34);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(214, 173, 97, 0.28), rgba(122, 169, 154, 0.18));
}

.send-button text {
  width: 18px;
  height: 1px;
  background: #d6ad61;
}

.drawer {
  position: fixed;
  inset: 0;
  z-index: 20;
}

.drawer-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(7, 7, 6, 0.66);
}

.drawer-panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  max-height: 78vh;
  border: 1px solid rgba(218, 190, 126, 0.18);
  border-radius: 16px 16px 0 0;
  padding: 16px;
  overflow: auto;
  background: #1b1a17;
}

.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
}

.drawer-title {
  font-size: 18px;
  font-weight: 700;
}

.plain-button {
  min-height: 34px;
  padding: 8px 10px;
}

.plain-wide-button {
  min-height: 40px;
  border: 1px solid rgba(218, 190, 126, 0.18);
  border-radius: 8px;
  color: #a9a090;
  background: rgba(242, 234, 217, 0.045);
}

.current-profile {
  display: grid;
  gap: 6px;
  border: 1px solid rgba(122, 169, 154, 0.22);
  border-radius: 8px;
  padding: 12px;
  background: rgba(122, 169, 154, 0.08);
}

.profile-name {
  color: #f2ead9;
  font-size: 18px;
  font-weight: 800;
}

.profile-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-chip {
  min-height: 36px;
  border: 1px solid rgba(218, 190, 126, 0.18);
  border-radius: 999px;
  padding: 0 12px;
  color: #a9a090;
  background: rgba(242, 234, 217, 0.045);
}

.profile-chip.is-active {
  border-color: rgba(122, 169, 154, 0.34);
  color: #f2ead9;
  background: rgba(122, 169, 154, 0.14);
}

.add-profile {
  display: grid;
  gap: 10px;
}

.history-item {
  display: grid;
  gap: 8px;
  padding: 12px;
  color: #746d61;
  font-size: 12px;
}

.history-question {
  color: #f2ead9;
  font-size: 14px;
}

@media (max-width: 859px) {
  .mobile-command-bar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: grid;
    gap: 10px;
    margin: -2px 0 14px;
    border: 1px solid rgba(218, 190, 126, 0.16);
    border-radius: 8px;
    padding: 10px;
    background: rgba(20, 19, 16, 0.9);
    box-shadow: 0 18px 42px -30px rgba(5, 5, 4, 0.9);
    backdrop-filter: blur(18px);
  }

  .mobile-tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
  }

  .mobile-tab {
    min-height: 38px;
    border: 1px solid rgba(218, 190, 126, 0.18);
    border-radius: 8px;
    color: #a9a090;
    background: rgba(242, 234, 217, 0.045);
    font-size: 14px;
    font-weight: 700;
  }

  .mobile-tab.is-active {
    border-color: rgba(214, 173, 97, 0.36);
    color: #17130d;
    background: linear-gradient(135deg, #d8b56d, #b98942 72%, #8aa99d);
  }

  .mobile-tag-strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .mobile-tag-strip::-webkit-scrollbar {
    display: none;
  }

  .tag-panel {
    display: none;
  }

  .mobile-section {
    display: none !important;
  }

  .question-panel.mobile-section.is-active,
  .profile-panel.mobile-section.is-active,
  .daily-panel.mobile-section.is-active,
  .method-guide.mobile-section.is-active {
    display: grid !important;
  }

  .result-panel.mobile-section.is-active {
    display: block !important;
  }

  .result-panel.is-empty.mobile-section.is-active {
    display: grid !important;
  }
}

@media (min-width: 860px) {
  .page-shell {
    display: grid;
    grid-template-columns: minmax(320px, 410px) minmax(0, 1fr);
    align-items: start;
    gap: 16px;
    width: min(100%, 1160px);
    padding: 24px;
  }

  .topbar {
    grid-column: 1 / -1;
    padding-bottom: 8px;
  }

  .auth-panel {
    grid-column: 1 / -1;
    width: min(100%, 460px);
    justify-self: center;
  }

  .profile-panel,
  .tag-panel,
  .daily-panel,
  .method-guide {
    grid-column: 1;
    margin-bottom: 0;
  }

  .profile-panel {
    grid-row: 2;
  }

  .tag-panel {
    grid-row: 3;
  }

  .daily-panel {
    grid-row: 4;
  }

  .method-guide {
    grid-row: 5;
  }

  .question-panel,
  .result-panel {
    grid-column: 2;
    margin-bottom: 0;
  }

  .question-panel {
    grid-row: 2;
  }

  .result-panel {
    grid-row: 3 / span 3;
    margin-top: 0;
  }

  .question-panel,
  .auth-panel,
  .profile-panel,
  .tag-panel,
  .daily-panel,
  .method-guide {
    padding: 20px;
  }

  .title {
    font-size: 40px;
  }

  .question-input {
    min-height: 138px;
  }

  .daily-input {
    min-height: 96px;
  }

  .method-grid {
    grid-template-columns: 1fr;
  }

  .drawer-panel {
    width: min(460px, 44vw);
  }
}

@media (min-width: 1180px) {
  .page-shell {
    grid-template-columns: 420px minmax(0, 1fr);
    gap: 18px;
  }

  .method-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 360px) {
  .page-shell {
    padding-inline: 12px;
  }

  .question-panel,
  .result-inner {
    padding: 14px;
  }

  .hexagram-grid {
    grid-template-columns: 1fr;
  }

  .daily-extra-grid {
    grid-template-columns: 1fr;
  }

  .hex-card {
    min-height: 116px;
  }
}

@keyframes shakeTube {
  from {
    transform: rotate(-7deg) translateX(-2px);
  }

  to {
    transform: rotate(7deg) translateX(2px);
  }
}

@keyframes jumpStick {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-18px);
  }
}

@keyframes stickLand {
  from {
    opacity: 0;
    transform: translateY(-14px) rotate(-8deg);
  }

  to {
    opacity: 1;
    transform: translateY(0) rotate(-8deg);
  }
}
</style>
