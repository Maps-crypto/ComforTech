import React, { useState, useEffect, useRef } from 'react';
import { STRESSORS, LANGUAGES } from '../data/mockData';
import { fetchJournalReflection, processVoiceJournal, fetchVoiceSummaryReport } from '../services/api';
import { saveJournalEntry, getVoiceJournalEntries, saveVoiceJournalEntry, deleteVoiceJournalEntry } from '../services/storage';
import {
  JournalEntry,
  MoodType,
  StressorCategory,
  UserProfile,
  VoiceJournalResult,
  VoiceJournalEntry,
  VoiceSentimentSummaryReport,
  LanguageCode,
} from '../types';
import { getTranslation } from '../utils/translations';
import { VoiceSummaryReportModal } from './VoiceSummaryReportModal';
import {
  Wind,
  Zap,
  BookOpen,
  Mic,
  MicOff,
  Smile,
  Sparkles,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Square,
  Radio,
  Copy,
  Check,
  Languages,
  Activity,
  HeartHandshake,
  ArrowRight,
  Brain,
  MessageSquareQuote,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  BarChart2,
  TrendingUp,
} from 'lucide-react';

interface CopingToolsProps {
  userProfile: UserProfile;
  selectedLanguage?: LanguageCode;
  initialTab?: 'breathing' | 'grounding' | 'journal' | 'voice' | 'checkin';
  onActivityLogged: (title: string, desc: string, score?: number) => void;
  onRefreshRecommendations: () => void;
}

