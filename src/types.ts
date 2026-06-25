/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EmotionId = 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised' | 'excited' | 'relaxed' | 'serious' | 'gentle' | 'cheerful';

export interface VoiceModel {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  ageGroup: 'child' | 'youth' | 'adult' | 'elder';
  description: string;
  isPreset: boolean;
  avatarColor: string;

  // Custom Fine-Tuning Parameters
  pitch: number; // -100 to 100 (Default 0)
  speed: number; // 0.5 to 2.0 (Default 1.0)
  volume: number; // 0 to 100 (Default 80)

  // Storage & Sharing Metadata
  createdAt?: string;
  sampleText?: string;
  audioUrl?: string;
  supportsEmotion?: boolean;
}

export interface SSMLSegment {
  id: string;
  text: string;

  // Emotion Settings
  emotion: EmotionId;
  emotionIntensity: number; // 0.01 to 2.0

  // Prosody Settings
  pitch: number; // Relative pitch adjustment (-100 to 100)
  speed: number; // 0.5 to 2.0
  volume: number; // 0 to 100

  // Pauses
  pauseDuration?: number; // milliseconds

  // Audio
  audioUrl?: string;
  isSynthesizing?: boolean;
}

export type EmotionPreset = 'conservative' | 'standard' | 'passionate';

export interface EmotionPresetConfig {
  label: string;
  description: string;
  defaultIntensity: number;
  emotionMappings: Record<EmotionId, { intensity: number; speedMod: number }>;
}

export const EMOTION_PRESETS: Record<EmotionPreset, EmotionPresetConfig> = {
  conservative: {
    label: '保守',
    description: '语气平稳，强度适中',
    defaultIntensity: 0.5,
    emotionMappings: {
      neutral: { intensity: 0.3, speedMod: 1.0 },
      happy: { intensity: 0.4, speedMod: 1.0 },
      sad: { intensity: 0.4, speedMod: 0.9 },
      angry: { intensity: 0.5, speedMod: 1.1 },
      fearful: { intensity: 0.4, speedMod: 1.05 },
      disgusted: { intensity: 0.4, speedMod: 1.0 },
      surprised: { intensity: 0.5, speedMod: 1.05 },
      excited: { intensity: 0.4, speedMod: 1.1 },
      relaxed: { intensity: 0.3, speedMod: 0.95 },
      serious: { intensity: 0.4, speedMod: 0.95 },
      gentle: { intensity: 0.3, speedMod: 0.9 },
      cheerful: { intensity: 0.4, speedMod: 1.05 }
    }
  },
  standard: {
    label: '标准',
    description: '情绪分明，层次清晰',
    defaultIntensity: 1.0,
    emotionMappings: {
      neutral: { intensity: 0.6, speedMod: 1.0 },
      happy: { intensity: 1.0, speedMod: 1.05 },
      sad: { intensity: 0.9, speedMod: 0.95 },
      angry: { intensity: 1.0, speedMod: 1.15 },
      fearful: { intensity: 0.9, speedMod: 1.1 },
      disgusted: { intensity: 0.8, speedMod: 1.0 },
      surprised: { intensity: 1.0, speedMod: 1.1 },
      excited: { intensity: 1.0, speedMod: 1.15 },
      relaxed: { intensity: 0.6, speedMod: 0.95 },
      serious: { intensity: 0.8, speedMod: 0.95 },
      gentle: { intensity: 0.7, speedMod: 0.9 },
      cheerful: { intensity: 1.0, speedMod: 1.1 }
    }
  },
  passionate: {
    label: '激情',
    description: '情感饱满，富有感染力',
    defaultIntensity: 1.5,
    emotionMappings: {
      neutral: { intensity: 0.8, speedMod: 1.05 },
      happy: { intensity: 1.5, speedMod: 1.15 },
      sad: { intensity: 1.2, speedMod: 0.9 },
      angry: { intensity: 1.5, speedMod: 1.25 },
      fearful: { intensity: 1.3, speedMod: 1.15 },
      disgusted: { intensity: 1.2, speedMod: 1.05 },
      surprised: { intensity: 1.5, speedMod: 1.2 },
      excited: { intensity: 1.5, speedMod: 1.25 },
      relaxed: { intensity: 0.9, speedMod: 0.9 },
      serious: { intensity: 1.2, speedMod: 0.9 },
      gentle: { intensity: 1.0, speedMod: 0.85 },
      cheerful: { intensity: 1.5, speedMod: 1.2 }
    }
  }
};

