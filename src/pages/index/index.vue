<template>
  <view class="page-shell">
    <view class="topbar">
      <view class="brand-lockup">
        <view class="brand-mark">
          <text class="mark-line yang"></text>
          <text class="mark-line yin"></text>
          <text class="mark-line yang"></text>
        </view>
        <view>
          <text class="eyebrow">MEI HUA WEN SHI</text>
          <text class="title">玄问临占</text>
          <text class="subtitle">{{ user ? "已登录" : "登录后保存问卜" }}</text>
        </view>
      </view>
      <view class="topbar-actions">
        <button v-if="user" class="plain-button small topbar-logout" @click="logout">退出</button>
        <button class="icon-button" aria-label="打开记录" @click="setHistoryOpen(true)">
          <text class="menu-line"></text>
          <text class="menu-line"></text>
          <text class="menu-line"></text>
        </button>
      </view>
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
    <view class="mobile-tag-dock">
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
    <view class="mobile-bottom-nav">
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
        <button
          v-for="item in methodGuides"
          :key="item.name"
          class="method-card"
          :class="{ 'is-ready': item.ready, 'is-selected': selectedGuideKey === item.key }"
          @click="selectMethodGuide(item)"
        >
          <view class="method-row">
            <text class="method-name">{{ item.name }}</text>
            <text class="method-status">{{ selectedGuideKey === item.key ? "已选" : item.ready ? "可用" : "后续" }}</text>
          </view>
          <text class="method-fit">{{ item.fit }}</text>
        </button>
      </view>

      <view v-if="isAdvancedMethod" class="advanced-tool">
        <view class="panel-head compact-head">
          <view>
            <text class="panel-kicker">CAST</text>
            <text class="panel-title">{{ currentMethodGuide?.name }}问卜</text>
          </view>
        </view>
        <view class="field">
          <text class="label">{{ advancedMethod === "personal" ? "所看主题" : "所问之事" }}</text>
          <textarea
            v-model="advancedQuestion"
            class="question-input daily-input"
            :placeholder="advancedMethod === 'personal' ? '例如：我这个阶段适合主动换方向吗？' : '例如：这件事今天该不该推进？'"
            :maxlength="-1"
          />
        </view>
        <view v-if="advancedMethod === 'personal'" class="daily-extra-grid">
          <view class="field compact">
            <text class="label">出生日期</text>
            <input v-model="advancedBirthDate" class="number-input" type="date" />
          </view>
          <view class="field compact">
            <text class="label">出生时间</text>
            <input v-model="advancedBirthTime" class="number-input" type="time" />
          </view>
        </view>
        <view class="field compact">
          <text class="label">地点/背景</text>
          <input v-model="advancedLocation" class="number-input" placeholder="可选：地点、关系、当前背景" />
        </view>
        <button class="primary-action" :disabled="advancedCasting" @click="castAdvanced">
          <text>{{ advancedCasting ? "正在推演" : "开始推演" }}</text>
          <text class="arrow-line"></text>
        </button>
        <text class="error-text">{{ advancedError }}</text>

        <view v-if="advancedResult" class="advanced-result">
          <view class="daily-sign-head">
            <view>
              <text class="daily-sign-name">{{ advancedResult.methodLabel }}</text>
              <text class="meta">{{ advancedResult.verdict }} · {{ formatDate(advancedResult.createdAt) }}</text>
            </view>
            <text class="verdict-badge">{{ advancedResult.verdict }}</text>
          </view>
          <text class="daily-poem">{{ advancedResult.summary }}</text>
          <view class="analysis-grid">
            <view v-for="fact in advancedResult.facts" :key="fact[0]" class="fact-row">
              <text>{{ fact[0] }}</text>
              <text>{{ fact[1] }}</text>
            </view>
          </view>
          <view v-if="advancedResult.extra?.plate" class="method-plate">
            <view v-for="item in advancedResult.extra.plate" :key="item.palace" class="plate-cell">
              <text class="method-name">{{ item.palace }}</text>
              <text class="meta">{{ item.door }} · {{ item.star }} · {{ item.god }}</text>
            </view>
          </view>
          <view v-if="advancedResult.extra?.lines" class="line-list">
            <view v-for="item in advancedResult.extra.lines" :key="item.line" class="fact-row">
              <text>第{{ item.line }}爻</text>
              <text>{{ item.name }}{{ item.moving ? " · 动" : "" }}</text>
            </view>
          </view>
          <view class="reading-list">
            <text v-for="item in advancedResult.reading" :key="item" class="reading-item">{{ item }}</text>
          </view>
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
            <text class="history-question">{{ getHistoryTitle(item) }}</text>
            <text>{{ getHistoryMeta(item) }}</text>
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
  { key: "daily", name: "今日签", ready: true, fit: "适合今日状态、轻量提醒、当天宜忌与行动校准。" },
  { key: "mei", name: "梅花易数", ready: true, fit: "适合一事一问、临时起意、看当前气机和走势。" },
  { key: "xiaoliuren", name: "小六壬", ready: true, fit: "适合快速判断来不来、成不成、等不等、去不去。" },
  { key: "liuyao", name: "六爻", ready: true, fit: "适合重要事项、关系复杂、要看动爻、变化和应期。" },
  { key: "qimen", name: "奇门", ready: true, fit: "适合行动策略、方位选择、布局和大方向判断。" },
  { key: "personal", name: "个人盘", ready: true, fit: "适合长期背景、阶段趋势和个人状态，不适合临时小事。" }
];
const advancedMethodKeys = ["xiaoliuren", "liuyao", "qimen", "personal"];

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
const selectedTags = ref(loadJsonStorage("wenshi-selected-tags", []));
const advancedMethod = ref("xiaoliuren");
const advancedQuestion = ref("");
const advancedBirthDate = ref("");
const advancedBirthTime = ref("12:00");
const advancedLocation = ref("");
const advancedCasting = ref(false);
const advancedError = ref("");
const advancedResult = ref(null);
const selectedGuideKey = ref("xiaoliuren");

