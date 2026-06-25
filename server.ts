/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';
import { URL } from 'url';

// Load environment variables
dotenv.config();

import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-DashScope-Api-Key, Authorization');
  next();
});

// Ensure local uploads folder exists for serving reference audios to Alibaba DashScope
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded reference audios statically
app.use('/uploads', express.static(uploadDir));

// Aliyun DashScope API client for prompt-based acoustic parameter prediction
async function callDashScopeLLM(prompt: string, apiKey: string): Promise<any> {
  console.log('[DashScope LLM] 开始调用 Qwen-Turbo API...');
  console.log('[DashScope LLM] API Key 已配置:', !!apiKey);
  
  try {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          prompt: prompt
        },
        parameters: {
          max_tokens: 512,
          temperature: 0.7,
          top_p: 0.9,
          result_format: 'message'
        }
      })
    });

    const data = await response.json();
    console.log('[DashScope LLM] API 响应状态:', response.status);
    console.log('[DashScope LLM] API 响应数据:', JSON.stringify(data, null, 2).slice(0, 500));

    // Check for error responses
    if (!response.ok || data.code) {
      const errorCode = data.code || response.status;
      const errorMsg = data.message || data.error || `API Error: ${errorCode}`;
      console.error('[DashScope LLM] API 调用失败:', errorCode, errorMsg);
      throw new Error(`DashScope LLM API 调用失败 (${errorCode}): ${errorMsg}`);
    }

    if (data.output && data.output.choices && data.output.choices[0] && data.output.choices[0].message) {
      const content = data.output.choices[0].message.content;
      console.log('[DashScope LLM] LLM 返回内容:', content);
      try {
        return JSON.parse(content.trim());
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('无法解析 LLM 返回的 JSON 内容: ' + content.slice(0, 200));
      }
    }
    
    // Fallback: try data.output.text
    if (data.output && data.output.text) {
      const content = data.output.text;
      console.log('[DashScope LLM] LLM 返回内容 (output.text):', content);
      try {
        return JSON.parse(content.trim());
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('无法解析 LLM 返回的 JSON 内容: ' + content.slice(0, 200));
      }
    }

    throw new Error('LLM 响应格式不符合预期: ' + JSON.stringify(data).slice(0, 200));
  } catch (error) {
    console.error('[DashScope LLM] 请求异常:', error);
    throw error;
  }
}

// 1. Config Check endpoint
app.get('/api/config', (req, res) => {
  res.json({
    hasApiKey: !!process.env.DASHSCOPE_API_KEY,
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    platform: 'Alibaba DashBailian (阿里云百炼)',
    supportedModels: {
      tts: [
        {
          id: 'cosyvoice-v2',
          name: 'CosyVoice-V2',
          description: '阿里百炼新一代语音合成模型，支持多情感、多音色',
          voices: ['sl_yifei', 'sl_boy', 'sl_tongtong', 'sl_nannan', 'longxiaochun', 'longyue'],
          requiresActivation: true,
          activationUrl: 'https://dashscope.console.aliyuncs.com/modelmarket/modelDetail?modelName=cosyvoice-v2'
        },
        {
          id: 'cosyvoice-v1',
          name: 'CosyVoice-V1',
          description: '经典版语音合成模型，稳定可靠',
          voices: ['Alice', 'Bob', 'Charlie', 'Diana'],
          requiresActivation: true,
          activationUrl: 'https://dashscope.console.aliyuncs.com/modelmarket/modelDetail?modelName=cosyvoice'
        }
      ],
      voiceDesign: [
        {
          id: 'cosyvoice-voice-design',
          name: '音色设计',
          description: '基于提示词生成定制音色',
          requiresActivation: true,
          activationUrl: 'https://dashscope.console.aliyuncs.com/modelmarket/modelDetail?modelName=cosyvoice-voice-design'
        }
      ],
      voiceClone: [
        {
          id: 'cosyvoice-voice-clone',
          name: '极速声音克隆',
          description: '上传音频快速克隆人声',
          requiresActivation: true,
          activationUrl: 'https://dashscope.console.aliyuncs.com/modelmarket/modelDetail?modelName=cosyvoice-voice-clone'
        }
      ],
      llm: [
        {
          id: 'qwen-turbo',
          name: 'Qwen-Turbo',
          description: '通义千问轻量版，响应快、性价比高',
          requiresActivation: false,
          activationUrl: 'https://dashscope.console.aliyuncs.com/modelmarket/modelDetail?modelName=qwen-turbo'
        },
        {
          id: 'qwen-plus',
          name: 'Qwen-Plus',
          description: '通义千问增强版，能力更强',
          requiresActivation: true,
          activationUrl: 'https://dashscope.console.aliyuncs.com/modelmarket/modelDetail?modelName=qwen-plus'
        }
      ]
    },
    activationLinks: {
      console: 'https://dashscope.console.aliyuncs.com/',
      modelMarket: 'https://dashscope.console.aliyuncs.com/modelmarket',
      apiKey: 'https://dashscope.console.aliyuncs.com/apiKey',
      billing: 'https://billing.console.aliyun.com/'
    }
  });
});

