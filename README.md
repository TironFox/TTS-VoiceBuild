# 阿里百炼音色设计与分段可控语音合成控制台

基于阿里云百炼 (DashScope) CosyVoice-v2 的高可控音色定制与分段语音合成控制台。

## 功能特性

- **音色定制设计**：通过自然语言提示词创建定制音色，支持自定义演示文案预览
- **声音克隆**：极速声音复刻，支持麦克风录音和文件上传
- **分段 TTS 合成**：将长文本智能断句，对每句话独立控制语气、语速、声调、音量
- **多情绪支持**：neutral, gentle, happy, excited, serious, sad, angry, fear, professional
- **实时波形可视化**：音频播放时动态展示频谱
- **API Key 校验**：内置阿里云百炼密钥验证功能
- **本地数据持久化**：自定义音色、历史记录自动保存到 localStorage

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
│   ├── services/
│   │   ├── VoiceDesignService.ts # 音色设计服务（核心）
│   │   ├── TtsService.ts         # 文字转语音服务
│   │   ├── VoiceCloneService.ts  # 声音克隆服务
│   │   └── index.ts              # 服务导出索引
│   ├── storage/
│   │   └── voiceStorage.ts       # 本地存储服务
│   ├── hooks/
│   │   └── useVoiceStore.ts      # 音色状态管理 Hook
│   ├── App.tsx                   # 主应用组件
│   ├── types.ts                  # TypeScript 类型定义
│   ├── main.tsx                  # React 入口
│   └── index.css                 # Tailwind CSS 入口
├── server.ts                     # Express 后端服务器
├── index.html                    # HTML 入口
├── vite.config.ts                # Vite 配置
└── package.json                  # 依赖配置
```

## 功能模块

### 1. 音色设计模块 (`VoiceDesignService`)

**核心功能**：通过自然语言提示词创建自定义音色

**新增特性**：
- **Demo 文案输入**：用户可输入自定义演示文本，生成音色后自动合成演示音频
- **纯云端调用**：仅调用阿里百炼 API，不使用本地规则引擎兜底
- **实时声学分析**：通过 Qwen-Turbo 进行高精度声学参数映射

**数据结构**：

```typescript
interface VoiceDesignParams {
  prompt: string;      // 自然语言提示词
  baseConfig?: Partial<VoiceModel>;  // 用户微调参数
  demoText?: string;   // 演示文案（用于生成预览音频）
}

interface VoiceDesignResult {
  success: boolean;
  mode: 'real';        // 始终为 real，不支持本地模式
  voiceId: string;     // 生成的音色ID（阿里云返回）
  specs: Partial<VoiceModel>;  // 声学参数
  message?: string;
  details?: unknown;
  demoAudioData?: string;  // Base64 编码的演示音频
}
```

**执行流程**：
1. 用户输入提示词和可选的演示文案
2. 调用 Qwen-Turbo 进行声学参数分析
3. 调用阿里百炼音色设计 API 创建音色
4. 若提供演示文案，自动调用 TTS API 生成演示音频
5. 返回完整的设计结果

### 2. 文字转语音模块 (`TtsService`)

提供单文本合成和分段合成功能，支持自定义音色参数调整。

### 3. 声音克隆模块 (`VoiceCloneService`)

支持从 URL、文件和麦克风录音三种方式进行声音克隆。

### 4. 本地存储模块 (`voiceStorage`)

管理自定义音色、转换历史、上次使用的音色等数据的持久化存储。

## API 端点

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/config` | 获取平台配置 |
| GET | `/api/voice/presets` | 获取预置音色列表 |
| GET | `/api/config/validate` | 验证 API Key |
| POST | `/api/voice/design` | 音色定制设计（新增 demoText 参数） |
| POST | `/api/voice/clone` | 声音克隆 |
| POST | `/api/voice/tts` | 文字转语音 |

## 预置音色

阿里百炼 CosyVoice-v2 提供以下预置音色：

| 音色 ID | 名称 | 性别 | 年龄 | 描述 |
|---------|------|------|------|------|
| longxiaochun_v2 | 龙小春 | 女 | 青年 | 声音清澈温润，极富生活代入感 |
| longqiang_v2 | 龙腔 | 男 | 中年 | 声音饱满富有弹性，极具专业新闻和企业演讲风骨 |
| longshuo_v2 | 龙硕 | 男 | 青年 | 语调干练果决，适合技术宣讲、发布会发言 |
| longting_v2 | 龙婷 | 女 | 青年 | 语气文雅睿智，适合有声小说与诗词朗诵 |
| longyue_v2 | 龙悦 | 女 | 儿童 | 纯真童趣女童，声音清亮活泼 |
| longjing_v2 | 龙静 | 女 | 成年 | 沉静典雅的中年成熟女腔，饱含人文情怀 |
| longchu_v2 | 龙楚 | 男 | 成年 | 腔调老练成熟，充满豁达的故事感 |
| longwan_v2 | 龙婉 | 女 | 老年 | 慈祥声音，充满慈爱，适合祖母角色演绎 |

## 使用示例

### 音色设计请求

```typescript
import { voiceDesignService } from './services';

const result = await voiceDesignService.designVoice({
  prompt: '一个温暖、磁性的深夜电台主持人声音',
  baseConfig: { gender: 'male', ageGroup: 'adult' },
  demoText: '欢迎来到深夜电台，今天为您带来一段温暖的故事。'
});

if (result.success) {
  console.log('音色ID:', result.voiceId);
  console.log('声学参数:', result.specs);
  console.log('演示音频:', result.demoAudioData);
}
```

## 注意事项

- **必须配置 API Key**：本平台仅调用外部模型 API，未配置密钥将无法使用音色设计功能
- 声音克隆要求音频采样率 >= 24000 Hz，时长 <= 60 秒
- 浏览器麦克风权限需要在 HTTPS 或 localhost 环境下使用
- 生产环境部署时需配置正确的 `APP_URL`
- 自定义音色数据存储在浏览器 localStorage 中，清除浏览器数据会导致数据丢失
