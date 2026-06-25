import { VoiceModel, TextSegment } from '../types';

export interface TtsResult {
  success: boolean;
  audioData?: string;
  audioUrl?: string;
  duration?: number;
  error?: string;
  details?: unknown;
}

export interface SegmentTtsResult extends TtsResult {
  segments?: TextSegment[];
}

export class TtsService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  static base64ToBlobUrl(base64: string, mime = 'audio/wav'): string {
    let cleanBase64 = base64;
    
    if (base64.startsWith('data:')) {
      const match = base64.match(/^data:([^,]+);base64,(.+)$/);
      if (match) {
        mime = match[1];
        cleanBase64 = match[2];
      }
    }
    
    const byteCharacters = atob(cleanBase64);
    const byteArrays: Uint8Array[] = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      byteArrays.push(new Uint8Array(byteNumbers));
    }

    const blob = new Blob(byteArrays, { type: mime });
    return URL.createObjectURL(blob);
  }

  async synthesize(
    text: string,
    voice: Partial<VoiceModel>,
    apiKey?: string
  ): Promise<TtsResult> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['x-dashscope-api-key'] = apiKey;
      }

      const response = await fetch(`${this.apiBaseUrl}/voice/tts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          voiceConfig: voice,
          segmentConfig: {
            pitch: 0,
            speed: 1.0,
            volume: 100,
            emotion: 'neutral' as const,
          },
          model: 'cosyvoice-v2',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'TTS合成失败',
          details: data,
        };
      }

      return {
        success: true,
        audioData: data.audioData,
        audioUrl: data.audioUrl,
        duration: data.duration,
        details: data,
      };
    } catch (error) {
      console.error('[TtsService] Error:', error);
      return {
        success: false,
        error: `TTS服务调用失败: ${(error as Error).message}`,
      };
    }
  }

  async synthesizeSegments(
    segments: TextSegment[],
    voice: Partial<VoiceModel>,
    apiKey?: string
  ): Promise<SegmentTtsResult> {
    try {
      const results: TextSegment[] = [];

      for (const segment of segments) {
        const result = await this.synthesize(
          segment.text,
          {
            ...voice,
            pitch: (voice.pitch || 0) + segment.pitch,
            speed: (voice.speed || 1.0) * segment.speed,
            volume: Math.min(100, Math.max(0, (voice.volume || 80) * segment.volume / 100)),
          },
          apiKey
        );

        const audioUrl = result.audioData ? TtsService.base64ToBlobUrl(result.audioData, 'audio/wav') : undefined;
        
        results.push({
          ...segment,
          audioUrl,
          isSynthesizing: false,
        });

        if (!result.success) {
          return {
            success: false,
            error: result.error,
            segments: results,
          };
        }
      }

      return {
        success: true,
        segments: results,
      };
    } catch (error) {
      console.error('[TtsService] Segment synthesis error:', error);
      return {
        success: false,
        error: `分段合成失败: ${(error as Error).message}`,
      };
    }
  }

  textToSpeechUrl(
    text: string,
    voice: Partial<VoiceModel>,
    apiKey?: string
  ): string {
    const params = new URLSearchParams({
      text: encodeURIComponent(text),
      voiceId: voice.id || 'longxiaochun_v2',
      pitch: String(voice.pitch || 0),
      speed: String(voice.speed || 1.0),
      volume: String(voice.volume || 80),
    });

    if (apiKey) {
      params.set('apiKey', apiKey);
    }

    return `${this.apiBaseUrl}/voice/tts?${params.toString()}`;
  }

  createAudioElement(audioData: string): HTMLAudioElement {
    const audioBlobUrl = TtsService.base64ToBlobUrl(audioData, 'audio/wav');
    const audio = new Audio(audioBlobUrl);
    return audio;
  }

  async playAudio(audioData: string): Promise<void> {
    const audio = this.createAudioElement(audioData);
    await audio.play();
  }
}

export const ttsService = new TtsService();