export const EMOTION_LABELS: Record<EmotionId, string> = {
  neutral: '平静',
  happy: '开心',
  sad: '悲伤',
  angry: '愤怒',
  fearful: '恐惧',
  disgusted: '厌恶',
  surprised: '惊讶',
  excited: '兴奋',
  relaxed: '放松',
  serious: '严肃',
  gentle: '温柔',
  cheerful: '欢快'
};

export interface ConversionHistoryItem {
  id: string;
  sourceText?: string;
  targetVoiceName: string;
  resultAudioUrl: string;
  timestamp: string;
  type: 'tts' | 'segment-tts';
  duration?: number;
  segmentCount?: number;
}

// Utility functions
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateSSML(segments: SSMLSegment[], voiceId: string): string {
  let ssml = `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2011/10/synthesis">
  <voice name="${voiceId}">`;

  for (const seg of segments) {
    const escapedText = escapeXml(seg.text);
    const pitchValue = seg.pitch !== 0 ? (seg.pitch > 0 ? `+${seg.pitch}%` : `${seg.pitch}%`) : '+0%';
    const rateValue = seg.speed !== 1.0 ? (seg.speed > 1 ? `+${Math.round((seg.speed - 1) * 100)}%` : `${Math.round((seg.speed - 1) * 100)}%`) : '+0%';
    const volumeValue = seg.volume !== 80 ? (seg.volume > 80 ? `+${seg.volume - 80}` : `${seg.volume - 80}`) : '+0';

    if (seg.emotion !== 'neutral' && seg.emotionIntensity > 0.01) {
      ssml += `
    <emotion id="${seg.emotion}" intensity="${seg.emotionIntensity.toFixed(2)}">
      <prosody pitch="${pitchValue}" rate="${rateValue}" volume="${volumeValue}">${escapedText}</prosody>
    </emotion>`;
    } else {
      ssml += `
    <prosody pitch="${pitchValue}" rate="${rateValue}" volume="${volumeValue}">${escapedText}</prosody>`;
    }

    if (seg.pauseDuration && seg.pauseDuration > 0) {
      ssml += `
    <break time="${seg.pauseDuration}ms"/>`;
    }
  }

  ssml += `
  </voice>
</speak>`;

  return ssml;
}

export function generateSegmentParams(segments: SSMLSegment[]): {
  json: Record<string, unknown>[];
  readable: string[];
} {
  const params: Record<string, unknown>[] = [];
  const readable: string[] = [];

  segments.forEach((seg, idx) => {
    params.push({
      segment: idx + 1,
      text: seg.text,
      emotion: seg.emotion,
      emotionIntensity: seg.emotionIntensity,
      pitch: seg.pitch,
      speed: seg.speed,
      volume: seg.volume,
      pause: seg.pauseDuration || 0
    });

    const emotionLabel = EMOTION_LABELS[seg.emotion];
    const intensityLevel = seg.emotionIntensity < 0.5 ? '微弱' : seg.emotionIntensity < 1.0 ? '适中' : seg.emotionIntensity < 1.5 ? '强烈' : '极强';
    readable.push(`第${idx + 1}句: "${seg.text.slice(0, 20)}${seg.text.length > 20 ? '...' : ''}" - ${emotionLabel}(${intensityLevel})`);
  });

  return { json: params, readable };
}