// 1.1 Preset Voices List from Alibaba CosyVoice-v2
app.get('/api/voice/presets', (req, res) => {
  res.json({
    success: true,
    presets: [
      {
        id: 'longxiaochun_v2',
        name: '龙小春 (青年温和女声 / longxiaochun_v2)',
        gender: 'female',
        ageGroup: 'youth',
        description: '阿里百炼 CosyVoice-v2 旗舰女声，声音清澈温润，极富生活代入感。',
        isPreset: true,
        avatarColor: 'bg-gradient-to-tr from-purple-500 to-indigo-400',
        pitch: 10,
        speed: 1.00,
        volume: 85,
        warmth: 30,
        tension: -5,
        breathiness: 15,
        robotic: 0,
        reverb: 6,
      },
      {
        id: 'longqiang_v2',
        name: '龙腔 (稳重中年男声 / longqiang_v2)',
        gender: 'male',
        ageGroup: 'adult',
        description: '声音饱满富有弹性，语重如磐石，极具专业新闻和企业演讲风骨。',
        isPreset: true,
        avatarColor: 'bg-gradient-to-tr from-blue-700 to-cyan-600',
        pitch: -20,
        speed: 0.90,
        volume: 95,
        warmth: 15,
        tension: 20,
        breathiness: 10,
        robotic: 0,
        reverb: 8,
      },
      {
        id: 'longshuo_v2',
        name: '龙硕 (庄重青年男声 / longshuo_v2)',
        gender: 'male',
        ageGroup: 'youth',
        description: '语调干练果决，适合技术宣讲、发布会发言，中气十足。',
        isPreset: true,
        avatarColor: 'bg-gradient-to-tr from-emerald-600 to-teal-500',
        pitch: -10,
        speed: 1.05,
        volume: 85,
        warmth: 10,
        tension: 10,
        breathiness: 8,
        robotic: 0,
        reverb: 5,
      },
      {
        id: 'longting_v2',
        name: '龙婷 (知性青年女声 / longting_v2)',
        gender: 'female',
        ageGroup: 'youth',
        description: '语气文雅睿智，带给受众舒缓流畅的倾听环境，非常适合有声小说与诗词朗诵。',
        isPreset: true,
        avatarColor: 'bg-gradient-to-tr from-fuchsia-500 to-pink-500',
        pitch: 20,
        speed: 0.95,
        volume: 85,
        warmth: 40,
        tension: -10,
        breathiness: 25,
        robotic: 0,
        reverb: 8,
      },
      {
        id: 'longyue_v2',
        name: '龙悦 (欢快儿童女声 / longyue_v2)',
        gender: 'female',
        ageGroup: 'child',
        description: 'CosyVoice-v2 最新纯真童趣女童，声音清亮活泼，洋溢着灵动生命力。',
        isPreset: true,
        avatarColor: 'bg-gradient-to-tr from-yellow-400 to-amber-500',
        pitch: 60,
        speed: 1.10,
        volume: 90,
        warmth: 15,
        tension: 5,
        breathiness: 12,
        robotic: 0,
        reverb: 5,
      },
      {
        id: 'longjing_v2',
        name: '龙静 (温柔叙事女声 / longjing_v2)',
        gender: 'female',
        ageGroup: 'adult',
        description: '沉静典雅的中年成熟女腔，饱含人文情怀，在有声读物与文化讲解中无出其右。',
        isPreset: true,
        avatarColor: 'bg-gradient-to-tr from-rose-600 to-orange-500',
        pitch: -5,
        speed: 1.00,
        volume: 80,
        warmth: 50,
        tension: -20,
        breathiness: 20,
        robotic: 0,
        reverb: 7,
      },
      {
        id: 'longchu_v2',
        name: '龙楚 (成熟磁性男声 / longchu_v2)',
        gender: 'male',
        ageGroup: 'adult',
        description: '腔调老练成熟，每一个字节里都是豁达的故事感，极佳的情感配音人选。',
        isPreset: true,
        avatarColor: 'bg-gradient-to-tr from-slate-600 to-slate-800',
        pitch: -30,
        speed: 0.95,
        volume: 85,
        warmth: 35,
        tension: -5,
        breathiness: 15,
        robotic: 0,
        reverb: 10,
      },
      {
        id: 'longwan_v2',
        name: '龙婉 (睿智有声老妪 / longwan_v2)',
        gender: 'female',
        ageGroup: 'elder',
        description: '带有些许岁月沉淀的慈祥声音，充满慈爱，适合祖母长辈角色演绎与寓言朗读。',
        isPreset: true,
        avatarColor: 'bg-gradient-to-tr from-stone-500 to-neutral-700',
        pitch: -20,
        speed: 0.85,
        volume: 80,
        warmth: 60,
        tension: -15,
        breathiness: 30,
        robotic: 0,
        reverb: 8,
      }
    ]
  });
});

