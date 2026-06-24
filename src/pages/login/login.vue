<template>
  <view class="login-page">
    <view class="login-card">
      <view class="brand-lockup">
        <view class="brand-mark">
          <image class="brand-icon" src="/static/app-icon-bagua.png" mode="aspectFill" />
        </view>
        <view>
          <text class="eyebrow">MEI HUA WEN SHI</text>
          <text class="title">玄问临占</text>
          <text class="subtitle">{{ authMode === "login" ? "登录后进入个人问卜" : "注册一个自用账号" }}</text>
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
        <text>{{ authLoading ? "处理中" : authMode === "login" ? "登录进入" : "注册并进入" }}</text>
        <text class="arrow-line"></text>
      </button>
      <button class="plain-wide-button" @click="toggleAuthMode">
        {{ authMode === "login" ? "还没有账号，去注册" : "已有账号，去登录" }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from "vue";

const API_BASE_URL = "https://wenshi.cccode.com.cn";
const authMode = ref("login");
const authPhone = ref("");
const authPassword = ref("");
const authError = ref("");
const authLoading = ref(false);

async function submitAuth() {
  authError.value = "";
  authLoading.value = true;
  try {
    const payload = await requestJson(`/api/auth/${authMode.value === "login" ? "login" : "register"}`, {
      phone: authPhone.value,
      password: authPassword.value
    });
    setStorage("auth-token", payload.token);
    goHome();
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

function requestJson(url, payload) {
  return new Promise((resolve, reject) => {
    if (typeof uni !== "undefined" && uni.request) {
      uni.request({
        url: resolveApiUrl(url),
        method: "POST",
        data: payload,
        header: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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

function resolveApiUrl(url) {
  if (/^https?:\/\//.test(url)) return url;
  if (typeof window === "undefined") return `${API_BASE_URL}${url}`;
  return url;
}

function setStorage(key, value) {
  if (typeof uni !== "undefined" && uni.setStorageSync) {
    uni.setStorageSync(key, value);
    return;
  }
  localStorage.setItem(key, value);
}

function goHome() {
  if (typeof uni !== "undefined" && uni.reLaunch) {
    uni.reLaunch({ url: "/pages/index/index" });
    return;
  }
  if (typeof window !== "undefined") window.location.href = "/";
}
</script>

<style>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0;
  color: #f7efd9;
  background:
    linear-gradient(180deg, rgba(12, 16, 15, 0.2), rgba(12, 16, 15, 0.82)),
    url("/static/ritual-backdrop.png") center top / cover,
    #0c100f;
  font-family:
    "Outfit", "Satoshi", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
    system-ui, sans-serif;
}

.login-page {
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  place-items: center;
  padding: max(18px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom));
}

.login-card {
  display: grid;
  width: min(100%, 430px);
  gap: 18px;
  border: 1px solid rgba(226, 191, 112, 0.2);
  border-radius: 8px;
  padding: 20px;
  background:
    linear-gradient(180deg, rgba(255, 248, 228, 0.075), transparent 180px),
    linear-gradient(145deg, rgba(42, 69, 61, 0.34), rgba(14, 18, 16, 0.2)),
    rgba(14, 18, 16, 0.9);
  box-shadow:
    0 28px 80px -48px rgba(0, 0, 0, 0.92),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(22px) saturate(1.05);
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 13px;
  padding-bottom: 8px;
}

.brand-mark {
  display: block;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(226, 191, 112, 0.28);
  border-radius: 8px;
  padding: 3px;
  overflow: hidden;
  background: rgba(226, 191, 112, 0.08);
}

.brand-icon {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 6px;
}

.eyebrow,
.subtitle,
.label,
.error-text {
  display: block;
}

.eyebrow {
  color: #91d1bd;
  font-size: 11px;
  font-weight: 800;
}

.title {
  display: block;
  margin-top: 2px;
  color: #fff7df;
  font-size: 24px;
  font-weight: 850;
}

.subtitle {
  margin-top: 4px;
  color: #9b9384;
  font-size: 13px;
}

.field {
  display: grid;
  gap: 8px;
}

.label {
  color: #d6cbb3;
  font-size: 13px;
  font-weight: 700;
}

.number-input {
  width: 100%;
  min-height: 46px;
  border: 1px solid rgba(226, 191, 112, 0.18);
  border-radius: 8px;
  padding: 0 12px;
  color: #fff7df;
  background: rgba(7, 11, 10, 0.56);
  font-size: 16px;
}

.error-text {
  min-height: 18px;
  color: #e8a28d;
  font-size: 13px;
}

.primary-action {
  position: relative;
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  border-radius: 8px;
  color: #101210;
  background:
    linear-gradient(135deg, #f0cc78, #c5964c 56%, #91d1bd),
    #e2bf70;
}

.primary-action text:first-child {
  position: relative;
  z-index: 1;
  padding-left: 18px;
  font-weight: 750;
}

.arrow-line {
  position: relative;
  z-index: 1;
  width: 28px;
  height: 2px;
  margin-right: 18px;
  border-radius: 999px;
  background: rgba(23, 19, 13, 0.74);
}

.arrow-line::after {
  content: "";
  position: absolute;
  right: -1px;
  top: 50%;
  width: 8px;
  height: 8px;
  border-top: 2px solid rgba(23, 19, 13, 0.74);
  border-right: 2px solid rgba(23, 19, 13, 0.74);
  transform: translateY(-50%) rotate(45deg);
}

.plain-wide-button {
  min-height: 42px;
  border: 1px solid rgba(226, 191, 112, 0.2);
  border-radius: 8px;
  color: #e2bf70;
  background: rgba(7, 11, 10, 0.42);
  font-weight: 750;
}

button[disabled] {
  opacity: 0.64;
}
</style>
