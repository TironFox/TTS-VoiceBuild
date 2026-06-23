# 阿里百炼音色设计与分段可控语音合成控制台

基于阿里云百炼 (DashScope) CosyVoice-v2 的高可控音色定制与分段语音合成控制台。

## 功能特性

- **音色定制设计**：通过自然语言提示词 + 滑块微调创建定制音色
- **声音克隆**：极速声音复刻，支持麦克风录音和文件上传
- **分段 TTS 合成**：将长文本智能断句，对每句话独立控制语气、语速、声调、音量
- **多情绪支持**：neutral, gentle, happy, excited, serious, sad, angry, fear, professional
- **实时波形可视化**：音频播放时动态展示频谱
- **API Key 校验**：内置阿里云百炼密钥验证功能

## 技术栈

- **前端**：React 19 + TypeScript + Tailwind CSS 4 + Vite
- **后端**：Express + Node.js
- **AI 服务**：阿里云百炼 (DashScope) - CosyVoice-v2 / Qwen-Turbo

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件或复制 `.env.example`：

```bash
cp .env.example .env
```

编辑 `.env` 填入您的 API 密钥：

```env
DASHSCOPE_API_KEY="your_dashscope_api_key"
APP_URL="http://localhost:3000"
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 生产构建

```bash
npm run build          # 构建前端
npm run server:build   # 构建后端服务
npm start              # 启动生产服务器
```

## 项目结构

```
├── src/
│   ├── components/
│   │   ├── AudioWaveform.tsx    # 音频波形可视化
│   │   ├── ErrorBoundary.tsx    # React 错误边界
│   │   └── VoiceSynthesizer.ts  # 浏览器端语音合成降级
│   ├── App.tsx                  # 主应用组件
│   ├── types.ts                 # TypeScript 类型定义
│   ├── main.tsx                 # React 入口
│   └── index.css                # Tailwind CSS 入口
├── server.ts                     # Express 后端服务器
├── index.html                    # HTML 入口
├── vite.config.ts               # Vite 配置
└── package.json                  # 依赖配置
```

## API 端点

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/config` | 获取平台配置 |
| GET | `/api/voice/presets` | 获取预置音色列表 |
| GET | `/api/config/validate` | 验证 API Key |
| POST | `/api/voice/design` | 音色定制设计 |
| POST | `/api/voice/clone` | 声音克隆 |
| POST | `/api/voice/tts` | 文字转语音 |

## 注意事项

- 声音克隆要求音频采样率 >= 24000 Hz，时长 <= 60 秒
- 浏览器麦克风权限需要在 HTTPS 或 localhost 环境下使用
- 生产环境部署时需配置正确的 `APP_URL`
