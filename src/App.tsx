/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Play, Square, Sparkles, Volume2, Plus, RefreshCw, 
  Download, Headphones, Award, Mic, Upload, X, Check, 
  ChevronDown, ChevronUp, Settings, Copy, FileText, Wand2
} from 'lucide-react';
import { 
  VoiceModel, SSMLSegment, EmotionId, EmotionPreset, 
  EMOTION_PRESETS, EMOTION_LABELS, generateSSML, generateSegmentParams 
} from './types';

function base64ToBlobUrl(base64: string, mime = 'audio/wav'): string {
  let cleanBase64 = base64;
  
  if (base64.startsWith('data:')) {
    const match = base64.match(/^data:([^,]+);base64,(.+)$/);
    if (match) {
      mime = match[1];
      cleanBase64 = match[2];
    }
  }
  
  try {
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
  } catch (e) {
    console.error('[base64ToBlobUrl] Failed to decode base64:', e);
    throw new Error('音频数据解码失败');
  }
}

const PRESET_VOICES: VoiceModel[] = [
  {
    id: 'longxiaochun_v2',
    name: '龙小春',
    gender: 'female',
    ageGroup: 'youth',
    description: '青年温和女声，声音清澈温润，极富生活代入感',
    isPreset: true,
    avatarColor: 'bg-luxury-400',
    pitch: 10,
    speed: 1.00,
    volume: 85,
  },
  {
    id: 'longqiang_v2',
    name: '龙腔',
    gender: 'male',
    ageGroup: 'adult',
    description: '稳重中年男声，声音饱满富有弹性，极具专业演讲风骨',
    isPreset: true,
    avatarColor: 'bg-luxury-500',
    pitch: -20,
    speed: 0.90,
    volume: 95,
  },
  {
    id: 'longshuo_v2',
    name: '龙硕',
    gender: 'male',
    ageGroup: 'youth',
    description: '庄重青年男声，语调干练果决，适合技术宣讲',
    isPreset: true,
    avatarColor: 'bg-luxury-600',
    pitch: -10,
    speed: 1.05,
    volume: 85,
  },
  {
    id: 'longting_v2',
    name: '龙婷',
    gender: 'female',
    ageGroup: 'youth',
    description: '知性青年女声，语气文雅睿智，适合有声小说',
    isPreset: true,
    avatarColor: 'bg-luxury-400',
    pitch: 20,
    speed: 0.95,
    volume: 85,
  },
  {
    id: 'longyue_v2',
    name: '龙悦',
    gender: 'female',
    ageGroup: 'child',
    description: '欢快儿童女声，纯真童趣，声音清亮活泼',
    isPreset: true,
    avatarColor: 'bg-accent',
    pitch: 60,
    speed: 1.10,
    volume: 90,
  },
  {
    id: 'longjing_v2',
    name: '龙静',
    gender: 'female',
    ageGroup: 'adult',
    description: '温柔叙事女声，沉静典雅，饱含人文情怀',
    isPreset: true,
    avatarColor: 'bg-luxury-500',
    pitch: -5,
    speed: 1.00,
    volume: 80,
  },
  {
    id: 'longchu_v2',
    name: '龙楚',
    gender: 'male',
    ageGroup: 'adult',
    description: '成熟磁性男声，腔调老练成熟，充满故事感',
    isPreset: true,
    avatarColor: 'bg-luxury-600',
    pitch: -30,
    speed: 0.95,
    volume: 85,
  },
  {
    id: 'longwan_v2',
    name: '龙婉',
    gender: 'female',
    ageGroup: 'elder',
    description: '睿智有声老妪，慈祥温暖，适合祖母角色演绎',
    isPreset: true,
    avatarColor: 'bg-luxury-700',
    pitch: -20,
    speed: 0.85,
    volume: 80,
  }
];