// 1.5 Validate Aliyun API Key by actively communicating with DashScope endpoint
app.get('/api/config/validate', async (req, res) => {
  const apiKeyHeader = req.headers['x-dashscope-api-key'] || req.headers['authorization']?.toString().replace('Bearer ', '');
  const apiKey = (typeof apiKeyHeader === 'string' && apiKeyHeader.trim() !== '') ? apiKeyHeader.trim() : process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    return res.json({
      success: false,
      reason: 'missing_key',
      message: '未配置任何 DASHSCOPE_API_KEY！请在界面的「API Key 状态校验器」文本框中贴入以 sk- 开头的百炼 API 密钥，或在云控制台环境变量中配置。'
    });
  }

  try {
    // Use text generation API for more reliable validation
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          prompt: 'test'
        },
        parameters: {
          max_tokens: 1,
          temperature: 0.7
        }
      })
    });

    const status = response.status;
    let data: any = {};
    try {
      data = await response.json();
    } catch (e) {
      // ignore json parse error
    }

    console.log('[API Key Validation Aliyun ResponseStatus]:', status, 'ResponseJSON:', data);

    if (status === 401 || data.code === 'ApiKeyRequired' || data.code === 'InvalidApiKey' || data.code === 'SignVerificationFailed') {
      return res.json({
        success: false,
        reason: 'invalid_key',
        message: '您的 DASHSCOPE_API_KEY 无效或已过期（阿里云百炼拦截：401 Unauthorized / InvalidApiKey）。请核对并在云平台重新设置该 API Key。',
        details: data
      });
    }

    if (status === 403) {
      return res.json({
        success: false,
        reason: 'forbidden',
        message: '您的 API Key 鉴权通过，但无权调用相关服务。请确保已在阿里百炼控制台开通了相关权限。',
        details: data
      });
    }

    if (status === 200 && data.output?.text) {
      return res.json({
        success: true,
        message: '阿里云百炼 DASHSCOPE_API_KEY 验证成功！授权状态正常，可以顺畅使用所有服务。',
        details: {
          status,
          code: data.code || 'Ok',
          message: 'Authentication Succeeded'
        }
      });
    }

    if (status === 400 && data.code && data.code !== 'ApiKeyRequired' && data.code !== 'InvalidApiKey') {
      return res.json({
        success: true,
        message: '阿里云百炼 DASHSCOPE_API_KEY 验证成功！授权状态正常。',
        details: {
          status,
          code: data.code || 'Ok',
          message: data.message || 'Authentication Succeeded'
        }
      });
    }

    return res.json({
      success: false,
      reason: 'api_error',
      message: `阿里云百炼返回非常规响应（HTTP 状态码: ${status}）。请检查密钥状态及百炼账户余额。`,
      details: data
    });

  } catch (err: any) {
    console.error('Error validating Aliyun DashScope API key:', err);
    return res.json({
      success: false,
      reason: 'network_failure',
      message: `网络连接故障：无法与阿里云 DashScope 云端服务器握手建立连接: ${err.message}`
    });
  }
});

