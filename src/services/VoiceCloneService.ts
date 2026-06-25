import { VoiceModel } from '../types';

export interface VoiceCloneResult {
  success: boolean;
  voiceId?: string;
  message?: string;
  details?: unknown;
}

export interface CloneTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  voiceId?: string;
  audioUrl?: string;
  progress?: number;
  error?: string;
}

export class VoiceCloneService {
  private apiBaseUrl: string;
  private tasks: Map<string, CloneTask> = new Map();

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  async cloneVoice(
    audioUrl: string,
    voiceName: string,
    apiKey?: string
  ): Promise<VoiceCloneResult> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['x-dashscope-api-key'] = apiKey;
      }

      const response = await fetch(`${this.apiBaseUrl}/voice/clone`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          audioUrl,
          voiceName,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        return {
          success: false,
          message: data.error || '声音克隆失败',
          details: data,
        };
      }

      return {
        success: true,
        voiceId: data.voiceId,
        message: data.message,
        details: data,
      };
    } catch (error) {
      console.error('[VoiceCloneService] Error:', error);
      return {
        success: false,
        message: `声音克隆服务调用失败: ${(error as Error).message}`,
      };
    }
  }

  async cloneFromFile(
    audioFile: File,
    voiceName: string,
    apiKey?: string
  ): Promise<VoiceCloneResult> {
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('voiceName', voiceName);

      const headers: Record<string, string> = {};

      if (apiKey) {
        headers['x-dashscope-api-key'] = apiKey;
      }

      const response = await fetch(`${this.apiBaseUrl}/voice/clone/file`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        return {
          success: false,
          message: data.error || '声音克隆失败',
          details: data,
        };
      }

      return {
        success: true,
        voiceId: data.voiceId,
        message: data.message,
        details: data,
      };
    } catch (error) {
      console.error('[VoiceCloneService] File upload error:', error);
      return {
        success: false,
        message: `声音克隆文件上传失败: ${(error as Error).message}`,
      };
    }
  }

  async cloneFromMic(
    audioBlob: Blob,
    voiceName: string,
    apiKey?: string
  ): Promise<VoiceCloneResult> {
    const file = new File([audioBlob], 'voice_sample.wav', {
      type: 'audio/wav',
    });
    return this.cloneFromFile(file, voiceName, apiKey);
  }

  async getCloneStatus(taskId: string): Promise<CloneTask | undefined> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/voice/clone/status/${taskId}`);
      const data = await response.json();

      if (data.success) {
        return {
          id: taskId,
          status: data.status as CloneTask['status'],
          voiceId: data.voiceId,
          audioUrl: data.audioUrl,
          progress: data.progress,
          error: data.error,
        };
      }
    } catch (error) {
      console.error('[VoiceCloneService] Get status error:', error);
    }

    return this.tasks.get(taskId);
  }

  cancelClone(taskId: string): void {
    this.tasks.delete(taskId);
    fetch(`${this.apiBaseUrl}/voice/clone/cancel/${taskId}`, {
      method: 'POST',
    }).catch(() => {});
  }

  createVoiceModelFromClone(voiceId: string, voiceName: string): VoiceModel {
    return {
      id: voiceId,
      name: `${voiceName} (克隆)`,
      gender: 'other',
      ageGroup: 'adult',
      description: '通过声音克隆生成的自定义音色',
      isPreset: false,
      avatarColor: 'bg-gradient-to-tr from-cyan-500 to-blue-600',
      pitch: 0,
      speed: 1.0,
      volume: 80,
      warmth: 0,
      tension: 0,
      breathiness: 10,
      robotic: 0,
      reverb: 5,
      createdAt: new Date().toISOString(),
    };
  }

  validateAudioFile(file: File): { valid: boolean; message: string } {
    const maxSize = 10 * 1024 * 1024;
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/aac', 'audio/flac'];

    if (file.size > maxSize) {
      return {
        valid: false,
        message: '文件大小不能超过10MB',
      };
    }

    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        message: '不支持的音频格式，请上传WAV、MP3、AAC或FLAC格式',
      };
    }

    return {
      valid: true,
      message: '文件验证通过',
    };
  }
}

export const voiceCloneService = new VoiceCloneService();
