<template>
  <view class="page-shell">
    <view class="topbar">
      <view class="brand-lockup">
        <view class="brand-mark">
          <image class="brand-icon" src="/static/app-icon-bagua.png" mode="aspectFill" />
        </view>
        <view>
          <text class="eyebrow">MEI HUA WEN SHI</text>
          <text class="title">玄问临占</text>
          <text class="subtitle">{{ showReviewMode ? "今日灵感体验" : user ? personalName || "已登录" : "登录后保存问卜" }}</text>
        </view>
      </view>
      <view class="topbar-actions">
        <button v-if="!showReviewMode && user" class="plain-button small topbar-logout" @click="logout">退出</button>
        <button v-if="!showReviewMode" class="icon-button" aria-label="打开记录" @click="setHistoryOpen(true)">
          <text class="history-icon"></text>
        </button>
      </view>
    </view>

    <view v-if="!appConfigLoading && !showReviewMode && user" class="desktop-nav">
      <button
        v-for="item in sectionTabs"
        :key="item.key"
        class="desktop-nav-item"
        :class="{ 'is-active': activeSection === item.key }"
        @click="activeSection = item.key"
      >
        {{ item.label }}
      </button>
    </view>

    <view v-if="appConfigLoading" class="auth-panel">
      <view class="panel-head compact-head">
        <view>
          <text class="panel-kicker">LOADING</text>
          <text class="panel-title">正在进入</text>
        </view>
      </view>
    </view>

    <view v-else-if="showReviewMode" class="review-panel">
      <view class="panel-head">
        <view>
          <text class="panel-kicker">TODAY</text>
          <text class="panel-title">今日灵感签</text>
        </view>
        <text class="daily-limit">体验版</text>
      </view>
      <view class="field">
        <text class="label">今日所想</text>
        <textarea
          v-model="reviewQuestion"
          class="question-input daily-input"
          placeholder="可写下今天最想确认的一件小事。"
          :maxlength="-1"
        />
      </view>
      <view class="shake-stage" :class="{ 'is-shaking': reviewDrawing, 'has-result': reviewOracle }">
        <view class="tube">
          <text class="stick one"></text>
          <text class="stick two"></text>
          <text class="stick three"></text>
        </view>
        <view v-if="reviewOracle" class="fallen-stick">
          <text>{{ reviewOracle.label }}</text>
        </view>
      </view>
      <button class="primary-action" :disabled="reviewDrawing" @click="drawReviewOracle">
        <text>{{ reviewDrawing ? "正在抽取" : "抽今日灵感" }}</text>
        <text class="arrow-line"></text>
      </button>
      <view v-if="reviewOracle" class="daily-result">
        <view class="daily-sign-head">
          <view>
            <text class="daily-sign-name">{{ reviewOracle.name }}</text>
            <text class="meta">{{ todayKey }} · {{ reviewOracle.label }}</text>
          </view>
          <text class="verdict-badge">{{ reviewOracle.label }}</text>
        </view>
        <text class="daily-poem">{{ reviewOracle.poem }}</text>
        <view class="reading-list">
          <text v-for="item in reviewOracle.reading" :key="item" class="reading-item">{{ item }}</text>
        </view>
      </view>
    </view>

    <view v-else-if="!user" class="auth-panel">
      <view class="panel-head compact-head">
        <view>
          <text class="panel-kicker">ACCOUNT</text>
          <text class="panel-title">正在确认登录</text>
        </view>
      </view>
      <text class="helper">未登录时会自动进入登录页。</text>
      <button class="primary-action" @click="redirectToLogin">
        <text>去登录</text>
        <text class="arrow-line"></text>
      </button>
    </view>

    <template v-else>
    <view class="personal-panel mobile-section" :class="{ 'is-active': activeSection === 'info' }">
      <view class="panel-head">
        <view>
          <text class="panel-kicker">PERSONAL PLATE</text>
          <text class="panel-title">个人盘</text>
        </view>
        <view class="panel-side-actions">
          <button class="plain-button small" @click="openProfileOnboarding">AI建档</button>
          <text class="daily-limit">{{ personalMemory?.totalQuestions ? `${personalMemory.totalQuestions}条记忆` : personalInfoReady ? "已填写" : "待填写" }}</text>
        </view>
      </view>
      <view v-if="shouldShowOnboarding" class="onboarding-card">
        <view class="memory-head">
          <view>
            <text class="section-title">AI 建档</text>
            <text class="meta">{{ personalInfoReady ? "补全个人盘资料" : "先用几句话建立个人盘" }}</text>
          </view>
          <button v-if="personalInfoReady" class="plain-button small" @click="onboardingOpen = !onboardingOpen">
            {{ onboardingOpen ? "收起" : "打开" }}
          </button>
        </view>
        <template v-if="onboardingOpen || !personalInfoReady">
          <view class="onboarding-chat">
            <view
              v-for="(message, index) in onboardingMessages"
              :key="`${message.role}-${index}`"
              class="onboarding-message"
              :class="`is-${message.role}`"
            >
              <text>{{ message.content }}</text>
            </view>
            <view v-if="onboardingLoading" class="onboarding-message is-assistant">
              <text>正在整理你的资料...</text>
            </view>
          </view>
          <view v-if="onboardingPreviewItems.length" class="onboarding-preview">
            <text v-for="item in onboardingPreviewItems" :key="item" class="preview-chip">{{ item }}</text>
          </view>
          <view class="onboarding-input-row">
            <textarea
              v-model="onboardingDraft"
              class="onboarding-input"
              auto-height
              maxlength="260"
              placeholder="直接回答即可，例如：我是女生，1996年农历八月十五晚上九点左右，常住杭州，最近主要看事业和感情。"
            />
            <button class="plain-button small" :disabled="onboardingLoading" @click="submitOnboardingAnswer">
              发送
            </button>
          </view>
          <view class="onboarding-actions">
            <button class="primary-action compact-action" :disabled="!onboardingCandidate || personalInfoSaving" @click="saveOnboardingInfo">
              <text>{{ personalInfoSaving ? "保存中" : onboardingDone ? "保存建档" : "先保存已获取" }}</text>
              <text class="arrow-line"></text>
            </button>
            <button class="plain-button small" :disabled="onboardingLoading" @click="restartOnboarding">重问</button>
          </view>
          <text v-if="onboardingError" class="chat-error">{{ onboardingError }}</text>
        </template>
      </view>
      <view class="memory-panel">
        <view class="memory-head">
          <view>
            <text class="section-title">记忆与主动提醒</text>
            <text class="meta">{{ personalMemory ? `更新于 ${formatDate(personalMemory.updatedAt)}` : "随着问卜记录逐步形成" }}</text>
          </view>
          <button class="plain-button small" :disabled="personalMemoryLoading" @click="loadPersonalMemory">
            {{ personalMemoryLoading ? "刷新中" : "刷新" }}
          </button>
        </view>
        <text class="memory-summary">{{ personalMemory?.memoryText || "先填写个人信息，并完成几次问卜，我会逐步记住你的关注主题、近期阻碍和可推进窗口。" }}</text>
        <view v-if="personalNotices.length" class="notice-list">
          <view v-for="notice in personalNotices" :key="notice.title" class="notice-card" :class="`is-${notice.level}`">
            <text>{{ notice.title }}</text>
            <text>{{ notice.body }}</text>
          </view>
        </view>
        <view v-if="memoryStats.length" class="memory-stat-row">
          <text v-for="item in memoryStats" :key="item.label">{{ item.label }} {{ item.count }}</text>
        </view>
        <text v-if="personalMemoryError" class="chat-error">{{ personalMemoryError }}</text>
      </view>
      <view class="push-panel">
        <view class="memory-head">
          <view>
            <text class="section-title">主动推送</text>
            <text class="meta">{{ pushStatusText }}</text>
          </view>
          <text class="push-badge" :class="{ 'is-on': pushSubscribed }">{{ pushSubscribed ? "已开启" : "未开启" }}</text>
        </view>
        <text class="memory-summary">开启后，个人盘形成新的提醒时，可以通过浏览器通知推给你。iPhone 需要先把网站添加到主屏幕后再开启。</text>
        <view class="push-actions">
          <button v-if="!pushSubscribed" class="primary-action compact-action" :disabled="pushLoading || !pushSupported" @click="enableWebPush">
            <text>{{ pushLoading ? "处理中" : "开启推送" }}</text>
            <text class="arrow-line"></text>
          </button>
          <button v-else class="plain-wide-button" :disabled="pushLoading" @click="disableWebPush">关闭推送</button>
          <button class="plain-button small" :disabled="pushLoading || !pushSubscribed" @click="sendTestPush">测试</button>
        </view>
        <text v-if="pushError" class="chat-error">{{ pushError }}</text>
      </view>
      <view class="daily-extra-grid">
        <view class="field compact">
          <text class="label">称呼</text>
          <input v-model="personalName" class="number-input" placeholder="如 我自己" />
        </view>
        <view class="field compact">
          <text class="label">出生日期</text>
          <picker mode="date" :value="personalBirthDate" :end="todayKey" @change="onBirthDateChange">
            <view class="number-input picker-input" :class="{ 'is-placeholder': !personalBirthDate }">
              {{ personalBirthDate || "请选择出生日期" }}
            </view>
          </picker>
        </view>
      </view>
      <view class="daily-extra-grid">
        <view class="field compact">
          <text class="label">出生时间</text>
          <picker mode="time" :value="personalBirthTime" @change="onBirthTimeChange">
            <view class="number-input picker-input" :class="{ 'is-placeholder': !personalBirthTime }">
              {{ personalBirthTime || "请选择出生时间" }}
            </view>
          </picker>
        </view>
        <view class="field compact">
          <text class="label">定位</text>
          <button class="plain-wide-button location-button" :disabled="locationLoading" @click="requestLocation">
            {{ locationLoading ? "定位中" : locationText || "获取位置" }}
          </button>
        </view>
      </view>
      <view class="daily-extra-grid">
        <view class="field compact">
          <text class="label">日期类型</text>
          <picker :range="birthCalendarOptions" range-key="label" :value="birthCalendarIndex" @change="onBirthCalendarChange">
            <view class="number-input picker-input">{{ birthCalendarLabel }}</view>
          </picker>
        </view>
        <view class="field compact">
          <text class="label">性别/称谓</text>
          <picker :range="genderOptions" range-key="label" :value="genderIndex" @change="onGenderChange">
            <view class="number-input picker-input">{{ genderLabel }}</view>
          </picker>
        </view>
      </view>
      <view class="daily-extra-grid">
        <view class="field compact">
          <text class="label">出生地</text>
          <input v-model="personalBirthPlace" class="number-input" placeholder="如 湖北武汉" />
        </view>
        <view class="field compact">
          <text class="label">常住地</text>
          <input v-model="personalCurrentCity" class="number-input" placeholder="如 上海" />
        </view>
      </view>
      <view class="field compact">
        <text class="label">关注方向</text>
        <input v-model="personalFocusText" class="number-input" placeholder="如 事业、感情、财务" />
      </view>
      <view class="field compact">
        <text class="label">补充信息</text>
        <input v-model="personalNote" class="number-input" placeholder="可选：当前状态、长期背景、关注方向" />
      </view>
      <button class="primary-action" :disabled="personalInfoSaving" @click="savePersonalInfo">
        <text>{{ personalInfoSaving ? "正在保存" : "保存个人信息" }}</text>
        <text class="arrow-line"></text>
      </button>
      <text class="error-text">{{ personalInfoError || locationError }}</text>
    </view>

    <view class="tag-panel" :class="{ 'is-active': activeSection === 'daily' || activeSection === 'mei' }">
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

      <view class="context-list">
        <view class="context-row">
          <text>定位</text>
          <text>{{ locationText || "未获取" }}</text>
        </view>
        <view class="context-row">
          <text>个人信息</text>
          <text>{{ personalInfoSummary || "未填写" }}</text>
        </view>
      </view>

      <view class="shake-stage" :class="{ 'is-shaking': dailyDrawing, 'has-result': dailyOracle }">
        <view class="tube">
          <text class="stick one"></text>
          <text class="stick two"></text>
          <text class="stick three"></text>
        </view>
        <view v-if="!dailyOracle && dailyShakeCount" class="shake-counter">
          <text>已摇 {{ dailyShakeCount }}/3</text>
        </view>
        <view v-if="dailyOracle" class="fallen-stick">
          <text>第 {{ dailyOracle.signNumber }} 签</text>
        </view>
      </view>

      <button class="primary-action" :disabled="dailyDrawing || Boolean(dailyOracle)" @click="drawDailyOracle">
        <text>{{ dailyShakeLabel }}</text>
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
        <view class="ai-box">
          <view class="ai-status" :class="{ 'is-loading': dailyAiLoading }">
            <view class="ai-status-copy">
              <text class="ai-status-kicker">AI READING</text>
              <text class="ai-status-title">{{ dailyAiLoading ? "AI 深断中" : "AI 深断" }}</text>
            </view>
            <text class="ai-status-dot"></text>
          </view>
          <view v-if="dailyAiVisible" class="ai-output">
            <view v-if="dailyAiNote" class="ai-note">{{ dailyAiNote }}</view>
            <view v-else class="ai-report">
              <view v-for="(section, index) in dailyAiSections" :key="section.title + index" class="ai-section">
                <text v-if="section.title" class="ai-title">{{ section.title }}</text>
                <text v-for="paragraph in section.paragraphs" :key="paragraph" class="ai-paragraph">{{ paragraph }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="followup-panel">
          <view class="followup-head">
            <text class="section-title plain">继续追问</text>
            <text>围绕今日签追问；若是新事情，建议重新起卦。</text>
          </view>
          <view class="chat-list">
            <view v-if="!dailySession.messages.length" class="chat-empty">
              <text>可以追问“今天具体该注意什么”“这件事该主动还是等”。</text>
            </view>
            <view
              v-for="(message, index) in dailySession.messages"
              :key="index"
              class="chat-message"
              :class="message.role === 'user' ? 'is-user' : 'is-assistant'"
            >
              <text class="chat-bubble">{{ cleanAiText(message.content) }}</text>
            </view>
          </view>
          <view class="chat-composer">
            <textarea
              :value="getFollowupDraft(dailyOracle.id)"
              class="followup-input"
              placeholder="比如：今天这件事更适合主动还是等待？"
              @input="setFollowupDraft(dailyOracle.id, $event.detail.value)"
            />
            <button class="send-button" :disabled="isFollowupLoading(dailyOracle.id)" aria-label="发送追问" @click="requestFollowupFor(dailyOracle)">
              <text class="send-icon"></text>
            </button>
          </view>
          <text class="chat-error">{{ getFollowupError(dailyOracle.id) }}</text>
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
      <view class="method-filter-row">
        <button
          v-for="item in methodFilters"
          :key="item.key"
          class="method-filter"
          :class="{ 'is-active': methodFilter === item.key }"
          @click="setMethodFilter(item.key)"
        >
          {{ item.label }}
        </button>
      </view>
      <view class="method-picker">
        <button
          v-for="item in visibleMethodGuides"
          :key="item.name"
          class="method-option"
          :class="{ 'is-selected': selectedGuideKey === item.key }"
          @click="selectMethodGuide(item)"
        >
          <text class="method-name">{{ item.name }}</text>
          <text class="method-option-meta">{{ item.groupLabel }} · {{ item.speed }} · {{ item.depth }}</text>
        </button>
      </view>

      <view v-if="selectedMethodGuide" class="method-detail">
        <view class="method-detail-head">
          <view>
            <text class="method-name">{{ selectedMethodGuide.name }}</text>
            <text class="method-fit">{{ selectedMethodGuide.fit }}</text>
          </view>
          <text class="method-status">{{ selectedMethodGuide.groupLabel }}</text>
        </view>
        <view class="method-meta-row">
          <text>{{ selectedMethodGuide.speed }}</text>
          <text>{{ selectedMethodGuide.depth }}</text>
          <text>{{ selectedMethodGuide.input }}</text>
        </view>
        <view class="analysis-grid">
          <view class="fact-row"><text>适合</text><text>{{ selectedMethodGuide.scopes.join("、") }}</text></view>
          <view class="fact-row"><text>需要</text><text>{{ selectedMethodGuide.required }}</text></view>
          <view class="fact-row"><text>起法</text><text>{{ selectedMethodGuide.castMode }}</text></view>
          <view class="fact-row"><text>结果</text><text>{{ selectedMethodGuide.resultShape }}</text></view>
          <view class="fact-row"><text>AI</text><text>{{ selectedMethodGuide.aiFocus }}</text></view>
        </view>
        <view v-if="selectedGuideKey === 'daily' || selectedGuideKey === 'mei'" class="method-entry-actions">
          <button class="primary-action" @click="openSelectedMethod">
            <text>{{ selectedGuideKey === "daily" ? "进入今日问卜" : "进入梅花问事" }}</text>
            <text class="arrow-line"></text>
          </button>
        </view>
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
        <view class="context-list">
          <view class="context-row">
            <text>定位</text>
            <text>{{ locationText || "未获取" }}</text>
          </view>
          <view class="context-row">
            <text>个人信息</text>
            <text>{{ personalInfoSummary || "未填写" }}</text>
          </view>
        </view>
        <view v-if="advancedMethod === 'personal' && !hasRequiredPersonalInfo" class="info-warning">
          <text>个人盘需要先在“我的”里填写出生日期。</text>
        </view>
        <view v-if="needsLiuYaoShake" class="yao-shake-panel">
          <view class="yao-shake-head">
            <view>
              <text class="section-title">手摇六爻</text>
              <text class="meta">{{ liuYaoShakeComplete ? "六爻已成" : `第 ${liuYaoShakeCount + 1} 爻 / 共 6 爻` }}</text>
            </view>
            <button class="plain-button" :disabled="advancedCasting || liuYaoShaking || !liuYaoShakeCount" @click="resetLiuYaoShake">重摇</button>
          </view>
          <view class="yao-line-grid">
            <view
              v-for="index in 6"
              :key="index"
              class="yao-line-cell"
              :class="{ 'is-filled': Boolean(liuYaoShakeValues[index - 1]) }"
            >
              <text>第{{ index }}爻</text>
              <text>{{ formatYaoValue(liuYaoShakeValues[index - 1]) }}</text>
            </view>
          </view>
          <button class="plain-wide-button" :disabled="advancedCasting || liuYaoShaking || liuYaoShakeComplete" @click="shakeLiuYaoLine">
            <text>{{ liuYaoShaking ? "正在摇爻" : liuYaoShakeComplete ? "六爻已成" : `摇第 ${liuYaoShakeCount + 1} 爻` }}</text>
          </button>
        </view>
        <button class="primary-action" :disabled="advancedCasting || !canCastAdvanced" @click="castAdvanced">
          <text>{{ advancedCastLabel }}</text>
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
          <view class="ai-box">
            <view class="ai-status" :class="{ 'is-loading': advancedAiLoading }">
              <view class="ai-status-copy">
                <text class="ai-status-kicker">AI READING</text>
                <text class="ai-status-title">{{ advancedAiLoading ? "AI 深断中" : "AI 深断" }}</text>
              </view>
              <text class="ai-status-dot"></text>
            </view>
            <view v-if="advancedAiVisible" class="ai-output">
              <view v-if="advancedAiNote" class="ai-note">{{ advancedAiNote }}</view>
              <view v-else class="ai-report">
                <view v-for="(section, index) in advancedAiSections" :key="section.title + index" class="ai-section">
                  <text v-if="section.title" class="ai-title">{{ section.title }}</text>
                  <text v-for="paragraph in section.paragraphs" :key="paragraph" class="ai-paragraph">{{ paragraph }}</text>
                </view>
              </view>
            </view>
          </view>

          <view class="followup-panel">
            <view class="followup-head">
              <text class="section-title plain">继续追问</text>
              <text>围绕当前结果追问；若是新事情，建议重新起卦。</text>
            </view>
            <view class="chat-list">
              <view v-if="!advancedSession.messages.length" class="chat-empty">
                <text>可以追问“关键阻碍是什么”“下一步该怎么做”“应期怎么看”。</text>
              </view>
              <view
                v-for="(message, index) in advancedSession.messages"
                :key="index"
                class="chat-message"
                :class="message.role === 'user' ? 'is-user' : 'is-assistant'"
              >
                <text class="chat-bubble">{{ cleanAiText(message.content) }}</text>
              </view>
            </view>
            <view class="chat-composer">
              <textarea
                :value="getFollowupDraft(advancedResult.id)"
                class="followup-input"
                placeholder="比如：这个判断里最该抓哪一点？"
                @input="setFollowupDraft(advancedResult.id, $event.detail.value)"
              />
              <button class="send-button" :disabled="isFollowupLoading(advancedResult.id)" aria-label="发送追问" @click="requestFollowupFor(advancedResult)">
                <text class="send-icon"></text>
              </button>
            </view>
            <text class="chat-error">{{ getFollowupError(advancedResult.id) }}</text>
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
          <view class="ai-status" :class="{ 'is-loading': aiLoading }">
            <view class="ai-status-copy">
              <text class="ai-status-kicker">AI READING</text>
              <text class="ai-status-title">{{ aiLoading ? "AI 深断中" : "AI 深断" }}</text>
            </view>
            <text class="ai-status-dot"></text>
          </view>
          <view v-if="aiVisible" class="ai-output">
            <view v-if="aiNote" class="ai-note">{{ aiNote }}</view>
            <view v-else class="ai-report">
              <view v-for="(section, index) in aiSections" :key="section.title + index" class="ai-section">
                <text v-if="section.title" class="ai-title">{{ section.title }}</text>
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
            <textarea
              :value="getFollowupDraft(current.id)"
              class="followup-input"
              placeholder="比如：阻碍具体指什么？我接下来该主动还是等？"
              @input="setFollowupDraft(current.id, $event.detail.value)"
            />
              <button class="send-button" :disabled="isFollowupLoading(current.id)" aria-label="发送追问" @click="requestFollowupFor(current)">
                <text class="send-icon"></text>
              </button>
          </view>
          <text class="chat-error">{{ getFollowupError(current.id) }}</text>
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
  <view v-if="!appConfigLoading && !showReviewMode && user" class="mobile-bottom-nav">
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
</template>

<script setup>
import { computed, defineComponent, h, ref } from "vue";

const API_BASE_URL = "https://wenshi.cccode.com.cn";
const PUSH_WORKER_URL = "/push-worker.js?v=20260624";
const DIRECT_READING_RULES =
  "回答风格要直接。第一句话必须先给明确判断，例如“建议推进”“先别动”“偏吉但要慢”“不建议现在做”，不要以“可能、也许、看情况”开头。后面再讲原因和动作。少用模棱两可词；如果卦象确实矛盾，也要说明主倾向和次要风险。必须给出一到三个具体行动建议。可以提醒占卜不是绝对，但不要反复免责声明。";
const PERSONAL_READING_RULES =
  "这是个人盘，不要按普通一事一占回答。必须分清长期底盘和当前阶段，直接覆盖资产、事业、健康作息、关系、迁移环境、主要风险、机会窗口。每一项都要给明确倾向和可执行建议，不要只说泛泛的性格描述。健康和资产只能做趋势提醒，不给医疗诊断或具体投资指令。";
const categories = ["事业", "感情", "财运", "合作", "出行", "其他"];
const sectionTabs = [
  { key: "daily", label: "今日" },
  { key: "mei", label: "问事" },
  { key: "methods", label: "方式" },
  { key: "info", label: "个人盘" }
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
const methodFilters = [
  { key: "all", label: "全部" },
  { key: "fast", label: "快断" },
  { key: "event", label: "问事" },
  { key: "strategy", label: "策略" },
  { key: "self", label: "个人" }
];
const reviewSigns = [
  {
    name: "清风拂案",
    label: "宜缓",
    poem: "急处先停半步，静中自有回音。",
    reading: ["今天适合先理清顺序，再推进关键一步。", "遇到催促时不急着表态，留一点确认空间。"]
  },
  {
    name: "灯火初明",
    label: "可试",
    poem: "一点微光可引路，小行胜过久徘徊。",
    reading: ["适合做一个低成本尝试，用结果判断下一步。", "不要把事情一次做满，先拿到真实反馈。"]
  },
  {
    name: "云开见月",
    label: "渐顺",
    poem: "前路未必全明，所行处已有光。",
    reading: ["今天的阻力会比想象中小，但仍要按节奏来。", "把话说清，把边界立住，事情会更稳。"]
  },
  {
    name: "石上听泉",
    label: "宜守",
    poem: "不争一时快慢，守住便是转机。",
    reading: ["暂时不适合强推，适合观察对方反应。", "先保留资源和情绪，等待更明确的信号。"]
  }
];
const methodGuides = [
  {
    key: "daily",
    group: "fast",
    groupLabel: "日课",
    name: "今日签",
    ready: true,
    speed: "最快",
    depth: "轻量",
    input: "自动",
    fit: "适合今日状态、轻量提醒、当天宜忌与行动校准。",
    scopes: ["今日运势", "当天宜忌", "情绪校准"],
    required: "账号个人信息可选，定位自动带入。",
    castMode: "一日一签，后端按账号复用当日结果。",
    resultShape: "签名、签诗、关键词、基础解签、AI 深断。",
    aiFocus: "把签意落到当天行动建议。"
  },
  {
    key: "mei",
    group: "event",
    groupLabel: "临占",
    name: "梅花易数",
    ready: true,
    speed: "较快",
    depth: "中等",
    input: "时间/数字",
    fit: "适合一事一问、临时起意、看当前气机和走势。",
    scopes: ["临时起意", "短期走势", "成败倾向"],
    required: "需要写清一个具体问题，可选时间起卦或数字起卦。",
    castMode: "时间起卦或三数起卦，排本卦、互卦、变卦。",
    resultShape: "本互变卦、动爻、体用、生克、白话断语、AI 深断和追问。",
    aiFocus: "解释体用生克和动爻对应的阻碍、转机、应对。"
  },
  {
    key: "xiaoliuren",
    group: "fast",
    groupLabel: "快断",
    name: "小六壬",
    ready: true,
    speed: "最快",
    depth: "简断",
    input: "月日时",
    fit: "适合快速判断来不来、成不成、等不等、去不去。",
    scopes: ["等消息", "去不去", "能不能成"],
    required: "需要一个具体问题，后端自动取当前月日时。",
    castMode: "按月、日、时取数，落大安、留连、速喜、赤口、小吉、空亡。",
    resultShape: "落宫、倾向、快断建议、AI 深断。",
    aiFocus: "把快断结果翻译成当下该催、该等、该避还是该试。"
  },
  {
    key: "liuyao",
    group: "event",
    groupLabel: "重问",
    name: "六爻",
    ready: true,
    speed: "中等",
    depth: "较深",
    input: "自动摇卦",
    fit: "适合重要事项、关系复杂、要看动爻、变化和应期。",
    scopes: ["重要决定", "关系变化", "应期线索"],
    required: "需要明确问题；后续可继续加入手动摇卦和装卦。",
    castMode: "自动生成六爻值，排本卦、变卦和动爻。",
    resultShape: "本卦、变卦、动爻、六爻值、基础断语、AI 深断。",
    aiFocus: "围绕动爻、变卦和阶段变化解释关键节点。"
  },
  {
    key: "qimen",
    group: "strategy",
    groupLabel: "谋局",
    name: "奇门",
    ready: true,
    speed: "中等",
    depth: "策略",
    input: "时局",
    fit: "适合行动策略、方位选择、布局和大方向判断。",
    scopes: ["行动策略", "合作谈判", "方向选择"],
    required: "需要明确行动目标，定位会自动带入作背景参考。",
    castMode: "按当前时局生成简化九宫盘，取门、星、神和可用宫。",
    resultShape: "九宫门星神、建议方位、行动建议、AI 深断。",
    aiFocus: "把可用门和宫位转成沟通、推进、避险策略。"
  },
  {
    key: "personal",
    group: "self",
    groupLabel: "长期",
    name: "个人盘",
    ready: true,
    speed: "一次填",
    depth: "长期",
    input: "生日",
    fit: "适合长期背景、阶段趋势和个人状态，不适合临时小事。",
    scopes: ["阶段趋势", "自我状态", "长期背景"],
    required: "必须先在“我的”填写出生日期，出生时间建议填写。",
    castMode: "按出生日期和时间生成个人长期背景提示。",
    resultShape: "年柱、生肖、五行提示、阶段建议、AI 深断。",
    aiFocus: "把个人背景和当前主题结合，给阶段性方向建议。"
  }
];
const advancedMethodKeys = ["xiaoliuren", "liuyao", "qimen", "personal"];
const birthCalendarOptions = [
  { value: "solar", label: "阳历" },
  { value: "lunar", label: "农历" },
  { value: "unknown", label: "不确定" }
];
const genderOptions = [
  { value: "unknown", label: "不限定" },
  { value: "female", label: "女" },
  { value: "male", label: "男" },
  { value: "other", label: "其他" }
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
const dailyOracle = ref(null);
const dailyDrawing = ref(false);
const dailyShakeValues = ref([]);
const dailyError = ref("");
const reviewQuestion = ref("");
const reviewOracle = ref(null);
const reviewDrawing = ref(false);
const current = ref(null);
const history = ref(loadJsonStorage("mei-hua-history", []));
const aiSessions = ref(loadJsonStorage("mei-hua-ai-sessions", {}));
const aiVisible = ref(false);
const aiLoading = ref(false);
const aiNote = ref("");
const aiSections = ref([]);
const dailyAiVisible = ref(false);
const dailyAiLoading = ref(false);
const dailyAiNote = ref("");
const dailyAiSections = ref([]);
const advancedAiVisible = ref(false);
const advancedAiLoading = ref(false);
const advancedAiNote = ref("");
const advancedAiSections = ref([]);
const followupDrafts = ref({});
const followupLoadingMap = ref({});
const followupErrors = ref({});
const historyOpen = ref(false);
const activeSection = ref("daily");
const authMode = ref("login");
const authPhone = ref("");
const authPassword = ref("");
const authError = ref("");
const authLoading = ref(false);
const authToken = ref(getStorage("auth-token") || "");
const user = ref(null);
const selectedTags = ref(loadJsonStorage("wenshi-selected-tags", []));
const methodFilter = ref("all");
const advancedMethod = ref("xiaoliuren");
const advancedQuestion = ref("");
const advancedCasting = ref(false);
const advancedError = ref("");
const advancedResult = ref(null);
const liuYaoShakeValues = ref([]);
const liuYaoShaking = ref(false);
const selectedGuideKey = ref("xiaoliuren");
const personalName = ref("");
const personalBirthDate = ref("");
const personalBirthTime = ref("12:00");
const personalBirthCalendar = ref("solar");
const personalGender = ref("unknown");
const personalBirthPlace = ref("");
const personalCurrentCity = ref("");
const personalFocusText = ref("");
const personalNote = ref("");
const personalInfoSaving = ref(false);
const personalInfoError = ref("");
const personalMemory = ref(null);
const personalMemoryLoading = ref(false);
const personalMemoryError = ref("");
const onboardingOpen = ref(false);
const onboardingStarted = ref(false);
const onboardingMessages = ref([]);
const onboardingDraft = ref("");
const onboardingLoading = ref(false);
const onboardingError = ref("");
const onboardingCandidate = ref(null);
const onboardingDone = ref(false);
const pushSupported = ref(false);
const pushPermission = ref("default");
const pushSubscribed = ref(false);
const pushLoading = ref(false);
const pushError = ref("");
const autoLocation = ref(loadJsonStorage("wenshi-auto-location", null));
const locationLoading = ref(false);
const locationError = ref("");
const appConfigLoading = ref(true);
const miniProgramReviewMode = ref(false);

const selectedTagLabels = computed(() => selectedTags.value.filter((label) => quickTags.some((tag) => tag.label === label)));
const visibleMethodGuides = computed(() => getMethodGuidesByFilter(methodFilter.value));
const selectedMethodGuide = computed(() => methodGuides.find((item) => item.key === selectedGuideKey.value) || methodGuides[0]);
const isAdvancedMethod = computed(() => advancedMethodKeys.includes(selectedGuideKey.value));
const currentMethodGuide = computed(() => methodGuides.find((item) => item.key === advancedMethod.value) || methodGuides[2]);
const personalInfoReady = computed(() => Boolean(personalBirthDate.value));
const hasRequiredPersonalInfo = computed(() => Boolean(personalBirthDate.value));
const personalInfoSummary = computed(() => buildPersonalInfoSummary());
const shouldShowOnboarding = computed(() => onboardingOpen.value || !personalInfoReady.value);
const birthCalendarIndex = computed(() => Math.max(0, birthCalendarOptions.findIndex((item) => item.value === personalBirthCalendar.value)));
const birthCalendarLabel = computed(() => birthCalendarOptions[birthCalendarIndex.value]?.label || "阳历");
const genderIndex = computed(() => Math.max(0, genderOptions.findIndex((item) => item.value === personalGender.value)));
const genderLabel = computed(() => genderOptions[genderIndex.value]?.label || "不限定");
const onboardingPreviewItems = computed(() => buildOnboardingPreview(onboardingCandidate.value));
const pushStatusText = computed(() => {
  if (!pushSupported.value) return "当前浏览器暂不支持 Web Push";
  if (pushSubscribed.value) return "这台设备会接收个人盘提醒";
  if (pushPermission.value === "denied") return "浏览器已拒绝通知权限";
  return "需要你授权浏览器通知";
});
const personalNotices = computed(() => personalMemory.value?.notices || []);
const memoryStats = computed(() => [
  ...(personalMemory.value?.categoryStats || []).slice(0, 3),
  ...(personalMemory.value?.methodStats || []).slice(0, 2)
]);
const locationText = computed(() => formatLocation(autoLocation.value));
const dailyShakeCount = computed(() => dailyShakeValues.value.length);
const dailyShakeLabel = computed(() => {
  if (dailyOracle.value) return "今日签已生成";
  if (dailyDrawing.value) return dailyShakeCount.value >= 3 ? "正在取签" : "承签中";
  return `摇签 ${Math.min(dailyShakeCount.value + 1, 3)}/3`;
});
const needsLiuYaoShake = computed(() => advancedMethod.value === "liuyao");
const liuYaoShakeCount = computed(() => liuYaoShakeValues.value.length);
const liuYaoShakeComplete = computed(() => liuYaoShakeCount.value >= 6);
const canCastAdvanced = computed(() => {
  if (advancedMethod.value === "personal" && !hasRequiredPersonalInfo.value) return false;
  if (needsLiuYaoShake.value && !liuYaoShakeComplete.value) return false;
  return true;
});
const advancedCastLabel = computed(() => {
  if (advancedCasting.value) return "正在推演";
  if (needsLiuYaoShake.value && !liuYaoShakeComplete.value) return `先摇六爻 ${liuYaoShakeCount.value}/6`;
  return "开始推演";
});
const todayKey = computed(() => getTodayKey());
const showReviewMode = computed(() => miniProgramReviewMode.value && isMiniProgramRuntime());

const currentSession = computed(() => {
  if (!current.value) return { reading: "", messages: [] };
  return getAiSession(current.value.id);
});
const dailySession = computed(() => {
  if (!dailyOracle.value) return { reading: "", messages: [] };
  return getAiSession(dailyOracle.value.id);
});
const advancedSession = computed(() => {
  if (!advancedResult.value) return { reading: "", messages: [] };
  return getAiSession(advancedResult.value.id);
});

dailyOracle.value = loadDailyOracle();

loadAppConfig();

async function loadAppConfig() {
  try {
    const payload = await requestGet("/api/app-config", { skipAuth: true });
    miniProgramReviewMode.value = Boolean(payload.miniProgramReviewMode);
  } catch {
    miniProgramReviewMode.value = false;
  } finally {
    appConfigLoading.value = false;
    if (!showReviewMode.value && authToken.value) {
      loadMe();
    } else if (!showReviewMode.value) {
      redirectToLogin();
    }
  }
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
  syncPersonalInfo(payload.user?.personalInfo);
  syncAccountContext();
  loadPersonalMemory();
  if (!personalInfoReady.value) {
    activeSection.value = "info";
    openProfileOnboarding();
  }
}

function logout() {
  authToken.value = "";
  user.value = null;
  personalMemory.value = null;
  removeStorage("auth-token");
  dailyOracle.value = null;
  redirectToLogin();
}

function redirectToLogin() {
  if (showReviewMode.value) return;
  if (typeof uni !== "undefined" && uni.redirectTo) {
    uni.redirectTo({ url: "/pages/login/login" });
    return;
  }
  if (typeof window !== "undefined" && !window.location.pathname.includes("/pages/login/login")) {
    window.location.href = "/pages/login/login";
  }
}

function syncPersonalInfo(info = {}) {
  personalName.value = info.name || personalName.value || "我自己";
  personalBirthDate.value = info.birthDate || "";
  personalBirthTime.value = info.birthTime || "12:00";
  personalBirthCalendar.value = info.birthCalendar || "solar";
  personalGender.value = info.gender || "unknown";
  personalBirthPlace.value = info.birthPlace || "";
  personalCurrentCity.value = info.currentCity || "";
  personalFocusText.value = Array.isArray(info.focusAreas) ? info.focusAreas.join("、") : "";
  personalNote.value = info.note || "";
}

function onBirthDateChange(event) {
  personalBirthDate.value = event.detail.value;
}

function onBirthTimeChange(event) {
  personalBirthTime.value = event.detail.value;
}

function onBirthCalendarChange(event) {
  personalBirthCalendar.value = birthCalendarOptions[Number(event.detail.value)]?.value || "solar";
}

function onGenderChange(event) {
  personalGender.value = genderOptions[Number(event.detail.value)]?.value || "unknown";
}

function syncAccountContext() {
  dailyOracle.value = loadDailyOracle();
  if (!autoLocation.value) requestLocation({ silent: true });
  refreshPushStatus();
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

async function savePersonalInfo() {
  personalInfoError.value = "";
  personalInfoSaving.value = true;
  try {
    const payload = await requestJson("/api/user/info", {
      name: personalName.value.trim(),
      birthDate: personalBirthDate.value,
      birthTime: personalBirthTime.value || "12:00",
      birthCalendar: personalBirthCalendar.value,
      gender: personalGender.value,
      birthPlace: personalBirthPlace.value.trim(),
      currentCity: personalCurrentCity.value.trim(),
      focusAreas: splitFocusAreas(personalFocusText.value),
      note: personalNote.value.trim()
    });
    user.value = payload.user;
    syncPersonalInfo(payload.user?.personalInfo);
    personalInfoError.value = "个人信息已保存。";
    onboardingOpen.value = false;
    loadPersonalMemory();
  } catch (error) {
    personalInfoError.value = `保存失败：${error.message}`;
  } finally {
    personalInfoSaving.value = false;
  }
}

function openProfileOnboarding() {
  onboardingOpen.value = true;
  if (!onboardingStarted.value) {
    requestProfileOnboarding();
  }
}

function restartOnboarding() {
  onboardingStarted.value = false;
  onboardingMessages.value = [];
  onboardingDraft.value = "";
  onboardingCandidate.value = null;
  onboardingDone.value = false;
  onboardingError.value = "";
  requestProfileOnboarding();
}

async function submitOnboardingAnswer() {
  const text = onboardingDraft.value.trim();
  if (!text || onboardingLoading.value) return;
  onboardingMessages.value = [...onboardingMessages.value, { role: "user", content: text }];
  onboardingDraft.value = "";
  await requestProfileOnboarding();
}

async function requestProfileOnboarding() {
  if (!authToken.value || onboardingLoading.value) return;
  onboardingStarted.value = true;
  onboardingLoading.value = true;
  onboardingError.value = "";
  try {
    const payload = await requestJson("/api/onboarding/profile", {
      messages: onboardingMessages.value
    });
    const reply = String(payload.reply || "").trim();
    if (reply) {
      onboardingMessages.value = [...onboardingMessages.value, { role: "assistant", content: reply }];
    }
    onboardingCandidate.value = normalizeOnboardingInfo(payload.personalInfo);
    onboardingDone.value = Boolean(payload.done);
  } catch (error) {
    onboardingError.value = `AI 建档失败：${error.message}`;
  } finally {
    onboardingLoading.value = false;
  }
}

async function saveOnboardingInfo() {
  const info = normalizeOnboardingInfo(onboardingCandidate.value);
  if (!info) return;
  applyPersonalInfoDraft(info);
  await savePersonalInfo();
}

function applyPersonalInfoDraft(info) {
  personalName.value = info.name || personalName.value || "我自己";
  personalBirthDate.value = info.birthDate || personalBirthDate.value;
  personalBirthTime.value = info.birthTime || personalBirthTime.value || "12:00";
  personalBirthCalendar.value = info.birthCalendar || personalBirthCalendar.value || "solar";
  personalGender.value = info.gender || personalGender.value || "unknown";
  personalBirthPlace.value = info.birthPlace || personalBirthPlace.value;
  personalCurrentCity.value = info.currentCity || personalCurrentCity.value;
  personalFocusText.value = info.focusAreas?.length ? info.focusAreas.join("、") : personalFocusText.value;
  personalNote.value = info.note || personalNote.value;
}

function normalizeOnboardingInfo(value) {
  if (!value || typeof value !== "object") return null;
  const birthCalendar = ["solar", "lunar", "unknown"].includes(value.birthCalendar) ? value.birthCalendar : "solar";
  const gender = ["male", "female", "other", "unknown"].includes(value.gender) ? value.gender : "unknown";
  return {
    name: String(value.name || "").trim().slice(0, 30),
    birthDate: /^\d{4}-\d{2}-\d{2}$/.test(String(value.birthDate || "")) ? String(value.birthDate) : "",
    birthTime: /^\d{2}:\d{2}$/.test(String(value.birthTime || "")) ? String(value.birthTime) : "12:00",
    birthCalendar,
    gender,
    birthPlace: String(value.birthPlace || "").trim().slice(0, 60),
    currentCity: String(value.currentCity || "").trim().slice(0, 60),
    focusAreas: Array.isArray(value.focusAreas) ? value.focusAreas.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 5) : [],
    note: String(value.note || "").trim().slice(0, 160)
  };
}

function buildOnboardingPreview(info) {
  const normalized = normalizeOnboardingInfo(info);
  if (!normalized) return [];
  return [
    normalized.name ? `称呼 ${normalized.name}` : "",
    normalized.birthDate ? `${getBirthCalendarLabel(normalized.birthCalendar)} ${normalized.birthDate} ${normalized.birthTime}` : "",
    normalized.gender !== "unknown" ? `称谓 ${getGenderLabel(normalized.gender)}` : "",
    normalized.birthPlace ? `出生地 ${normalized.birthPlace}` : "",
    normalized.currentCity ? `常住 ${normalized.currentCity}` : "",
    normalized.focusAreas.length ? `关注 ${normalized.focusAreas.join("、")}` : "",
    normalized.note ? normalized.note : ""
  ].filter(Boolean);
}

function splitFocusAreas(value) {
  return String(value || "")
    .split(/[、,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function getBirthCalendarLabel(value) {
  return birthCalendarOptions.find((item) => item.value === value)?.label || "阳历";
}

function getGenderLabel(value) {
  return genderOptions.find((item) => item.value === value)?.label || "不限定";
}

function isWebPushSupported() {
  return typeof window !== "undefined"
    && typeof navigator !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

async function refreshPushStatus() {
  pushSupported.value = isWebPushSupported();
  if (!pushSupported.value) {
    pushPermission.value = "unsupported";
    pushSubscribed.value = false;
    return;
  }
  pushPermission.value = Notification.permission;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    pushSubscribed.value = Boolean(subscription);
  } catch {
    pushSubscribed.value = false;
  }
}

async function getPushRegistration() {
  if (!isWebPushSupported()) throw new Error("当前浏览器不支持 Web Push。");
  if (typeof window !== "undefined" && !window.isSecureContext) {
    throw new Error("Web Push 需要 HTTPS 环境。");
  }
  return navigator.serviceWorker.register(PUSH_WORKER_URL, { scope: "/", updateViaCache: "none" });
}

async function enableWebPush() {
  pushError.value = "";
  pushLoading.value = true;
  try {
    pushSupported.value = isWebPushSupported();
    if (!pushSupported.value) throw new Error("当前浏览器暂不支持 Web Push。iPhone 需要先添加到主屏幕。");
    const permission = await Notification.requestPermission();
    pushPermission.value = permission;
    if (permission !== "granted") throw new Error("你没有允许通知权限。");

    const registration = await getPushRegistration();
    const existing = await registration.pushManager.getSubscription();
    const { publicKey } = await requestGet("/api/push/public-key");
    const subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    await requestJson("/api/push/subscribe", {
      subscription: subscription.toJSON(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : ""
    });
    pushSubscribed.value = true;
    pushError.value = "推送已开启，可以点测试确认。";
  } catch (error) {
    pushError.value = `开启失败：${error.message}`;
  } finally {
    pushLoading.value = false;
  }
}

async function disableWebPush() {
  pushError.value = "";
  pushLoading.value = true;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await requestJson("/api/push/unsubscribe", { endpoint: subscription.endpoint });
      await subscription.unsubscribe();
    }
    pushSubscribed.value = false;
    pushError.value = "这台设备的推送已关闭。";
  } catch (error) {
    pushError.value = `关闭失败：${error.message}`;
  } finally {
    pushLoading.value = false;
  }
}

async function sendTestPush() {
  pushError.value = "";
  pushLoading.value = true;
  try {
    const payload = await requestJson("/api/push/test", {});
    pushError.value = payload.sent ? "测试推送已发送。" : "没有成功发送到当前设备。";
  } catch (error) {
    pushError.value = `测试失败：${error.message}`;
  } finally {
    pushLoading.value = false;
  }
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }
  return output;
}

async function loadPersonalMemory() {
  if (!authToken.value || !user.value) return;
  personalMemoryLoading.value = true;
  personalMemoryError.value = "";
  try {
    const payload = await requestGet("/api/personal-memory");
    personalMemory.value = payload.memory || null;
  } catch (error) {
    personalMemoryError.value = `记忆加载失败：${error.message}`;
  } finally {
    personalMemoryLoading.value = false;
  }
}

function requestLocation(options = {}) {
  const silent = options?.silent === true;
  locationLoading.value = true;
  if (!silent) locationError.value = "";

  const onSuccess = (coords) => {
    autoLocation.value = {
      latitude: Number(coords.latitude),
      longitude: Number(coords.longitude),
      accuracy: Number(coords.accuracy || 0),
      updatedAt: new Date().toISOString()
    };
    setJsonStorage("wenshi-auto-location", autoLocation.value);
    locationError.value = "";
    locationLoading.value = false;
  };
  const onError = (message) => {
    if (!silent) locationError.value = message || "定位失败，请检查浏览器权限。";
    locationLoading.value = false;
  };

  if (typeof uni !== "undefined" && uni.getLocation) {
    uni.getLocation({
      type: "wgs84",
      success: (result) => onSuccess(result),
      fail: (error) => onError(error.errMsg)
    });
    return;
  }

  if (typeof navigator !== "undefined" && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => onSuccess(position.coords),
      (error) => onError(error.message),
      { enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 8000 }
    );
    return;
  }

  onError("当前浏览器不支持定位。");
}

function buildPersonalInfoSummary() {
  const parts = [
    personalName.value.trim() ? `称呼：${personalName.value.trim()}` : "",
    personalBirthDate.value ? `出生：${birthCalendarLabel.value}${personalBirthDate.value} ${personalBirthTime.value || "12:00"}` : "",
    personalGender.value !== "unknown" ? `称谓：${genderLabel.value}` : "",
    personalBirthPlace.value.trim() ? `出生地：${personalBirthPlace.value.trim()}` : "",
    personalCurrentCity.value.trim() ? `常住地：${personalCurrentCity.value.trim()}` : "",
    splitFocusAreas(personalFocusText.value).length ? `关注：${splitFocusAreas(personalFocusText.value).join("、")}` : "",
    personalNote.value.trim() ? `补充：${personalNote.value.trim()}` : ""
  ].filter(Boolean);
  return parts.join("；");
}

function formatLocation(value) {
  if (!value || typeof value !== "object") return "";
  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "";
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

function getMethodGuidesByFilter(filterKey) {
  return filterKey === "all"
    ? methodGuides
    : methodGuides.filter((item) => item.group === filterKey);
}

function setMethodFilter(filterKey) {
  methodFilter.value = filterKey;
  const nextGuides = getMethodGuidesByFilter(filterKey);
  const currentStillVisible = nextGuides.some((item) => item.key === selectedGuideKey.value);
  if (!currentStillVisible && nextGuides[0]) {
    selectMethodGuide(nextGuides[0]);
  }
}

function selectMethodGuide(item) {
  selectedGuideKey.value = item.key;
  activeSection.value = "methods";

  if (!advancedMethodKeys.includes(item.key)) return;
  const methodChanged = advancedMethod.value !== item.key;
  advancedMethod.value = item.key;
  if (methodChanged) {
    advancedError.value = "";
    advancedResult.value = null;
    resetLiuYaoShake();
    resetAdvancedAiState();
  }
}

function openSelectedMethod() {
  if (selectedGuideKey.value === "daily") {
    activeSection.value = "daily";
    return;
  }

  if (selectedGuideKey.value === "mei") {
    activeSection.value = "mei";
  }
}

async function drawReviewOracle() {
  reviewDrawing.value = true;
  reviewOracle.value = null;
  try {
    await new Promise((resolve) => setTimeout(resolve, 760));
    const seed = `${getTodayKey()}:${reviewQuestion.value.trim()}`;
    const index = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) % reviewSigns.length;
    reviewOracle.value = reviewSigns[index];
  } finally {
    reviewDrawing.value = false;
  }
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
    loadPersonalMemory();
    requestAiReading();
  } catch (error) {
    errorText.value = `起卦失败：${error.message}`;
  } finally {
    casting.value = false;
  }
}

async function castAdvanced() {
  advancedError.value = "";
  if (!canCastAdvanced.value) {
    if (advancedMethod.value === "personal" && !hasRequiredPersonalInfo.value) {
      advancedError.value = "个人盘需要先到“我的”填写出生日期。";
      activeSection.value = "info";
    } else if (needsLiuYaoShake.value) {
      advancedError.value = "六爻需要先手摇满六爻。";
    }
    return;
  }
  advancedCasting.value = true;
  try {
    const result = await requestJson("/api/oracle/cast", {
      oracleType: advancedMethod.value,
      question: advancedQuestion.value.trim(),
      category: category.value,
      tags: selectedTagLabels.value,
      location: locationText.value,
      profile: personalName.value.trim() || "我自己",
      personalInfo: personalInfoSummary.value,
      birthDate: personalBirthDate.value,
      birthTime: personalBirthTime.value || "12:00",
      yaoValues: needsLiuYaoShake.value ? liuYaoShakeValues.value : []
    });
    advancedResult.value = result;
    activeSection.value = "methods";
    resetAdvancedAiState();
    saveResult(result);
    loadPersonalMemory();
    requestAdvancedAiReading();
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
    await wait(360);
    dailyShakeValues.value = [...dailyShakeValues.value, createShakeNumber(100)];
    if (dailyShakeValues.value.length < 3) return;

    await wait(520);
    const result = await requestJson("/api/daily-oracle/cast", {
      question: dailyQuestion.value.trim(),
      profile: personalName.value.trim() || "我自己",
      location: locationText.value,
      personalInfo: personalInfoSummary.value,
      tags: selectedTagLabels.value,
      shakeNumbers: dailyShakeValues.value
    });
    dailyOracle.value = result;
    resetDailyAiState();
    setJsonStorage(getDailyOracleStorageKey(), result);
    loadPersonalMemory();
    requestDailyAiReading();
  } catch (error) {
    dailyError.value = `摇签失败：${error.message}`;
    dailyShakeValues.value = [];
  } finally {
    dailyDrawing.value = false;
  }
}

async function shakeLiuYaoLine() {
  if (liuYaoShaking.value || liuYaoShakeComplete.value || advancedCasting.value) return;
  advancedError.value = "";
  liuYaoShaking.value = true;
  try {
    await wait(360);
    liuYaoShakeValues.value = [...liuYaoShakeValues.value, 6 + createShakeNumber(4)];
  } finally {
    liuYaoShaking.value = false;
  }
}

function resetLiuYaoShake() {
  liuYaoShakeValues.value = [];
  liuYaoShaking.value = false;
}

async function requestDailyAiReading() {
  if (!dailyOracle.value) return;
  await requestContextAiReading({
    resultId: dailyOracle.value.id,
    prompt: buildDailyAiPrompt(dailyOracle.value),
    loading: dailyAiLoading,
    visible: dailyAiVisible,
    note: dailyAiNote,
    sections: dailyAiSections,
    system:
      `你是传统问卜和签文解读助手。根据今日签、问题、定位和个人信息做自然的白话解读，像一位有经验的老师在认真回应。不要套固定栏目，不要为了分段而分段，不要宣称绝对准确，不要给医疗、法律、投资等高风险决定下定论。${DIRECT_READING_RULES}`
  });
}

async function requestAdvancedAiReading() {
  if (!advancedResult.value) return;
  await requestContextAiReading({
    resultId: advancedResult.value.id,
    prompt: buildAdvancedAiPrompt(advancedResult.value),
    loading: advancedAiLoading,
    visible: advancedAiVisible,
    note: advancedAiNote,
    sections: advancedAiSections,
    system:
      `你是传统问卜解读助手。根据用户提供的起占方式、结果、事实和问题做自然的白话解读。不要重新起卦，不要套固定栏目，不要为了分段而分段，不要宣称绝对准确，不要给医疗、法律、投资等高风险决定下定论。${DIRECT_READING_RULES}`
  });
}

async function requestContextAiReading({ resultId, prompt, loading, visible, note, sections, system }) {
  loading.value = true;
  visible.value = true;
  note.value = "正在整理问卜结果...";
  sections.value = [];

  try {
    const data = await requestJson("/api/chat/completions", {
      temperature: 0.58,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ]
    });
    const content = cleanAiText(data.choices?.[0]?.message?.content?.trim() || "AI 没有返回可读内容。");
    if (resultId) setAiReading(resultId, content);
    note.value = "";
    await revealAiText(content, sections);
  } catch (error) {
    note.value = `AI 请求失败：${error.message}`;
  } finally {
    loading.value = false;
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
      temperature: 0.58,
      messages: [
        {
          role: "system",
          content:
            `你是传统梅花易数问事助手。只根据用户提供的卦象、体用、生克、动爻和问题做自然的白话分析，像认真看完卦后直接和用户说话。不要套固定栏目，不要为了分段而分段，不要宣称绝对准确，不要给医疗、法律、投资等高风险决定下定论。${DIRECT_READING_RULES}`
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
    await revealAiText(content, aiSections);
  } catch (error) {
    aiNote.value = `AI 请求失败：${error.message}`;
  } finally {
    aiLoading.value = false;
  }
}

async function requestFollowupFor(result) {
  if (!result?.id) return;
  const text = getFollowupDraft(result.id).trim();
  setFollowupError(result.id, "");
  if (!text) {
    setFollowupError(result.id, "先写下你要追问的点。");
    return;
  }

  const session = getAiSession(result.id);
  session.messages.push({ role: "user", content: text, createdAt: new Date().toISOString() });
  setFollowupDraft(result.id, "");
  setFollowupLoading(result.id, true);
  saveAiSessions();

  try {
    const data = await requestJson("/api/chat/completions", {
      temperature: 0.56,
      messages: buildFollowupMessages(result, session)
    });
    const answer = cleanAiText(data.choices?.[0]?.message?.content?.trim() || "AI 没有返回可读内容。");
    session.messages.push({ role: "assistant", content: answer, createdAt: new Date().toISOString() });
    saveAiSessions();
  } catch (error) {
    setFollowupError(result.id, `追问失败：${error.message}`);
  } finally {
    setFollowupLoading(result.id, false);
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
        url: resolveApiUrl(url),
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
        url: resolveApiUrl(url),
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

function resolveApiUrl(url) {
  if (/^https?:\/\//.test(url)) return url;
  if (typeof window === "undefined") return `${API_BASE_URL}${url}`;
  return url;
}

function isMiniProgramRuntime() {
  return typeof wx !== "undefined" && typeof window === "undefined";
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

function createShakeNumber(modulo) {
  const now = Date.now();
  const fineTime = typeof performance !== "undefined" ? Math.floor(performance.now() * 1000) : 0;
  let entropy = Math.floor(Math.random() * 1000000);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    entropy = buffer[0];
  }
  const countSeed = dailyShakeValues.value.length * 97 + liuYaoShakeValues.value.length * 131;
  return Math.abs(now + fineTime + entropy + countSeed) % modulo;
}

function formatYaoValue(value) {
  return ({ 6: "老阴", 7: "少阳", 8: "少阴", 9: "老阳" })[value] || "待摇";
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
    `请自然回复，不要套固定标题或固定模板。${DIRECT_READING_RULES}`
  ].filter(Boolean).join("\n");
}

function buildDailyAiPrompt(result) {
  return [
    `方式：今日签`,
    `问题：${result.question || "今日总体"}`,
    `日期：${result.dateKey}`,
    `签号：第 ${result.signNumber}/${result.totalSigns} 签`,
    `签名：${result.sign.name}`,
    `吉凶：${result.sign.fortune}`,
    `签诗：${result.sign.poem}`,
    result.sign.keywords?.length ? `关键词：${result.sign.keywords.join("、")}` : "",
    result.location ? `定位：${result.location}` : locationText.value ? `定位：${locationText.value}` : "",
    result.personalInfo ? `个人信息：${result.personalInfo}` : personalInfoSummary.value ? `个人信息：${personalInfoSummary.value}` : "",
    result.reading?.length ? `当前解读：${result.reading.join("；")}` : "",
    `请自然回复，不要套固定标题或固定模板。${DIRECT_READING_RULES}`
  ].filter(Boolean).join("\n");
}

function buildAdvancedAiPrompt(result) {
  const personalRules = result.type === "personal" ? PERSONAL_READING_RULES : "";
  return [
    `方式：${result.methodLabel}`,
    `问题：${result.question}`,
    `事项：${result.category}`,
    result.tags?.length ? `标签：${result.tags.join("、")}` : "",
    result.location ? `定位：${result.location}` : locationText.value ? `定位：${locationText.value}` : "",
    result.personalInfo ? `个人信息：${result.personalInfo}` : personalInfoSummary.value ? `个人信息：${personalInfoSummary.value}` : "",
    `结论：${result.verdict}`,
    `摘要：${result.summary}`,
    result.facts?.length ? `事实：${result.facts.map((fact) => `${fact[0]}=${fact[1]}`).join("；")}` : "",
    buildAdvancedExtraSummary(result),
    result.reading?.length ? `基础断语：${result.reading.join("；")}` : "",
    personalRules,
    `请自然回复，不要套固定标题或固定模板。${DIRECT_READING_RULES}`
  ].filter(Boolean).join("\n");
}

function buildAdvancedExtraSummary(result) {
  if (result.extra?.lifeDomains?.length) {
    const domains = `人生领域：${result.extra.lifeDomains.map((item) => `${item.name}=${item.verdict}`).join("；")}`;
    const timeline = result.extra.timeline?.length
      ? `后续轨迹：${result.extra.timeline.map((item) => `${item.range}${item.verdict}`).join("；")}`
      : "";
    return [domains, timeline].filter(Boolean).join("\n");
  }
  if (result.extra?.plate?.length) {
    return `九宫：${result.extra.plate.map((item) => `${item.palace}${item.door}/${item.star}/${item.god}`).join("；")}`;
  }
  if (result.extra?.lines?.length) {
    return `爻象：${result.extra.lines.map((item) => `第${item.line}爻${item.name}${item.moving ? "动" : ""}`).join("；")}`;
  }
  if (result.extra?.state?.name) {
    return `小六壬：${result.extra.state.name}，${result.extra.state.nature}`;
  }
  if (result.extra?.stem && result.extra?.branch) {
    return `个人盘：${result.extra.stem}${result.extra.branch}，生肖${result.extra.zodiac}，五行${result.extra.element}，年龄阶段${result.extra.phase?.name || ""}`;
  }
  return "";
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
        `你是传统问卜追问助手。当前问卜结果已经生成，不要重新起卦、抽签或排盘。围绕原结果自然回答用户不懂的地方，像继续聊天一样回应。若用户明显问另一个独立新事件，提醒一事一占，建议重新问卜。不要宣称绝对准确，不要给医疗、法律、投资等高风险决定下定论。${DIRECT_READING_RULES}`
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
    "当前问卜上下文：",
    buildFollowupBaseContext(result),
    session.reading ? `此前 AI 深断：${session.reading}` : "此前 AI 深断：暂无，按卦象和规则断语回答。",
    `回答要求：直接回答用户追问，不要重复完整结果，不要套固定栏目。${DIRECT_READING_RULES}`
  ].filter(Boolean).join("\n");
}

function buildFollowupBaseContext(result) {
  if (result.type === "daily-oracle" || result.sign) return buildDailyAiPrompt(result);
  if (result.original && result.mutual && result.changed) return buildAiPrompt(result);
  return buildAdvancedAiPrompt(result);
}

function parseAiSections(text) {
  const paragraphs = splitAiParagraphs(text);
  return paragraphs.length ? [{ title: "", paragraphs }] : [];
}

async function revealAiText(content, sections) {
  const normalized = cleanAiText(content);
  if (!normalized) {
    sections.value = [];
    return;
  }

  sections.value = [];
  const chunkSize = normalized.length > 700 ? 4 : normalized.length > 360 ? 3 : 2;
  const delay = normalized.length > 700 ? 10 : 14;

  for (let index = chunkSize; index < normalized.length; index += chunkSize) {
    sections.value = parseAiSections(normalized.slice(0, index));
    await wait(delay);
  }
  sections.value = parseAiSections(normalized);
}

function splitAiParagraphs(text) {
  return cleanAiText(text)
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-]\s*/, "").replace(/^\s*\d+[.、]\s*/, "").trim())
    .filter(Boolean);
}

function cleanAiText(value) {
  let text = String(value || "").replace(/\r/g, "").trim();
  text = text
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

function getFollowupDraft(resultId) {
  return followupDrafts.value[resultId] || "";
}

function setFollowupDraft(resultId, value) {
  followupDrafts.value = { ...followupDrafts.value, [resultId]: value };
}

function isFollowupLoading(resultId) {
  return Boolean(followupLoadingMap.value[resultId]);
}

function setFollowupLoading(resultId, value) {
  followupLoadingMap.value = { ...followupLoadingMap.value, [resultId]: value };
}

function getFollowupError(resultId) {
  return followupErrors.value[resultId] || "";
}

function setFollowupError(resultId, value) {
  followupErrors.value = { ...followupErrors.value, [resultId]: value };
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
    resetAdvancedAiState();
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
  if (current.value?.id) setFollowupError(current.value.id, "");
}

function resetDailyAiState() {
  dailyAiVisible.value = false;
  dailyAiLoading.value = false;
  dailyAiNote.value = "";
  dailyAiSections.value = [];
}

function resetAdvancedAiState() {
  advancedAiVisible.value = false;
  advancedAiLoading.value = false;
  advancedAiNote.value = "";
  advancedAiSections.value = [];
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

:global(html) {
  min-height: 100%;
  background: #0c100f;
  overscroll-behavior-y: none;
}

:global(body) {
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0;
  overflow-x: hidden;
  color: #f7efd9;
  background:
    linear-gradient(180deg, rgba(12, 16, 15, 0.2), rgba(12, 16, 15, 0.82)),
    url("/static/ritual-backdrop.png") center top / cover fixed,
    linear-gradient(180deg, rgba(255, 246, 214, 0.055) 0 1px, transparent 1px 100%),
    linear-gradient(90deg, rgba(255, 246, 214, 0.035) 0 1px, transparent 1px 100%),
    linear-gradient(135deg, rgba(61, 105, 93, 0.34) 0%, rgba(13, 18, 16, 0) 36%),
    linear-gradient(315deg, rgba(113, 42, 39, 0.18) 0%, rgba(13, 18, 16, 0) 42%),
    #0c100f;
  background-size: auto, cover, 38px 38px, 38px 38px, auto, auto;
  font-family:
    "Outfit", "Satoshi", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
    system-ui, sans-serif;
  -webkit-overflow-scrolling: touch;
}

:global(#app) {
  min-height: 100vh;
  min-height: 100dvh;
}

.page-shell {
  position: relative;
  isolation: isolate;
  width: min(100%, 480px);
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0 auto;
  padding: max(18px, env(safe-area-inset-top)) 16px max(30px, env(safe-area-inset-bottom));
  color: #f7efd9;
}

.page-shell::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    linear-gradient(118deg, rgba(217, 182, 103, 0.1), transparent 26%),
    linear-gradient(242deg, rgba(123, 61, 53, 0.12), transparent 34%);
  mask-image: linear-gradient(180deg, black, transparent 86%);
}

.page-shell::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    linear-gradient(90deg, transparent, rgba(255, 248, 228, 0.035), transparent),
    linear-gradient(180deg, transparent 0%, rgba(12, 16, 15, 0.72) 100%);
  opacity: 0.78;
  animation: ambientSweep 16s ease-in-out infinite alternate;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 2px 18px;
}

.brand-lockup {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

.brand-mark {
  display: block;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(218, 183, 103, 0.28);
  border-radius: 8px;
  padding: 3px;
  overflow: hidden;
  background:
    linear-gradient(145deg, rgba(230, 194, 114, 0.26), rgba(61, 105, 93, 0.18)),
    rgba(18, 22, 20, 0.92);
  box-shadow:
    0 18px 36px -24px rgba(218, 183, 103, 0.9),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  animation: markBreathe 4.8s ease-in-out infinite;
}

.brand-icon {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 6px;
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
  color: #91d1bd;
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.16em;
}

.title {
  color: #fff8e4;
  font-size: clamp(27px, 9vw, 40px);
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 12px 34px rgba(218, 183, 103, 0.18);
}

.subtitle {
  display: block;
  margin-top: 6px;
  color: #b7ad98;
  font-size: 12px;
  line-height: 1.3;
}

button {
  border: 0;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease,
    opacity 180ms ease,
    transform 180ms ease;
  -webkit-tap-highlight-color: transparent;
}

button:active {
  transform: translateY(1px) scale(0.99);
}

.icon-button {
  position: relative;
  display: grid;
  flex: 0 0 46px;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 1px solid rgba(218, 183, 103, 0.26);
  border-radius: 8px;
  padding: 0;
  background:
    linear-gradient(180deg, rgba(255, 248, 228, 0.08), rgba(255, 248, 228, 0.025)),
    rgba(15, 18, 16, 0.72);
  box-shadow: 0 14px 30px -24px rgba(0, 0, 0, 0.9);
}

.icon-button:hover,
.plain-button:hover,
.plain-wide-button:hover,
.chip:hover,
.mode:hover,
.method-filter:hover,
.method-option:hover,
.tag-chip:hover {
  border-color: rgba(226, 191, 112, 0.42);
  color: #fff8e4;
  background:
    linear-gradient(180deg, rgba(255, 248, 228, 0.08), rgba(255, 248, 228, 0.025)),
    rgba(31, 37, 33, 0.72);
  box-shadow: 0 18px 42px -32px rgba(226, 191, 112, 0.5);
}

.icon-button::after {
  border: 0;
}

.history-icon {
  position: relative;
  display: block;
  width: 20px;
  height: 20px;
  border: 2px solid #e2bf70;
  border-radius: 50%;
}

.history-icon::before,
.history-icon::after {
  content: "";
  position: absolute;
  left: 9px;
  top: 4px;
  width: 2px;
  height: 7px;
  border-radius: 999px;
  background: #e2bf70;
  transform-origin: bottom center;
}

.history-icon::after {
  top: 9px;
  width: 6px;
  height: 2px;
  transform: rotate(0deg);
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
.review-panel,
.personal-panel,
.tag-panel,
.daily-panel,
.method-guide,
.result-panel {
  border: 1px solid rgba(226, 191, 112, 0.2);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 248, 228, 0.075), transparent 180px),
    linear-gradient(145deg, rgba(42, 69, 61, 0.32), rgba(14, 18, 16, 0.18)),
    rgba(14, 18, 16, 0.82);
  box-shadow:
    0 28px 80px -48px rgba(0, 0, 0, 0.92),
    0 1px 0 rgba(255, 255, 255, 0.045),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(22px) saturate(1.05);
}

.mobile-bottom-nav {
  display: none;
}

.desktop-nav {
  display: none;
}

.question-panel,
.auth-panel,
.review-panel,
.personal-panel,
.tag-panel,
.daily-panel,
.method-guide {
  display: grid;
  gap: 18px;
  padding: 18px;
}

.daily-panel,
.auth-panel,
.review-panel,
.personal-panel,
.tag-panel,
.method-guide {
  margin-bottom: 14px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid rgba(226, 191, 112, 0.17);
  padding-bottom: 14px;
}

.panel-side-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
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
  color: #91d1bd;
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.16em;
}

