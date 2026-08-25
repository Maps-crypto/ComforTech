import React, { useState, useEffect, useRef } from 'react';
import { STRESSORS, LANGUAGES } from '../data/mockData';
import { fetchJournalReflection, processVoiceJournal } from '../services/api';
import { saveJournalEntry } from '../services/storage';
import { JournalEntry, MoodType, StressorCategory, UserProfile, VoiceJournalResult } from '../types';
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
  TrendingUp,
  BrainCircuit,
  MessageSquareQuote
} from 'lucide-react';

interface CopingToolsProps {
  userProfile: UserProfile;
  initialTab?: 'breathing' | 'grounding' | 'journal' | 'voice' | 'checkin';
  onActivityLogged: (title: string, desc: string, score?: number) => void;
  onRefreshRecommendations: () => void;
}

export const CopingTools: React.FC<CopingToolsProps> = ({
  userProfile,
  initialTab = 'breathing',
  onActivityLogged,
  onRefreshRecommendations,
}) => {
  const [activeTab, setActiveTab] = useState<'breathing' | 'grounding' | 'journal' | 'voice' | 'checkin'>(initialTab);

  // Sync if initialTab changes
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
    { count: 5, label: 'Things you can SEE', hint: 'e.g. your desk, the window, a pen, light reflection, shoes' },
    { count: 4, label: 'Things you can physically TOUCH / FEEL', hint: 'e.g. texture of your clothes, cool table, your feet on the ground' },
    { count: 3, label: 'Things you can HEAR', hint: 'e.g. birds outside, fridge hum, distant traffic, your own breath' },
    { count: 2, label: 'Things you can SMELL', hint: 'e.g. coffee, fresh air, notebook paper, soap' },
    { count: 1, label: 'Thing you can TASTE or one genuine blessing', hint: 'e.g. mint, water, or gratitude for your breath right now' },
  ];
  const [currentGroundingStep, setCurrentGroundingStep] = useState(0);
  const [groundingInputs, setGroundingInputs] = useState<{ [key: number]: string }>({});

  const handleFinishGrounding = () => {
    onActivityLogged('5-4-3-2-1 Grounding Completed', 'Re-anchored senses to physical surroundings', 70);
    onRefreshRecommendations();
    alert('Grounding complete! Notice the stillness in your nervous system.');
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

  /* ================= VOICE JOURNALING (VULAVULA) STATE ================= */
  const [voiceLanguage, setVoiceLanguage] = useState<string>('English');
  const [voiceTopic, setVoiceTopic] = useState<string>('Exam stress & study pace');
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded' | 'processing' | 'done'>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceResult, setVoiceResult] = useState<VoiceJournalResult | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [manualSpokenInput, setManualSpokenInput] = useState('');
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const voicePrompts = [
    'Exam stress & study pace',
    'Financial & NSFAS anxiety',
    'Missing home / loneliness',
    'Unfiltered stream of thoughts',
    'Daily win & self-gratitude',
  ];

  // Start voice recording
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

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setRecordingState('recording');

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone error:', err);
      setMicPermissionError('Microphone permission needed or preview mode active. You can speak or use our audio reflection input below.');
      // Allow fallback simulation
      setRecordingState('recording');
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1);
      }, 1000);
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback state if simulated
      setRecordingState('recorded');
    }
  };

  // Reset recording
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

  // Process and analyze with Vulavula
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

      // Auto-log to activity history & trigger recommendations
      onActivityLogged(
        'Voice Journal Reflection',
        `Vulavula Transcribed: "${result.transcript.slice(0, 60)}..." · (${voiceLanguage})`,
        result.sentimentScore
      );
      onRefreshRecommendations();
    } catch (e) {
      console.error('Failed to process voice reflection:', e);
      setRecordingState('recorded');
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
      {/* Tool Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#e8e0d0]/50 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveTab('breathing')}
          className={`py-3 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'breathing'
              ? 'bg-[#212b4a] text-white shadow-xs'
              : 'text-[#5c574c] hover:bg-[#e8e0d0]'
          }`}
        >
          <Wind className="w-4 h-4 text-[#4f7c6f]" />
          <span>Box Breathing</span>
        </button>

        <button
          onClick={() => setActiveTab('grounding')}
          className={`py-3 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'grounding'
              ? 'bg-[#212b4a] text-white shadow-xs'
              : 'text-[#5c574c] hover:bg-[#e8e0d0]'
          }`}
        >
          <Zap className="w-4 h-4 text-[#e8a33d]" />
          <span>5-4-3-2-1 Grounding</span>
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`py-3 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'journal'
              ? 'bg-[#212b4a] text-white shadow-xs'
              : 'text-[#5c574c] hover:bg-[#e8e0d0]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#4f7c6f]" />
          <span>AI Mood Journal</span>
        </button>

        <button
          onClick={() => setActiveTab('voice')}
          className={`py-3 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
            activeTab === 'voice'
              ? 'bg-[#212b4a] text-white shadow-xs'
              : 'text-[#5c574c] hover:bg-[#e8e0d0]'
          }`}
        >
          <Mic className="w-4 h-4 text-emerald-400" />
          <span className="flex items-center gap-1">
            Voice Journal
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        </button>

        <button
          onClick={() => setActiveTab('checkin')}
          className={`py-3 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'checkin'
              ? 'bg-[#212b4a] text-white shadow-xs'
              : 'text-[#5c574c] hover:bg-[#e8e0d0]'
          }`}
        >
          <Smile className="w-4 h-4 text-[#e8a33d]" />
          <span>Daily Check-In</span>
        </button>
      </div>

      {/* TAB 1: BOX BREATHING */}
      {activeTab === 'breathing' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#e8e0d0] shadow-sm text-center space-y-8">
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-[#1c1a16] font-sans">
              4-4-4-4 Box Breathing Reset
            </h3>
            <p className="text-xs text-[#5c574c] leading-relaxed">
              Used by emergency responders and students before high-stakes exams to instantly reduce sympathetic nervous system overdrive.
            </p>
          </div>

          {/* Animated Visualizer Circle */}
          <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
            {/* Outer Ring */}
            <div
              className={`absolute inset-0 rounded-full border-4 border-dashed transition-all duration-1000 ${
                breathingActive
                  ? breathPhase === 'Inhale'
                    ? 'border-[#4f7c6f] scale-105'
                    : breathPhase === 'Exhale'
                    ? 'border-[#212b4a] scale-90'
                    : 'border-[#e8a33d] scale-100'
                  : 'border-[#e8e0d0]'
              }`}
            />

            {/* Inner Expanding/Contracting Blob */}
            <div
              className={`w-48 h-48 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-1000 ${
                breathingActive
                  ? breathPhase === 'Inhale'
                    ? 'bg-[#4f7c6f] scale-110'
                    : breathPhase === 'Hold (In)'
                    ? 'bg-[#3a5d53] scale-105'
                    : breathPhase === 'Exhale'
                    ? 'bg-[#212b4a] scale-80'
                    : 'bg-[#161d34] scale-85'
                  : 'bg-[#212b4a]'
              }`}
            >
              <span className="text-xs uppercase tracking-widest font-mono font-bold text-[#e8a33d]">
                {breathingActive ? breathPhase : 'Ready'}
              </span>
              <span className="text-4xl font-bold font-mono my-1">
                {breathingActive ? phaseSecondsLeft : '4s'}
              </span>
              <span className="text-[11px] text-[#b9c0d6]">
                {cyclesCompleted > 0 ? `${cyclesCompleted} cycles` : 'Box Rhythm'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleBreathing}
              className={`px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                breathingActive
                  ? 'bg-[#c3503b] hover:bg-[#b0432f] text-white'
                  : 'bg-[#4f7c6f] hover:bg-[#3a5d53] text-white'
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
              className="p-3.5 rounded-2xl border border-[#e8e0d0] hover:bg-[#f3eee4] text-[#5c574c] transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute tone' : 'Enable tone'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#4f7c6f]" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: 5-4-3-2-1 GROUNDING */}
      {activeTab === 'grounding' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8e0d0] shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[#1c1a16]">5-4-3-2-1 Sensory Grounding</h3>
            <p className="text-xs text-[#5c574c]">
              When thoughts spiral or you experience panic, sensory grounding brings your focus safely back to the room.
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
                    ? 'border-[#4f7c6f] bg-[#4f7c6f]/10 text-[#4f7c6f] font-bold'
                    : idx < currentGroundingStep
                    ? 'border-[#e8e0d0] bg-[#f3eee4] text-[#5c574c]'
                    : 'border-[#f3eee4] text-[#8a8578]'
                }`}
              >
                <div className="text-base font-mono font-bold">{step.count}</div>
                <div className="text-[10px] truncate">{step.label.split(' ')[0]}</div>
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="p-6 bg-[#f3eee4] rounded-2xl border border-[#e8e0d0] space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#212b4a] text-white flex items-center justify-center font-bold text-lg font-mono">
                {groundingSteps[currentGroundingStep].count}
              </span>
              <div>
                <h4 className="text-sm font-bold text-[#1c1a16]">
                  {groundingSteps[currentGroundingStep].label}
                </h4>
                <p className="text-xs text-[#5c574c]">
                  {groundingSteps[currentGroundingStep].hint}
                </p>
              </div>
            </div>

            <textarea
              rows={3}
              placeholder="Type what you notice right now (optional, or just observe quietly in your mind)..."
              value={groundingInputs[currentGroundingStep] || ''}
              onChange={(e) =>
                setGroundingInputs({ ...groundingInputs, [currentGroundingStep]: e.target.value })
              }
              className="w-full p-3 text-xs bg-white rounded-xl border border-[#e8e0d0] focus:outline-none focus:ring-2 focus:ring-[#4f7c6f]"
            />

            <div className="flex justify-between items-center pt-2">
              <button
                disabled={currentGroundingStep === 0}
                onClick={() => setCurrentGroundingStep((s) => s - 1)}
                className="px-4 py-2 text-xs font-semibold text-[#5c574c] hover:text-[#1c1a16] disabled:opacity-30 cursor-pointer"
              >
                Previous Step
              </button>

              {currentGroundingStep < groundingSteps.length - 1 ? (
                <button
                  onClick={() => setCurrentGroundingStep((s) => s + 1)}
                  className="px-5 py-2.5 bg-[#4f7c6f] hover:bg-[#3a5d53] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Next Step ({groundingSteps[currentGroundingStep + 1].count})
                </button>
              ) : (
                <button
                  onClick={handleFinishGrounding}
                  className="px-5 py-2.5 bg-[#e8a33d] hover:bg-[#c9822a] text-[#1c1a16] text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Complete Grounding Session
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEXT EMOTION JOURNAL */}
      {activeTab === 'journal' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8e0d0] shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold text-[#1c1a16]">AI Reflective Emotion Journal</h3>
            <p className="text-xs text-[#5c574c] mt-1">
              Write out your raw thoughts and feelings. Our AI wellness engine generates validating, culturally grounded insights and gentle micro-actions.
            </p>
          </div>

          {/* Tags Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1c1a16] mb-1.5">How are you feeling?</label>
              <select
                value={journalMood}
                onChange={(e) => setJournalMood(e.target.value as MoodType)}
                className="w-full p-2.5 text-xs rounded-xl border border-[#e8e0d0] bg-[#f3eee4]/50 focus:bg-white"
              >
                <option value="Anxious">Anxious / Nervous</option>
                <option value="Overwhelmed">Overwhelmed / Burdened</option>
                <option value="Down">Down / Sad</option>
                <option value="Neutral">Neutral / Floating</option>
                <option value="Hopeful">Hopeful / Determined</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1c1a16] mb-1.5">Primary Area</label>
              <select
                value={journalStressor}
                onChange={(e) => setJournalStressor(e.target.value as StressorCategory)}
                className="w-full p-2.5 text-xs rounded-xl border border-[#e8e0d0] bg-[#f3eee4]/50 focus:bg-white"
              >
                {STRESSORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Writing Area */}
          <div>
            <label className="block text-xs font-bold text-[#1c1a16] mb-1.5">Your Thoughts (Unfiltered & Safe)</label>
            <textarea
              rows={5}
              placeholder="Write anything on your mind... exam pressure, missing home, feeling stuck, or small wins..."
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              className="w-full p-4 text-xs sm:text-sm rounded-xl border border-[#e8e0d0] bg-[#f3eee4]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4f7c6f] leading-relaxed"
            />
          </div>

          <button
            onClick={handleSaveJournal}
            disabled={!journalText.trim() || isGeneratingReflection}
            className="w-full py-3 bg-[#212b4a] hover:bg-[#161d34] disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#e8a33d]" />
            {isGeneratingReflection ? 'AI is generating reflection...' : 'Save & Get AI Reflection'}
          </button>

          {/* AI Reflection Result */}
          {aiReflection && (
            <div className="p-5 bg-gradient-to-br from-[#f3eee4] to-[#e8e0d0] rounded-2xl border border-[#e8e0d0] space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4f7c6f]">
                <Sparkles className="w-4 h-4" />
                <span>AI Reflection & Comfort</span>
              </div>
              <p className="text-xs sm:text-sm text-[#1c1a16] leading-relaxed italic">
                "{aiReflection}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VOICE JOURNALING (VULAVULA STT & SENTIMENT ANALYSIS) */}
      {activeTab === 'voice' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8e0d0] shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 pb-2 border-b border-[#e8e0d0]/60">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[#1c1a16]">Voice Journaling</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <BrainCircuit className="w-3 h-3 text-emerald-600" />
                  Vulavula Speech & Sentiment
                </span>
              </div>
              <p className="text-xs text-[#5c574c] mt-1 max-w-xl">
                Speak freely in your mother tongue. Vulavula transcribes your voice, gauges your real-time emotional telemetry, and generates grounding affirmations.
              </p>
            </div>

            {/* Language Selection */}
            <div className="flex items-center gap-2 bg-[#f3eee4] p-1.5 rounded-xl border border-[#e8e0d0]">
              <Languages className="w-3.5 h-3.5 text-[#4f7c6f]" />
              <select
                value={voiceLanguage}
                onChange={(e) => setVoiceLanguage(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#1c1a16] focus:outline-none cursor-pointer"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.name}>
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic / Prompt Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#1c1a16]">
              Choose a voice reflection prompt (or speak freely):
            </label>
            <div className="flex flex-wrap gap-2">
              {voicePrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => setVoiceTopic(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    voiceTopic === p
                      ? 'bg-[#212b4a] text-white border-[#212b4a] shadow-xs font-semibold'
                      : 'bg-[#f3eee4]/60 text-[#5c574c] border-[#e8e0d0] hover:bg-[#e8e0d0]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Recorder Center Stage */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 text-center space-y-6 relative overflow-hidden border border-slate-800">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              {/* Status Header */}
              <div className="flex items-center justify-center gap-2 text-xs font-mono">
                {recordingState === 'recording' ? (
                  <span className="flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Recording in {voiceLanguage}... ({recordingSeconds}s)
                  </span>
                ) : recordingState === 'recorded' ? (
                  <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Audio Recorded ({recordingSeconds}s) · Ready for Vulavula
                  </span>
                ) : recordingState === 'processing' ? (
                  <span className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full animate-pulse">
                    <BrainCircuit className="w-3.5 h-3.5 animate-spin" />
                    Vulavula is transcribing & analyzing sentiment...
                  </span>
                ) : recordingState === 'done' ? (
                  <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Transcription & Sentiment Analysis Complete
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    Tap microphone and speak your unfiltered reflection
                  </span>
                )}
              </div>

              {/* Dynamic Sound Wave & Microphone Button */}
              <div className="py-2 flex flex-col items-center justify-center gap-4">
                {/* Wave Bars */}
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

                {/* Big Mic Button */}
                <div className="relative">
                  {recordingState === 'recording' && (
                    <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
                  )}
                  <button
                    onClick={
                      recordingState === 'idle'
                        ? startRecording
                        : recordingState === 'recording'
                        ? stopRecording
                        : startRecording
                    }
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer relative z-10 ${
                      recordingState === 'recording'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white scale-105'
                        : recordingState === 'recorded' || recordingState === 'done'
                        ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
                        : 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white hover:scale-105'
                    }`}
                  >
                    {recordingState === 'recording' ? (
                      <Square className="w-8 h-8 fill-current" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </button>
                </div>

                <div className="text-xs text-slate-300 font-medium">
                  {recordingState === 'recording'
                    ? 'Tap to Stop Recording'
                    : recordingState === 'recorded'
                    ? 'Tap to Re-record'
                    : 'Tap to Record Spoken Reflection'}
                </div>
              </div>

              {/* Audio Playback & Actions */}
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

              {/* Mic permission helper or text fallback */}
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
                  <BrainCircuit className="w-4 h-4" />
                  <span>
                    {recordingState === 'processing'
                      ? 'Vulavula Transcribing & Analyzing...'
                      : 'Transcribe & Analyze with Vulavula'}
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

          {/* VULAVULA TRANSCRIPTION & SENTIMENT RESULTS */}
          {voiceResult && (
            <div className="bg-[#f3eee4] rounded-3xl p-6 sm:p-8 border border-[#e8e0d0] space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#e8e0d0]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#212b4a] text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1c1a16]">
                      Vulavula Voice Telemetry & Reflection
                    </h4>
                    <span className="text-[11px] text-[#5c574c]">
                      Language: {voiceLanguage} · Topic: {voiceTopic}
                    </span>
                  </div>
                </div>

                {/* Sentiment Gauge Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#e8e0d0] shadow-xs">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-[#1c1a16]">
                    Sentiment Index: <span className="font-mono text-emerald-600">{voiceResult.sentimentScore}%</span>
                  </span>
                </div>
              </div>

              {/* Transcription Card */}
              <div className="bg-white rounded-2xl p-5 border border-[#e8e0d0] shadow-xs space-y-2 relative">
                <div className="flex items-center justify-between text-xs text-[#5c574c]">
                  <span className="font-bold text-[#212b4a] flex items-center gap-1.5">
                    <MessageSquareQuote className="w-4 h-4 text-[#4f7c6f]" />
                    Vulavula Spoken Transcript
                  </span>
                  <button
                    onClick={copyTranscript}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#4f7c6f] hover:text-[#3a5d53] cursor-pointer"
                  >
                    {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTranscript ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-[#1c1a16] leading-relaxed font-sans italic bg-[#f3eee4]/30 p-3 rounded-xl border border-[#e8e0d0]/50">
                  "{voiceResult.transcript}"
                </p>
              </div>

              {/* Detected Themes & Emotional State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-[#e8e0d0] space-y-2">
                  <span className="text-xs font-bold text-[#5c574c] block">Detected Emotional State</span>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                      {voiceResult.detectedMood}
                    </span>
                    <span className="text-xs text-[#5c574c]">
                      {voiceResult.sentimentScore >= 70
                        ? 'Grounded & Optimistic'
                        : voiceResult.sentimentScore >= 45
                        ? 'Mild Stress & Processing'
                        : 'Elevated Strain & Fatigue'}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[#e8e0d0] space-y-2">
                  <span className="text-xs font-bold text-[#5c574c] block">Primary Life Themes</span>
                  <div className="flex flex-wrap gap-1.5">
                    {voiceResult.primaryThemes.map((theme, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-md bg-[#f3eee4] text-[#1c1a16] text-[11px] font-medium border border-[#e8e0d0]"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Reflection & Guidance */}
              <div className="p-5 bg-gradient-to-br from-[#212b4a] to-[#161d34] text-white rounded-2xl shadow-md space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <HeartHandshake className="w-4 h-4" />
                  <span>AI Wellness Companion Reflection</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans">
                  {voiceResult.reflection}
                </p>

                {/* Cultural / Ubuntu Wisdom */}
                {voiceResult.culturalInsight && (
                  <div className="pt-3 border-t border-slate-700/60 text-xs text-amber-300/90 italic flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{voiceResult.culturalInsight}</span>
                  </div>
                )}
              </div>

              {/* Actionable Micro-Step */}
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

      {/* TAB 5: DAILY CHECK-IN */}
      {activeTab === 'checkin' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8e0d0] shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold text-[#1c1a16]">Daily 30-Second Mental Check-In</h3>
            <p className="text-xs text-[#5c574c]">
              Logging your daily mood builds long-term self-awareness and tunes your real-time AI recommendations.
            </p>
          </div>

          {checkinDone ? (
            <div className="p-8 text-center bg-[#4f7c6f]/10 border border-[#4f7c6f]/30 rounded-2xl space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#4f7c6f] mx-auto" />
              <h4 className="text-sm font-bold text-[#1c1a16]">Daily Check-in Logged!</h4>
              <p className="text-xs text-[#5c574c] max-w-sm mx-auto">
                Your activity radar and recommendations have been recalculated for today.
              </p>
              <button
                onClick={() => setCheckinDone(false)}
                className="text-xs font-bold text-[#4f7c6f] underline pt-2 cursor-pointer"
              >
                Log another update
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Mood Selector Chips */}
              <div>
                <label className="block text-xs font-bold text-[#1c1a16] mb-2">Overall Mood Today</label>
                <div className="flex flex-wrap gap-2">
                  {(['Great', 'Good', 'Neutral', 'Anxious', 'Stressed', 'Down', 'Overwhelmed'] as MoodType[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setCheckinMood(m)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        checkinMood === m
                          ? 'bg-[#212b4a] text-white border-[#212b4a] shadow-xs'
                          : 'bg-[#f3eee4] text-[#1c1a16] border-[#e8e0d0] hover:bg-[#e8e0d0]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Level Slider */}
              <div>
                <div className="flex justify-between text-xs font-bold text-[#1c1a16] mb-2">
                  <span>Physical Energy Level</span>
                  <span className="font-mono text-[#4f7c6f]">{energyLevel} / 5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                  className="w-full accent-[#4f7c6f] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#8a8578] mt-1">
                  <span>1: Drained</span>
                  <span>3: Moderate</span>
                  <span>5: Energized</span>
                </div>
              </div>

              {/* Stressor Category */}
              <div>
                <label className="block text-xs font-bold text-[#1c1a16] mb-2">Biggest Stress Factor Right Now</label>
                <select
                  value={checkinStressor}
                  onChange={(e) => setCheckinStressor(e.target.value as StressorCategory)}
                  className="w-full p-3 text-xs rounded-xl border border-[#e8e0d0] bg-[#f3eee4]/60 focus:bg-white"
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
                className="w-full py-3.5 bg-[#4f7c6f] hover:bg-[#3a5d53] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                Save Today's Check-In
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