// 2. AI Voice prompt design mapping rules (Local fallback)
function localRuleEngineParsePrompt(prompt: string) {
  const p = prompt.toLowerCase();
  
  // Default values
  let gender: 'male' | 'female' | 'other' = 'male';
  let ageGroup: 'child' | 'youth' | 'adult' | 'elder' = 'adult';
  let pitch = 0;
  let speed = 1.0;
  let warmth = 0;
  let tension = 0;
  let breathiness = 10;
  let robotic = 0;
  let reverb = 10;
  let description = `${prompt} (由规则引擎翻译：`;

  // Gender detection
  if (p.includes('女') || p.includes('妹') || p.includes('姐') || p.includes('娇') || p.includes('娘') || p.includes('妈') || p.includes('幼女')) {
    gender = 'female';
  } else if (p.includes('男') || p.includes('叔') || p.includes('哥') || p.includes('汉') || p.includes('爸') || p.includes('爷')) {
    gender = 'male';
  } else if (p.includes('机械') || p.includes('合成') || p.includes('外星') || p.includes('变形') || p.includes('赛博')) {
    gender = 'other';
  }

  // Age group detection
  if (p.includes('童') || p.includes('娃') || p.includes('正太') || p.includes('萝莉') || p.includes('小')) {
    ageGroup = 'child';
    pitch += 40;
  } else if (p.includes('青') || p.includes('少') || p.includes('阳光') || p.includes('活力')) {
    ageGroup = 'youth';
    pitch += 15;
  } else if (p.includes('老') || p.includes('奶') || p.includes('爷') || p.includes('暮') || p.includes('沧桑')) {
    ageGroup = 'elder';
    pitch -= 35;
    warmth += 20;
  }

  // Specific descriptors
  if (p.includes('高') || p.includes('尖') || p.includes('细')) {
    pitch = Math.min(100, pitch + 30);
  }
  if (p.includes('低') || p.includes('沉') || p.includes('重') || p.includes('沙哑')) {
    pitch = Math.max(-100, pitch - 30);
    breathiness += 25;
  }
  if (p.includes('快') || p.includes('急')) {
    speed = 1.3;
  }
  if (p.includes('慢') || p.includes('听故事') || p.includes('稳重')) {
    speed = 0.85;
  }
  if (p.includes('暖') || p.includes('温柔') || p.includes('亲切') || p.includes('治愈') || p.includes('厚')) {
    warmth = Math.min(100, warmth + 40);
  }
  if (p.includes('冷') || p.includes('严肃') || p.includes('紧张') || p.includes('颤抖')) {
    tension = Math.min(100, tension + 30);
  }
  if (p.includes('气') || p.includes('气音') || p.includes('耳语') || p.includes('深夜')) {
    breathiness = Math.min(100, breathiness + 45);
  }
  if (p.includes('机械') || p.includes('电音') || p.includes('声码') || p.includes('太空') || p.includes('科幻')) {
    robotic = Math.min(100, robotic + 70);
    reverb = Math.min(100, reverb + 25);
  }

  description += `性别:${gender === 'male'?'男':'女'}, 年龄:${ageGroup}, 音调:${pitch})`;

  return {
    gender,
    ageGroup,
    pitch,
    speed,
    warmth,
    tension,
    breathiness,
    robotic,
    reverb,
    description
  };
}