.panel-title {
  color: #fff8e4;
  font-size: 19px;
  font-weight: 750;
  line-height: 1.15;
}

.daily-limit {
  flex: 0 0 auto;
  border: 1px solid rgba(145, 209, 189, 0.36);
  border-radius: 999px;
  padding: 6px 9px;
  color: #91d1bd;
  font-size: 12px;
  background:
    linear-gradient(180deg, rgba(145, 209, 189, 0.14), rgba(145, 209, 189, 0.04)),
    rgba(42, 92, 85, 0.12);
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
  border: 1px solid rgba(226, 191, 112, 0.2);
  border-radius: 8px;
  color: #fff8e4;
  font-size: 16px;
  outline: none;
  background:
    linear-gradient(180deg, rgba(255, 248, 228, 0.035), rgba(255, 248, 228, 0.01)),
    rgba(7, 11, 10, 0.62);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 14px 34px -30px rgba(0, 0, 0, 0.86);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.question-input:focus,
.number-input:focus,
.followup-input:focus {
  border-color: rgba(145, 209, 189, 0.5);
  background:
    linear-gradient(180deg, rgba(255, 248, 228, 0.055), rgba(255, 248, 228, 0.015)),
    rgba(8, 13, 12, 0.76);
  box-shadow:
    0 0 0 3px rgba(145, 209, 189, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
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

.picker-input {
  display: flex;
  align-items: center;
}

.picker-input.is-placeholder {
  color: #6f685c;
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
  border: 1px solid rgba(226, 191, 112, 0.18);
  border-radius: 8px;
  color: #c2b8a2;
  background:
    linear-gradient(180deg, rgba(255, 248, 228, 0.055), rgba(255, 248, 228, 0.012)),
    rgba(246, 240, 223, 0.035);
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
  border: 1px solid rgba(226, 191, 112, 0.16);
  border-radius: 999px;
  padding: 0 12px;
  color: #c2b8a2;
  background: rgba(246, 240, 223, 0.04);
}

.tag-chip.is-active {
  border-color: rgba(145, 209, 189, 0.44);
  color: #fff8e4;
  background:
    linear-gradient(135deg, rgba(145, 209, 189, 0.22), rgba(226, 191, 112, 0.08)),
    rgba(42, 92, 85, 0.26);
}

.chip.is-active,
.mode.is-active {
  border-color: rgba(226, 191, 112, 0.48);
  color: #fff8e4;
  background:
    linear-gradient(135deg, rgba(226, 191, 112, 0.28), rgba(145, 209, 189, 0.2)),
    rgba(32, 42, 36, 0.58);
  box-shadow: 0 16px 34px -28px rgba(226, 191, 112, 0.74);
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

.context-list {
  display: grid;
  gap: 8px;
  border: 1px solid rgba(150, 200, 184, 0.16);
  border-radius: 8px;
  padding: 10px 12px;
  background: rgba(42, 92, 85, 0.1);
}

.memory-panel {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(226, 191, 112, 0.18);
  border-radius: 8px;
  padding: 13px;
  background:
    linear-gradient(135deg, rgba(226, 191, 112, 0.12), transparent 50%),
    linear-gradient(315deg, rgba(145, 209, 189, 0.09), transparent 55%),
    rgba(7, 11, 10, 0.48);
}

.push-panel {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(145, 209, 189, 0.18);
  border-radius: 8px;
  padding: 13px;
  background:
    linear-gradient(135deg, rgba(145, 209, 189, 0.1), transparent 50%),
    rgba(7, 11, 10, 0.42);
}

.push-badge {
  flex: 0 0 auto;
  border: 1px solid rgba(181, 172, 153, 0.2);
  border-radius: 999px;
  padding: 5px 9px;
  color: #b5ac99;
  font-size: 12px;
  background: rgba(181, 172, 153, 0.06);
}

.push-badge.is-on {
  border-color: rgba(145, 209, 189, 0.32);
  color: #91d1bd;
  background: rgba(145, 209, 189, 0.1);
}

.push-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.onboarding-card {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(145, 209, 189, 0.2);
  border-radius: 8px;
  padding: 13px;
  background:
    linear-gradient(135deg, rgba(145, 209, 189, 0.14), transparent 50%),
    linear-gradient(315deg, rgba(226, 191, 112, 0.1), transparent 58%),
    rgba(7, 11, 10, 0.54);
}

.onboarding-chat {
  display: grid;
  max-height: 280px;
  gap: 8px;
  overflow: auto;
  padding-right: 2px;
}

.onboarding-message {
  display: block;
  width: fit-content;
  max-width: 88%;
  border: 1px solid rgba(226, 191, 112, 0.14);
  border-radius: 8px;
  padding: 9px 10px;
  color: #d8cfbb;
  font-size: 13px;
  line-height: 1.58;
  background: rgba(19, 27, 23, 0.78);
}

.onboarding-message.is-user {
  justify-self: end;
  border-color: rgba(145, 209, 189, 0.26);
  color: #f7efd9;
  background: rgba(42, 92, 85, 0.34);
}

.onboarding-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.preview-chip {
  border: 1px solid rgba(145, 209, 189, 0.2);
  border-radius: 999px;
  padding: 5px 9px;
  color: #d8cfbb;
  font-size: 12px;
  line-height: 1.3;
  background: rgba(145, 209, 189, 0.08);
}

.onboarding-input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 8px;
}

.onboarding-input {
  width: 100%;
  min-height: 54px;
  max-height: 118px;
  border: 1px solid rgba(226, 191, 112, 0.18);
  border-radius: 8px;
  padding: 10px 11px;
  color: #fff7df;
  font-size: 16px;
  line-height: 1.55;
  background: rgba(5, 8, 7, 0.5);
}

.onboarding-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.compact-action {
  min-height: 42px;
}

.memory-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.memory-summary {
  color: #d4cab2;
  font-size: 14px;
  line-height: 1.72;
}

.notice-list {
  display: grid;
  gap: 8px;
}

.notice-card {
  display: grid;
  gap: 5px;
  border: 1px solid rgba(150, 200, 184, 0.16);
  border-radius: 8px;
  padding: 10px 11px;
  background: rgba(42, 92, 85, 0.12);
}

.notice-card text:first-child {
  color: #fff7df;
  font-size: 14px;
  font-weight: 800;
}

.notice-card text:last-child {
  color: #b5ac99;
  font-size: 13px;
  line-height: 1.58;
}

.notice-card.is-risk {
  border-color: rgba(232, 162, 141, 0.28);
  background: rgba(185, 95, 78, 0.12);
}

.notice-card.is-good {
  border-color: rgba(226, 191, 112, 0.3);
  background: rgba(226, 191, 112, 0.1);
}

.notice-card.is-warning {
  border-color: rgba(226, 191, 112, 0.24);
  background: rgba(226, 191, 112, 0.08);
}

.memory-stat-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.memory-stat-row text {
  border: 1px solid rgba(226, 191, 112, 0.16);
  border-radius: 999px;
  padding: 5px 9px;
  color: #e2bf70;
  font-size: 12px;
  background: rgba(226, 191, 112, 0.07);
}

.context-row {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 10px;
  color: #b5ac99;
  font-size: 13px;
  line-height: 1.5;
}

.context-row text:first-child {
  color: #96c8b8;
}

.location-button {
  width: 100%;
  padding: 0 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-warning {
  border: 1px solid rgba(232, 162, 141, 0.28);
  border-radius: 8px;
  padding: 10px 12px;
  color: #e8a28d;
  font-size: 13px;
  line-height: 1.5;
  background: rgba(185, 95, 78, 0.1);
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
  border: 1px solid rgba(226, 191, 112, 0.18);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(226, 191, 112, 0.14), transparent 48%),
    rgba(7, 11, 10, 0.5);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 20px 48px -36px rgba(226, 191, 112, 0.5);
}

.shake-stage::before {
  content: "";
  position: absolute;
  inset: -72px;
  opacity: 0.3;
  background: url("/static/oracle-disc.png") center / contain no-repeat;
  animation: oracleRotate 38s linear infinite;
}

.shake-stage::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(100deg, transparent 0 38%, rgba(255, 248, 228, 0.11) 50%, transparent 62%),
    linear-gradient(180deg, rgba(255, 248, 228, 0.04), transparent 55%);
  transform: translateX(-72%);
  animation: lightPass 5.8s ease-in-out infinite;
}

.tube {
  position: relative;
  z-index: 1;
  width: 78px;
  height: 88px;
  border: 1px solid rgba(226, 191, 112, 0.48);
  border-radius: 12px 12px 22px 22px;
  background:
    linear-gradient(90deg, transparent 0 18%, rgba(226, 191, 112, 0.18) 18% 22%, transparent 22% 78%, rgba(226, 191, 112, 0.14) 78% 82%, transparent 82%),
    rgba(20, 19, 16, 0.9);
  box-shadow:
    0 20px 42px -30px rgba(0, 0, 0, 0.9),
    inset 0 -12px 20px rgba(226, 191, 112, 0.1);
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
  z-index: 2;
  right: 24px;
  bottom: 20px;
  border: 1px solid rgba(226, 191, 112, 0.42);
  border-radius: 999px;
  padding: 6px 12px;
  color: #e2bf70;
  font-size: 12px;
  background: rgba(7, 11, 10, 0.86);
  box-shadow: 0 14px 28px -22px rgba(226, 191, 112, 0.78);
  animation: stickLand 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.shake-counter {
  position: absolute;
  z-index: 2;
  right: 18px;
  bottom: 18px;
  border: 1px solid rgba(145, 209, 189, 0.34);
  border-radius: 999px;
  padding: 6px 12px;
  color: #91d1bd;
  font-size: 12px;
  background: rgba(7, 11, 10, 0.82);
  box-shadow: 0 14px 28px -22px rgba(145, 209, 189, 0.72);
}

.daily-result {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(226, 191, 112, 0.2);
  border-radius: 8px;
  padding: 14px;
  background:
    linear-gradient(135deg, rgba(226, 191, 112, 0.13), transparent 44%),
    linear-gradient(315deg, rgba(145, 209, 189, 0.08), transparent 50%),
    rgba(7, 11, 10, 0.54);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
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

.method-filter-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
}

.method-filter {
  min-height: 34px;
  border: 1px solid rgba(226, 191, 112, 0.16);
  border-radius: 8px;
  color: #a99f8d;
  background: rgba(246, 240, 223, 0.04);
  font-size: 12px;
  font-weight: 700;
}

.method-filter.is-active {
  border-color: rgba(145, 209, 189, 0.44);
  color: #fff8e4;
  background:
    linear-gradient(135deg, rgba(145, 209, 189, 0.2), rgba(226, 191, 112, 0.1)),
    rgba(42, 92, 85, 0.24);
  box-shadow: 0 14px 30px -26px rgba(145, 209, 189, 0.62);
}

.method-picker {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.method-option {
  display: grid;
  align-content: center;
  gap: 4px;
  min-height: 70px;
  border: 1px solid rgba(226, 191, 112, 0.16);
  border-radius: 8px;
  padding: 10px;
  color: inherit;
  text-align: left;
  background:
    linear-gradient(180deg, rgba(255, 248, 228, 0.045), transparent),
    rgba(7, 11, 10, 0.42);
}

.method-option::after {
  border: 0;
}

.method-option.is-selected {
  border-color: rgba(226, 191, 112, 0.64);
  background:
    linear-gradient(135deg, rgba(226, 191, 112, 0.22), rgba(145, 209, 189, 0.18)),
    rgba(7, 11, 10, 0.48);
  box-shadow:
    0 20px 44px -34px rgba(226, 191, 112, 0.75),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.method-name {
  color: #fff8e4;
  font-size: 15px;
  font-weight: 750;
}

.method-option-meta {
  display: block;
  overflow: hidden;
  color: #a99f8d;
  font-size: 11px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.method-status {
  border: 1px solid rgba(226, 191, 112, 0.28);
  border-radius: 999px;
  padding: 4px 7px;
  color: #e2bf70;
  font-size: 11px;
  background: rgba(226, 191, 112, 0.08);
}

.method-fit {
  color: #b5ac99;
  font-size: 13px;
  line-height: 1.6;
}

.method-meta-row,
.method-scope-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.method-meta-row text,
.method-scope-row text {
  border: 1px solid rgba(145, 209, 189, 0.22);
  border-radius: 999px;
  padding: 4px 7px;
  color: #91d1bd;
  font-size: 11px;
  background: rgba(42, 92, 85, 0.16);
}

.method-scope-row text {
  border-color: rgba(218, 183, 103, 0.16);
  color: #dab767;
  background: rgba(218, 183, 103, 0.07);
}

.method-detail {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(226, 191, 112, 0.2);
  border-radius: 8px;
  padding: 14px;
  background:
    linear-gradient(135deg, rgba(226, 191, 112, 0.1), transparent 46%),
    linear-gradient(315deg, rgba(145, 209, 189, 0.075), transparent 54%),
    rgba(7, 11, 10, 0.48);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.method-detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.method-entry-actions {
  display: grid;
  gap: 8px;
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

.yao-shake-panel {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(226, 191, 112, 0.18);
  border-radius: 8px;
  padding: 12px;
  background:
    linear-gradient(135deg, rgba(226, 191, 112, 0.1), transparent 56%),
    rgba(7, 11, 10, 0.46);
}

.yao-shake-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.yao-line-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.yao-line-cell {
  display: grid;
  min-height: 58px;
  align-content: center;
  gap: 5px;
  border: 1px solid rgba(150, 200, 184, 0.14);
  border-radius: 8px;
  padding: 8px;
  color: #8f8677;
  background: rgba(246, 240, 223, 0.035);
}

.yao-line-cell.is-filled {
  border-color: rgba(226, 191, 112, 0.28);
  color: #e2bf70;
  background:
    linear-gradient(135deg, rgba(226, 191, 112, 0.12), rgba(145, 209, 189, 0.06)),
    rgba(7, 11, 10, 0.42);
}

.yao-line-cell text:first-child {
  color: #9b9384;
  font-size: 11px;
}

.yao-line-cell text:last-child {
  font-size: 14px;
  font-weight: 750;
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

.primary-action {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  overflow: hidden;
  border-radius: 8px;
  color: #101210;
  background:
    linear-gradient(135deg, #f0cc78, #c5964c 56%, #91d1bd),
    #e2bf70;
  box-shadow:
    0 22px 48px -28px rgba(226, 191, 112, 0.86),
    inset 0 1px 0 rgba(255, 255, 255, 0.36);
}

.primary-action::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 0 34%, rgba(255, 255, 255, 0.34) 48%, transparent 62%);
  transform: translateX(-120%);
  animation: buttonSheen 4.2s ease-in-out infinite;
}

.primary-action:hover {
  box-shadow:
    0 28px 58px -28px rgba(226, 191, 112, 0.95),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
  transform: translateY(-1px);
}

.primary-action[disabled],
.send-button[disabled] {
  cursor: not-allowed;
  filter: grayscale(0.45);
  opacity: 0.66;
}

.plain-button[disabled],
.plain-wide-button[disabled],
.chip[disabled],
.mode[disabled],
.method-filter[disabled],
.method-option[disabled],
.tag-chip[disabled] {
  border-color: rgba(226, 191, 112, 0.12) !important;
  color: #756e61 !important;
  background:
    linear-gradient(180deg, rgba(255, 248, 228, 0.04), rgba(255, 248, 228, 0.01)),
    rgba(16, 19, 17, 0.76) !important;
  box-shadow: none !important;
  opacity: 0.72;
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
  position: relative;
  width: 92px;
  height: 92px;
  border: 1px solid rgba(226, 191, 112, 0.34);
  border-radius: 50%;
  background: url("/static/oracle-disc.png") center / 168% no-repeat;
  box-shadow:
    0 0 0 10px rgba(226, 191, 112, 0.035),
    0 28px 54px -36px rgba(226, 191, 112, 0.6);
  animation: oracleRotate 34s linear infinite;
}

.sigil::after {
  content: "";
  position: absolute;
  inset: 26px;
  border: 1px solid rgba(145, 209, 189, 0.42);
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
  border-bottom: 1px solid rgba(226, 191, 112, 0.18);
  padding-bottom: 16px;
}

.result-title-copy {
  flex: 1;
  min-width: 0;
}

.result-heading {
  font-size: 20px;
  line-height: 1.28;
  color: #fff8e4;
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
  border: 1px solid rgba(226, 191, 112, 0.38);
  border-radius: 999px;
  padding: 7px 10px;
  color: #e2bf70;
  font-size: 12px;
  background:
    linear-gradient(180deg, rgba(226, 191, 112, 0.14), rgba(226, 191, 112, 0.04)),
    rgba(214, 173, 97, 0.08);
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
  border: 1px solid rgba(226, 191, 112, 0.2);
  border-radius: 8px;
  padding: 12px;
  background:
    linear-gradient(180deg, rgba(255, 248, 228, 0.045), transparent),
    rgba(7, 11, 10, 0.48);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
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
  border: 1px solid rgba(226, 191, 112, 0.18);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 248, 228, 0.035), transparent),
    rgba(7, 11, 10, 0.46);
}

.reading {
  display: grid;
  gap: 10px;
  padding: 14px;
  background:
    linear-gradient(135deg, rgba(145, 209, 189, 0.12), transparent 60%),
    rgba(42, 92, 85, 0.12);
}

.section-title,
.ai-title {
  color: #e2bf70;
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

.ai-status {
  display: flex;
  min-height: 54px;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(226, 191, 112, 0.22);
  border-radius: 8px;
  padding: 10px 13px 10px 15px;
  background:
    linear-gradient(135deg, rgba(226, 191, 112, 0.16), rgba(145, 209, 189, 0.1) 58%, transparent),
    rgba(7, 11, 10, 0.5);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 18px 42px -34px rgba(226, 191, 112, 0.68);
}

.ai-status-copy {
  display: grid;
  gap: 3px;
}

.ai-status-kicker {
  color: #91d1bd;
  font-size: 10px;
  font-weight: 800;
}

.ai-status-title {
  color: #fff7df;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.25;
}

.ai-status-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #e2bf70;
  box-shadow: 0 0 0 6px rgba(226, 191, 112, 0.1), 0 0 18px rgba(226, 191, 112, 0.64);
}

.ai-status.is-loading .ai-status-dot {
  animation: aiStatusPulse 1.15s ease-in-out infinite;
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

.send-icon {
  position: relative;
  display: block;
  width: 18px;
  height: 18px;
}

.send-icon::before {
  content: "";
  position: absolute;
  inset: 2px;
  border-top: 2px solid #dab767;
  border-right: 2px solid #dab767;
  transform: rotate(45deg);
}

.send-icon::after {
  content: "";
  position: absolute;
  left: 2px;
  top: 8px;
  width: 15px;
  height: 2px;
  border-radius: 999px;
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
  background: rgba(7, 7, 6, 0.72);
  backdrop-filter: blur(6px);
}

.drawer-panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  max-height: 78vh;
  border: 1px solid rgba(226, 191, 112, 0.22);
  border-radius: 16px 16px 0 0;
  padding: 16px;
  overflow: auto;
  background:
    linear-gradient(180deg, rgba(255, 248, 228, 0.075), transparent 180px),
    #161a17;
  box-shadow: 0 -30px 80px -46px rgba(0, 0, 0, 0.95);
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
  border: 1px solid rgba(226, 191, 112, 0.2);
  border-radius: 8px;
  color: #c2b8a2;
  background:
    linear-gradient(180deg, rgba(255, 248, 228, 0.055), rgba(255, 248, 228, 0.01)),
    rgba(246, 240, 223, 0.04);
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
  :global(body) {
    overflow-x: hidden;
    overflow-y: auto;
    background-attachment: scroll, scroll, scroll, scroll, scroll, scroll, scroll;
  }

  .page-shell {
    min-height: 100vh;
    min-height: 100dvh;
    padding-bottom: calc(84px + env(safe-area-inset-bottom));
    overscroll-behavior-y: contain;
    -webkit-overflow-scrolling: touch;
  }

  .mobile-bottom-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    transform: translateZ(0);
    will-change: transform;
    contain: layout paint;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    width: 100%;
    margin: 0 auto;
    border: 1px solid rgba(226, 191, 112, 0.22);
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 8px 8px 0 0;
    padding:
      7px
      max(12px, env(safe-area-inset-right))
      calc(7px + env(safe-area-inset-bottom))
      max(12px, env(safe-area-inset-left));
    background:
      linear-gradient(180deg, rgba(255, 248, 228, 0.08), rgba(255, 248, 228, 0.02)),
      rgba(12, 16, 15, 0.94);
    box-shadow:
      0 24px 60px -28px rgba(0, 0, 0, 0.94),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px) saturate(1.08);
  }

  .mobile-tab {
    min-height: 42px;
    border: 0;
    border-radius: 7px;
    color: #a99f8d;
    background: transparent;
    font-size: 13px;
    font-weight: 750;
  }

  .mobile-tab.is-active {
    color: #101210;
    background:
      linear-gradient(135deg, #f0cc78, #c5964c 62%, #91d1bd),
      #e2bf70;
    box-shadow:
      0 14px 28px -18px rgba(226, 191, 112, 0.75),
      inset 0 1px 0 rgba(255, 255, 255, 0.34);
  }

  .tag-panel {
    display: none;
  }

  .mobile-section {
    display: none !important;
  }

  .question-panel.mobile-section.is-active,
  .personal-panel.mobile-section.is-active,
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

  .yao-line-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 860px) {
  .page-shell {
    display: grid;
    grid-template-columns: 230px minmax(0, 760px);
    align-items: start;
    align-content: start;
    justify-content: center;
    gap: 20px;
    width: min(100%, 1160px);
    padding: 24px;
  }

  .topbar {
    grid-column: 1 / -1;
    padding-bottom: 8px;
  }

  .desktop-nav {
    position: sticky;
    top: 24px;
    display: grid;
    grid-column: 1;
    grid-row: 2;
    gap: 8px;
    border: 1px solid rgba(226, 191, 112, 0.18);
    border-radius: 8px;
    padding: 10px;
    background:
      linear-gradient(180deg, rgba(255, 248, 228, 0.06), rgba(255, 248, 228, 0.015)),
      rgba(14, 18, 16, 0.76);
    box-shadow: 0 24px 70px -52px rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(18px) saturate(1.05);
  }

  .desktop-nav-item {
    min-height: 42px;
    border: 1px solid transparent;
    border-radius: 7px;
    color: #c2b8a2;
    text-align: left;
    padding: 0 12px;
    background: transparent;
    font-size: 14px;
    font-weight: 750;
  }

  .desktop-nav-item:hover {
    border-color: rgba(226, 191, 112, 0.24);
    color: #fff8e4;
    background: rgba(255, 248, 228, 0.045);
  }

  .desktop-nav-item.is-active {
    color: #101210;
    border-color: rgba(226, 191, 112, 0.4);
    background:
      linear-gradient(135deg, #f0cc78, #c5964c 62%, #91d1bd),
      #e2bf70;
    box-shadow:
      0 16px 30px -20px rgba(226, 191, 112, 0.78),
      inset 0 1px 0 rgba(255, 255, 255, 0.32);
  }

  .auth-panel,
  .review-panel {
    grid-column: 1 / -1;
    width: min(100%, 460px);
    justify-self: center;
  }

  .tag-panel,
  .tag-panel.is-active,
  .mobile-section {
    display: none !important;
  }

  .question-panel.mobile-section.is-active,
  .personal-panel.mobile-section.is-active,
  .daily-panel.mobile-section.is-active,
  .method-guide.mobile-section.is-active {
    display: grid !important;
    grid-column: 2;
    grid-row: 2;
    margin-bottom: 0;
  }

  .result-panel.mobile-section.is-active {
    display: block !important;
    grid-column: 2;
    grid-row: 3;
    margin-top: 18px;
    margin-bottom: 0;
  }

  .result-panel.is-empty.mobile-section.is-active {
    display: grid !important;
  }

  .question-panel,
  .auth-panel,
  .review-panel,
  .personal-panel,
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

  .method-picker {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .drawer-panel {
    width: min(460px, 44vw);
  }
}

@media (min-width: 1180px) {
  .page-shell {
    grid-template-columns: 250px minmax(0, 820px);
    width: min(100%, 1220px);
  }

  .method-picker {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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

@keyframes ambientSweep {
  from {
    transform: translateX(-8%);
    opacity: 0.42;
  }

  to {
    transform: translateX(8%);
    opacity: 0.82;
  }
}

@keyframes markBreathe {
  0%,
  100% {
    box-shadow:
      0 18px 36px -24px rgba(218, 183, 103, 0.8),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }

  50% {
    box-shadow:
      0 24px 46px -22px rgba(145, 209, 189, 0.54),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }
}

@keyframes oracleRotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes lightPass {
  0%,
  42% {
    transform: translateX(-72%);
  }

  76%,
  100% {
    transform: translateX(72%);
  }
}

@keyframes buttonSheen {
  0%,
  46% {
    transform: translateX(-120%);
  }

  76%,
  100% {
    transform: translateX(120%);
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

@keyframes aiStatusPulse {
  0%,
  100% {
    opacity: 0.48;
    transform: scale(0.84);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-shell::after,
  .brand-mark,
  .shake-stage::before,
  .shake-stage::after,
  .sigil,
  .primary-action::before,
  .ai-status.is-loading .ai-status-dot,
  .is-shaking .tube,
  .is-shaking .stick.two,
  .fallen-stick {
    animation: none;
  }

  button,
  .question-input,
  .number-input,
  .followup-input {
    transition: none;
  }
}
</style>
