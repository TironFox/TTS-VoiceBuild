import { VoiceModel, ConversionHistoryItem } from '../types';

const STORAGE_KEYS = {
  CUSTOM_VOICES: 'tts_custom_voices',
  PRESET_VOICES: 'tts_preset_voices',
  CONVERSION_HISTORY: 'tts_conversion_history',
  LAST_USED_VOICE: 'tts_last_used_voice',
  APP_SETTINGS: 'tts_app_settings',
};

export const voiceStorage = {
  getCustomVoices(): VoiceModel[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_VOICES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCustomVoice(voice: VoiceModel): void {
    const voices = this.getCustomVoices();
    const existingIndex = voices.findIndex(v => v.id === voice.id);
    if (existingIndex >= 0) {
      voices[existingIndex] = voice;
    } else {
      voices.push(voice);
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOM_VOICES, JSON.stringify(voices));
  },

  deleteCustomVoice(voiceId: string): void {
    const voices = this.getCustomVoices().filter(v => v.id !== voiceId);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_VOICES, JSON.stringify(voices));
  },

  getAllCustomVoices(): VoiceModel[] {
    return this.getCustomVoices();
  },

  savePresetVoices(voices: VoiceModel[]): void {
    localStorage.setItem(STORAGE_KEYS.PRESET_VOICES, JSON.stringify(voices));
  },

  getPresetVoices(): VoiceModel[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRESET_VOICES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addToHistory(item: ConversionHistoryItem): void {
    const history = this.getHistory();
    history.unshift(item);
    if (history.length > 50) {
      history.pop();
    }
    localStorage.setItem(STORAGE_KEYS.CONVERSION_HISTORY, JSON.stringify(history));
  },

  getHistory(): ConversionHistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONVERSION_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  clearHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.CONVERSION_HISTORY);
  },

  saveLastUsedVoice(voiceId: string): void {
    localStorage.setItem(STORAGE_KEYS.LAST_USED_VOICE, voiceId);
  },

  getLastUsedVoice(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_USED_VOICE);
  },

  saveSettings(settings: Record<string, unknown>): void {
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
  },

  getSettings(): Record<string, unknown> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  getVoiceById(voiceId: string): VoiceModel | undefined {
    const presets = this.getPresetVoices();
    const customs = this.getCustomVoices();
    return [...presets, ...customs].find(v => v.id === voiceId);
  },

  searchVoices(query: string): VoiceModel[] {
    const presets = this.getPresetVoices();
    const customs = this.getCustomVoices();
    const allVoices = [...presets, ...customs];
    const lowerQuery = query.toLowerCase();
    return allVoices.filter(
      v => v.name.toLowerCase().includes(lowerQuery) || 
           v.description.toLowerCase().includes(lowerQuery) ||
           v.gender.toLowerCase().includes(lowerQuery)
    );
  },
};
