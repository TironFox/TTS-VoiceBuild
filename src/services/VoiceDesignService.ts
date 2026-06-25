import { VoiceModel } from '../types';

export interface DemoAudio {
  type: 'base64' | 'url';
  mime?: string;
  data?: string;
  url?: string;
}

export interface VoiceDesignResult {
  success: boolean;
  mode: 'real';
  voiceId: string;
  specs: Partial<VoiceModel>;
  message?: string;
  details?: unknown;
  demoAudio?: DemoAudio;
}

export interface VoiceDesignParams {
  prompt: string;
  baseConfig?: Partial<VoiceModel>;
  demoText?: string;
}

export class VoiceDesignService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  async designVoice(
    params: VoiceDesignParams,
    apiKey?: string
  ): Promise<VoiceDesignResult> {
    const { prompt, baseConfig, demoText } = params;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['x-dashscope-api-key'] = apiKey;
    }

    const response = await fetch(`${this.apiBaseUrl}/voice/design`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, baseConfig, demoText }),
    });

    const data = await response.json();

    if (!data.success) {
      const errorMsg = data.message || JSON.stringify(data);
      return {
        success: false,
        mode: 'real',
        voiceId: '',
        specs: {},
        message: `音色设计API调用失败: ${errorMsg}`,
        details: data,
      };
    }

    return {
      success: true,
      mode: 'real',
      voiceId: data.voiceId || this.generateVoiceId(),
      specs: data.specs || {},
      message: data.message,
      details: data.details,
      demoAudio: data.demoAudio,
    };
  }

  generateVoiceId(prefix: string = 'custom'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  createVoiceModel(specs: Partial<VoiceModel>, name: string): VoiceModel {
    return {
      id: specs.id || this.generateVoiceId(),
      name: name || '自定义音色',
      gender: specs.gender || 'female',
      ageGroup: specs.ageGroup || 'youth',
      description: specs.description || '通过音色设计工具创建的自定义音色',
      isPreset: false,
      avatarColor: specs.avatarColor || this.generateAvatarColor(),
      pitch: specs.pitch || 0,
      speed: specs.speed || 1.0,
      volume: specs.volume || 80,
      warmth: specs.warmth || 0,
      tension: specs.tension || 0,
      breathiness: specs.breathiness || 10,
      robotic: specs.robotic || 0,
      reverb: specs.reverb || 5,
      createdAt: new Date().toISOString(),
    };
  }

  private generateAvatarColor(): string {
    const colors = [
      'bg-gradient-to-tr from-purple-500 to-indigo-400',
      'bg-gradient-to-tr from-blue-700 to-cyan-600',
      'bg-gradient-to-tr from-emerald-600 to-teal-500',
      'bg-gradient-to-tr from-fuchsia-500 to-pink-500',
      'bg-gradient-to-tr from-yellow-400 to-amber-500',
      'bg-gradient-to-tr from-rose-600 to-orange-500',
      'bg-gradient-to-tr from-slate-600 to-slate-800',
      'bg-gradient-to-tr from-stone-500 to-neutral-700',
      'bg-gradient-to-tr from-red-500 to-pink-400',
      'bg-gradient-to-tr from-violet-600 to-purple-500',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export const voiceDesignService = new VoiceDesignService();
