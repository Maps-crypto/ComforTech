import React, { useState, useEffect, useRef } from 'react';
import { STRESSORS } from '../data/mockData';
import { fetchJournalReflection } from '../services/api';
import { saveJournalEntry } from '../services/storage';
import { JournalEntry, MoodType, StressorCategory, UserProfile } from '../types';
import { Wind, Zap, BookOpen, Smile, Sparkles, CheckCircle2, Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface CopingToolsProps {
  userProfile: UserProfile;
  initialTab?: 'breathing' | 'grounding' | 'journal' | 'checkin';
  onActivityLogged: (title: string, desc: string, score?: number) => void;
  onRefreshRecommendations: () => void;
}

export const CopingTools: React.FC<CopingToolsProps> = ({
  userProfile,
  initialTab = 'breathing',
  onActivityLogged,
  onRefreshRecommendations,
}) => {
  const [activeTab, setActiveTab] = useState<'breathing' | 'grounding' | 'journal' | 'checkin'>(initialTab);

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
            // switch phase
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

  /* ================= JOURNAL STATE ================= */
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
      onActivityLogged('Lelapa AI Journal Entry', `Reflected on ${journalStressor} (${journalMood})`, 60);
      onRefreshRecommendations();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingReflection(false);
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#e8e0d0]/50 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveTab('breathing')}
          className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'breathing'
              ? 'bg-[#212b4a] text-white shadow-sm'
              : 'text-[#5c574c] hover:bg-[#e8e0d0]'
          }`}
        >
          <Wind className="w-4 h-4 text-[#4f7c6f]" />
          <span>Box Breathing</span>
        </button>

        <button
          onClick={() => setActiveTab('grounding')}
          className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'grounding'
              ? 'bg-[#212b4a] text-white shadow-sm'
              : 'text-[#5c574c] hover:bg-[#e8e0d0]'
          }`}
        >
          <Zap className="w-4 h-4 text-[#e8a33d]" />
          <span>5-4-3-2-1 Grounding</span>
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'journal'
              ? 'bg-[#212b4a] text-white shadow-sm'
              : 'text-[#5c574c] hover:bg-[#e8e0d0]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#4f7c6f]" />
          <span>AI Mood Journal</span>
        </button>

        <button
          onClick={() => setActiveTab('checkin')}
          className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'checkin'
              ? 'bg-[#212b4a] text-white shadow-sm'
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
              className={`px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${
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
              className="p-3.5 rounded-2xl border border-[#e8e0d0] hover:bg-[#f3eee4] text-[#5c574c] transition-colors"
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
                className="px-4 py-2 text-xs font-semibold text-[#5c574c] hover:text-[#1c1a16] disabled:opacity-30"
              >
                Previous Step
              </button>

              {currentGroundingStep < groundingSteps.length - 1 ? (
                <button
                  onClick={() => setCurrentGroundingStep((s) => s + 1)}
                  className="px-5 py-2.5 bg-[#4f7c6f] hover:bg-[#3a5d53] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Next Step ({groundingSteps[currentGroundingStep + 1].count})
                </button>
              ) : (
                <button
                  onClick={handleFinishGrounding}
                  className="px-5 py-2.5 bg-[#e8a33d] hover:bg-[#c9822a] text-[#1c1a16] text-xs font-bold rounded-xl shadow-xs"
                >
                  Complete Grounding Session
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LELAPA AI MOOD JOURNAL */}
      {activeTab === 'journal' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8e0d0] shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold text-[#1c1a16]">Lelapa AI Reflective Emotion Journal</h3>
            <p className="text-xs text-[#5c574c]">
              Write out your raw feelings. Lelapa AI's InkubaLM engine generates validating, culturally grounded insights and gentle micro-actions.
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
            className="w-full py-3 bg-[#212b4a] hover:bg-[#161d34] disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#e8a33d]" />
            {isGeneratingReflection ? 'Lelapa AI is generating reflection...' : 'Save & Get Lelapa AI Reflection'}
          </button>

          {/* AI Reflection Result */}
          {aiReflection && (
            <div className="p-5 bg-gradient-to-br from-[#f3eee4] to-[#e8e0d0] rounded-2xl border border-[#e8e0d0] space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4f7c6f]">
                <Sparkles className="w-4 h-4" />
                <span>Lelapa AI Reflection & Comfort</span>
              </div>
              <p className="text-xs sm:text-sm text-[#1c1a16] leading-relaxed italic">
                "{aiReflection}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DAILY CHECK-IN */}
      {activeTab === 'checkin' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8e0d0] shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold text-[#1c1a16]">Daily 30-Second Mental Check-In</h3>
            <p className="text-xs text-[#5c574c]">
              Logging your daily mood builds long-term self-awareness and tunes Lelapa AI's real-time recommendations.
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
                className="text-xs font-bold text-[#4f7c6f] underline pt-2"
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
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
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
                  className="w-full accent-[#4f7c6f]"
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
                className="w-full py-3.5 bg-[#4f7c6f] hover:bg-[#3a5d53] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all"
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