// 3. POST /api/voice/design
// Creates custom voice model by evaluating prompt + fine-tune variables + demo text
app.post('/api/voice/design', async (req, res) => {
  try {
    console.log('[Voice Design] 请求体:', JSON.stringify(req.body));
    
    const { prompt, baseConfig, demoText } = req.body ?? {};
    const apiKeyHeader = req.headers['x-dashscope-api-key'] || req.headers['authorization']?.toString().replace('Bearer ', '');
    const apiKey = (typeof apiKeyHeader === 'string' && apiKeyHeader.trim() !== '') ? apiKeyHeader.trim() : process.env.DASHSCOPE_API_KEY;

    console.log(`[Voice Design] API Key 已配置: ${!!apiKey}`);
    console.log(`[Voice Design] Prompt: "${prompt?.slice(0, 50)}..."`);
    console.log(`[Voice Design] DemoText: "${demoText?.slice(0, 50)}..."`);

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Missing DASHSCOPE_API_KEY environment variable.',
        message: '检测到未配置 DASHSCOPE_API_KEY 密钥，请在项目右上角的设置中填入有效的阿里百炼 API Key。'
      });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid prompt parameter',
        message: '请提供有效的音色描述提示词'
      });
    }

    let designedParams: Record<string, unknown> = {
      gender: 'female',
      ageGroup: 'youth',
      pitch: 0,
      speed: 1.0,
      warmth: 0,
      tension: 0,
      breathiness: 10,
      robotic: 0,
      reverb: 5,
      description: '通过AI声学分析生成的自定义音色'
    };

    try {
      console.log('[DashScope AI Voice Design]: Requesting acoustic parameter analysis...');
      const dashScopePrompt = `你是一个高级AI声学工程师与发声建模师。基于用户的自然语言提示词（Prompt）进行分析。
提示词: "${prompt}"。
你需要输出一个JSON对象，对应于声学参数，要求：
1. "gender": 只能是 "male" | "female" | "other" 之一。
2. "ageGroup": 只能是 "child" | "youth" | "adult" | "elder" 之一。
3. "pitch": 数字，取值 -100 到 100 之间。
4. "speed": 数字，取值 0.5 到 2.0 之间。
5. "warmth": 数字，取值 -100 到 100 之间。
6. "tension": 数字，取值 -100 到 100 之间。
7. "breathiness": 数字，取值 0 到 100 之间。
8. "robotic": 数字，取值 0 到 100 之间。
9. "reverb": 数字，取值 0 到 100 之间。
10. "description": 一句简明专业的中文声学特征描述。

必须严格返回如下格式的纯JSON字符串，不要包含任何额外解释文字:
{
  "gender": "female",
  "ageGroup": "youth",
  "pitch": 25,
  "speed": 1.1,
  "warmth": 20,
  "tension": 10,
  "breathiness": 5,
  "robotic": 0,
  "reverb": 5,
  "description": "..."
}`;

      const cleanJson = await callDashScopeLLM(dashScopePrompt, apiKey);
      console.log('[DashScope LLM Response]:', cleanJson);
      
      if (cleanJson && typeof cleanJson === 'object') {
        designedParams = {
          gender: cleanJson.gender || 'female',
          ageGroup: cleanJson.ageGroup || 'youth',
          pitch: cleanJson.pitch ?? 0,
          speed: cleanJson.speed ?? 1.0,
          warmth: cleanJson.warmth ?? 0,
          tension: cleanJson.tension ?? 0,
          breathiness: cleanJson.breathiness ?? 10,
          robotic: cleanJson.robotic ?? 0,
          reverb: cleanJson.reverb ?? 5,
          description: cleanJson.description || '通过AI声学分析生成的自定义音色',
        };
      }
      
    } catch (llmErr) {
      console.error('[DashScope LLM Analysis Failed, using defaults]', llmErr);
      // Continue with default params even if LLM fails
    }
    
    // Override with baseConfig if provided
    if (baseConfig && typeof baseConfig === 'object') {
      if (baseConfig.gender) designedParams.gender = baseConfig.gender;
      if (baseConfig.ageGroup) designedParams.ageGroup = baseConfig.ageGroup;
      if (typeof baseConfig.pitch === 'number') designedParams.pitch = baseConfig.pitch;
      if (typeof baseConfig.speed === 'number') designedParams.speed = baseConfig.speed;
      if (typeof baseConfig.warmth === 'number') designedParams.warmth = baseConfig.warmth;
      if (typeof baseConfig.tension === 'number') designedParams.tension = baseConfig.tension;
      if (typeof baseConfig.breathiness === 'number') designedParams.breathiness = baseConfig.breathiness;
      if (typeof baseConfig.robotic === 'number') designedParams.robotic = baseConfig.robotic;
      if (typeof baseConfig.reverb === 'number') designedParams.reverb = baseConfig.reverb;
    }

    let demoAudioData: string | undefined;
    let voiceId = `custom-dashscope-${Date.now()}`;

    // Try to call voice enrollment API
    try {
      console.log('[Voice Design] Calling voice-enrollment API...');
      
      let previewText = demoText || '这是音色在线设计与拟合注册声音，用于调试。';
      if (previewText.length < 15) {
        previewText = previewText + ' ' + '这是音色在线设计与拟合注册声音，用于调试。'.slice(0, Math.max(0, 15 - previewText.length));
      }
      
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'voice-enrollment',
          input: {
            action: 'create_voice',
            target_model: 'cosyvoice-v2',
            voice_prompt: prompt || '一个自然的声音',
            preview_text: previewText,
            prefix: 'customvd',
            language_hints: ['zh']
          },
          parameters: {
            sample_rate: 24000,
            response_format: 'wav'
          }
        })
      });

      const data = await response.json();
      console.log('[Voice Enrollment Response Status]:', response.status);
      console.log('[Voice Enrollment Response]:', JSON.stringify(data).slice(0, 500));

      if (response.ok && data.output?.voice_id) {
        voiceId = data.output.voice_id;
        console.log('[Voice Design] Voice ID created:', voiceId);
      } else {
        console.log('[Voice Design] Voice enrollment API did not return voice_id, using generated ID');
        // Don't fail, continue with generated voiceId
      }
    } catch (enrollmentErr) {
      console.error('[Voice Enrollment Error]:', enrollmentErr);
      // Continue without voice enrollment
    }
    
    // Generate demo audio using TTS
    if (demoText) {
      console.log('[Voice Design] Generating demo audio for:', demoText);
      
      try {
        const ttsResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'cosyvoice-v2',
            input: {
              text: demoText
            },
            parameters: {
              voice: voiceId,
              format: 'wav',
              sample_rate: 24000,
              pitch: Math.max(0.5, Math.min(2.0, 1.0 + ((designedParams.pitch as number || 0) / 150))),
              rate: Math.max(0.5, Math.min(2.0, designedParams.speed as number || 1.0)),
              language_hints: ['zh']
            }
          })
        });

        const ttsData = await ttsResponse.json();
        
        if (ttsData.output && ttsData.output.audio && ttsData.output.audio.url) {
          const audioResponse = await fetch(ttsData.output.audio.url);
          const audioBuffer = await audioResponse.arrayBuffer();
          demoAudioData = Buffer.from(audioBuffer).toString('base64');
          console.log('[Voice Design] Demo audio generated successfully');
        }
      } catch (ttsErr) {
        console.warn('[Voice Design] Failed to generate demo audio:', ttsErr);
      }
    }
    
    const demoAudio = demoAudioData ? {
      type: 'base64' as const,
      mime: 'audio/wav',
      data: demoAudioData
    } : undefined;
    
    console.log('[Voice Design] Response: success=true, voiceId=' + voiceId + ', demoAudio=' + (demoAudio ? `base64(${demoAudio.data.length} chars)` : 'none'));
    
    return res.json({
      success: true,
      mode: 'real',
      voiceId,
      specs: designedParams,
      demoAudio,
      message: '音色设计完成'
    });
  } catch (error: any) {
    console.error('[DashScope API Integration Error]', error);
    return res.status(500).json({
      success: false,
      error: '音色设计API调用失败',
      message: `调用阿里云百炼音色设计服务失败: ${error.message}`,
      details: error
    });
  }
});

