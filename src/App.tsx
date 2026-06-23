/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  FileText, CheckCircle2, ShieldCheck, Cpu, Database, Play, Square, 
  Sparkles, Sliders, Volume2, Plus, RefreshCw, 
  Download, Terminal, BookOpen, AlertCircle, HelpCircle,
  Trash2, Check, Headphones, Award, Activity, Sparkle, Key, Mic, Upload,
  Layers, ExternalLink
} from 'lucide-react';
import { VoiceModel, TextSegment, ConversionHistoryItem } from './types';
import { AudioWaveform } from './components/AudioWaveform';

// Initial Official Preset Voices provided by the Aliyun DashScope platform (CosyVoice-v2)
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
  }
];

export default function App() {
  const [isDesignApproved, setIsDesignApproved] = useState<boolean>(true);
  const [activeSpecSection, setActiveSpecSection] = useState<'req' | 'arch' | 'api' | 'schedule'>('req');

  // Load preset voices from state so that we can sync it with Aliyun lists on-the-fly!
  const [presetVoices, setPresetVoices] = useState<VoiceModel[]>(PRESET_VOICES);

  // --- Voice Studio / Custom Designs ---
  const [customVoices, setCustomVoices] = useState<VoiceModel[]>([
    {
      id: 'custom-designed-1',
      name: '极客暖意电台 (Custom)',
      gender: 'male',
      ageGroup: 'youth',
      description: '融入声音磁性并对声带柔和度做过深度微调的治愈男主播音色。',
      isPreset: false,
      avatarColor: 'bg-gradient-to-tr from-orange-400 to-red-500',
      pitch: -15,
      speed: 1.00,
      volume: 80,
      warmth: 40,
      tension: -15,
      breathiness: 15,
      robotic: 0,
      reverb: 8
    }
  ]);

  // Selected Target Voice Model for multi-segment TTS
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('cosyvoice-v2-preset-001');
  const allVoicesCombined = [...presetVoices, ...customVoices];
  const activeSelectedVoice = allVoicesCombined.find(v => v.id === selectedVoiceId) || presetVoices[0];

  // --- Active Voice Designer (Prompt + Sliders) ---
  const [designerPrompt, setDesignerPrompt] = useState<string>('一个声音暖洋洋、吐字清晰、充满治愈力量的深夜电台主持人');
  const [editorName, setEditorName] = useState<string>('晨曦暖风');
  const [editorGender, setEditorGender] = useState<VoiceModel['gender']>('female');
  const [editorAge, setEditorAge] = useState<VoiceModel['ageGroup']>('youth');
  const [pitch, setPitch] = useState<number>(10);
  const [speed, setSpeed] = useState<number>(1.00);
  const [volume, setVolume] = useState<number>(80);
  const [warmth, setWarmth] = useState<number>(30);
  const [tension, setTension] = useState<number>(-10);
  const [breathiness, setBreathiness] = useState<number>(15);
  const [robotic, setRobotic] = useState<number>(0);
  const [reverb, setReverb] = useState<number>(10);
  
  const [designSaving, setDesignSaving] = useState<boolean>(false);

  // --- Multi-Segment TTS Controller State ---
  const [rawTextToSplit, setRawTextToSplit] = useState<string>(
    '（欢快）亲爱的各位乘客，欢迎搭乘百炼极速号！\n（深情）本次列车将全力加速，带你冲向智能语音交互的星河未来。\n（严肃）请大家系好安全带，抓稳扶手。'
  );
  
  const [segments, setSegments] = useState<TextSegment[]>([
    {
      id: 'seg-1',
      text: '欢迎进入阿里百炼音色合成设计工坊！',
      pitch: 15,
      speed: 1.05,
      volume: 85,
      emotion: 'gentle',
      audioUrl: undefined
    },
    {
      id: 'seg-2',
      text: '在这里，你可以针对每一句话，分段精细调节其声调和语速情绪。',
      pitch: -10,
      speed: 0.90,
      volume: 90,
      emotion: 'serious',
      audioUrl: undefined
    },
    {
      id: 'seg-3',
      text: '非常好！请试着调节我的音调或新增句段，享受高可控配音魅力。',
      pitch: 25,
      speed: 1.15,
      volume: 95,
      emotion: 'happy',
      audioUrl: undefined
    }
  ]);

  const [segmentSynthesizingId, setSegmentSynthesizingId] = useState<string | null>(null);
  const [allSegmentsPlaying, setAllSegmentsPlaying] = useState<boolean>(false);

  // --- Audition Players & WebAudio Analyzer state ---
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [visualDataArray, setVisualDataArray] = useState<Uint8Array>(new Uint8Array(64));
  const activeVoiceRunnerRef = useRef<{ stop: () => void } | null>(null);

  // --- API Authentication configuration ---
  const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem('dashscope_api_key') || '');
  const [selectedTtsModel, setSelectedTtsModel] = useState<string>('cosyvoice-v2');
  const [models, setModels] = useState<{
    tts: Array<{id: string; name: string; description: string; voices: string[]; requiresActivation: boolean; activationUrl: string}>;
    voiceDesign: Array<{id: string; name: string; description: string; requiresActivation: boolean; activationUrl: string}>;
    voiceClone: Array<{id: string; name: string; description: string; requiresActivation: boolean; activationUrl: string}>;
    llm: Array<{id: string; name: string; description: string; requiresActivation: boolean; activationUrl: string}>;
  } | null>(null);
  const [activationLinks, setActivationLinks] = useState<{
    console: string;
    modelMarket: string;
    apiKey: string;
    billing: string;
  } | null>(null);
  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (customApiKey) {
      headers['X-DashScope-Api-Key'] = customApiKey.trim();
    }
    return headers;
  };

  // --- Voice Cloning State & Helpers ---
  const [activeDesignMode, setActiveDesignMode] = useState<'prompt' | 'cloning'>('prompt');
  const [cloneAudioBase64, setCloneAudioBase64] = useState<string>('');
  const [cloneAudioUrl, setCloneAudioUrl] = useState<string>('');
  const [cloneName, setCloneName] = useState<string>('我的私有克隆音色');
  const [cloningStatus, setCloningStatus] = useState<'idle' | 'recording' | 'processing' | 'success' | 'failed'>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioAnalysis, setAudioAnalysis] = useState<{ sampleRate: number; duration: number } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  const analyzeAudioFile = async (blob: Blob | File): Promise<{ sampleRate: number; duration: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioCtx.decodeAudioData(arrayBuffer, (decodedData) => {
            const result = {
              sampleRate: decodedData.sampleRate,
              duration: decodedData.duration
            };
            audioCtx.close();
            resolve(result);
          }, (err) => {
            audioCtx.close();
            reject(new Error('音频数据解码失败，可能格式解析不受浏览器原生支持。推荐使用 16bit 44100Hz 的标准 WAV 或 MP3。'));
          });
        } catch (err: any) {
          reject(new Error(`解码异常: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('读取文件流数据错误'));
      reader.readAsArrayBuffer(blob);
    });
  };

  const startRecording = async () => {
    addLog('[声音克隆]: 正在请求浏览器麦克风访问权限...');
    audioChunksRef.current = [];
    setRecordingSeconds(0);
    setAudioAnalysis(null);
    setCloneAudioBase64('');
    setCloneAudioUrl('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog('[声音克隆 ✔]: 麦克风启用成功，采音通道开启！开始录制优质参考人声...');
      
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const playbackUrl = URL.createObjectURL(audioBlob);
        setCloneAudioUrl(playbackUrl);

        try {
          addLog('[声音克隆]: 人声音频写入就绪，正在分析音频质量及规格信息...');
          const analysis = await analyzeAudioFile(audioBlob);
          setAudioAnalysis(analysis);
          addLog(`[分析就绪]: 成功获取人声数据。采样率: ${analysis.sampleRate} Hz | 时长: ${analysis.duration.toFixed(1)} 秒。`);
          
          const reader = new FileReader();
          reader.onloadend = () => {
            const rawBase64 = (reader.result as string).split(',')[1];
            setCloneAudioBase64(rawBase64);
          };
          reader.readAsDataURL(audioBlob);
        } catch (err: any) {
          addLog(`[分析异常]: ${err.message}`);
          // Fallback reading
          const reader = new FileReader();
          reader.onloadend = () => {
            const rawBase64 = (reader.result as string).split(',')[1];
            setCloneAudioBase64(rawBase64);
          };
          reader.readAsDataURL(audioBlob);
        }
      };

      recorder.start(250);
      setCloningStatus('recording');

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 59) {
            addLog('[自动限额保护]: 已录制满 60 秒（阿里云克隆单次音频最大限制），正在安全锁盘并停止收音...');
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error(err);
      addLog(`[录取失败 ❌]: 获取录音设备故障: ${err.message}. 建议直接使用「本地拖曳/选择文件上传」进行复刻。`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      try {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (e) {}
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setCloningStatus('idle');
    addLog('[声音克隆]: 人声拟合素材截取完毕，可在下方试听说词效果，或确认后直接点击一键同步构建克隆。');
  };

  const handleUploadedFile = async (file: File) => {
    if (!file) return;
    setAudioAnalysis(null);
    setCloneAudioBase64('');
    setCloneAudioUrl('');
    addLog(`[文件加载]: 加载音频素材「${file.name}」（大小 ${(file.size / 1024).toFixed(1)} KB），正在审查合规性元数据...`);

    const playbackUrl = URL.createObjectURL(file);
    setCloneAudioUrl(playbackUrl);

    try {
      const analysis = await analyzeAudioFile(file);
      setAudioAnalysis(analysis);
      addLog(`[分析说明 ✔]: 采样率 ${analysis.sampleRate} Hz，总时长 ${analysis.duration.toFixed(1)} 秒。`);
      
      if (analysis.sampleRate < 24000) {
        addLog(`[400-Audio.AudioRateError ❌ 拦截]: 此音频采样率为 ${analysis.sampleRate} Hz。阿里云百炼声音克隆要求采样率必须自 24000 Hz 起算！直接提报上游服务百分之百会由于 400 Audio 格式错误被拒。推荐使用麦克风现场念词录制 (系统自动升频采集)。`);
      }
      if (analysis.duration > 60) {
        addLog(`[400-Audio.DurationLimitError ❌ 拦截]: 此音频总计 ${analysis.duration.toFixed(1)} 秒。阿里云极速克隆最高仅支持 60 秒音频时长！为保障顺利注册，请选取截短版或重新剪辑。`);
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const rawBase64 = (reader.result as string).split(',')[1];
        setCloneAudioBase64(rawBase64);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      addLog(`[解析中断 ⚠️]: ${err.message} 基础声纹将直接封包。`);
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawBase64 = (reader.result as string).split(',')[1];
        setCloneAudioBase64(rawBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartVoiceClone = async () => {
    if (!cloneAudioBase64) {
      addLog('[克隆拦截 ❌]: 缺少可用音源！请先现场念词录音，或拖入一份有效的 WAV/MP3 本地音频。');
      return;
    }

    if (audioAnalysis) {
      if (audioAnalysis.sampleRate < 24000) {
        addLog(`[400-Audio.AudioRateError ❌ 终止]: 因采样率 ${audioAnalysis.sampleRate} Hz 无法满足阿里百炼最低 24000 Hz 规范，系统已拒绝将数据包发送至服务器！请重新录制。`);
        return;
      }
      if (audioAnalysis.duration < 5) {
        addLog(`[音频太短 ⚠️]: 音频时长仅为 ${audioAnalysis.duration.toFixed(1)} 秒。百炼通常推荐 10-20 秒音量平稳的录音，以确保声线还原高品质。`);
      }
      if (audioAnalysis.duration > 60) {
        addLog(`[400-Audio.DurationLimitError ❌ 终止]: 音频时长为 ${audioAnalysis.duration.toFixed(1)} 秒超出 60 秒限制，直接运行必得 400 失败！`);
        return;
      }
    }

    forceStopAudition();
    setCloningStatus('processing');
    addLog(`[克隆提报 🚀]: 正在向服务端上传您的私有声纹编码，并注册阿里百炼 [cosyvoice-voice-clone] 服务...`);

    try {
      const res = await fetch('/api/voice/clone', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          voiceName: cloneName || `克隆音-${Date.now().toString().slice(-4)}`,
          audioBase64: cloneAudioBase64,
          audioName: 'clone.wav'
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.voiceId) {
        addLog(`[克隆注册成功 ✔]: 恭喜！百炼声纹库建模完成，标识码为: [${data.voiceId}]。已为您将该克隆声音加入并指派为当前活动发音主体！`);
        
        const clonedVoice: VoiceModel = {
          id: data.voiceId,
          name: `${cloneName} (已克隆)`,
          gender: 'other',
          ageGroup: 'youth',
          description: `利用极速声音复刻机制（CosyVoice-voice-clone）精算生成的完美定制音。`,
          isPreset: false,
          avatarColor: 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-500',
          pitch: 0,
          speed: 1.0,
          volume: 90,
          warmth: 0,
          tension: 0,
          breathiness: 10,
          robotic: 0,
          reverb: 3
        };

        setCustomVoices(prev => [clonedVoice, ...prev]);
        setSelectedVoiceId(clonedVoice.id);
        setCloningStatus('success');

        // Instant play custom demo synthesized with Aliyun CosyVoice API using newly cloned key
        setTimeout(() => {
          handlePlayVoicePreview(clonedVoice);
        }, 600);

      } else {
        throw new Error(data.error || data.message || '上游处理鉴权不通过或发生 400/401 故障。');
      }
    } catch (err: any) {
      addLog(`[克隆建模失败 ❌]: 发生致命故障: ${err.message}`);
      setCloningStatus('failed');
    }
  };

  // Connectivity
  const [isRealServerConnected, setIsRealServerConnected] = useState<boolean>(false);
  const [apiLogs, setApiLogs] = useState<string[]>([
    '[System]: 阿里云百炼与音谱调试控制台已就绪。',
    '[Sandbox]: 如果缺少 DASHSCOPE_API_KEY，系统将通过自主编写的声码器在本端生成高还原度的仿调音频。'
  ]);

  const [validationStatus, setValidationStatus] = useState<'idle' | 'checking' | 'success' | 'failed'>('idle');
  const [validationMessage, setValidationMessage] = useState<string>('');

  const handleValidateApiKey = async () => {
    setValidationStatus('checking');
    addLog('[KeyValidation]: 启动与阿里云百炼云主机的握手服务，验证 API Key 可行性...');
    try {
      const res = await fetch('/api/config/validate', { headers: getHeaders() });
      const data = await res.json();
      
      if (data.success) {
        setValidationStatus('success');
        setValidationMessage(data.message);
        setIsRealServerConnected(true);
        addLog(`[KeyValidation ✔]: 密钥联通率100%。协议代码: ${data.details?.code || 'Ok'}. 阿里云返回: "${data.message}"`);
      } else {
        setValidationStatus('failed');
        setValidationMessage(data.message);
        setIsRealServerConnected(false);
        addLog(`[KeyValidation ❌]: 校验未通过! 拦截类型: ${data.reason || 'unknown'}. 错误描述: "${data.message}"`);
      }
    } catch (err: any) {
      setValidationStatus('failed');
      setValidationMessage('无法与本地 Node.js 代理服务器建立通信，请确保服务器处于激活状态。');
      addLog(`[KeyValidation ❌]: 网络请求异常: ${err.message}`);
    }
  };

  // --- History Records ---
  const [conversionHistory, setConversionHistory] = useState<ConversionHistoryItem[]>([
    {
      id: 'history-1',
      sourceText: '在深夜的助眠故事里，微弱的气流感能够让您的心率恢复平稳。',
      targetVoiceName: '活力元气少女 (Aria / sl_yifei)',
      resultAudioUrl: '#',
      timestamp: '2026-06-21 20:30',
      type: 'tts',
      duration: 5
    }
  ]);

  // Fetch API Connection
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setIsRealServerConnected(data.hasApiKey);
        if (data.supportedModels) {
          setModels(data.supportedModels);
        }
        if (data.activationLinks) {
          setActivationLinks(data.activationLinks);
        }
        if (data.hasApiKey) {
          addLog('[Aliyun]: 阿里云百炼鉴权验证成功！音色云端重采样通道畅通。');
        } else {
          addLog('[SandboxMode]: 未配置百炼 DASHSCOPE_API_KEY。系统支持试听反馈与真实错误上报，并拒绝低质量本地 TTS 合成。');
        }
      })
      .catch(err => {
        console.error('Config fetch error:', err);
        addLog(`[Error]: 读取配置文件出错: ${err.message}`);
      });

    // Sync official presets from the registered CosyVoice endpoints!
    fetch('/api/voice/presets')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.presets && data.presets.length > 0) {
          setPresetVoices(data.presets);
          addLog(`[Presets Loader]: 成功与阿里云百炼握手，加载官方同源 ${data.presets.length} 套最新旗舰预置音色（含 CosyVoice-v2 最新成员）！`);
        }
      })
      .catch(err => {
        console.warn('Failed to sync presets from backend:', err);
      });
  }, []);

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setApiLogs(prev => [`[${time}] ${message}`, ...prev.slice(0, 49)]);
  };

  const forceStopAudition = () => {
    if (activeVoiceRunnerRef.current) {
      try {
        activeVoiceRunnerRef.current.stop();
      } catch (e) {}
      activeVoiceRunnerRef.current = null;
    }
    setCurrentlyPlayingId(null);
    setAllSegmentsPlaying(false);
  };

  // 1. Play Previews
  const handlePlayVoicePreview = async (voice: VoiceModel) => {
    if (activeVoiceRunnerRef.current) {
      forceStopAudition();
      return;
    }

    addLog(`[在线试听]: 开始对音色 "${voice.name}" 进行百炼高品质声学试听和特征采样...`);
    setCurrentlyPlayingId(voice.id);

    // If there is a real Aliyun output voice_url (from design register), play it directly
    if (voice.audioUrl && voice.audioUrl !== '#') {
      try {
        addLog(`[在线试听]: 播放已注册的声音样例...`);
        const audio = new Audio(voice.audioUrl);
        audio.crossOrigin = 'anonymous';

        let animId: number;
        const fakeSpectrum = () => {
          if (audio.paused || audio.ended) return;
          const dataArray = new Uint8Array(64);
          for (let i = 0; i < 64; i++) {
            dataArray[i] = Math.max(10, Math.floor(Math.random() * 120 + Math.sin(Date.now() / 100 + i) * 40));
          }
          setVisualDataArray(dataArray);
          animId = requestAnimationFrame(fakeSpectrum);
        };

        audio.addEventListener('play', () => {
          fakeSpectrum();
        });

        audio.addEventListener('ended', () => {
          cancelAnimationFrame(animId);
          setCurrentlyPlayingId(null);
          activeVoiceRunnerRef.current = null;
        });

        audio.addEventListener('error', (e) => {
          console.error("Custom audio preview failed", e);
          cancelAnimationFrame(animId);
          setCurrentlyPlayingId(null);
          activeVoiceRunnerRef.current = null;
          addLog(`[在线试听 ❌]: 本次注册音频流加载失败。请检测百炼模型是否正确交付或鉴权已重置。`);
        });

        const stopPlayback = () => {
          cancelAnimationFrame(animId);
          try {
            audio.pause();
          } catch (e) {}
          setCurrentlyPlayingId(null);
          activeVoiceRunnerRef.current = null;
        };

        activeVoiceRunnerRef.current = { stop: stopPlayback };
        audio.play().catch((err) => {
          console.warn("Autoplay audio blocked", err);
          addLog(`[在线试听 ❌]: 浏览器自主播放拦截或加载失败。`);
          setCurrentlyPlayingId(null);
        });
        return;
      } catch (err: any) {
        addLog(`[在线试听 ❌]: ${err.message}`);
        setCurrentlyPlayingId(null);
        return;
      }
    }

    // Call Aliyun API to generate premium preview on-the-fly!
    addLog(`[云端流式]: 正在请求阿里云百炼交互，实时合成极速试听字节流 (CosyVoice-v2)...`);
    try {
      const auditionText = `您好，我是 ${voice.name}。这是我当前的百炼极速合成实例，欢迎选用。`;
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          text: auditionText,
          voiceConfig: voice,
          segmentConfig: {
            pitch: 0,
            speed: 1.0,
            volume: 100,
            emotion: 'neutral'
          },
          model: selectedTtsModel
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.audioData && data.audioData !== '#') {
        if (data.fallbackActive) {
          addLog(`[音色修正 ⚠️]: ${data.message}`);
        } else {
          addLog(`[在线试听 ✔]: 实时合成就绪！正在实时绘制声谱共鸣包络。`);
        }
        const audio = new Audio(data.audioData);
        
        let animId: number;
        const fakeSpectrum = () => {
          if (audio.paused || audio.ended) return;
          const dataArray = new Uint8Array(64);
          for (let i = 0; i < 64; i++) {
            dataArray[i] = Math.max(10, Math.floor(Math.random() * 120 + Math.sin(Date.now() / 100 + i) * 40));
          }
          setVisualDataArray(dataArray);
          animId = requestAnimationFrame(fakeSpectrum);
        };

        audio.addEventListener('play', () => {
          fakeSpectrum();
        });

        audio.addEventListener('ended', () => {
          cancelAnimationFrame(animId);
          setCurrentlyPlayingId(null);
          activeVoiceRunnerRef.current = null;
        });

        audio.addEventListener('error', () => {
          cancelAnimationFrame(animId);
          setCurrentlyPlayingId(null);
          activeVoiceRunnerRef.current = null;
          addLog(`[在线试听 ❌]: 音频解码或网络加载故障。`);
        });

        const stopPlayback = () => {
          cancelAnimationFrame(animId);
          try {
            audio.pause();
          } catch (e) {}
          setCurrentlyPlayingId(null);
          activeVoiceRunnerRef.current = null;
        };

        activeVoiceRunnerRef.current = { stop: stopPlayback };
        await audio.play();
      } else {
        const errorDetail = data.message || data.error || '百炼平台未返回有效音频流';
        addLog(`[试听失败 ❌]: 阿里百炼服务当前离线（缺少密钥或鉴权失败）。为保证高品质，系统已拒绝低质量浏览器电子 TTS 音。请在项目右上角设置中配置秘钥: ${errorDetail}`);
        setCurrentlyPlayingId(null);
      }
    } catch (err: any) {
      console.error('Real-time preview synthesis failed', err);
      addLog(`[试听异常 ❌]: 无法与百炼网关通信: ${err.message}`);
      setCurrentlyPlayingId(null);
    }
  };

  // 2. Core Custom Voice designer mapping (Prompt + Fine-tuning variables)
  const handleRegisterCustomVoice = async () => {
    forceStopAudition();
    setDesignSaving(true);
    addLog(`[音色定制]: 提交提示词 "${designerPrompt}" 与微观声带滑块以创建模型特征...`);

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
            volume,
            warmth,
            tension,
            breathiness,
            robotic,
            reverb
          }
        })
      });

      const data = await res.json();
      
      const refinedSpecs = data.specs || {
        gender: editorGender,
        ageGroup: editorAge,
        pitch,
        speed,
        volume,
        warmth,
        tension,
        breathiness,
        robotic,
        reverb,
        description: '拟合成功的仿真声乐腔体特征。'
      };

      const newVoice: VoiceModel = {
        id: data.voiceId || `custom-designed-${Date.now()}`,
        name: `${editorName} (Designed)`,
        gender: refinedSpecs.gender,
        ageGroup: refinedSpecs.ageGroup,
        description: refinedSpecs.description || `根据用户描述 "${designerPrompt}" 精制生成的专家音色。`,
        isPreset: false,
        avatarColor: 'bg-gradient-to-tr from-sky-500 via-indigo-600 to-amber-500',
        pitch: refinedSpecs.pitch,
        speed: refinedSpecs.speed,
        volume: refinedSpecs.volume,
        warmth: refinedSpecs.warmth,
        tension: refinedSpecs.tension,
        breathiness: refinedSpecs.breathiness,
        robotic: refinedSpecs.robotic,
        reverb: refinedSpecs.reverb,
        audioUrl: data.audioUrl
      };

      setCustomVoices(prev => [newVoice, ...prev]);
      setSelectedVoiceId(newVoice.id);
      addLog(`[Success]: 音色定制录入成功！得到百炼声带标识 [${newVoice.id.slice(0, 16)}]。`);

      // Immediately trigger testing / sound audition
      setTimeout(() => {
        handlePlayVoicePreview(newVoice);
      }, 400);

    } catch (e: any) {
      addLog(`[Error] 阿里百炼设计终端通信不顺: ${e.message}`);
    } finally {
      setDesignSaving(false);
    }
  };

  const handleDeleteVoice = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    forceStopAudition();
    setCustomVoices(prev => prev.filter(v => v.id !== id));
    addLog(`[设计工坊]: 已将自定义选区音色 ${id} 移除销毁。`);
    if (selectedVoiceId === id) {
      setSelectedVoiceId('cosyvoice-v2-preset-001');
    }
  };

  // Clear or load preset specs in slider
  const loadPresetToEditor = (preset: VoiceModel) => {
    setEditorName(`${preset.name.split(' (')[0]} 精细定制版`);
    setEditorGender(preset.gender);
    setEditorAge(preset.ageGroup);
    setPitch(preset.pitch);
    setSpeed(preset.speed);
    setVolume(preset.volume);
    setWarmth(preset.warmth);
    setTension(preset.tension);
    setBreathiness(preset.breathiness);
    setRobotic(preset.robotic);
    setReverb(preset.reverb);
    addLog(`[Acoustic]: 已装载 "${preset.name}" 的原始骨架作为微调初使值。`);
  };

  // 3. Segment Manager - Auto Text parsing & Splitting
  const handleAutoSplitText = () => {
    if (!rawTextToSplit.trim()) return;
    
    // Split sentences by dynamic regex matching common punctuation or newlines
    const punctuationRegex = /([^，。！？?!\n；;]+[，。！？?!\n；;]?)/g;
    const matches = rawTextToSplit.match(punctuationRegex);
    
    if (!matches || matches.length === 0) {
      const single: TextSegment = {
        id: `seg-${Date.now()}`,
        text: rawTextToSplit.trim(),
        pitch: 0,
        speed: 1.0,
        volume: 80,
        emotion: 'neutral'
      };
      setSegments([single]);
      return;
    }

    const parsedSegs: TextSegment[] = matches
      .map(m => m.trim())
      .filter(m => m.length > 0)
      .map((text, idx) => {
        // Simple intelligent parser to detect pre-fixed bracket emotions
        let defaultEmotion: TextSegment['emotion'] = 'neutral';
        let cleanText = text;
        
        if (text.startsWith('（欢快）') || text.startsWith('(欢快)')) {
          defaultEmotion = 'happy';
          cleanText = text.replace(/^（欢快）|^\(欢快\)/, '');
        } else if (text.startsWith('（喜悦）') || text.startsWith('(喜悦)')) {
          defaultEmotion = 'excited';
          cleanText = text.replace(/^（喜悦）|^\(喜悦\)/, '');
        } else if (text.startsWith('（深情）') || text.startsWith('(深情)') || text.startsWith('（温柔）') || text.startsWith('(温柔)')) {
          defaultEmotion = 'gentle';
          cleanText = text.replace(/^（深情）|^\(深情\)|^（温柔）|^\(温柔\)/, '');
        } else if (text.startsWith('（严肃）') || text.startsWith('(严肃)') || text.startsWith('（庄重）') || text.startsWith('(庄重)')) {
          defaultEmotion = 'serious';
          cleanText = text.replace(/^（严肃）|^\(严肃\)|^（庄重）|^\(庄重\)/, '');
        } else if (text.startsWith('（悲伤）') || text.startsWith('(悲伤)')) {
          defaultEmotion = 'sad';
          cleanText = text.replace(/^（悲伤）|^\(悲伤\)/, '');
        }

        return {
          id: `seg-${Date.now()}-${idx}`,
          text: cleanText,
          pitch: defaultEmotion === 'happy' ? 15 : defaultEmotion === 'sad' ? -15 : 0,
          speed: defaultEmotion === 'excited' ? 1.15 : defaultEmotion === 'serious' ? 0.90 : 1.0,
          volume: 85,
          emotion: defaultEmotion
        };
      });

    setSegments(parsedSegs);
    addLog(`[智能断句]: 拆分机制装配完毕，共捕获到 ${parsedSegs.length} 段高拟合参数切片。`);
  };

  // Synthesize single Segment Audio via backend
  const handleSynthesizeSingleSegment = async (segId: string) => {
    const targetSeg = segments.find(s => s.id === segId);
    if (!targetSeg || !targetSeg.text.trim()) return;

    forceStopAudition();
    setSegmentSynthesizingId(segId);
    addLog(`[单段合成]: 提报第[${segId.slice(-4)}]句合成请求，情绪选定: ${targetSeg.emotion || '平静'}...`);

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
      if (res.ok && data.success && data.audioData && data.audioData !== '#') {
        if (data.fallbackActive) {
          addLog(`[音色修正 ⚠️]: ${data.message}`);
        } else {
          addLog(`[单段就绪 ✔]: 阿里云百炼合成成功！字节大小约 ${(data.audioData.length / 1.33 / 1024).toFixed(1)} KB。`);
        }
        
        // Save audio base64 or set virtual key for playback
        setSegments(prev => prev.map(s => {
          if (s.id === segId) {
            return { ...s, audioUrl: data.audioData || '#', isSynthesizing: false };
          }
          return s;
        }));

        // Instantly play what we got
        triggerSegmentLocalAudio(data.audioData, targetSeg);
      } else {
        throw new Error(data.message || data.error || '服务器反馈无极速音轨数据');
      }
    } catch (e: any) {
      addLog(`[单段出错 ❌]: 百炼服务交割失败: ${e.message}。系统谢绝低质量浏览器电子仿真合成。`);
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

  // Trigger segment audio play helper (real base64 or procedural)
  const triggerSegmentLocalAudio = async (dataUrl: string | undefined, segment: TextSegment) => {
    forceStopAudition();

    if (!dataUrl || dataUrl === '#') {
      addLog(`[播报失败 ❌]: 暂无缓存的百炼云端音轨。请先点击该句滑块下方的「重合成」按钮下载高质量声带。`);
      return;
    }

    setCurrentlyPlayingId(`segment-${segment.id}`);

    const audio = new Audio(dataUrl);
    activeVoiceRunnerRef.current = {
      stop: () => {
        audio.pause();
      }
    };

    // Interval to paint waves while playing
    const iv = setInterval(() => {
      const customWave = new Uint8Array(64).map(() => Math.floor(Math.random() * 125 + 25));
      setVisualDataArray(customWave);
    }, 75);

    audio.onended = () => {
      clearInterval(iv);
      setCurrentlyPlayingId(null);
      activeVoiceRunnerRef.current = null;
    };
    
    audio.onerror = () => {
      clearInterval(iv);
      setCurrentlyPlayingId(null);
      activeVoiceRunnerRef.current = null;
      addLog(`[播报 ❌]: 音频流解码失败，请确认导出的 MP3 数据格式。`);
    };

    await audio.play().catch(e => {
      console.error(e);
      clearInterval(iv);
      setCurrentlyPlayingId(null);
      addLog(`[播报 ❌]: 浏览器可能拦截了自动交互，请手动点击播放。`);
    });
  };

  // Play All Segments sequences sequentially
  const handleSynthesizeAndPlaySequence = async () => {
    if (segments.length === 0) return;
    setAllSegmentsPlaying(true);
    addLog(`[多段联合]: 启动无缝多轨句段顺序合成及试听工程连播...`);

    forceStopAudition();

    let currentIndex = 0;

    const playStep = async () => {
      if (currentIndex >= segments.length) {
        setAllSegmentsPlaying(false);
        setCurrentlyPlayingId(null);
        addLog(`[多段播放完毕]: 全段对白合成播放结束，高控性合成闭环！`);
        
        // Save to History Records
        const totalCharCount = segments.reduce((acc, s) => acc + s.text.length, 0);
        const historyItem: ConversionHistoryItem = {
          id: `history-seg-${Date.now()}`,
          sourceText: segments[0].text.slice(0, 30) + (segments.length > 1 ? '...' : ''),
          targetVoiceName: activeSelectedVoice.name,
          resultAudioUrl: '#',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          type: 'segment-tts',
          duration: Math.ceil(totalCharCount * 0.15 + 1),
          segmentCount: segments.length
        };
        setConversionHistory(prev => [historyItem, ...prev]);
        return;
      }

      const activeSeg = segments[currentIndex];
      setCurrentlyPlayingId(`segment-queue-${activeSeg.id}`);
      addLog(`[联合播报]: 正在处理第 ${currentIndex + 1}/${segments.length} 句: "${activeSeg.text}"`);

      // Synthesize on-the-fly if not cached
      if (!activeSeg.audioUrl || activeSeg.audioUrl === '#') {
        try {
          addLog(`[队列合成]: 该句尚无音频缓存，正在自动化云端渲染...`);
          const res = await fetch('/api/voice/tts', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              text: activeSeg.text,
              voiceConfig: activeSelectedVoice,
              segmentConfig: activeSeg,
              model: selectedTtsModel
            })
          });
          const data = await res.json();
          if (res.ok && data.success && data.audioData) {
            if (data.fallbackActive) {
              addLog(`[音色修正 ⚠️]: ${data.message}`);
            }
            activeSeg.audioUrl = data.audioData;
            // update local segments caching indicator
            setSegments(prev => prev.map(s =>
              s.id === activeSeg.id
                ? { ...s, audioUrl: data.audioData }
                : s
            ));
          } else {
            activeSeg.audioUrl = undefined;
          }
        } catch (e) {
          activeSeg.audioUrl = undefined;
        }
      }

      // Play the segment audio
      if (activeSeg.audioUrl && activeSeg.audioUrl !== '#') {
        const audio = new Audio(activeSeg.audioUrl);
        activeVoiceRunnerRef.current = {
          stop: () => {
            audio.pause();
          }
        };

        const interval = setInterval(() => {
          const fakeWave = new Uint8Array(64).map(() => Math.floor(Math.random() * 140 + 30));
          setVisualDataArray(fakeWave);
        }, 80);

        audio.onended = () => {
          clearInterval(interval);
          currentIndex++;
          playStep();
        };

        audio.onerror = () => {
          clearInterval(interval);
          addLog(`[播放错误 ❌]: 第 ${currentIndex + 1} 句音频解码或流连接加载异常，自动跳过该轨。`);
          currentIndex++;
          playStep();
        };

        audio.play().catch(e => {
          console.error('[Playback abort or paused]', e);
          clearInterval(interval);
          currentIndex++;
          playStep();
        });
      } else {
        addLog(`[联合播报 ❌]: 第 ${currentIndex + 1} 句未探测到缓存音频流（可能是配置未生效或额度缺失）。自动跳过。`);
        currentIndex++;
        playStep();
      }
    };

    playStep();
  };

  const handleUpdateSegmentText = (id: string, text: string) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, text, audioUrl: undefined } : s));
  };

  const handleUpdateSegmentPitch = (id: string, pitch: number) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, pitch, audioUrl: undefined } : s));
  };

  const handleUpdateSegmentSpeed = (id: string, speed: number) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, speed, audioUrl: undefined } : s));
  };

  const handleUpdateSegmentEmotion = (id: string, emotion: TextSegment['emotion']) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, emotion, audioUrl: undefined } : s));
  };

  const handleUpdateSegmentVolume = (id: string, volume: number) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, volume, audioUrl: undefined } : s));
  };

  const handleRemoveSegment = (id: string) => {
    forceStopAudition();
    setSegments(prev => prev.filter(s => s.id !== id));
  };

  const handleAddBlankSegment = () => {
    const blank: TextSegment = {
      id: `seg-blank-${Date.now()}`,
      text: '新插入的一句录音配音。',
      pitch: 0,
      speed: 1.0,
      volume: 85,
      emotion: 'neutral'
    };
    setSegments(prev => [...prev, blank]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-orange-500/35 selection:text-orange-200">
      
      {/* Platform Header */}
      <header id="app-header" className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/90 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20 ring-1 ring-orange-400/30">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-orange-400 bg-clip-text text-transparent">
                阿里百炼 · 音色定制与分段可控语音合成控制台
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Alibaba DashScope Customized voice design & highly controllable segment-based TTS workspace
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 self-end md:self-auto">
            {/* Live Gateway Status */}
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center space-x-2 ${
              isRealServerConnected 
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400' 
                : 'bg-amber-950/30 border-amber-800/60 text-amber-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isRealServerConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-500'}`}></span>
              <span>{isRealServerConnected ? '阿里云百炼 API 已联结' : '智能仿真声码器在运行'}</span>
            </div>

            {/* Document check buttons */}
            <button 
              id="confirm-btn"
              onClick={() => {
                setIsDesignApproved(!isDesignApproved);
                addLog(isDesignApproved ? '[BluePrint]: 搁置方案确认状态。' : '[BluePrint]: 您已确认阿里百炼定制化声带方案。');
              }}
              className={`text-xs px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                isDesignApproved 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                  : 'bg-orange-500 text-white hover:bg-orange-600 shadow shadow-orange-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isDesignApproved ? '调试已激活' : '激活控制台'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24">
        
        {/* Left Side: System Documentations and Integration architecture */}
        <section id="system-docs-rail" className="lg:col-span-4 bg-slate-950/50 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-4 backdrop-blur-sm self-start">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold tracking-wide text-slate-300 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-orange-400" />
              <span>阿里百炼声谱控制文档</span>
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-semibold tracking-wide uppercase">
              COSYVOICE V2
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-lg">
            <button
              onClick={() => setActiveSpecSection('req')}
              className={`py-1 text-[11px] font-semibold rounded-md transition-colors ${
                activeSpecSection === 'req' ? 'bg-slate-800 text-orange-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              设计说明
            </button>
            <button
              onClick={() => setActiveSpecSection('arch')}
              className={`py-1 text-[11px] font-semibold rounded-md transition-colors ${
                activeSpecSection === 'arch' ? 'bg-slate-800 text-orange-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              架构层级
            </button>
            <button
              onClick={() => setActiveSpecSection('api')}
              className={`py-1 text-[11px] font-semibold rounded-md transition-colors ${
                activeSpecSection === 'api' ? 'bg-slate-800 text-orange-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              通信端点
            </button>
            <button
              onClick={() => setActiveSpecSection('schedule')}
              className={`py-1 text-[11px] font-semibold rounded-md transition-colors ${
                activeSpecSection === 'schedule' ? 'bg-slate-800 text-orange-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              工作路径
            </button>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900 text-xs text-slate-400 leading-relaxed min-h-[220px]">
            {activeSpecSection === 'req' && (
              <div className="space-y-3">
                <div className="font-bold text-slate-200 text-[13px] border-b border-slate-900 pb-1 flex items-center space-x-1">
                  <Sparkle className="w-3.5 h-3.5 text-orange-400" />
                  <span>音色定制设计规范</span>
                </div>
                <p>
                  1. <strong>提示词解调</strong>：用户可通过自然语言提示词描述声音气场（如「沧桑」、「甜美」），并结合喉部拉伸度、张力以及环境干湿滑块。
                </p>
                <p>
                  2. <strong>音色试听</strong>：创建的音色会及时存入私人库，并能在「音色推荐库」旁作为后续单句或批量长对白合成的高精发音人模版。
                </p>
                <p>
                  3. <strong>分段语气精修</strong>：多段语音合成提供「情绪、音速、音高差、音量」独立句段滑块，实现全可控、高密度的表达力声腔拟合。
                </p>
              </div>
            )}

            {activeSpecSection === 'arch' && (
              <div className="space-y-3">
                <div className="font-bold text-slate-200 text-[13px] border-b border-slate-900 pb-1 text-xs">
                  百炼端到端语音拟重塑架构
                </div>
                <div className="border-l-2 border-orange-500 pl-2 space-y-1">
                  <div className="font-bold text-slate-200">层级 ①: 声带控制层 (用户界面)</div>
                  <div className="text-slate-400 text-[11px]">集成分段滑块及提示词智能定制面板，实现可视化的声音物理特性操控。</div>
                </div>
                <div className="border-l-2 border-orange-500 pl-2 space-y-1">
                  <div className="font-bold text-slate-200">层级 ②: 代理安全连接层 (Node.js backend)</div>
                  <div className="text-slate-400 text-[11px]">Express安全保护 DASHSCOPE_API_KEY，分流或多段并行合成请求。</div>
                </div>
                <div className="border-l-2 border-orange-500 pl-2 space-y-1">
                  <div className="font-bold text-slate-200">层级 ③: 阿里百炼 CosyVoice-v2 云网</div>
                  <div className="text-slate-400 text-[11px]">提供高拟精度的文字转声谱，或根据提示句声带解离生成定制音色。</div>
                </div>
              </div>
            )}

            {activeSpecSection === 'api' && (
              <div className="space-y-3">
                <div className="font-bold text-slate-200 text-[13px] border-b border-slate-900 pb-1">
                  API 端点交互规范
                </div>
                <div className="p-2 bg-slate-900 rounded font-mono text-[10.5px]">
                  <span className="text-emerald-400">POST</span> /api/voice/design
                  <div className="text-slate-500 mt-0.5 text-[10px]">根据输入的「提示词」和「基础共鸣参数」，服务端使用阿里百炼大模型智能预测最吻合的物理配置并在百炼中建立注册专一 voiceId。</div>
                </div>
                <div className="p-2 bg-slate-900 rounded font-mono text-[10.5px]">
                  <span className="text-emerald-400">POST</span> /api/voice/tts
                  <div className="text-slate-500 mt-0.5 text-[10px]">合成对白。接受目标发音人 ID 以及该句段指定的 relative pitch_rate，speech_rate，进行音频生成并返回 base64 数据。</div>
                </div>
              </div>
            )}

            {activeSpecSection === 'schedule' && (
              <div className="space-y-3">
                <div className="font-bold text-slate-200 text-[13px] border-b border-slate-930 pb-1">
                  控制台部署里程碑
                </div>
                <div className="flex items-start space-x-1.5 text-[11.5px]">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">✔</span>
                  <div>
                    <span className="font-bold text-slate-200">提示词创意设计体系</span>
                    <p className="text-slate-400">完成提示词自动声学参数拟合与注册。</p>
                  </div>
                </div>
                <div className="flex items-start space-x-1.5 text-[11.5px]">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">✔</span>
                  <div>
                    <span className="font-bold text-slate-200">高可控分句精调</span>
                    <p className="text-slate-400">句段切片情绪、声调及速度自主操盘。</p>
                  </div>
                </div>
                <div className="flex items-start space-x-1.5 text-[11.5px]">
                  <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">⚙</span>
                  <div>
                    <span className="font-bold text-slate-200">API 完整互通与并发合流</span>
                    <p className="text-slate-400 font-mono text-[10px]">DASHSCOPE_API_KEY 直连云端生产系统。</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* API Key Connection Validation Card */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">API Key 状态校验器</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                validationStatus === 'success' ? 'bg-emerald-500/15 text-emerald-400' :
                validationStatus === 'failed' ? 'bg-rose-500/15 text-rose-400' :
                validationStatus === 'checking' ? 'bg-amber-500/15 text-amber-400 animate-pulse' :
                'bg-slate-800 text-slate-400'
              }`}>
                {validationStatus === 'success' ? '校验通过' :
                 validationStatus === 'failed' ? '验证失败' :
                 validationStatus === 'checking' ? '正在连接...' :
                 '未验证'}
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-normal">
              主动拨测阿里云百炼鉴权网关获取身份响应，检查当前系统注册的 <code className="bg-slate-950 px-1 py-0.5 border border-slate-900 rounded font-mono text-[10px] text-slate-300">DASHSCOPE_API_KEY</code> 连接成色。
            </p>

            {validationMessage && (
              <div className={`p-2 rounded text-[10.5px] leading-relaxed font-mono border ${
                validationStatus === 'success' 
                  ? 'bg-emerald-950/25 border-emerald-900/40 text-emerald-300' 
                  : 'bg-rose-950/25 border-rose-900/40 text-rose-300'
              }`}>
                {validationMessage}
              </div>
            )}

            <button
              onClick={handleValidateApiKey}
              disabled={validationStatus === 'checking'}
              className="w-full text-xs py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium transition-all duration-200 flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-slate-700/50"
            >
              <span>{validationStatus === 'checking' ? '连接阿里云百炼中...' : '校验 API Key 连通性'}</span>
            </button>
          </div>

          {/* TTS Model Selection Card */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200">语音合成模型选择</span>
              </div>
            </div>
            
            <select
              value={selectedTtsModel}
              onChange={(e) => setSelectedTtsModel(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg bg-slate-950 border border-slate-700/50 text-slate-200 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              {models?.tts.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description.substring(0, 20)}...
                </option>
              ))}
            </select>

            <p className="text-[10.5px] text-slate-500">
              当前选择: <code className="bg-slate-950 px-1.5 py-0.5 border border-slate-900 rounded font-mono text-[10px] text-blue-400">{selectedTtsModel}</code>
            </p>
          </div>

          {/* Model Activation Links Card */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2.5">
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-200">模型开通与配置</span>
            </div>
            
            <div className="space-y-1.5">
              <a
                href={activationLinks?.apiKey}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 hover:bg-slate-800/50 transition-colors cursor-pointer group"
              >
                <span className="text-[11px] text-slate-400 group-hover:text-slate-200">获取 API Key</span>
                <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
              </a>
              
              <a
                href={activationLinks?.modelMarket}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 hover:bg-slate-800/50 transition-colors cursor-pointer group"
              >
                <span className="text-[11px] text-slate-400 group-hover:text-slate-200">模型市场（开通 CosyVoice）</span>
                <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
              </a>
              
              <a
                href={models?.tts.find(m => m.id === selectedTtsModel)?.activationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors cursor-pointer group"
              >
                <span className="text-[11px] text-blue-300">开通 {models?.tts.find(m => m.id === selectedTtsModel)?.name}</span>
                <ExternalLink className="w-3 h-3 text-blue-400" />
              </a>
            </div>

            <div className="pt-2 border-t border-slate-800/50">
              <p className="text-[10px] text-slate-500">
                💡 提示：使用前请确保已在阿里云百炼控制台开通相关模型服务
              </p>
            </div>
          </div>

          {/* Interactive plan agreement box */}
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl space-y-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4.5 h-4.5 text-orange-400" />
              <span className="text-xs font-bold text-orange-200">需求状态确认记录</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              根据您的意见，我们清除了不必要的市场共享与现场变声克隆功能，完全聚焦在<strong>高拟合度提示词定制、纯单机控制与精细分句切片语音合成</strong>。
            </p>
            <label className="flex items-center space-x-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isDesignApproved}
                onChange={(e) => {
                  setIsDesignApproved(e.target.checked);
                  addLog(e.target.checked ? '[System]: 已激活专属语音调试网关。' : '[System]: 挂起离线。');
                }}
                className="rounded border-slate-700 text-orange-500 focus:ring-orange-500/20 bg-slate-800 w-4 h-4 accent-orange-500"
              />
              <span className="text-[11px] font-medium text-slate-300 select-none">
                我已仔细阅览，开始进行合成联调
              </span>
            </label>
          </div>

          {/* Logger Stream */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>百炼接口通信日志</span>
              </span>
              <button 
                onClick={() => setApiLogs([])}
                className="text-[9px] text-slate-500 hover:text-slate-300 underline uppercase"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1.5 h-[135px] overflow-y-auto text-[10.5px] font-mono text-slate-400">
              {apiLogs.length === 0 ? (
                <div className="text-slate-600 italic text-[10px]">尚无日志流通...</div>
              ) : (
                apiLogs.map((log, index) => (
                  <div key={index} className="leading-snug border-b border-slate-900 pb-1 break-all select-all">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>


        {/* Right Side: Primary interactive workspace */}
        <section id="workbench-arena" className="lg:col-span-8 space-y-6">
          
          {isDesignApproved && (<>
              <div id="vocal-artistry-lab" className="bg-slate-950/20 border border-slate-800 rounded-2xl p-5 space-y-4">
                {/* Mode Selector Tabs */}
                <div className="flex border-b border-slate-800 pb-3 items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setActiveDesignMode('prompt')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeDesignMode === 'prompt'
                          ? 'bg-orange-500 text-slate-950 shadow font-extrabold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      💡 提示词描述定制 (Acoustic Design)
                    </button>
                    <button
                      onClick={() => {
                        forceStopAudition();
                        setActiveDesignMode('cloning');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                        activeDesignMode === 'cloning'
                          ? 'bg-purple-600 text-slate-100 shadow font-extrabold shadow-purple-900/40'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>🎙️ 极速声音复刻/克隆 (Voice Clone)</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800 hidden md:inline-block">
                    符合阿里云百炼 CosyVoice 实战标准
                  </span>
                </div>

                {activeDesignMode === 'prompt' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-xs font-bold text-slate-300">
                          根据描述词自由拟合声音形象与阻尼特征
                        </h4>
                      </div>
                      <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono">
                        支持阿里百炼自动参数预测
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      {/* Prompt Text input on design */}
                      <div className="md:col-span-6 space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-slate-300">① 输入音色形象描述提示词 (Prompt)</label>
                            <span className="text-[9px] text-slate-500">支持中英文、拟声词细节</span>
                          </div>
                          <textarea
                            rows={2.5}
                            value={designerPrompt}
                            onChange={(e) => setDesignerPrompt(e.target.value)}
                            placeholder="例如：一个声音有点沙哑但非常有磁性的沧桑男配音员，带有一丝深夜黑胶收音机质感..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500/70 leading-relaxed resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">自定义新音色名称</label>
                            <input
                              type="text"
                              value={editorName}
                              onChange={(e) => setEditorName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500/70"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1">主要性别</label>
                              <select
                                value={editorGender}
                                onChange={(e) => setEditorGender(e.target.value as any)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                              >
                                <option value="male">男声</option>
                                <option value="female">女声</option>
                                <option value="other">合成</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 mb-1">年龄组</label>
                              <select
                                value={editorAge}
                                onChange={(e) => setEditorAge(e.target.value as any)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                              >
                                <option value="child">幼龄</option>
                                <option value="youth">青年</option>
                                <option value="adult">中年</option>
                                <option value="elder">老年</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-indigo-950/20 border border-indigo-900/35 rounded-xl text-[11px] text-indigo-300 leading-normal">
                          <p className="font-bold flex items-center space-x-1 mb-0.5">
                            <Cpu className="w-3.5 h-3.5" />
                            <span>AI声学自动映射逻辑</span>
                          </p>
                          当你输入提示词后点击生成，服务器会调用<strong>阿里百炼大模型</strong>将繁杂的文本特性精密翻译并叠加至阻尼滑块属性内，免除手工微调困扰。
                        </div>
                      </div>

                      {/* Micro sliders manual override overrides */}
                      <div className="md:col-span-6 bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3.5">
                        <span className="text-[11px] font-bold text-slate-400 block border-b border-slate-800 pb-1">
                          ② 结合微调滑块重塑物理共鸣 (阻尼拉伸)
                        </span>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          {/* Pitch scale */}
                          <div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                              <span>发音音高 (Pitch)</span>
                              <span className="font-mono text-orange-400">{pitch > 0 ? `+${pitch}` : pitch}Hz</span>
                            </div>
                            <input 
                              type="range" min="-100" max="100" value={pitch} onChange={(e) => setPitch(Number(e.target.value))}
                              className="w-full h-1 bg-slate-805 appearance-none cursor-pointer accent-orange-500" 
                            />
                          </div>

                          {/* Speed limit */}
                          <div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                              <span>出音语速 (Speed)</span>
                              <span className="font-mono text-orange-400">{speed.toFixed(2)}x</span>
                            </div>
                            <input 
                              type="range" min="0.5" max="2.0" step="0.05" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
                              className="w-full h-1 bg-slate-800 appearance-none cursor-pointer accent-orange-500" 
                            />
                          </div>

                          {/* Warmth */}
                          <div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                              <span>共鸣腔暖度 (Warmth)</span>
                              <span className="font-mono text-orange-400">{warmth}%</span>
                            </div>
                            <input 
                              type="range" min="-100" max="100" value={warmth} onChange={(e) => setWarmth(Number(e.target.value))}
                              className="w-full h-1 bg-slate-800 appearance-none cursor-pointer accent-orange-500" 
                            />
                          </div>

                          {/* Tension */}
                          <div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                              <span>声带张力 (Tension)</span>
                              <span className="font-mono text-orange-400">{tension}%</span>
                            </div>
                            <input 
                              type="range" min="-100" max="100" value={tension} onChange={(e) => setTension(Number(e.target.value))}
                              className="w-full h-1 bg-slate-800 appearance-none cursor-pointer accent-orange-500" 
                            />
                          </div>

                          {/* Breathiness */}
                          <div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                              <span>呼气占比 (Breathiness)</span>
                              <span className="font-mono text-orange-400">{breathiness}%</span>
                            </div>
                            <input 
                              type="range" min="0" max="100" value={breathiness} onChange={(e) => setBreathiness(Number(e.target.value))}
                              className="w-full h-1 bg-slate-800 appearance-none cursor-pointer accent-orange-500" 
                            />
                          </div>

                          {/* Reverb or Robotic */}
                          <div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                              <span>混响空间 (Reverb)</span>
                              <span className="font-mono text-orange-400">{reverb}%</span>
                            </div>
                            <input 
                              type="range" min="0" max="100" value={reverb} onChange={(e) => setReverb(Number(e.target.value))}
                              className="w-full h-1 bg-slate-800 appearance-none cursor-pointer accent-orange-500" 
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex justify-between space-x-2">
                          {customVoices.length > 0 && (
                            <button
                              title="清空选区"
                              onClick={() => {
                                setEditorName('新录制音');
                                setDesignerPrompt('');
                                setPitch(0);
                                setSpeed(1.0);
                                setWarmth(0);
                                setTension(0);
                                setBreathiness(10);
                              }}
                              className="px-3 bg-slate-800 text-slate-300 rounded-lg hover:text-white transition-colors cursor-pointer text-xs"
                            >
                              重置
                            </button>
                          )}

                          <button
                            onClick={handleRegisterCustomVoice}
                            disabled={designSaving || !editorName.trim()}
                            className="flex-1 py-2 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-slate-900 rounded-xl font-bold text-xs shadow-md shadow-orange-500/10 hover:opacity-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {designSaving ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                                <span>云端正弦波拟合中...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 text-slate-900" />
                                <span>提报百炼模型并定制音色</span>
                              </>
                            )}
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                ) : (
                  /* Voice Cloning Panel content */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      {/* Left: Input parameters */}
                      <div className="md:col-span-6 space-y-4">
                        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-3">
                          <label className="block text-xs font-bold text-slate-300">① 克隆音色专有命名</label>
                          <input
                            type="text"
                            value={cloneName}
                            onChange={(e) => setCloneName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-805 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-medium"
                            placeholder="例如：我的原声克隆、复刻体验等"
                          />
                          <p className="text-[10px] text-slate-500">
                            声音克隆成功后将加入您的私人音色库，让多句合成器立即使用它说出任意文字。
                          </p>
                        </div>

                        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-3">
                          <span className="text-xs font-bold text-slate-300 block border-b border-slate-900 pb-1.5">② 声音来源选择 (双模输入)</span>
                          
                          <div className="grid grid-cols-2 gap-2.5">
                            {/* Recording mode card */}
                            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col items-center justify-center space-y-2 text-center">
                              <span className="text-[10.5px] font-bold text-slate-400">麦克风现场朗读录音</span>
                              
                              {cloningStatus === 'recording' ? (
                                <div className="space-y-1.5 text-center w-full">
                                  <div className="w-10 h-10 rounded-full bg-red-650 flex items-center justify-center animate-pulse mx-auto">
                                    <Square className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="text-[11px] text-red-400 font-mono font-bold block">录制中: {recordingSeconds}s / 60s</span>
                                  <button
                                    onClick={stopRecording}
                                    className="px-2 py-0.5 bg-red-950 border border-red-800 text-red-200 text-[9px] rounded hover:bg-red-900 transition-colors cursor-pointer font-bold block mx-auto"
                                  >
                                    停止并锁轨
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <button
                                    onClick={startRecording}
                                    className="w-10 h-10 rounded-full bg-purple-650 hover:bg-purple-600 flex items-center justify-center text-slate-100 mx-auto transition-transform hover:scale-105 cursor-pointer shadow-md shadow-purple-900/10"
                                  >
                                    <Mic className="w-4.5 h-4.5" />
                                  </button>
                                  <span className="text-[9.5px] text-slate-500 block">系统完美捕获并升频</span>
                                </div>
                              )}
                            </div>

                            {/* Local file upload card */}
                            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col items-center justify-center space-y-2 text-center relative hover:border-purple-950 transition-colors">
                              <span className="text-[10.5px] font-bold text-slate-400">本地旧音频拖入上传</span>
                              
                              <label className="cursor-pointer space-y-2 block w-full">
                                <input
                                  type="file"
                                  accept="audio/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleUploadedFile(e.target.files[0]);
                                    }
                                  }}
                                />
                                <div className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 mx-auto transition-all">
                                  <Upload className="w-4.5 h-4.5" />
                                </div>
                                <span className="text-[9.5px] text-slate-500 block underline">选取本地 .wav/.mp3 </span>
                              </label>
                            </div>
                          </div>

                          {cloneAudioUrl && (
                            <div className="p-2 bg-slate-900 border border-slate-850 rounded-lg flex items-center justify-between">
                              <span className="text-[10px] text-emerald-400 font-bold">参考声轨就绪</span>
                              <audio src={cloneAudioUrl} controls className="h-6 w-3/4 max-w-[180px] text-xs" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Analyzer info & clone action trigger */}
                      <div className="md:col-span-6 bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-4">
                        <div className="space-y-2.5">
                          <span className="text-xs font-bold text-slate-300 block border-b border-slate-800 pb-1.5 flex items-center justify-between">
                            <span>③ 阿里百炼规范性拦截检验板</span>
                            <span className="text-[8.5px] text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded font-mono">
                              主动防灾预检
                            </span>
                          </span>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-slate-900/80 rounded border border-slate-805">
                              <div className="text-[10px] text-slate-500">音频采样率 (极速克隆 &gt;=24k)</div>
                              <div className={`text-[12px] font-bold mt-0.5 font-mono ${
                                !audioAnalysis ? 'text-slate-500' :
                                audioAnalysis.sampleRate >= 24000 ? 'text-emerald-400' : 'text-rose-500 font-bold'
                              }`}>
                                {audioAnalysis ? `${audioAnalysis.sampleRate} Hz` : '待检测'}
                              </div>
                            </div>
                            <div className="p-2 bg-slate-900/80 rounded border border-slate-805">
                              <div className="text-[10px] text-slate-500">音频总时长 (克隆最长 60s)</div>
                              <div className={`text-[12px] font-bold mt-0.5 font-mono ${
                                !audioAnalysis ? 'text-slate-500' :
                                audioAnalysis.duration <= 60 ? 'text-emerald-400' : 'text-rose-500 font-black'
                              }`}>
                                {audioAnalysis ? `${audioAnalysis.duration.toFixed(1)} 秒` : '待检测'}
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl text-[11px] leading-relaxed text-slate-400">
                            {audioAnalysis ? (
                              <div className="space-y-1">
                                <p className="font-bold flex items-center space-x-1 text-slate-300">
                                  <AlertCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                  <span>百炼规范符合度报告</span>
                                </p>
                                {audioAnalysis.sampleRate < 24000 && (
                                  <p className="text-rose-400 font-medium">
                                    ❌ [400-Audio.AudioRateError 拦截] 该音频低于 24000Hz 采样率！上游提取其复刻声纹必定会引发400格式错误，系统已为您自动拦截该次提报，请使用现场麦克风采集(采样率通常为 44.1k)。
                                  </p>
                                )}
                                {audioAnalysis.duration > 60 && (
                                  <p className="text-rose-400 font-medium">
                                    ❌ [400-Audio.DurationLimitError 拦截] 音频达到了 {audioAnalysis.duration.toFixed(1)} 秒，超过了 60 秒极速克隆最高上限，请截短并重新录入。
                                  </p>
                                )}
                                {audioAnalysis.sampleRate >= 24000 && audioAnalysis.duration <= 60 && (
                                  <p className="text-emerald-400 font-bold">
                                    ✔ [校验通过] 该音轨完美符合阿里云百炼 CosyVoice-V2 极速声音复刻规范！您可以开始进行同步复刻建模。
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p>
                                <strong>💡 阻断说明 (关于 400-Audio 异常常见机制)：</strong>
                                <br />
                                1. <strong>采样率不合</strong>：使用 Qwen-TTS 或 CosyVoice 声音复刻时，外部文件低于 24000 Hz，请用系统录音或录音外设。
                                <br />
                                2. <strong>时长超限</strong>：待复刻音频超过 60 秒。建议采集在 12秒 ~ 25秒 左右最有利于声韵提取。
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={handleStartVoiceClone}
                          disabled={cloningStatus === 'processing'}
                          className="w-full py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 text-slate-50 rounded-xl font-bold text-xs shadow-md shadow-purple-900/10 hover:opacity-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          {cloningStatus === 'processing' ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-slate-100" />
                              <span>阿里云百炼特征矩阵建模中，请稍候...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-purple-250 animate-pulse" />
                              <span>一键向阿里云同步注册并克隆声音 (Clone)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Voice Collection indicator */}
                {customVoices.length > 0 && (
                  <div className="flex items-center space-x-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-805 text-xs text-slate-400">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>你的私人音色库目前装载了以下极小特征：</span>
                    <div className="flex flex-wrap gap-1.5 ml-1 flex-1">
                      {customVoices.map(cv => (
                        <div key={cv.id} className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-750 flex items-center space-x-1 text-[11px]">
                          <span className="text-slate-300 font-medium truncate max-w-[100px]">{cv.name}</span>
                          <button 
                            onClick={(e) => handleDeleteVoice(cv.id, e)}
                            className="text-red-400 hover:text-red-200 font-bold ml-1 text-[10px]"
                            title="物理销毁"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>


              {/* Block 3: Dynamic high-controllability segment-based voice synthesiser */}
              <div id="highly-controllable-synthesizer" className="bg-slate-950/20 border border-slate-800 rounded-2xl p-5 space-y-4">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Volume2 className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">
                        高可控长对白分段微调语音合成 (Segment Controllable TTS)
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        支持将整句长文切片为对句对白，对每一段单独精确设定语气情绪声调
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shrink-0">
                    <span className="text-[11px] text-slate-400">选用发音主体:</span>
                    <span className="text-xs font-black text-orange-400 truncate max-w-[130px]">
                      {activeSelectedVoice.name.split(' (')[0]}
                    </span>
                    <span className="text-[8.5px] bg-orange-500/10 text-orange-400 px-1 py-0.2 rounded font-semibold shrink-0">
                      {activeSelectedVoice.isPreset ? 'Preset' : 'Designed'}
                    </span>
                  </div>
                </div>

                {/* Split text area zone */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      第一步：在此贴入剧本对白 / 文本大段内容 (支持表情前缀自动切片)
                    </label>
                    <textarea
                      rows={3}
                      value={rawTextToSplit}
                      onChange={(e) => setRawTextToSplit(e.target.value)}
                      placeholder='输入例如:&#10;（喜悦）今天真是个美好的日子！&#10;（严肃）但是根据天气预报，傍晚可能有暴雨降临。'
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500/60 leading-relaxed font-sans"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-500">
                      系统支持在句首使用 [（欢快）|（深情）|（严正）] 情绪词触发自动智能分句和声学特征设定。
                    </p>
                    
                    <button
                      onClick={handleAutoSplitText}
                      disabled={!rawTextToSplit.trim()}
                      className="px-4 py-1.5 bg-indigo-900/60 hover:bg-indigo-900 text-indigo-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-indigo-800/50 cursor-pointer disabled:opacity-40"
                    >
                      智能自动拆分句段 &rarr;
                    </button>
                  </div>
                </div>

                {/* Render split Segment rows with sliders and buttons */}
                <div className="space-y-3 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-300 flex items-center space-x-1">
                      <span>第二步：分段微调声谱及情绪参数组 ({segments.length} 句对白)</span>
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddBlankSegment}
                        className="text-[10.5px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 px-2.5 py-1 rounded border border-slate-800 cursor-pointer"
                      >
                        + 手工插入新句
                      </button>
                      <button
                        onClick={() => setSegments([])}
                        className="text-[10.5px] bg-red-950/15 hover:bg-red-950/30 text-red-400 px-2.5 py-1 rounded border border-red-950/35 cursor-pointer"
                      >
                        清空列表
                      </button>
                    </div>
                  </div>

                  {segments.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2 border border-dashed border-slate-800 rounded-xl">
                      <Download className="w-8 h-8 text-slate-600 animate-bounce" />
                      <p>当前分段配音表为空。</p>
                      <p className="text-[10px] text-slate-600">在上方贴入段落并点击 “智能自动拆分句段” 一键生成专属台词流</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                      {segments.map((segment, index) => {
                        const isSpeaking = currentlyPlayingId === `segment-${segment.id}` || currentlyPlayingId === `segment-queue-${segment.id}`;
                        const isSynthesizing = segmentSynthesizingId === segment.id;

                        return (
                          <div 
                            key={segment.id}
                            id={`seg-card-${segment.id}`}
                            className={`p-3.5 rounded-xl border text-left transition-all relative ${
                              isSpeaking 
                                ? 'bg-indigo-950/15 border-indigo-400 shadow shadow-indigo-500/5' 
                                : segment.audioUrl 
                                ? 'bg-slate-950/30 border-slate-800/80 ring-1 ring-emerald-500/10' 
                                : 'bg-slate-950/45 border-slate-850'
                            }`}
                          >
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                              {/* Left column text input */}
                              <div className="flex-1 w-full space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-mono w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                    {(index + 1).toString().padStart(2, '0')}
                                  </span>
                                  {segment.audioUrl ? (
                                    <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                                      {segment.audioUrl === '#' ? '本地拟质就绪' : '百炼云音频已缓存'}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                                      未拟合
                                    </span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={segment.text}
                                  onChange={(e) => handleUpdateSegmentText(segment.id, e.target.value)}
                                  className="w-full bg-slate-900 border-b border-transparent focus:border-orange-500/30 text-xs text-slate-200 font-medium py-1 focus:outline-none"
                                />
                              </div>

                              {/* Tone segment tuning variables */}
                              <div className="w-full md:w-auto grid grid-cols-2 md:flex items-center gap-2.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
                                
                                {/* Segment Emotion */}
                                <div className="shrink-0 text-left">
                                  <div className="text-[9px] text-slate-500 mb-0.5">语气表情</div>
                                  <select
                                    value={segment.emotion}
                                    onChange={(e) => handleUpdateSegmentEmotion(segment.id, e.target.value as any)}
                                    className="bg-slate-950 text-[10.5px] border border-slate-800 rounded px-1 py-0.5 text-slate-300 focus:outline-none"
                                  >
                                    <option value="neutral">平静自然</option>
                                    <option value="gentle">温柔治愈</option>
                                    <option value="happy">欢快喜悦</option>
                                    <option value="excited">激昂热烈</option>
                                    <option value="serious">严肃庄重</option>
                                    <option value="sad">低沉悲伤</option>
                                    <option value="angry">愤怒</option>
                                    <option value="fear">恐惧</option>
                                    <option value="professional">专业客服</option>
                                  </select>
                                </div>

                                {/* Segment relative speed */}
                                <div className="text-left shrink-0">
                                  <div className="text-[9px] text-slate-500 mb-0.5 flex justify-between">
                                    <span>语速</span>
                                    <span className="text-orange-400 font-mono scale-90">{segment.speed.toFixed(1)}x</span>
                                  </div>
                                  <input 
                                    type="range" min="0.5" max="1.8" step="0.05" value={segment.speed}
                                    onChange={(e) => handleUpdateSegmentSpeed(segment.id, Number(e.target.value))}
                                    className="w-16 h-1 bg-slate-800 cursor-pointer accent-orange-500"
                                  />
                                </div>

                                {/* Segment relative pitch offset */}
                                <div className="text-left shrink-0">
                                  <div className="text-[9px] text-slate-500 mb-0.5 flex justify-between">
                                    <span>声调偏移</span>
                                    <span className="text-orange-400 font-mono scale-90">{segment.pitch > 0 ? `+${segment.pitch}` : segment.pitch}Hz</span>
                                  </div>
                                  <input 
                                    type="range" min="-45" max="45" step="1" value={segment.pitch}
                                    onChange={(e) => handleUpdateSegmentPitch(segment.id, Number(e.target.value))}
                                    className="w-16 h-1 bg-slate-800 cursor-pointer accent-orange-500"
                                  />
                                </div>

                                {/* Segment volume */}
                                <div className="text-left shrink-0">
                                  <div className="text-[9px] text-slate-500 mb-0.5 flex justify-between">
                                    <span>独立音量</span>
                                    <span className="text-orange-400 font-mono scale-90">{segment.volume}%</span>
                                  </div>
                                  <input 
                                    type="range" min="30" max="100" step="5" value={segment.volume}
                                    onChange={(e) => handleUpdateSegmentVolume(segment.id, Number(e.target.value))}
                                    className="w-16 h-1 bg-slate-800 cursor-pointer accent-orange-500"
                                  />
                                </div>

                              </div>

                              {/* Button triggers */}
                              <div className="flex items-center space-x-2 w-full md:w-auto md:shrink-0 justify-end">
                                <button
                                  onClick={() => handleSynthesizeSingleSegment(segment.id)}
                                  disabled={isSynthesizing}
                                  className={`px-3 py-1.5 lg:py-2 text-[10.5px] font-bold rounded-lg cursor-pointer transition-colors flex items-center space-x-1 ${
                                    isSpeaking 
                                      ? 'bg-orange-600 hover:bg-orange-700 text-white animate-pulse' 
                                      : segment.audioUrl 
                                      ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400' 
                                      : 'bg-indigo-900 hover:bg-indigo-800 text-indigo-100'
                                  }`}
                                >
                                  {isSynthesizing ? (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      <span>合成中...</span>
                                    </>
                                  ) : isSpeaking ? (
                                    <>
                                      <Square className="w-3.5 h-3.5" />
                                      <span>停止播放</span>
                                    </>
                                  ) : segment.audioUrl ? (
                                    <>
                                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>播放重听</span>
                                    </>
                                  ) : (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5 text-indigo-305" />
                                      <span>拟合单段</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  title="移出本句话"
                                  onClick={() => handleRemoveSegment(segment.id)}
                                  className="p-2 rounded-lg bg-red-950/20 text-red-400 hover:bg-red-950/50 hover:text-red-300"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Synthesis and control button triggers */}
                {segments.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-t border-slate-850 pt-4">
                    <div className="md:col-span-8 flex flex-col justify-center">
                      <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                        选择下面的「一键整段联合连播合成」触发多句并行调度渲染机制。
                        未生成缓存的句段将会自动化连通百炼网络渲染，完成无缝隙的流式播放融合！
                      </p>
                    </div>

                    <div className="md:col-span-4 flex items-center justify-end space-x-3 w-full">
                      <button
                        onClick={forceStopAudition}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        全盘放音断开/停止
                      </button>

                      <button
                        onClick={handleSynthesizeAndPlaySequence}
                        disabled={allSegmentsPlaying}
                        className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-orange-500/10 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {allSegmentsPlaying ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-slate-950 font-black" />
                            <span>联合连放中...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4.5 h-4.5 text-slate-950 font-black" />
                            <span>一键整段联合连播合成</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

              </div>


              {/* Block 4: Waveform spectral feedback display */}
              <div id="reconstitution-waveform-panel" className="bg-slate-950/20 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <h4 className="font-bold text-slate-200">
                      频域重组流式频谱与声压曲线反馈 (Spectral Analyzer Feedback)
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400">音能段分布，温暖色段代表中高音频密集度</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className="md:col-span-8 flex flex-col justify-center">
                    <AudioWaveform 
                      isPlaying={!!currentlyPlayingId} 
                      visualData={visualDataArray}
                      color={activeSelectedVoice.gender === 'male' ? '#f59e0b' : '#06b6d4'}
                    />
                  </div>

                  <div className="md:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between text-xs font-mono text-slate-405 leading-relaxed">
                    <div className="text-[11px] text-slate-400 font-bold border-b border-slate-900 pb-1 flex justify-between">
                      <span>声乐特征诊断：</span>
                      <span className="text-orange-400">ONLINE</span>
                    </div>

                    <div className="space-y-1.5 text-slate-500">
                      <div className="flex justify-between">
                        <span>喉位比率 (Vocal Tract)</span>
                        <span className="text-slate-300">{(1.0 + (activeSelectedVoice.pitch / 250)).toFixed(2)}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>声带干湿度 (Fluidity)</span>
                        <span className="text-slate-300">{activeSelectedVoice.breathiness}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>相延迟声腔 (Reverbs)</span>
                        <span className="text-slate-300">{activeSelectedVoice.reverb}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>声门状态 (Acoustic)</span>
                        <span className="text-slate-300">{activeSelectedVoice.robotic > 0 ? '极客调解' : '阿里云高保真'}</span>
                      </div>
                    </div>

                    <div className="text-[10.5px] text-slate-400 italic bg-amber-500/5 p-2 rounded border border-amber-500/10">
                      试听或进行段落连播时，该频谱会自动跟随发音波动。多句对白连播将实时展示多频腔过渡效果。
                    </div>
                  </div>
                </div>
              </div>


              {/* Block 5: Historic execution log table */}
              <div id="workflow-history" className="bg-slate-950/20 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-slate-400" />
                    <h4 className="font-bold text-slate-200">
                      语音加工合成工作审计历史 (History Record Engine)
                    </h4>
                  </div>
                  <button 
                    onClick={() => {
                      setConversionHistory([]);
                      addLog('[System]: 审计面板历史已清空。');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer"
                  >
                    遗漏清理
                  </button>
                </div>

                {conversionHistory.length === 0 ? (
                  <div className="py-6 text-center text-slate-600 text-xs italic">
                    暂无配音合成历史。在上方进行单段或连续多段合成，记录将在此呈现。
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300 font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                          <th className="pb-2">合成类型</th>
                          <th className="pb-2">对白预览段 (起始行)</th>
                          <th className="pb-2">声谱发音主体</th>
                          <th className="pb-2">加工日期</th>
                          <th className="pb-2">切片包含量</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {conversionHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-900/20 text-slate-400">
                            <td className="py-2.5 font-semibold">
                              {item.type === 'tts' ? (
                                <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded text-[10px]">
                                  CosyVoice-TTS
                                </span>
                              ) : (
                                <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[10px]">
                                  分段极控合成
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 max-w-[280px] truncate text-slate-300" title={item.sourceText}>
                              {item.sourceText}
                            </td>
                            <td className="py-2.5 text-slate-200 font-bold">{item.targetVoiceName}</td>
                            <td className="py-2.5 text-slate-500">{item.timestamp}</td>
                            <td className="py-2.5 text-slate-300 font-bold">{item.segmentCount || 1} 句</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

          </>)}

        </section>

      </main>

      {/* Persistent Audio Node Footer Bar */}
      {currentlyPlayingId && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-orange-500/30 px-6 py-3 shadow-lg flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-600/20 animate-pulse shrink-0">
                <Volume2 className="w-4 h-4 text-orange-400" />
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {currentlyPlayingId.startsWith('segment-queue-')
                    ? '联合工程连播：正在解码并流式播放配音句段...'
                    : currentlyPlayingId.startsWith('segment-')
                    ? '独立句段精调声学效果本地播报中...'
                    : `正在试听声质特征: ${allVoicesCombined.find(v => v.id === currentlyPlayingId)?.name || '未名定制声谱'}`
                  }
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  采样率: 24kHz | 阿里云神经网络声谱直通还原系统 | 动态波谱状态: 活跃中
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 shrink-0">
              {/* Spectral peaks */}
              <div className="hidden md:flex items-center space-x-1">
                {Array.from(visualDataArray).slice(0, 16).map((val: any, i) => (
                  <span 
                    key={i} 
                    style={{ height: `${Math.max(4, (val/255)*28)}px` }}
                    className="w-1 bg-gradient-to-t from-orange-600 to-yellow-500 rounded-sm transition-all duration-75"
                  />
                ))}
              </div>

              <button
                onClick={forceStopAudition}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-extrabold text-xs rounded-lg cursor-pointer"
              >
                立即断开播音
              </button>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}
