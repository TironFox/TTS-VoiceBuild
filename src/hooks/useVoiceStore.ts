import { useState, useEffect, useCallback } from 'react';
import { VoiceModel } from '../types';
import { voiceStorage } from '../storage/voiceStorage';

const PRESET_VOICES: VoiceModel[] = [
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
    description: '语气文雅睿智，适合有声小说与诗词朗诵。',
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
    description: '纯真童趣女童，声音清亮活泼，洋溢着灵动生命力。',
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
    description: '沉静典雅的中年成熟女腔，饱含人文情怀，适合有声读物与文化讲解。',
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
  },
];

export function useVoiceStore() {
  const [presetVoices, setPresetVoices] = useState<VoiceModel[]>(PRESET_VOICES);
  const [customVoices, setCustomVoices] = useState<VoiceModel[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');

  useEffect(() => {
    const savedCustomVoices = voiceStorage.getCustomVoices();
    if (savedCustomVoices.length > 0) {
      setCustomVoices(savedCustomVoices);
    }

    const lastUsedVoice = voiceStorage.getLastUsedVoice();
    if (lastUsedVoice) {
      setSelectedVoiceId(lastUsedVoice);
    } else {
      setSelectedVoiceId(PRESET_VOICES[0].id);
    }
  }, []);

  useEffect(() => {
    voiceStorage.savePresetVoices(presetVoices);
  }, [presetVoices]);

  const saveCustomVoice = useCallback((voice: VoiceModel) => {
    voiceStorage.saveCustomVoice(voice);
    setCustomVoices(prev => {
      const index = prev.findIndex(v => v.id === voice.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = voice;
        return updated;
      }
      return [...prev, voice];
    });
  }, []);

  const deleteCustomVoice = useCallback((voiceId: string) => {
    voiceStorage.deleteCustomVoice(voiceId);
    setCustomVoices(prev => prev.filter(v => v.id !== voiceId));
    if (selectedVoiceId === voiceId) {
      const allVoices = [...presetVoices, ...customVoices].filter(v => v.id !== voiceId);
      setSelectedVoiceId(allVoices[0]?.id || presetVoices[0].id);
    }
  }, [selectedVoiceId, presetVoices, customVoices]);

  const selectVoice = useCallback((voiceId: string) => {
    setSelectedVoiceId(voiceId);
    voiceStorage.saveLastUsedVoice(voiceId);
  }, []);

  const allVoices = [...presetVoices, ...customVoices];

  const getVoiceById = useCallback((voiceId: string): VoiceModel | undefined => {
    return allVoices.find(v => v.id === voiceId);
  }, [allVoices]);

  const searchVoices = useCallback((query: string): VoiceModel[] => {
    if (!query) return allVoices;
    const lowerQuery = query.toLowerCase();
    return allVoices.filter(
      v => v.name.toLowerCase().includes(lowerQuery) ||
           v.description.toLowerCase().includes(lowerQuery) ||
           v.gender.toLowerCase().includes(lowerQuery)
    );
  }, [allVoices]);

  const selectedVoice = getVoiceById(selectedVoiceId) || presetVoices[0];

  return {
    presetVoices,
    customVoices,
    selectedVoiceId,
    selectedVoice,
    allVoices,
    saveCustomVoice,
    deleteCustomVoice,
    selectVoice,
    getVoiceById,
    searchVoices,
  };
}