// 3.5 POST /api/voice/clone
// Clones user voice by registering public URL of sample audio
app.post('/api/voice/clone', async (req, res) => {
  const { voiceName, audioBase64, audioName } = req.body;
  const apiKeyHeader = req.headers['x-dashscope-api-key'] || req.headers['authorization']?.toString().replace('Bearer ', '');
  const apiKey = (typeof apiKeyHeader === 'string' && apiKeyHeader.trim() !== '') ? apiKeyHeader.trim() : process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Missing DASHSCOPE_API_KEY.',
      message: '未在上游注册 DASHSCOPE_API_KEY。请在界面的 API Key 输入框中配置密钥。'
    });
  }

  if (!audioBase64) {
    return res.status(400).json({
      success: false,
      error: 'Missing audioBase64 parameter.'
    });
  }

  try {
    const ext = audioName?.split('.').pop() || 'wav';
    const filename = `clone-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Save base64 to file
    const buffer = Buffer.from(audioBase64, 'base64');
    fs.writeFileSync(filePath, buffer);

    // Compute public URL using dynamic proxy scheme
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const publicUrl = `${protocol}://${req.headers.host}/uploads/${filename}`;
    console.log(`[Voice Clone] Saved file to ${filePath}. Public URL: ${publicUrl}`);

    // Call DashScope voice cloning
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/voice-studio/voice-clone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'cosyvoice-voice-clone',
        input: {
          voice_name: voiceName || `极速克隆音色-${Date.now().toString().slice(-6)}`,
          voice_url: publicUrl
        }
      })
    });

    const data = await response.json();
    console.log('[Aliyun Voice Clone Response]:', data);

    if (!response.ok || (data.code && data.code !== 'Ok' && data.code !== 200)) {
      const errorMsg = data.message || JSON.stringify(data);
      return res.status(response.status || 400).json({
        success: false,
        error: `声音复刻识别失败 (HTTP ${response.status}): ${errorMsg}`,
        details: data
      });
    }

    return res.json({
      success: true,
      voiceId: data.output?.voice_id || `cosyvoice-clone-${Date.now()}`,
      voiceUrl: data.output?.voice_url || null,
      message: '声音克隆复刻建模成功！已注册至阿里百炼后台，您可以立即选择使用该音色。',
      details: data
    });
  } catch (err: any) {
    console.error('[Voice cloning execution err]:', err);
    return res.status(500).json({
      success: false,
      error: `触发声音复刻服务失败: ${err.message}`
    });
  }
});