export const CopingTools: React.FC<CopingToolsProps> = ({
  userProfile,
  selectedLanguage,
  initialTab = 'breathing',
  onActivityLogged,
  onRefreshRecommendations,
}) => {
  const activeLangCode = selectedLanguage || userProfile.preferredLanguage || 'en';
  const t = getTranslation(activeLangCode);
  const [activeTab, setActiveTab] = useState<'breathing' | 'grounding' | 'journal' | 'voice' | 'checkin'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  /* ================= BOX BREATHING STATE ================= */
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold (In)' | 'Exhale' | 'Hold (Out)'>('Inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = (freq: number) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      // Audio context might be restricted
    }
  };

  useEffect(() => {
    let timer: any;
    if (breathingActive) {
      timer = setInterval(() => {
        setPhaseSecondsLeft((prev) => {
          if (prev <= 1) {
            setBreathPhase((currentPhase) => {
              if (currentPhase === 'Inhale') {
                playTone(440);
                return 'Hold (In)';
              } else if (currentPhase === 'Hold (In)') {
                playTone(330);
                return 'Exhale';
              } else if (currentPhase === 'Exhale') {
                playTone(260);
                return 'Hold (Out)';
              } else {
                playTone(520);
                setCyclesCompleted((c) => c + 1);
                return 'Inhale';
              }
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [breathingActive, soundEnabled]);

  const toggleBreathing = () => {
    if (!breathingActive) {
      setBreathingActive(true);
      playTone(520);
    } else {
      setBreathingActive(false);
      if (cyclesCompleted > 0) {
        onActivityLogged('Box Breathing Exercise', `Completed ${cyclesCompleted} cycles of 4-4-4-4 breathing`, 75);
        onRefreshRecommendations();
      }
    }
  };

  /* ================= 5-4-3-2-1 GROUNDING STATE ================= */
  const groundingSteps = [
    { count: 5, label: t.coping.grounding.see || 'Things you can SEE', hint: 'e.g., your desk, light on the wall, textbook, your shoes, tree outside' },
    { count: 4, label: t.coping.grounding.touch || 'Things you can physically TOUCH / FEEL', hint: 'e.g., your feet against the floor, fabric of your shirt, cool desk' },
    { count: 3, label: t.coping.grounding.hear || 'Things you can HEAR', hint: 'e.g., distant footsteps, fan humming, birds, your own breathing' },
    { count: 2, label: t.coping.grounding.smell || 'Things you can SMELL', hint: 'e.g., notebook paper, coffee, fresh air, hand sanitizer' },
    { count: 1, label: t.coping.grounding.taste || 'Thing you can TASTE or gratitude', hint: 'e.g., mint, water, or gratitude for your courage right now' },
  ];
  const [currentGroundingStep, setCurrentGroundingStep] = useState(0);
  const [groundingInputs, setGroundingInputs] = useState<{ [key: number]: string }>({});

  const handleFinishGrounding = () => {
    onActivityLogged('5-4-3-2-1 Grounding Completed', 'Re-anchored senses to physical surroundings', 70);
    onRefreshRecommendations();
    setCurrentGroundingStep(0);
  };

  /* ================= TEXT JOURNAL STATE ================= */
  const [journalMood, setJournalMood] = useState<MoodType>('Anxious');
  const [journalStressor, setJournalStressor] = useState<StressorCategory>('Exams & Deadlines');
  const [journalText, setJournalText] = useState('');
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const [aiReflection, setAiReflection] = useState('');

  const handleSaveJournal = async () => {
    if (!journalText.trim()) return;
    setIsGeneratingReflection(true);
    try {
      const { reflection } = await fetchJournalReflection({
        content: journalText,
        mood: journalMood,
      });
      setAiReflection(reflection);

      const entry: JournalEntry = {
        id: 'j_' + Date.now(),
        content: journalText,
        mood: journalMood,
        stressors: [journalStressor],
        timestamp: new Date().toISOString(),
        aiReflection: reflection,
      };

      saveJournalEntry(entry);
      onActivityLogged('AI Journal Entry', `Reflected on ${journalStressor} (${journalMood})`, 62);
      onRefreshRecommendations();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  /* ================= VOICE JOURNALING STATE ================= */
  const initialLang = LANGUAGES.find((l) => l.code === activeLangCode) || LANGUAGES[0];
  const [voiceLanguage, setVoiceLanguage] = useState<string>(initialLang.name);

  useEffect(() => {
    const matched = LANGUAGES.find((l) => l.code === activeLangCode);
    if (matched) {
      setVoiceLanguage(matched.name);
    }
  }, [activeLangCode]);
  const [voiceTopic, setVoiceTopic] = useState<string>('Exam stress & study pace');
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded' | 'processing' | 'done'>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceResult, setVoiceResult] = useState<VoiceJournalResult | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [manualSpokenInput, setManualSpokenInput] = useState('');
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  // Voice entries history and summary report states
  const [voiceEntries, setVoiceEntries] = useState<VoiceJournalEntry[]>(() => getVoiceJournalEntries());
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryReport, setSummaryReport] = useState<VoiceSentimentSummaryReport | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [previewingHistoryEntry, setPreviewingHistoryEntry] = useState<VoiceJournalEntry | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const voicePrompts = [
    'Exam stress & study pace',
    'Financial & NSFAS anxiety',
    'Missing home / loneliness in res',
    'Unfiltered stream of thoughts',
    'Daily win & self-gratitude',
  ];

  const startRecording = async () => {
    setMicPermissionError(null);
    setVoiceResult(null);
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordingState('recorded');
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setRecordingState('recording');

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone notice:', err);
      setMicPermissionError('Microphone permission required or active in preview. You can speak or use the reflection box below.');
      setRecordingState('recording');
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      setRecordingState('recorded');
    }
  };

  const resetRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setRecordingState('idle');
    setRecordingSeconds(0);
    setAudioUrl(null);
    setAudioBlob(null);
    setVoiceResult(null);
    setMicPermissionError(null);
    setManualSpokenInput('');
  };

  const handleAnalyzeVoiceJournal = async () => {
    setRecordingState('processing');
    try {
      let base64Audio = '';
      if (audioBlob) {
        base64Audio = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(audioBlob);
        });
      }

      const result = await processVoiceJournal({
        audioBase64: base64Audio,
        mimeType: audioBlob?.type || 'audio/webm',
        language: voiceLanguage,
        topic: voiceTopic,
        spokenText: manualSpokenInput.trim() || undefined,
        durationSeconds: recordingSeconds || 15,
      });

      setVoiceResult(result);
      setRecordingState('done');

      // Save into historical voice journal entries
      const newEntry: VoiceJournalEntry = {
        id: 'v_' + Date.now(),
        transcript: result.transcript,
        sentimentScore: result.sentimentScore,
        detectedMood: result.detectedMood,
        primaryThemes: result.primaryThemes,
        reflection: result.reflection,
        culturalInsight: result.culturalInsight,
        suggestedMicroAction: result.suggestedMicroAction,
        audioDurationSeconds: result.audioDurationSeconds || recordingSeconds || 15,
        language: voiceLanguage,
        topic: voiceTopic,
        timestamp: new Date().toISOString(),
      };
      const updatedEntries = saveVoiceJournalEntry(newEntry);
      setVoiceEntries(updatedEntries);

      onActivityLogged(
        'Voice Journal Reflection',
        `Transcribed: "${result.transcript.slice(0, 60)}..." · (${voiceLanguage})`,
        result.sentimentScore
      );
      onRefreshRecommendations();
    } catch (e) {
      console.error('Failed to process voice reflection:', e);
      setRecordingState('recorded');
    }
  };

  const handleGenerateSummaryReport = async () => {
    setIsGeneratingSummary(true);
    setIsSummaryModalOpen(true);
    try {
      const { report } = await fetchVoiceSummaryReport({
        voiceEntries,
        language: voiceLanguage,
      });
      setSummaryReport(report);
    } catch (err) {
      console.error('Failed to generate voice summary report:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleDeleteVoiceEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteVoiceJournalEntry(id);
    setVoiceEntries(updated);
    if (previewingHistoryEntry?.id === id) {
      setPreviewingHistoryEntry(null);
    }
  };

  const copyTranscript = () => {
    if (voiceResult?.transcript) {
      navigator.clipboard.writeText(voiceResult.transcript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  /* ================= DAILY CHECK-IN STATE ================= */
  const [checkinMood, setCheckinMood] = useState<MoodType>('Neutral');
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [checkinStressor, setCheckinStressor] = useState<StressorCategory>('Exams & Deadlines');
  const [checkinDone, setCheckinDone] = useState(false);

  const handleCompleteCheckin = () => {
    onActivityLogged(
      'Daily Mental Check-In',
      `Mood: ${checkinMood} · Energy: ${energyLevel}/5 · Stress: ${checkinStressor}`,
      checkinMood === 'Great' ? 85 : checkinMood === 'Down' ? 35 : 55
    );
    setCheckinDone(true);
    onRefreshRecommendations();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Tool Navigation Segmented Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-200/80 p-1 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('breathing')}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'breathing'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Wind className="w-4 h-4 text-emerald-600" />
          <span>{t.coping.tabs.breathing || 'Box Breathing'}</span>
        </button>

        <button
          onClick={() => setActiveTab('grounding')}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'grounding'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-600" />
          <span>{t.coping.tabs.grounding || '5-4-3-2-1 Grounding'}</span>
        </button>

        <button
          onClick={() => setActiveTab('voice')}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'voice'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Mic className="w-4 h-4 text-emerald-600" />
          <span className="flex items-center gap-1">
            {t.coping.tabs.voice || 'Voice Journal'}
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </span>
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'journal'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>{t.coping.tabs.journal || 'AI Emotion Journal'}</span>
        </button>

        <button
          onClick={() => setActiveTab('checkin')}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'checkin'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Smile className="w-4 h-4 text-amber-600" />
          <span>{t.coping.tabs.checkin || 'Daily Check-In'}</span>
        </button>
      </div>

      {/* TAB 1: 4-4-4-4 BOX BREATHING */}
      {activeTab === 'breathing' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs text-center space-y-8">
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-slate-900">
              4-4-4-4 Box Breathing Reset
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Inhale 4s · Hold 4s · Exhale 4s · Hold 4s. Used before high-stakes exams and during sudden panic to safely calm your autonomic nervous system.
            </p>
          </div>

          {/* Animated Visualizer Circle */}
          <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
            <div
              className={`absolute inset-0 rounded-full border-4 border-dashed transition-all duration-1000 ${
                breathingActive
                  ? breathPhase === 'Inhale'
                    ? 'border-emerald-500 scale-105'
                    : breathPhase === 'Exhale'
                    ? 'border-slate-800 scale-90'
                    : 'border-amber-500 scale-100'
                  : 'border-slate-200'
              }`}
            />

            <div
              className={`w-48 h-48 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-1000 ${
                breathingActive
                  ? breathPhase === 'Inhale'
                    ? 'bg-emerald-600 scale-110'
                    : breathPhase === 'Hold (In)'
                    ? 'bg-emerald-700 scale-105'
                    : breathPhase === 'Exhale'
                    ? 'bg-slate-900 scale-85'
                    : 'bg-slate-800 scale-90'
                  : 'bg-slate-900'
              }`}
            >
              <span className="text-xs uppercase tracking-widest font-mono font-bold text-emerald-300">
                {breathingActive ? breathPhase : 'Ready'}
              </span>
              <span className="text-4xl font-bold font-mono my-1">
                {breathingActive ? phaseSecondsLeft : '4s'}
              </span>
              <span className="text-[11px] text-slate-300">
                {cyclesCompleted > 0 ? `${cyclesCompleted} cycles finished` : 'Box Rhythm'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleBreathing}
              className={`px-8 py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
                breathingActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {breathingActive ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause & Save Activity</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start 4-4-4-4 Breathing</span>
                </>
              )}
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute audio cues' : 'Enable audio cues'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: 5-4-3-2-1 GROUNDING */}
      {activeTab === 'grounding' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">5-4-3-2-1 Sensory Grounding</h3>
            <p className="text-xs text-slate-600">
              When racing thoughts or anxiety detach you from the moment, sensory grounding anchors you back into physical safety.
            </p>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {groundingSteps.map((step, idx) => (
              <div
                key={step.count}
                onClick={() => setCurrentGroundingStep(idx)}
                className={`flex-1 min-w-[70px] p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                  currentGroundingStep === idx
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                    : idx < currentGroundingStep
                    ? 'border-slate-200 bg-slate-50 text-slate-600'
                    : 'border-slate-100 text-slate-400'
                }`}
              >
                <div className="text-base font-mono font-bold">{step.count}</div>
                <div className="text-[10px] truncate">{step.label.split(' ')[0]}</div>
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg font-mono">
                {groundingSteps[currentGroundingStep].count}
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {groundingSteps[currentGroundingStep].label}
                </h4>
                <p className="text-xs text-slate-600">
                  {groundingSteps[currentGroundingStep].hint}
                </p>
              </div>
            </div>

            <textarea
              rows={3}
              placeholder="Type what you notice right now (optional, or observe quietly in your mind)..."
              value={groundingInputs[currentGroundingStep] || ''}
              onChange={(e) =>
                setGroundingInputs({ ...groundingInputs, [currentGroundingStep]: e.target.value })
              }
              className="w-full p-3 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex justify-between items-center pt-2">
              <button
                disabled={currentGroundingStep === 0}
                onClick={() => setCurrentGroundingStep((s) => s - 1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
              >
                Previous Step
              </button>

              {currentGroundingStep < groundingSteps.length - 1 ? (
                <button
                  onClick={() => setCurrentGroundingStep((s) => s + 1)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Next Step ({groundingSteps[currentGroundingStep + 1].count})
                </button>
              ) : (
                <button
                  onClick={handleFinishGrounding}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Complete Grounding Session
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VOICE JOURNALING */}
      {activeTab === 'voice' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">Multilingual Voice Journaling</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Voice Telemetry
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200">
                  {voiceEntries.length} Voice Logs
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                Speak freely in your mother tongue. Transcribe your voice, measure emotional sentiment, and generate AI speech pattern summary reports.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Summary Report Trigger Button */}
              <button
                onClick={handleGenerateSummaryReport}
                disabled={isGeneratingSummary}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
                <span>{isGeneratingSummary ? 'Analyzing...' : 'AI Sentiment Report'}</span>
              </button>

              {/* Language Selection */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <Languages className="w-3.5 h-3.5 text-emerald-600" />
                <select
                  value={voiceLanguage}
                  onChange={(e) => setVoiceLanguage(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.name}>
                      {lang.name} ({lang.nativeName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick AI Summary & Telemetry Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                    Speech Sentiment Longitudinal Analytics
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.2 rounded-full border border-emerald-200">
                    {voiceEntries.length > 0
                      ? `${voiceEntries.length} Recorded Entries`
                      : 'Awaiting Recordings'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800/90 leading-tight">
                  Track recurring themes, verbal catharsis, and emotional trajectory across your campus semester.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistoryDrawer((s) => !s)}
                className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-900 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Voice History ({voiceEntries.length})</span>
                {showHistoryDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleGenerateSummaryReport}
                disabled={isGeneratingSummary}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Generate Summary Report</span>
              </button>
            </div>
          </div>

          {/* Historical Voice Entries Drawer */}
          {showHistoryDrawer && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800">
                    Recent Voice Journal Recordings ({voiceEntries.length})
                  </h4>
                </div>
                <button
                  onClick={handleGenerateSummaryReport}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run AI Sentiment Analysis on History</span>
                </button>
              </div>

              {voiceEntries.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No voice reflections recorded yet. Record your first voice log above!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {voiceEntries.map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => setPreviewingHistoryEntry(previewingHistoryEntry?.id === entry.id ? null : entry)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2 ${
                        previewingHistoryEntry?.id === entry.id
                          ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-800 truncate max-w-[160px]">
                              {entry.topic}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                              {entry.language}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(entry.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
                            {entry.sentimentScore}%
                          </span>
                          <button
                            onClick={(e) => handleDeleteVoiceEntry(entry.id, e)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 line-clamp-2 italic">
                        "{entry.transcript}"
                      </p>

                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {entry.detectedMood}
                        </span>
                        {entry.primaryThemes?.slice(0, 2).map((t, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800">
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Expanded entry inspection */}
                      {previewingHistoryEntry?.id === entry.id && (
                        <div className="pt-3 mt-2 border-t border-emerald-200/80 space-y-2 text-xs text-slate-800">
                          <div className="p-2.5 rounded-lg bg-white border border-emerald-200/60">
                            <span className="font-bold text-slate-700 block mb-0.5">AI Companion Reflection:</span>
                            <p className="text-slate-600 text-[11px] leading-relaxed">{entry.reflection}</p>
                          </div>
                          {entry.culturalInsight && (
                            <div className="text-[11px] text-amber-900 italic flex items-start gap-1.5">
                              <Sparkles className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                              <span>{entry.culturalInsight}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Topic Prompts */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Choose a reflection prompt (or speak freely):
            </label>
            <div className="flex flex-wrap gap-2">
              {voicePrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => setVoiceTopic(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    voiceTopic === p
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Recorder Stage */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 text-center space-y-6 relative overflow-hidden border border-slate-800">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-center gap-2 text-xs font-mono">
                {recordingState === 'recording' ? (
                  <span className="flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Recording in {voiceLanguage}... ({recordingSeconds}s)
                  </span>
                ) : recordingState === 'recorded' ? (
                  <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Audio Recorded ({recordingSeconds}s) · Ready for Analysis
                  </span>
                ) : recordingState === 'processing' ? (
                  <span className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    Transcribing & analyzing sentiment...
                  </span>
                ) : recordingState === 'done' ? (
                  <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Transcription & Sentiment Analysis Complete
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    Tap microphone to record your spoken reflection
                  </span>
                )}
              </div>

              {/* Wave & Mic Button */}
              <div className="py-2 flex flex-col items-center justify-center gap-4">
                {recordingState === 'recording' && (
                  <div className="flex items-center justify-center gap-1.5 h-12">
                    {[16, 28, 44, 22, 36, 48, 20, 40, 32, 18, 42, 26].map((h, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-emerald-400 rounded-full animate-bounce"
                        style={{
                          height: `${Math.max(12, h + (i % 3) * 6)}px`,
                          animationDelay: `${i * 80}ms`,
                          animationDuration: '600ms',
                        }}
                      />
                    ))}
                  </div>
                )}

                <button
                  onClick={
                    recordingState === 'idle'
                      ? startRecording
                      : recordingState === 'recording'
                      ? stopRecording
                      : startRecording
                  }
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer ${
                    recordingState === 'recording'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white scale-105'
                      : recordingState === 'recorded' || recordingState === 'done'
                      ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105'
                  }`}
                >
                  {recordingState === 'recording' ? (
                    <Square className="w-7 h-7 fill-current" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>

                <div className="text-xs text-slate-300 font-medium">
                  {recordingState === 'recording'
                    ? 'Tap to Stop Recording'
                    : recordingState === 'recorded'
                    ? 'Tap to Re-record'
                    : 'Tap to Record Spoken Reflection'}
                </div>
              </div>

              {/* Audio Playback */}
              {audioUrl && (
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 max-w-md mx-auto">
                  <audio
                    ref={audioPreviewRef}
                    src={audioUrl}
                    controls
                    className="w-full h-8 accent-emerald-500"
                  />
                  <button
                    onClick={resetRecording}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    title="Reset Audio"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Fallback Input */}
              {micPermissionError && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200 text-left space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <MicOff className="w-4 h-4 text-amber-400" />
                    <span>Microphone Notice</span>
                  </div>
                  <p>{micPermissionError}</p>
                  <input
                    type="text"
                    placeholder="Or type what you would speak in your voice reflection..."
                    value={manualSpokenInput}
                    onChange={(e) => setManualSpokenInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 rounded-lg text-xs text-white border border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleAnalyzeVoiceJournal}
                  disabled={recordingState === 'recording' || recordingState === 'processing'}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Brain className="w-4 h-4" />
                  <span>
                    {recordingState === 'processing'
                      ? 'Transcribing & Analyzing...'
                      : 'Transcribe & Generate Insights'}
                  </span>
                </button>

                {recordingState !== 'idle' && (
                  <button
                    onClick={resetRecording}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                  >
                    Start New Voice Log
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Display */}
          {voiceResult && (
            <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Voice Telemetry & Reflection
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Language: {voiceLanguage} · Topic: {voiceTopic}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Sentiment: <span className="font-mono text-emerald-600">{voiceResult.sentimentScore}%</span>
                  </span>
                </div>
              </div>

              {/* Transcript */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <MessageSquareQuote className="w-4 h-4 text-emerald-600" />
                    Spoken Transcript
                  </span>
                  <button
                    onClick={copyTranscript}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTranscript ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{voiceResult.transcript}"
                </p>
              </div>

              {/* State & Themes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-500 block">Detected Emotional State</span>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                      {voiceResult.detectedMood}
                    </span>
                    <span className="text-xs text-slate-500">
                      {voiceResult.sentimentScore >= 70
                        ? 'Grounded & Optimistic'
                        : voiceResult.sentimentScore >= 45
                        ? 'Mild Stress & Processing'
                        : 'Elevated Strain & Fatigue'}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-500 block">Primary Life Themes</span>
                  <div className="flex flex-wrap gap-1.5">
                    {voiceResult.primaryThemes.map((theme, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reflection Card */}
              <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <HeartHandshake className="w-4 h-4" />
                  <span>AI Wellness Companion Reflection</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {voiceResult.reflection}
                </p>
                {voiceResult.culturalInsight && (
                  <div className="pt-3 border-t border-slate-800 text-xs text-amber-300/90 italic flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{voiceResult.culturalInsight}</span>
                  </div>
                )}
              </div>

              {/* Micro-Action */}
              {voiceResult.suggestedMicroAction && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-emerald-950">Recommended 2-Minute Coping Action</h5>
                      <p className="text-xs text-emerald-800">{voiceResult.suggestedMicroAction}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('breathing')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shrink-0 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Practice Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TEXT EMOTION JOURNAL */}
      {activeTab === 'journal' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">AI Reflective Emotion Journal</h3>
            <p className="text-xs text-slate-600 mt-1">
              Write out your unfiltered thoughts. Receive validating, culturally grounded insights and gentle micro-actions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">How are you feeling?</label>
              <select
                value={journalMood}
                onChange={(e) => setJournalMood(e.target.value as MoodType)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              >
                <option value="Anxious">Anxious / Nervous</option>
                <option value="Overwhelmed">Overwhelmed / Burdened</option>
                <option value="Down">Down / Sad</option>
                <option value="Neutral">Neutral / Floating</option>
                <option value="Hopeful">Hopeful / Determined</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Area</label>
              <select
                value={journalStressor}
                onChange={(e) => setJournalStressor(e.target.value as StressorCategory)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              >
                {STRESSORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Your Thoughts (Unfiltered & Safe)</label>
            <textarea
              rows={5}
              placeholder="Write anything on your mind... exam pressure, missing home, feeling stuck, or small wins..."
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              className="w-full p-4 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          <button
            onClick={handleSaveJournal}
            disabled={!journalText.trim() || isGeneratingReflection}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            {isGeneratingReflection ? 'Composing supportive reflection...' : 'Save & Get Supportive Reflection'}
          </button>

          {aiReflection && (
            <div className="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <Sparkles className="w-4 h-4" />
                <span>Supportive Reflection & Grounding</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed italic">
                "{aiReflection}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DAILY CHECK-IN */}
      {activeTab === 'checkin' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Daily 30-Second Mental Check-In</h3>
            <p className="text-xs text-slate-600">
              Logging daily mood builds steady emotional awareness and refines your personalized recommendations.
            </p>
          </div>

          {checkinDone ? (
            <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Daily Check-in Logged!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Your activity history and personalized recommendations have been updated.
              </p>
              <button
                onClick={() => setCheckinDone(false)}
                className="text-xs font-bold text-emerald-700 underline pt-2 cursor-pointer"
              >
                Log another update
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Overall Mood Today</label>
                <div className="flex flex-wrap gap-2">
                  {(['Great', 'Good', 'Neutral', 'Anxious', 'Stressed', 'Down', 'Overwhelmed'] as MoodType[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setCheckinMood(m)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        checkinMood === m
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>Physical Energy Level</span>
                  <span className="font-mono text-emerald-600">{energyLevel} / 5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>1: Drained</span>
                  <span>3: Moderate</span>
                  <span>5: Energized</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Biggest Stress Factor Right Now</label>
                <select
                  value={checkinStressor}
                  onChange={(e) => setCheckinStressor(e.target.value as StressorCategory)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                >
                  {STRESSORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCompleteCheckin}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Save Today's Check-In
              </button>
            </div>
          )}
        </div>
      )}

      {/* Voice Speech Sentiment Summary Report Modal */}
      <VoiceSummaryReportModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        report={summaryReport}
        isLoading={isGeneratingSummary}
        onRegenerate={handleGenerateSummaryReport}
        voiceEntries={voiceEntries}
        onOpenTool={(tool) => setActiveTab(tool as any)}
      />
    </div>
  );
};