const currentProfile = computed(() => profiles.value.find((item) => item.id === user.value?.currentProfileId) || profiles.value[0] || null);
const selectedTagLabels = computed(() => selectedTags.value.filter((label) => quickTags.some((tag) => tag.label === label)));
const isAdvancedMethod = computed(() => advancedMethodKeys.includes(selectedGuideKey.value));
const currentMethodGuide = computed(() => methodGuides.find((item) => item.key === advancedMethod.value) || methodGuides[2]);

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

function syncProfileContext() {
  dailyProfile.value = dailyProfile.value || "我自己";
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

function selectMethodGuide(item) {
  if (item.key === "daily") {
    selectedGuideKey.value = "daily";
    activeSection.value = "daily";
    return;
  }

  if (item.key === "mei") {
    selectedGuideKey.value = "mei";
    activeSection.value = "mei";
    return;
  }

  if (!advancedMethodKeys.includes(item.key)) return;
  selectedGuideKey.value = item.key;
  advancedMethod.value = item.key;
  activeSection.value = "methods";
  advancedError.value = "";
  advancedResult.value = null;
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

async function castAdvanced() {
  advancedError.value = "";
  advancedCasting.value = true;
  try {
    const result = await requestJson("/api/oracle/cast", {
      oracleType: advancedMethod.value,
      question: advancedQuestion.value.trim(),
      category: category.value,
      tags: selectedTagLabels.value,
      location: advancedLocation.value.trim(),
      profile: dailyProfile.value.trim() || currentProfile.value?.name || "",
      birthDate: advancedBirthDate.value,
      birthTime: advancedBirthTime.value
    });
    advancedResult.value = result;
    activeSection.value = "methods";
    saveResult(result);
  } catch (error) {
    advancedError.value = `推演失败：${error.message}`;
  } finally {
    advancedCasting.value = false;
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
  return `daily-oracle:${user.value?.id || "guest"}:account:${getTodayKey()}`;
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
  if (advancedMethodKeys.includes(item.type)) {
    advancedMethod.value = item.type;
    selectedGuideKey.value = item.type;
    advancedResult.value = item;
    activeSection.value = "methods";
  } else {
    selectedGuideKey.value = "mei";
    current.value = item;
    activeSection.value = "mei";
    resetAiState();
  }
  historyOpen.value = false;
}

function getHistoryTitle(item) {
  return item.question || item.summary || "未命名问卜";
}

function getHistoryMeta(item) {
  const parts = [
    item.category,
    item.methodLabel,
    getHistoryShape(item),
    formatDate(item.createdAt)
  ].filter(Boolean);
  return parts.join(" · ");
}

function getHistoryShape(item) {
  if (item.original?.name && item.changed?.name) return `${item.original.name}之${item.changed.name}`;
  if (item.extra?.state?.name) return item.extra.state.name;
  if (item.extra?.best?.palace) return `${item.extra.best.palace}${item.extra.best.door}`;
  if (item.extra?.stem && item.extra?.branch) return `${item.extra.stem}${item.extra.branch}`;
  return item.verdict || "";
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
  color: #f6f0df;
  background:
    linear-gradient(180deg, rgba(246, 240, 223, 0.035) 0 1px, transparent 1px 100%),
    linear-gradient(90deg, rgba(246, 240, 223, 0.025) 0 1px, transparent 1px 100%),
    linear-gradient(150deg, rgba(42, 92, 85, 0.34), transparent 34%),
    linear-gradient(28deg, rgba(150, 62, 51, 0.16), transparent 42%),
    #0f1311;
  background-size: auto, 34px 34px, auto, auto, auto;
  font-family:
    "Outfit", "Satoshi", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
    system-ui, sans-serif;
}

.page-shell {
  position: relative;
  width: min(100%, 480px);
  min-height: 100vh;
  margin: 0 auto;
  padding: max(18px, env(safe-area-inset-top)) 16px max(30px, env(safe-area-inset-bottom));
  color: #f6f0df;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 2px 16px;
}

.brand-lockup {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

.brand-mark {
  display: grid;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  align-content: center;
  gap: 5px;
  border: 1px solid rgba(218, 183, 103, 0.28);
  border-radius: 8px;
  padding: 9px;
  background:
    linear-gradient(145deg, rgba(218, 183, 103, 0.2), rgba(42, 92, 85, 0.16)),
    rgba(18, 22, 20, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.mark-line {
  display: block;
  height: 3px;
  border-radius: 999px;
  background: #dab767;
}

.mark-line.yin {
  background: linear-gradient(90deg, #dab767 0 38%, transparent 38% 62%, #dab767 62% 100%);
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
  margin: 0 0 4px;
  color: #96c8b8;
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.16em;
}

.title {
  color: #fff7df;
  font-size: clamp(27px, 9vw, 40px);
  font-weight: 800;
  line-height: 1;
}

.subtitle {
  display: block;
  margin-top: 6px;
  color: #9b9384;
  font-size: 12px;
  line-height: 1.3;
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
  border: 1px solid rgba(218, 183, 103, 0.2);
  border-radius: 8px;
  padding: 0;
  background: rgba(246, 240, 223, 0.06);
}

.icon-button::after {
  border: 0;
}

.menu-line {
  display: block;
  width: 19px;
  height: 2px;
  border-radius: 999px;
  background: #dab767;
}

.topbar-actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 8px;
}

.topbar-logout {
  min-width: 54px;
}

.question-panel,
.auth-panel,
.tag-panel,
.daily-panel,
.method-guide,
.result-panel {
  border: 1px solid rgba(218, 183, 103, 0.18);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(246, 240, 223, 0.045), transparent 160px),
    rgba(18, 22, 20, 0.82);
  box-shadow:
    0 24px 70px -42px rgba(0, 0, 0, 0.82),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
}

.mobile-tag-dock,
.mobile-bottom-nav {
  display: none;
}

.question-panel,
.auth-panel,
.tag-panel,
.daily-panel,
.method-guide {
  display: grid;
  gap: 18px;
  padding: 18px;
}

.daily-panel,
.auth-panel,
.tag-panel,
.method-guide {
  margin-bottom: 14px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid rgba(218, 183, 103, 0.16);
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
  color: #96c8b8;
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.16em;
}

.panel-title {
  color: #fff7df;
  font-size: 19px;
  font-weight: 750;
  line-height: 1.15;
}

.daily-limit {
  flex: 0 0 auto;
  border: 1px solid rgba(150, 200, 184, 0.32);
  border-radius: 999px;
  padding: 6px 9px;
  color: #96c8b8;
  font-size: 12px;
  background: rgba(42, 92, 85, 0.16);
}

.field {
  display: grid;
  gap: 8px;
}

.label {
  color: #fff7df;
  font-size: 14px;
  font-weight: 650;
}

.helper {
  color: #9b9384;
  font-size: 12px;
  line-height: 1.5;
}

.question-input,
.number-input,
.followup-input {
  width: 100%;
  border: 1px solid rgba(218, 183, 103, 0.18);
  border-radius: 8px;
  color: #fff7df;
  outline: none;
  background: rgba(7, 11, 10, 0.54);
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
  border: 1px solid rgba(218, 183, 103, 0.16);
  border-radius: 8px;
  color: #b5ac99;
  background: rgba(246, 240, 223, 0.045);
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
  border: 1px solid rgba(218, 183, 103, 0.16);
  border-radius: 999px;
  padding: 0 12px;
  color: #b5ac99;
  background: rgba(246, 240, 223, 0.045);
}

.tag-chip.is-active {
  border-color: rgba(150, 200, 184, 0.38);
  color: #fff7df;
  background: rgba(42, 92, 85, 0.28);
}

.tag-chip.compact {
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 11px;
  font-size: 13px;
}

.chip.is-active,
.mode.is-active {
  border-color: rgba(218, 183, 103, 0.36);
  color: #fff7df;
  background: linear-gradient(135deg, rgba(218, 183, 103, 0.24), rgba(42, 92, 85, 0.22));
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
  color: #b5ac99;
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
    linear-gradient(135deg, rgba(218, 183, 103, 0.1), transparent 48%),
    rgba(7, 11, 10, 0.42);
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
  background: linear-gradient(#fff7df, #dab767);
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
  color: #dab767;
  font-size: 12px;
  background: rgba(7, 11, 10, 0.78);
  animation: stickLand 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.daily-result {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(218, 183, 103, 0.18);
  border-radius: 8px;
  padding: 14px;
  background:
    linear-gradient(135deg, rgba(218, 183, 103, 0.09), transparent 44%),
    rgba(7, 11, 10, 0.48);
}

.daily-sign-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.daily-sign-name {
  display: block;
  color: #fff7df;
  font-size: 20px;
  font-weight: 800;
}

.daily-poem {
  display: block;
  border-left: 2px solid #dab767;
  padding-left: 10px;
  color: #dab767;
  font-size: 14px;
  line-height: 1.7;
}

.keyword-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-row text {
  border: 1px solid rgba(150, 200, 184, 0.28);
  border-radius: 999px;
  padding: 5px 8px;
  color: #96c8b8;
  font-size: 12px;
  background: rgba(42, 92, 85, 0.18);
}

.method-grid {
  display: grid;
  gap: 10px;
}

.method-card {
  display: grid;
  gap: 7px;
  border: 1px solid rgba(218, 183, 103, 0.14);
  border-radius: 8px;
  padding: 12px;
  color: inherit;
  text-align: left;
  background: rgba(7, 11, 10, 0.34);
}

.method-card::after {
  border: 0;
}

.method-card.is-ready {
  border-color: rgba(150, 200, 184, 0.28);
}

.method-card.is-selected {
  border-color: rgba(218, 183, 103, 0.54);
  background:
    linear-gradient(135deg, rgba(218, 183, 103, 0.16), rgba(42, 92, 85, 0.18)),
    rgba(7, 11, 10, 0.48);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.method-card.is-selected .method-status {
  border-color: rgba(150, 200, 184, 0.36);
  color: #96c8b8;
  background: rgba(42, 92, 85, 0.2);
}

.method-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.method-name {
  color: #fff7df;
  font-size: 15px;
  font-weight: 750;
}

.method-status {
  border: 1px solid rgba(214, 173, 97, 0.22);
  border-radius: 999px;
  padding: 4px 7px;
  color: #dab767;
  font-size: 11px;
  background: rgba(218, 183, 103, 0.08);
}

.method-fit {
  color: #b5ac99;
  font-size: 13px;
  line-height: 1.6;
}

.advanced-tool,
.advanced-result,
.line-list {
  display: grid;
  gap: 12px;
}

.advanced-tool {
  border-top: 1px solid rgba(218, 183, 103, 0.16);
  padding-top: 14px;
}

.advanced-result {
  border: 1px solid rgba(218, 183, 103, 0.18);
  border-radius: 8px;
  padding: 14px;
  background:
    linear-gradient(135deg, rgba(42, 92, 85, 0.15), transparent 50%),
    rgba(7, 11, 10, 0.46);
}

.method-plate {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.plate-cell {
  display: grid;
  min-height: 72px;
  align-content: center;
  gap: 4px;
  border: 1px solid rgba(218, 183, 103, 0.14);
  border-radius: 8px;
  padding: 10px;
  background: rgba(246, 240, 223, 0.045);
}

.plate-cell .meta {
  margin-top: 0;
}

.line-list {
  border: 1px solid rgba(150, 200, 184, 0.18);
  border-radius: 8px;
  padding: 4px 12px 12px;
  background: rgba(42, 92, 85, 0.1);
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
  color: #101210;
  background: linear-gradient(135deg, #e1c06f, #b98a45 62%, #96c8b8);
  box-shadow: 0 18px 45px -26px rgba(218, 183, 103, 0.76);
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
  color: #b5ac99;
  text-align: center;
}

.sigil {
  width: 92px;
  height: 92px;
  border: 1px solid rgba(218, 183, 103, 0.34);
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
  border-bottom: 1px solid rgba(218, 183, 103, 0.16);
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
  color: #9b9384;
  font-size: 12px;
  line-height: 1.5;
}

.verdict-badge {
  flex: 0 0 auto;
  border: 1px solid rgba(218, 183, 103, 0.34);
  border-radius: 999px;
  padding: 7px 10px;
  color: #dab767;
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
  border: 1px solid rgba(218, 183, 103, 0.18);
  border-radius: 8px;
  padding: 12px;
  background: rgba(7, 11, 10, 0.44);
}

.hex-label {
  color: #9b9384;
  font-size: 11px;
}

.hex-name {
  color: #fff7df;
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
  background: #dab767;
}

.line.yin {
  background: linear-gradient(90deg, #dab767 0 39%, transparent 39% 61%, #dab767 61% 100%);
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
  border-top: 1px solid rgba(218, 183, 103, 0.16);
  padding-top: 10px;
  color: #b5ac99;
  font-size: 14px;
  line-height: 1.55;
}

.fact-row text:first-child {
  color: #9b9384;
}

.reading,
.ai-section,
.ai-note,
.chat-empty,
.history-item {
  border: 1px solid rgba(218, 183, 103, 0.18);
  border-radius: 8px;
  background: rgba(7, 11, 10, 0.44);
}

.reading {
  display: grid;
  gap: 10px;
  padding: 14px;
  background: rgba(42, 92, 85, 0.12);
}

.section-title,
.ai-title {
  color: #dab767;
  font-size: 15px;
  font-weight: 750;
}

.section-title.plain {
  color: #fff7df;
}

.reading-list {
  display: grid;
  gap: 7px;
}

.reading-item,
.ai-paragraph,
.ai-note {
  color: #b5ac99;
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
  border-top: 1px solid rgba(218, 183, 103, 0.16);
  padding-top: 2px;
}

.followup-head text:last-child,
.chat-empty {
  color: #9b9384;
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
  color: #b5ac99;
  font-size: 14px;
  line-height: 1.68;
  background: rgba(7, 11, 10, 0.44);
  white-space: pre-wrap;
}

.is-user .chat-bubble {
  border-color: rgba(150, 200, 184, 0.28);
  color: #fff7df;
  background: rgba(42, 92, 85, 0.24);
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
  border: 1px solid rgba(218, 183, 103, 0.34);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(218, 183, 103, 0.3), rgba(42, 92, 85, 0.22));
}

.send-button text {
  width: 18px;
  height: 1px;
  background: #dab767;
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
  border: 1px solid rgba(218, 183, 103, 0.18);
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
  border: 1px solid rgba(218, 183, 103, 0.18);
  border-radius: 8px;
  color: #b5ac99;
  background: rgba(246, 240, 223, 0.045);
}

.history-item {
  display: grid;
  gap: 8px;
  padding: 12px;
  color: #9b9384;
  font-size: 12px;
}

.history-question {
  color: #fff7df;
  font-size: 14px;
}

@media (max-width: 859px) {
  .page-shell {
    padding-bottom: calc(96px + env(safe-area-inset-bottom));
  }

  .mobile-tag-dock {
    position: sticky;
    top: 0;
    z-index: 20;
    display: block;
    margin: -2px 0 12px;
    border: 1px solid rgba(218, 183, 103, 0.14);
    border-radius: 8px;
    padding: 9px;
    background: rgba(15, 19, 17, 0.92);
    box-shadow: 0 18px 42px -30px rgba(5, 5, 4, 0.9);
    backdrop-filter: blur(18px);
  }

  .mobile-bottom-nav {
    position: fixed;
    left: max(12px, env(safe-area-inset-left));
    right: max(12px, env(safe-area-inset-right));
    bottom: max(12px, env(safe-area-inset-bottom));
    z-index: 30;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    width: min(calc(100vw - 24px), 430px);
    margin: 0 auto;
    border: 1px solid rgba(218, 183, 103, 0.18);
    border-radius: 8px;
    padding: 7px;
    background: rgba(15, 19, 17, 0.94);
    box-shadow: 0 24px 60px -28px rgba(0, 0, 0, 0.92);
    backdrop-filter: blur(18px);
  }

  .mobile-tab {
    min-height: 42px;
    border: 0;
    border-radius: 7px;
    color: #9b9384;
    background: transparent;
    font-size: 13px;
    font-weight: 750;
  }

  .mobile-tab.is-active {
    color: #101210;
    background: linear-gradient(135deg, #dab767, #b98a45 72%, #96c8b8);
  }

  .mobile-tag-strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 1px;
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

  .tag-panel,
  .daily-panel,
  .method-guide {
    grid-column: 1;
    margin-bottom: 0;
  }

  .tag-panel {
    grid-row: 2;
  }

  .daily-panel {
    grid-row: 3;
  }

  .method-guide {
    grid-row: 4;
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