// 4. POST /api/voice/tts
// Speaks text with Aliyun Cosyvoice standard or simulated synthesis
app.post('/api/voice/tts', async (req, res) => {
  const { text, voiceConfig, segmentConfig, model } = req.body;
  const apiKeyHeader = req.headers['x-dashscope-api-key'] || req.headers['authorization']?.toString().replace('Bearer ', '');
  const apiKey = (typeof apiKeyHeader === 'string' && apiKeyHeader.trim() !== '') ? apiKeyHeader.trim() : process.env.DASHSCOPE_API_KEY;

  console.log(`[TTS Query] Text: "${text}" Model: "${model || 'cosyvoice-v2'}"`);
  console.log(`[TTS Query] voiceConfig:`, JSON.stringify(voiceConfig));
  console.log(`[TTS Query] segmentConfig:`, JSON.stringify(segmentConfig));

  // Compute final pitch rate, speech speed, volume combining designed voice parameters + segment fine-tuning config!
  const baseVoice = voiceConfig || { pitch: 0, speed: 1.0, volume: 80, warmth: 0, tension: 0, breathiness: 0, reverb: 0 };
  const segment = segmentConfig || { pitch: 0, speed: 1.0, volume: 100, emotion: 'neutral', warmth: 0, tension: 0, breathiness: 0, reverb: 0 };
  
  console.log(`[TTS Params] baseVoice:`, baseVoice);
  console.log(`[TTS Params] segment:`, segment);

  // Calculate composite rates
  // Speed is multiplicative: base speed * segment rate
  const finalSpeed = Math.max(0.5, Math.min(2.0, baseVoice.speed * segment.speed));
  
  // Pitch is compounding: base pitch offset % + segment offset %
  // Aliyun pitch_rate is e.g. 1.0. We map pitch range (-100..100) to (0.5..2.0)
  const basePitchRate = 1.0 + (baseVoice.pitch / 250);
  const segmentPitchRate = 1.0 + (segment.pitch / 150);
  const finalPitch = Math.max(0.5, Math.min(2.0, basePitchRate * segmentPitchRate));

  const finalVolume = Math.min(100, Math.max(1, Math.round(baseVoice.volume * (segment.volume / 100))));

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Missing DASHSCOPE_API_KEY environment variable.',
      message: '未在上游注册 DASHSCOPE_API_KEY。系统已关闭本地 Web Audio 纯电音模拟器回退。请在项目设置中配置您的阿里云百炼 API 密钥。'
    });
  }

  try {
    // Aliyun DashScope CosyVoice API connection
    // Docs: https://help.aliyun.com/zh/dashscope/developer-reference/cosyvoice-quick-start
    let aliyunVoiceId = baseVoice.id || 'longxiaochun_v2';
    
    // Check and map legacy mock presets, standard string mapping
    if (aliyunVoiceId === 'cosyvoice-v2-preset-001' || aliyunVoiceId === 'custom-designed-1' || aliyunVoiceId.startsWith('dummy-') || aliyunVoiceId.startsWith('custom-local-') || aliyunVoiceId.startsWith('custom-designed-')) {
      aliyunVoiceId = 'longxiaochun_v2';
    } else if (aliyunVoiceId === 'cosyvoice-v2-preset-002') {
      aliyunVoiceId = 'sl_boy';
    } else if (aliyunVoiceId === 'cosyvoice-v2-preset-003') {
      aliyunVoiceId = 'sl_tongtong';
    } else if (aliyunVoiceId === 'cosyvoice-v2-preset-004') {
      aliyunVoiceId = 'sl_nannan';
    }
    
    const selectedModel = model || 'cosyvoice-v2';
    console.log(`[Aliyun Call] model: ${selectedModel}, voice_id: ${aliyunVoiceId}, pitch_rate: ${finalPitch}, speed: ${finalSpeed}`);

    try {
      // Use HTTP API to call dashscope TTS
      // Reference: https://help.aliyun.com/zh/model-studio/cosyvoice-tts-http-api
      const postData = JSON.stringify({
        model: selectedModel,
        input: { text: text },
        parameters: {
          voice: aliyunVoiceId,
          format: 'wav',
          sample_rate: 24000,
          pitch: parseFloat(finalPitch.toFixed(2)),
          rate: parseFloat(finalSpeed.toFixed(2)),
          volume: Math.min(100, Math.max(0, finalVolume)),
          language_hints: ['zh']
        }
      });

      const apiUrl = new URL('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer');
      const options = {
        hostname: apiUrl.hostname,
        port: 443,
        path: apiUrl.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const audioResult = await new Promise<{ url?: string; buffer?: Buffer; error?: string }>((resolve, reject) => {
        const req = https.request(options, (apiRes) => {
          const chunks: Buffer[] = [];
          apiRes.on('data', (chunk: Buffer) => chunks.push(chunk));
          apiRes.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const contentType = apiRes.headers['content-type'] || '';
            if (contentType.includes('application/json')) {
              try {
                const jsonData = JSON.parse(buffer.toString());
                // Check for API error
                if (jsonData.code && jsonData.code !== 'Success' && jsonData.code !== 'Successful') {
                  reject(new Error(`API Error: ${jsonData.code} - ${jsonData.message}`));
                } else if (jsonData.output?.audio?.url) {
                  // Success - return the audio URL for further processing
                  resolve({ url: jsonData.output.audio.url });
                } else {
                  reject(new Error(`API Error: Unexpected JSON response - ${buffer.toString()}`));
                }
              } catch (e) {
                reject(new Error(`API Error: Failed to parse JSON - ${buffer.toString()}`));
              }
            } else {
              // Binary audio directly
              resolve({ buffer });
            }
          });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
      });

      let base64Audio: string;
      
      if (audioResult.url) {
        // Download audio from the URL provided by CosyVoice API
        console.log(`[TTS] Fetching audio from URL: ${audioResult.url}`);
        const audioResponse = await fetch(audioResult.url);
        if (!audioResponse.ok) {
          throw new Error(`Failed to download audio from URL: ${audioResponse.status}`);
        }
        const audioBuffer = await audioResponse.arrayBuffer();
        base64Audio = Buffer.from(audioBuffer).toString('base64');
      } else if (audioResult.buffer) {
        base64Audio = audioResult.buffer.toString('base64');
      } else {
        throw new Error('No audio data received');
      }
      
      return res.json({
        success: true,
        mode: 'real',
        audioData: `data:audio/wav;base64,${base64Audio}`,
        fallbackActive: false,
        fallbackText: '',
        message: 'Task completed successfully',
        finalSpeed,
        finalPitch,
        finalVolume,
        emotion: segment.emotion
      });
    } catch (error: any) {
      const errorText = error.message || JSON.stringify(error);
      console.error(`[TTS Error]: ${errorText}`);
      res.status(500).json({
        success: false,
        error: errorText
      });
    }
  } catch (error: any) {
    console.error('[Dashboard Aliyun Backend Connection Failure]:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Alibaba DashScope audio rendering network error.'
    });
  }
});


// Serve static build as needed
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FullStack API] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
