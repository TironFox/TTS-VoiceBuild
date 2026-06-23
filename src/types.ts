/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VoiceModel {
  id: string; // "preset-*" or "custom-*"
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
  warmth: number; // -100 to 100 (Default 0, timber tone)
  tension: number; // -100 to 100 (Default 0, vocal fold tension)
  breathiness: number; // 0 to 100 (Default 0, breath amount)
  robotic: number; // 0 to 100 (Default 0, vocoder robotic effect)
  reverb: number; // 0 to 100 (Default 0, spatial wetness)
  
  // Storage & Sharing Metadata
  createdAt?: string;
  sampleText?: string;
  audioUrl?: string; // Cache of pre-synthesized sample or simulation
}

export interface TextSegment {
  id: string;
  text: string;
  pitch: number;    // -100 to 100 (Relative adjustments of segment tone)
  speed: number;    // 0.5 to 2.0 (Relative speed rate of segment)
  volume: number;   // 0 to 100 (Relative volume of segment)
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'fear' | 'excited' | 'serious' | 'gentle' | 'professional';
  audioUrl?: string; // Cache base64 or generated blob url of this specific segment
  isSynthesizing?: boolean;
}

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