export default function App() {
  const [presetVoices] = useState<VoiceModel[]>(PRESET_VOICES);
  const [customVoices, setCustomVoices] = useState<VoiceModel[]>(() => {
    try {
      const saved = localStorage.getItem('tts_custom_voices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('tts_last_used_voice');
      return saved || 'longxiaochun_v2';
    } catch {
      return 'longxiaochun_v2';
    }
  });
  
  const allVoicesCombined = [...presetVoices, ...customVoices];
  const activeSelectedVoice = allVoicesCombined.find(v => v.id === selectedVoiceId) || presetVoices[0];

  const [designerPrompt, setDesignerPrompt] = useState<string>('');
  const [designerPreviewText, setDesignerPreviewText] = useState<string>('');
  const [editorName, setEditorName] = useState<string>('');
  const [editorGender, setEditorGender] = useState<VoiceModel['gender']>('female');
  const [editorAge, setEditorAge] = useState<VoiceModel['ageGroup']>('youth');
  
  const [pitch, setPitch] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1.00);
  const [volume, setVolume] = useState<number>(85);
  
  const [designSaving, setDesignSaving] = useState<boolean>(false);
  const [designPreviewAudio, setDesignPreviewAudio] = useState<string>('');

  const [rawTextToSplit, setRawTextToSplit] = useState<string>('');
  const [segments, setSegments] = useState<SSMLSegment[]>([]);
  const [segmentSynthesizingId, setSegmentSynthesizingId] = useState<string | null>(null);
  const [emotionPreset, setEmotionPreset] = useState<EmotionPreset>('standard');
  const [showSSMLPreview, setShowSSMLPreview] = useState<boolean>(false);
  const [ssmlContent, setSSMLContent] = useState<string>('');

  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [visualDataArray, setVisualDataArray] = useState<Uint8Array>(new Uint8Array(64));
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  
  useEffect(() => {
    const cached = localStorage.getItem('voice_audio_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        Object.entries(parsed).forEach(([key, value]) => {
          audioCacheRef.current.set(key, value);
        });
      } catch {
        console.warn('Failed to parse audio cache');
      }
    }
  }, []);
  
  const saveAudioCache = () => {
    const cacheObj: Record<string, string> = {};
    audioCacheRef.current.forEach((value, key) => {
      cacheObj[key] = value;
    });
    localStorage.setItem('voice_audio_cache', JSON.stringify(cacheObj));
  };

  const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem('dashscope_api_key') || '');
  const [selectedTtsModel, setSelectedTtsModel] = useState<string>('cosyvoice-v2');
  
  const [activeTab, setActiveTab] = useState<'voices' | 'design' | 'synthesize'>('voices');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-49), message]);
  };

  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (customApiKey) {
      headers['X-DashScope-Api-Key'] = customApiKey.trim();
    }
    return headers;
  };

  const forceStopAudition = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    setCurrentlyPlayingId(null);
  };

  const handleAuditionVoice = async (voice: VoiceModel) => {
    forceStopAudition();
    setSelectedVoiceId(voice.id);
    addLog(`[试听]: 正在播放音色 "${voice.name}"`);
    
    const cacheKey = `${voice.id}_preview`;
    const cachedAudio = audioCacheRef.current.get(cacheKey);
    
    if (cachedAudio) {
      setCurrentlyPlayingId(voice.id);
      const audio = new Audio(cachedAudio);
      activeAudioRef.current = audio;
      
      audio.onended = () => {
        setCurrentlyPlayingId(null);
        activeAudioRef.current = null;
      };
      
      audio.onerror = () => {
        setCurrentlyPlayingId(null);
        activeAudioRef.current = null;
        audioCacheRef.current.delete(cacheKey);
        saveAudioCache();
      };
      
      await audio.play();
      addLog(`[试听完成]: "${voice.name}" (使用缓存)`);
      return;
    }
    
    const testText = '您好，这是阿里百炼音色合成服务的试听音频。';
    
    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          text: testText,
          voiceConfig: voice,
          segmentConfig: { pitch: voice.pitch, speed: voice.speed, volume: voice.volume },
          model: selectedTtsModel
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.audioData) {
        audioCacheRef.current.set(cacheKey, data.audioData);
        saveAudioCache();
        
        setCurrentlyPlayingId(voice.id);
        const audioBlobUrl = base64ToBlobUrl(data.audioData, 'audio/wav');
        const audio = new Audio(audioBlobUrl);
        activeAudioRef.current = audio;
        
        audio.onended = () => {
          setCurrentlyPlayingId(null);
          activeAudioRef.current = null;
        };
        
        audio.onerror = () => {
          setCurrentlyPlayingId(null);
          activeAudioRef.current = null;
          audioCacheRef.current.delete(cacheKey);
          saveAudioCache();
        };
        
        await audio.play();
        addLog(`[试听完成]: "${voice.name}"`);
      } else {
        throw new Error(data.message || '合成失败');
      }
    } catch (e: any) {
      addLog(`[试听失败]: ${e.message}`);
    }
  };

  const handleRegisterCustomVoice = async () => {
    if (!designerPrompt.trim()) {
      addLog('[提示]: 请输入音色描述提示词');
      return;
    }
    
    forceStopAudition();
    setDesignSaving(true);
    setDesignPreviewAudio('');
    addLog(`[音色定制]: 提交提示词 "${designerPrompt}"...`);

    try {
      const res = await fetch('/api/voice/design', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          prompt: designerPrompt,
          baseConfig: {
            gender: editorGender,
            ageGroup: editorAge,
            pitch,
            speed,
            volume
          },
          demoText: designerPreviewText || '这是我的音色预览。'
        })
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || '音色设计失败');
      }

      const newVoice: VoiceModel = {
        id: data.voiceId || `custom-${Date.now()}`,
        name: editorName || '自定义音色',
        gender: editorGender,
        ageGroup: editorAge,
        description: designerPrompt.slice(0, 50) + (designerPrompt.length > 50 ? '...' : ''),
        isPreset: false,
        avatarColor: 'bg-accent',
        pitch,
        speed,
        volume,
        createdAt: new Date().toISOString(),
        sampleText: designerPreviewText || '这是我的音色预览。'
      };

      setCustomVoices(prev => {
        const updated = [newVoice, ...prev];
        localStorage.setItem('tts_custom_voices', JSON.stringify(updated));
        return updated;
      });
      localStorage.setItem('tts_last_used_voice', newVoice.id);
      setSelectedVoiceId(newVoice.id);
      addLog(`[成功]: 音色定制完成！已保存到本地音色库`);

      if (data.demoAudio) {
        let audioUrl = '';
        if (data.demoAudio.type === 'base64' && data.demoAudio.data) {
          audioUrl = base64ToBlobUrl(data.demoAudio.data, data.demoAudio.mime || 'audio/wav');
        } else if (data.demoAudio.type === 'url' && data.demoAudio.url) {
          audioUrl = data.demoAudio.url;
        }
        
        if (audioUrl) {
          setDesignPreviewAudio(audioUrl);
          addLog(`[预览音频]: 已生成演示音频`);
        }
      }

    } catch (e: any) {
      addLog(`[错误]: ${e.message}`);
    } finally {
      setDesignSaving(false);
    }
  };

  const handleDeleteCustomVoice = (id: string) => {
    setCustomVoices(prev => {
      const updated = prev.filter(v => v.id !== id);
      localStorage.setItem('tts_custom_voices', JSON.stringify(updated));
      return updated;
    });
    if (selectedVoiceId === id) {
      const newSelected = presetVoices[0].id;
      setSelectedVoiceId(newSelected);
      localStorage.setItem('tts_last_used_voice', newSelected);
    }
    addLog(`[删除]: 已删除自定义音色`);
  };

  const handleSplitText = () => {
    if (!rawTextToSplit.trim()) return;
    
    const lines = rawTextToSplit.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const preset = EMOTION_PRESETS[emotionPreset];
    const parsedSegs: SSMLSegment[] = lines.map((text, idx) => ({
      id: `seg-${Date.now()}-${idx}`,
      text,
      pitch: 0,
      speed: 1.0,
      volume: 85,
      emotion: 'neutral',
      emotionIntensity: preset.defaultIntensity,
      audioUrl: undefined
    }));
    
    setSegments(parsedSegs);
    addLog(`[断句完成]: 共 ${parsedSegs.length} 段`);
  };

  const handleAddBlankSegment = () => {
    const preset = EMOTION_PRESETS[emotionPreset];
    const newSegment: SSMLSegment = {
      id: `seg-${Date.now()}`,
      text: '',
      pitch: 0,
      speed: 1.0,
      volume: 85,
      emotion: 'neutral',
      emotionIntensity: preset.defaultIntensity,
      audioUrl: undefined
    };
    setSegments(prev => [...prev, newSegment]);
  };

  const handleRemoveSegment = (id: string) => {
    setSegments(prev => prev.filter(s => s.id !== id));
  };

  const handleSynthesizeSingleSegment = async (segId: string) => {
    const targetSeg = segments.find(s => s.id === segId);
    if (!targetSeg || !targetSeg.text.trim()) return;

    forceStopAudition();
    setSegmentSynthesizingId(segId);
    addLog(`[合成]: 第 ${segments.findIndex(s => s.id === segId) + 1} 句`);

    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          text: targetSeg.text,
          voiceConfig: activeSelectedVoice,
          segmentConfig: targetSeg,
          model: selectedTtsModel
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.audioData) {
        addLog(`[合成完成]: 第 ${segments.findIndex(s => s.id === segId) + 1} 句`);
        
        const audioBlobUrl = base64ToBlobUrl(data.audioData, 'audio/wav');
        
        setSegments(prev => prev.map(s => {
          if (s.id === segId) {
            return { ...s, audioUrl: audioBlobUrl, isSynthesizing: false };
          }
          return s;
        }));
      } else {
        throw new Error(data.message || '合成失败');
      }
    } catch (e: any) {
      addLog(`[合成失败]: ${e.message}`);
      setSegments(prev => prev.map(s => {
        if (s.id === segId) {
          return { ...s, audioUrl: undefined, isSynthesizing: false };
        }
        return s;
      }));
    } finally {
      setSegmentSynthesizingId(null);
    }
  };

  const downloadAudio = (audioData: string, filename: string) => {
    const link = document.createElement('a');
    
    let audioSrc = audioData;
    if (audioData.startsWith('blob:')) {
      audioSrc = audioData;
    } else if (audioData.startsWith('data:')) {
      audioSrc = audioData;
    } else {
      audioSrc = `data:audio/wav;base64,${audioData}`;
    }
    
    link.href = audioSrc;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllSegmentAudio = () => {
    const synthesizedSegments = segments.filter(s => s.audioUrl && s.audioUrl !== '#');
    if (synthesizedSegments.length === 0) {
      addLog('[提示]: 暂无已合成的音轨');
      return;
    }

    synthesizedSegments.forEach((seg, index) => {
      if (seg.audioUrl) {
        const filename = `segment_${index + 1}.wav`;
        downloadAudio(seg.audioUrl, filename);
      }
    });
    addLog(`[下载完成]: 共 ${synthesizedSegments.length} 段`);
  };

  const saveApiKey = () => {
    localStorage.setItem('dashscope_api_key', customApiKey);
    setShowSettings(false);
    addLog('[设置]: API Key 已保存');
  };

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (!data.hasApiKey && !customApiKey) {
          setShowSettings(true);
        }
      });
  }, []);

  useEffect(() => {
    localStorage.setItem('tts_last_used_voice', selectedVoiceId);
  }, [selectedVoiceId]);

  return (
    <div className="min-h-screen bg-gradient-luxury">
      <header className="fixed top-0 left-0 right-0 z-50 bg-luxury-950/90 backdrop-blur-luxury border-b border-luxury-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-semibold text-luxury-100 tracking-wide">
                  VoiceCraft
                </h1>
                <p className="text-[10px] text-luxury-500 uppercase tracking-widest">
                  Premium Voice Synthesis
                </p>
              </div>
            </div>
            
            <nav className="flex items-center space-x-1">
              {[
                { id: 'voices', label: '音色库' },
                { id: 'design', label: '声音设计' },
                { id: 'synthesize', label: '分段合成' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'voices' | 'design' | 'synthesize')}
                  className={`px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-luxury-400 hover:text-luxury-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2.5 rounded-lg hover:bg-luxury-800/50 text-luxury-400 hover:text-accent transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="fixed inset-0 z-50 bg-luxury-950/95 backdrop-blur-luxury flex items-center justify-center animate-fade-in">
          <div className="bg-luxury-900 border border-luxury-700/50 rounded-2xl p-8 w-full max-w-md mx-4 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-lg font-semibold text-luxury-100">API 设置</h2>
              <button onClick={() => setShowSettings(false)} className="text-luxury-400 hover:text-luxury-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-luxury-400 mb-2">阿里百炼 API Key</label>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxxxx"
                  className="w-full bg-luxury-800/50 border border-luxury-700 rounded-lg px-4 py-3 text-sm text-luxury-100 placeholder:text-luxury-600 focus:border-accent/50 transition-colors"
                />
              </div>
              
              <div className="flex items-center justify-between text-xs text-luxury-500">
                <span>当前模型: {selectedTtsModel}</span>
                <select
                  value={selectedTtsModel}
                  onChange={(e) => setSelectedTtsModel(e.target.value)}
                  className="bg-luxury-800 border border-luxury-700 rounded px-3 py-1 text-xs text-luxury-300"
                >
                  <option value="cosyvoice-v2">CosyVoice-V2</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={saveApiKey}
              className="w-full mt-6 py-3 bg-accent hover:bg-accent-dark text-luxury-950 font-medium rounded-lg transition-colors"
            >
              保存设置
            </button>
          </div>
        </div>
      )}

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'voices' && (
            <div className="animate-slide-up">
              <div className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-luxury-100 mb-2">音色库</h2>
                <p className="text-sm text-luxury-500">选择预设音色或管理自定义音色</p>
              </div>

              <div className="mb-4">
                <div className="inline-flex items-center px-3 py-1.5 bg-luxury-800/50 border border-luxury-700/50 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-luxury-500 mr-2"></div>
                  <span className="text-xs text-luxury-400">系统预置音色 · {presetVoices.length} 个</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {presetVoices.map((voice) => (
                  <div
                    key={voice.id}
                    className={`relative p-5 rounded-xl border transition-all duration-300 cursor-pointer group ${
                      selectedVoiceId === voice.id
                        ? 'bg-accent/5 border-accent/30 shadow-accent'
                        : 'bg-gradient-card border-luxury-800/50 hover:border-luxury-700/50 hover:shadow-luxury'
                    }`}
                    onClick={() => {
                      handleAuditionVoice(voice);
                      setSelectedVoiceId(voice.id);
                    }}
                  >
                    <div className="absolute top-3 right-3">
                      <span className="text-[9px] px-2 py-0.5 bg-luxury-700/50 text-luxury-400 rounded-full">预置</span>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-full ${voice.avatarColor} flex items-center justify-center text-luxury-950 font-serif font-bold text-lg`}>
                        {voice.name[0]}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-luxury-100 mb-1">{voice.name}</h3>
                        <p className="text-xs text-luxury-500 mb-2">
                          {voice.gender === 'male' ? '男声' : '女声'} · {
                            voice.ageGroup === 'child' ? '儿童' :
                            voice.ageGroup === 'youth' ? '青年' :
                            voice.ageGroup === 'adult' ? '中年' : '老年'
                          }
                        </p>
                        <p className="text-xs text-luxury-400 line-clamp-2">{voice.description}</p>
                      </div>
                    </div>
                    
                    <div className={`mt-4 flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors ${
                      currentlyPlayingId === voice.id
                        ? 'bg-accent/10 text-accent'
                        : 'text-luxury-500 opacity-0 group-hover:opacity-100'
                    }`}>
                      {currentlyPlayingId === voice.id ? (
                        <><Square className="w-4 h-4" /><span className="text-xs">播放中</span></>
                      ) : (
                        <><Play className="w-4 h-4" /><span className="text-xs">试听</span></>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {customVoices.length > 0 && (
                <>
                  <div className="mb-4">
                    <div className="inline-flex items-center px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full">
                      <Award className="w-3 h-3 text-accent mr-2" />
                      <span className="text-xs text-accent">自定义音色 · {customVoices.length} 个</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {customVoices.map((voice) => (
                      <div
                        key={voice.id}
                        className={`relative p-5 rounded-xl border transition-all duration-300 ${
                          selectedVoiceId === voice.id
                            ? 'bg-accent/5 border-accent/30 shadow-accent'
                            : 'bg-gradient-card border-luxury-800/50 hover:border-luxury-700/50'
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomVoice(voice.id);
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-luxury-800 text-luxury-500 hover:text-error transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        
                        <div className="absolute top-3 left-3">
                          <span className="text-[9px] px-2 py-0.5 bg-accent/20 text-accent rounded-full">自定义</span>
                        </div>
                        
                        <div className="flex items-start space-x-4 pt-4" onClick={() => {
                          handleAuditionVoice(voice);
                          setSelectedVoiceId(voice.id);
                        }}>
                          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-luxury-950 font-serif font-bold text-lg">
                            {voice.name[0]}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-luxury-100 mb-1">{voice.name}</h3>
                            <p className="text-xs text-luxury-500 mb-2">自定义</p>
                            <p className="text-xs text-luxury-400 line-clamp-2">{voice.description}</p>
                          </div>
                        </div>
                        
                        <div className={`mt-4 flex items-center justify-center space-x-2 py-2 rounded-lg cursor-pointer transition-colors ${
                          currentlyPlayingId === voice.id
                            ? 'bg-accent/10 text-accent'
                            : 'text-luxury-500 opacity-0 hover:opacity-100'
                        }`} onClick={() => handleAuditionVoice(voice)}>
                          {currentlyPlayingId === voice.id ? (
                            <><Square className="w-4 h-4" /><span className="text-xs">播放中</span></>
                          ) : (
                            <><Play className="w-4 h-4" /><span className="text-xs">试听</span></>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'design' && (
            <div className="animate-slide-up">
              <div className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-luxury-100 mb-2">声音设计</h2>
                <p className="text-sm text-luxury-500">通过提示词创建自定义音色</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-gradient-card border border-luxury-800/50 rounded-2xl p-6">
                    <label className="block text-xs font-medium text-luxury-400 mb-3">音色描述提示词</label>
                    <textarea
                      rows={4}
                      value={designerPrompt}
                      onChange={(e) => setDesignerPrompt(e.target.value)}
                      placeholder="描述您想要创建的音色特征，例如：温暖、磁性、富有感染力的中年男性声音..."
                      className="w-full bg-luxury-800/30 border border-luxury-700/50 rounded-xl px-4 py-3 text-sm text-luxury-100 placeholder:text-luxury-600 resize-none focus:border-accent/50 transition-colors"
                    />
                  </div>

                  <div className="bg-gradient-card border border-luxury-800/50 rounded-2xl p-6">
                    <label className="block text-xs font-medium text-luxury-400 mb-3">预览文案</label>
                    <textarea
                      rows={3}
                      value={designerPreviewText}
                      onChange={(e) => setDesignerPreviewText(e.target.value)}
                      placeholder="输入演示文本，生成音色后将使用此文本进行预览..."
                      className="w-full bg-luxury-800/30 border border-luxury-700/50 rounded-xl px-4 py-3 text-sm text-luxury-100 placeholder:text-luxury-600 resize-none focus:border-accent/50 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-luxury-400 mb-2">音色名称</label>
                      <input
                        type="text"
                        value={editorName}
                        onChange={(e) => setEditorName(e.target.value)}
                        placeholder="自定义名称"
                        className="w-full bg-luxury-800/30 border border-luxury-700/50 rounded-lg px-3 py-2.5 text-sm text-luxury-100 placeholder:text-luxury-600 focus:border-accent/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-luxury-400 mb-2">性别</label>
                      <select
                        value={editorGender}
                        onChange={(e) => setEditorGender(e.target.value as VoiceModel['gender'])}
                        className="w-full bg-luxury-800/30 border border-luxury-700/50 rounded-lg px-3 py-2.5 text-sm text-luxury-100 focus:border-accent/50 transition-colors"
                      >
                        <option value="female">女声</option>
                        <option value="male">男声</option>
                        <option value="other">中性</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-luxury-400 mb-2">年龄</label>
                      <select
                        value={editorAge}
                        onChange={(e) => setEditorAge(e.target.value as VoiceModel['ageGroup'])}
                        className="w-full bg-luxury-800/30 border border-luxury-700/50 rounded-lg px-3 py-2.5 text-sm text-luxury-100 focus:border-accent/50 transition-colors"
                      >
                        <option value="child">儿童</option>
                        <option value="youth">青年</option>
                        <option value="adult">中年</option>
                        <option value="elder">老年</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-card border border-luxury-800/50 rounded-2xl p-6">
                    <h3 className="text-sm font-medium text-luxury-200 mb-6 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-accent" />
                      音色参数调节
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-luxury-400">音调 (Pitch)</span>
                          <span className="text-xs font-mono text-accent">{pitch > 0 ? '+' : ''}{pitch}%</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={pitch}
                          onChange={(e) => setPitch(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-luxury-800 rounded-full appearance-none cursor-pointer accent-accent"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-luxury-400">语速 (Speed)</span>
                          <span className="text-xs font-mono text-accent">{speed.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.05"
                          value={speed}
                          onChange={(e) => setSpeed(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-luxury-800 rounded-full appearance-none cursor-pointer accent-accent"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-luxury-400">音量 (Volume)</span>
                          <span className="text-xs font-mono text-accent">{volume}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={volume}
                          onChange={(e) => setVolume(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-luxury-800 rounded-full appearance-none cursor-pointer accent-accent"
                        />
                      </div>
                    </div>
                  </div>

                  {designPreviewAudio && (
                    <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-accent flex items-center">
                          <Headphones className="w-4 h-4 mr-2" />
                          演示音频
                        </h4>
                        <button
                          onClick={() => downloadAudio(designPreviewAudio, `${editorName || 'design'}_preview.wav`)}
                          className="text-xs px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent rounded-lg hover:bg-accent/20 transition-colors flex items-center space-x-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>下载</span>
                        </button>
                      </div>
                      <audio 
                        src={designPreviewAudio} 
                        controls 
                        className="w-full"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleRegisterCustomVoice}
                    disabled={designSaving || !designerPrompt.trim()}
                    className="w-full py-4 bg-accent hover:bg-accent-dark text-luxury-950 font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {designSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>生成中...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>创建音色</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'synthesize' && (
            <div className="animate-slide-up">
              <div className="mb-8">
                <h2 className="font-serif text-2xl font-semibold text-luxury-100 mb-2">分段语音合成</h2>
                <p className="text-sm text-luxury-500">逐句精细调节，打造完美配音效果</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gradient-card border border-luxury-800/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium text-luxury-200">输入文本</label>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Wand2 className="w-4 h-4 text-luxury-400" />
                          <span className="text-xs text-luxury-400">情绪预设:</span>
                          <div className="flex items-center space-x-1">
                            {(Object.entries(EMOTION_PRESETS) as [EmotionPreset, typeof EMOTION_PRESETS.conservative][]).map(([key, preset]) => (
                              <button
                                key={key}
                                onClick={() => setEmotionPreset(key)}
                                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                  emotionPreset === key
                                    ? 'bg-accent text-luxury-950 font-medium'
                                    : 'bg-luxury-800 text-luxury-400 hover:text-luxury-200'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={handleSplitText}
                          disabled={!rawTextToSplit.trim()}
                          className="text-xs px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
                        >
                          智能断句
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={4}
                      value={rawTextToSplit}
                      onChange={(e) => setRawTextToSplit(e.target.value)}
                      placeholder="输入需要合成的文本，每行一段..."
                      className="w-full bg-luxury-800/30 border border-luxury-700/50 rounded-xl px-4 py-3 text-sm text-luxury-100 placeholder:text-luxury-600 resize-none focus:border-accent/50 transition-colors"
                    />
                  </div>

                  <div className="bg-gradient-card border border-luxury-800/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-luxury-200">SSML 参数设定</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const ssml = generateSSML(segments, activeSelectedVoice.id);
                            setSSMLContent(ssml);
                            setShowSSMLPreview(true);
                          }}
                          disabled={segments.length === 0}
                          className="text-xs px-3 py-1.5 bg-luxury-800 border border-luxury-700 text-luxury-300 rounded-lg hover:bg-luxury-700/50 transition-colors flex items-center space-x-1 disabled:opacity-50"
                        >
                          <FileText className="w-3 h-3" />
                          <span>SSML预览</span>
                        </button>
                        <button
                          onClick={handleAddBlankSegment}
                          className="text-xs px-3 py-1.5 bg-luxury-800 border border-luxury-700 text-luxury-300 rounded-lg hover:bg-luxury-700/50 transition-colors flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>添加</span>
                        </button>
                        <button
                          onClick={downloadAllSegmentAudio}
                          disabled={!segments.some(s => s.audioUrl)}
                          className="text-xs px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50 flex items-center space-x-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>批量下载</span>
                        </button>
                        <button
                          onClick={() => setSegments([])}
                          className="text-xs px-3 py-1.5 text-luxury-400 hover:text-error transition-colors"
                        >
                          清空
                        </button>
                      </div>
                    </div>

                    {segments.length === 0 ? (
                      <div className="py-12 text-center text-luxury-500 text-sm">
                        <Volume2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>暂无音轨</p>
                        <p className="text-xs mt-1">输入文本并点击智能断句</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {segments.map((segment, index) => (
                          <div
                            key={segment.id}
                            className={`p-4 rounded-xl border transition-all ${
                              segment.audioUrl ? 'bg-accent/5 border-accent/20' : 'bg-luxury-800/20 border-luxury-700/30'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <span className="text-xs font-mono text-luxury-500 w-6">{index + 1}</span>
                              <div className="flex-1 space-y-3">
                                <textarea
                                  value={segment.text}
                                  onChange={(e) => setSegments(prev => prev.map(s => s.id === segment.id ? { ...s, text: e.target.value } : s))}
                                  rows={2}
                                  className="w-full bg-transparent text-sm text-luxury-100 placeholder:text-luxury-600 resize-none focus:outline-none"
                                  placeholder="输入文本..."
                                />
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[10px] text-luxury-500 w-12">情绪</span>
                                    <select
                                      value={segment.emotion}
                                      onChange={(e) => setSegments(prev => prev.map(s => s.id === segment.id ? { ...s, emotion: e.target.value as EmotionId } : s))}
                                      className="flex-1 bg-luxury-800 border border-luxury-700 rounded px-2 py-1 text-xs text-luxury-200"
                                    >
                                      {Object.entries(EMOTION_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[10px] text-luxury-500 w-12">强度</span>
                                    <input
                                      type="range"
                                      min="0.01"
                                      max="2.0"
                                      step="0.01"
                                      value={segment.emotionIntensity}
                                      onChange={(e) => setSegments(prev => prev.map(s => s.id === segment.id ? { ...s, emotionIntensity: parseFloat(e.target.value) } : s))}
                                      className="flex-1 h-1 bg-luxury-700 rounded-full appearance-none cursor-pointer accent-accent"
                                    />
                                    <span className="text-[10px] font-mono text-luxury-400 w-10">{segment.emotionIntensity.toFixed(2)}</span>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="flex items-center space-x-1">
                                    <span className="text-[10px] text-luxury-500 w-8">音调</span>
                                    <input
                                      type="range"
                                      min="-50"
                                      max="50"
                                      value={segment.pitch}
                                      onChange={(e) => setSegments(prev => prev.map(s => s.id === segment.id ? { ...s, pitch: parseInt(e.target.value) } : s))}
                                      className="flex-1 h-1 bg-luxury-700 rounded-full appearance-none cursor-pointer accent-accent"
                                    />
                                    <span className="text-[10px] font-mono text-luxury-400 w-8">{segment.pitch > 0 ? '+' : ''}{segment.pitch}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-[10px] text-luxury-500 w-8">语速</span>
                                    <input
                                      type="range"
                                      min="0.5"
                                      max="2.0"
                                      step="0.05"
                                      value={segment.speed}
                                      onChange={(e) => setSegments(prev => prev.map(s => s.id === segment.id ? { ...s, speed: parseFloat(e.target.value) } : s))}
                                      className="flex-1 h-1 bg-luxury-700 rounded-full appearance-none cursor-pointer accent-accent"
                                    />
                                    <span className="text-[10px] font-mono text-luxury-400 w-8">{segment.speed.toFixed(2)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-[10px] text-luxury-500 w-8">停顿</span>
                                    <input
                                      type="range"
                                      min="0"
                                      max="2000"
                                      step="100"
                                      value={segment.pauseDuration || 0}
                                      onChange={(e) => setSegments(prev => prev.map(s => s.id === segment.id ? { ...s, pauseDuration: parseInt(e.target.value) } : s))}
                                      className="flex-1 h-1 bg-luxury-700 rounded-full appearance-none cursor-pointer accent-accent"
                                    />
                                    <span className="text-[10px] font-mono text-luxury-400 w-8">{segment.pauseDuration || 0}ms</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end space-x-2">
                                <button
                                  onClick={() => handleRemoveSegment(segment.id)}
                                  className="p-1.5 text-luxury-500 hover:text-error transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleSynthesizeSingleSegment(segment.id)}
                                  disabled={!segment.text.trim() || segmentSynthesizingId === segment.id}
                                  className={`mt-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                    segment.audioUrl
                                      ? 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20'
                                      : 'bg-luxury-700 text-luxury-200 hover:bg-luxury-600'
                                  } disabled:opacity-50`}
                                >
                                  {segmentSynthesizingId === segment.id ? (
                                    <RefreshCw className="w-3 h-3 mx-auto animate-spin" />
                                  ) : segment.audioUrl ? (
                                    <span>重新合成</span>
                                  ) : (
                                    <span>合成</span>
                                  )}
                                </button>
                              </div>
                            </div>
                            
                            {segment.audioUrl && (
                              <div className="mt-3 pt-3 border-t border-luxury-700/30">
                                <audio 
                                  src={segment.audioUrl} 
                                  controls 
                                  className="w-full"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {showSSMLPreview && (
                    <div className="fixed inset-0 z-50 bg-luxury-950/95 backdrop-blur-luxury flex items-center justify-center animate-fade-in">
                      <div className="bg-luxury-900 border border-luxury-700/50 rounded-2xl p-6 w-full max-w-2xl mx-4 animate-scale-in max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="font-serif text-lg font-semibold text-luxury-100">SSML 预览</h2>
                          <button onClick={() => setShowSSMLPreview(false)} className="text-luxury-400 hover:text-luxury-200">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <pre className="flex-1 overflow-auto bg-luxury-950 rounded-lg p-4 text-xs text-luxury-300 font-mono whitespace-pre-wrap">
                          {ssmlContent}
                        </pre>
                        <div className="mt-4 flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(ssmlContent);
                              addLog('[复制]: SSML已复制到剪贴板');
                            }}
                            className="px-4 py-2 bg-luxury-800 border border-luxury-700 text-luxury-200 rounded-lg hover:bg-luxury-700 transition-colors flex items-center space-x-2"
                          >
                            <Copy className="w-4 h-4" />
                            <span>复制SSML</span>
                          </button>
                          <button
                            onClick={() => setShowSSMLPreview(false)}
                            className="px-4 py-2 bg-accent hover:bg-accent-dark text-luxury-950 font-medium rounded-lg transition-colors"
                          >
                            关闭
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-card border border-luxury-800/50 rounded-2xl p-6">
                    <h3 className="text-sm font-medium text-luxury-200 mb-4">当前音色</h3>
                    <div className="flex items-center space-x-4 p-3 bg-luxury-800/30 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-luxury-950 font-serif font-bold">
                        {activeSelectedVoice.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-luxury-100">{activeSelectedVoice.name}</p>
                        <p className="text-xs text-luxury-500">
                          {activeSelectedVoice.isPreset ? '预设音色' : '自定义音色'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-card border border-luxury-800/50 rounded-2xl p-6">
                    <h3 className="text-sm font-medium text-luxury-200 mb-4">选择音色</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                      {allVoicesCombined.map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => setSelectedVoiceId(voice.id)}
                          className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors text-left ${
                            selectedVoiceId === voice.id
                              ? 'bg-accent/10 text-accent'
                              : 'text-luxury-300 hover:bg-luxury-800/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full ${voice.avatarColor} flex items-center justify-center text-luxury-950 font-serif text-sm font-medium`}>
                            {voice.name[0]}
                          </div>
                          <span className="text-sm">{voice.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-card border border-luxury-800/50 rounded-2xl p-6">
                    <h3 className="text-sm font-medium text-luxury-200 mb-4">日志</h3>
                    <div className="h-48 overflow-y-auto scrollbar-hide space-y-1 text-xs text-luxury-400">
                      {logs.map((log, i) => (
                        <p key={i} className="py-0.5">{log}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-luxury-800/50 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between text-xs text-luxury-500">
            <span>VoiceCraft · Premium Voice Synthesis</span>
            <span>Powered by 阿里百炼</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
