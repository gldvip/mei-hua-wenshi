# 玄问临占交接说明

更新时间：2026-06-23

## 项目位置

```text
/Users/luck/cccode/mei-hua-wenshi
```

直接打开：

```text
file:///Users/luck/cccode/mei-hua-wenshi/index.html
```

这是一个静态网页项目，不依赖构建工具，后续迁移小程序时可以把页面、样式和逻辑拆成小程序页面/组件/工具函数。

## 当前目标

做一个自己使用的传统临时问事工具，重点不是商业化，也不是八字人生盘，而是“一事一问”的临占。

当前第一版选择：

- 梅花易数问事。
- 手机端优先。
- 界面简洁但带玄幻氛围。
- 前端使用 uni-app + Vue 3，当前发布 H5，后续可迁移微信小程序或 App。
- 规则排卦固定在后端接口，前端只负责渲染，AI 负责白话深断和追问解释。

## 当前已实现

- 手机端玄幻风界面。
- 首页今日问卜：
  - 今日所问
  - 当前对象
  - 地点
  - 个人信息
  - 摇签动画
  - 当日签保存和复看
- 问卜方式说明：
  - 今日签
  - 梅花易数
  - 小六壬
  - 六爻
  - 奇门
  - 个人盘
- 事项输入。
- 分类选择：
  - 事业
  - 感情
  - 财运
  - 合作
  - 出行
  - 其他
- 起卦方式：
  - 时间起卦
  - 数字起卦
- 梅花易数展示：
  - 本卦
  - 互卦
  - 变卦
  - 动爻
  - 体用
  - 五行生克
  - 白话断语
- 本地问事记录：
  - 保存在浏览器 `localStorage`
  - 点击右上角菜单可查看历史
- AI 深断：
  - 支持在当前卦基础上生成深断
  - 输出按“局势 / 阻碍 / 转机 / 应对 / 结果倾向”分段
  - 有打字机效果
- AI 继续追问：
  - 每个卦下面都有“继续追问”区域
  - 可以围绕当前卦继续问不懂的地方
  - 追问会带上当前卦象、原问题、AI 深断和最近对话
  - 追问记录按卦保存在 `localStorage`
- 时间起卦传统取数：
  - 优先读取浏览器 `Intl` 中文农历
  - 上卦取：农历年支数 + 农历月 + 农历日
  - 下卦/动爻取：上卦取数 + 时辰数
  - 若浏览器不支持中文农历，则自动退回公历年月日取数

## AI 配置

公网部署时 AI 不再把 key 放进前端。前端请求：

```text
POST /api/chat/completions
```

后端代理配置在本机 `.env`，格式参考 `.env.example`：

```text
AI_BASE_URL=你的接口地址
AI_API_KEY=你的 key
AI_MODEL=你的模型名
AI_TEMPERATURE=0.72
```

当前后端调用方式兼容常见 OpenAI 风格接口：

```text
POST {baseUrl}/chat/completions
```

注意：

- 不要把 `.env` 或 `ai-config.local.js` 提交到公开仓库。
- 如果接口本身已经包含 `/chat/completions`，`server.js` 会自动识别，不重复拼接。
- 之前出现过 `Failed to fetch`，排查发现可能是 `baseUrl` 和 `apiKey` 填反，或者浏览器 CORS 拦截。

## 已修过的问题

### 数字起卦输入默认露出

时间起卦模式下数字输入框曾经错误显示。已在 `styles.css` 中增加：

```css
.number-panel[hidden] {
  display: none;
}
```

### AI 输出太像纯文本

AI 深断最初是一整块文本，不好读。已改成结构化分段卡片：

- 局势
- 阻碍
- 转机
- 应对
- 结果倾向

### AI 输出没有打字机效果

已增加本地打字机效果。即使接口不是流式返回，也会在拿到完整文本后逐字展示。

### AI 返回 Markdown 星号不好看

AI 有时返回类似：

```text
*应对***结果倾向**
**局势**：...
```

已增加清洗逻辑：

- 自动去掉 `*`、`**`、`#`
- 尽量重新识别中文标题
- 提示词里也要求 AI 不要使用 Markdown

## 主要文件

```text
src/pages/index/index.vue uni-app 首页、样式、结果渲染、AI、追问、历史记录逻辑
src/pages.json  uni-app 页面配置
src/manifest.json uni-app 平台配置
index.html      H5 构建入口
vite.config.js  uni-app Vite 配置
package.json    uni-app + Vue 3 依赖和脚本
divination.js   后端起卦、排卦、体用、生克、断语规则
dailyOracle.js  后端今日摇签签文库和解签规则
server.js       后端接口：起卦计算和 AI 代理
Dockerfile      前端 H5 构建 + nginx 镜像
Dockerfile.api  后端 AI 代理镜像
nginx.conf      前端静态服务和 /api 反代配置
docker-compose.yml Docker 部署配置
README.md       项目说明
HANDOFF.md      当前交接说明
```

## 验证过的内容

用浏览器手机视口验证过：

- 起卦能正常生成结果。
- 今日问卜能摇签、展示解签，并保存当日结果。
- 首页展示各问卜方式适合的问题类型。
- 时间起卦显示农历年、月、日和时辰数。
- 时间起卦默认不显示数字输入。
- 数字起卦切换正常。
- AI 深断分段展示正常。
- AI 深断打字机效果正常。
- AI 继续追问可发送、可回复、可保存。
- AI 返回 Markdown 星号时，页面不会原样显示星号。

相关截图文件：

```text
check-mobile.png
check-ai-output.png
check-ai-typewriter.png
check-followup-chat.png
check-ai-cleaned.png
```

这些截图只是验证产物，不是功能必需文件。

## 后续建议

优先级建议：

1. 继续细化时间起卦：增加节气、月建等更传统的校正依据。
2. 增加“验证结果”功能：
   - 准
   - 部分准
   - 不准
   - 未发生
   - 实际结果记录
3. 增加六爻模块：
   - 手动摇卦
   - 自动起卦
   - 装卦
   - 世应
   - 六亲
   - 六神
   - 用神
4. 增加小六壬快速问事。
5. 小程序化：
   - `app.js` 拆成 `divination`、`ai`、`storage`、`ui` 几个模块
   - 页面拆成问事表单、卦象结果、AI 深断、追问会话、历史记录组件

## 迁移到另一台电脑

复制整个目录即可：

```text
/Users/luck/cccode/mei-hua-wenshi
```

到新电脑后：

1. 打开 `index.html`。
2. 如果要启用公网 AI，复制 `.env.example` 为 `.env` 并填写服务端 AI 配置。
3. 如果只在本机直接打开 HTML 调试，可以使用被忽略的 `ai-config.local.js`。
4. 浏览器 `localStorage` 不会随文件复制自动迁移，历史问事记录和追问记录如果要迁移，需要单独导出。
