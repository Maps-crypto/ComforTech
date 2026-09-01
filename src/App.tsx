import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LANGUAGES } from './data/mockData';
import { fetchLelapaRecommendations } from './services/api';
import { addActivity, getActivities, getOrCreateUserProfile, switchAuthMode } from './services/storage';
import { ActivityItem, CopingToolAction, LanguageCode, MoodType, RecommendationReport, UserProfile } from './types';
import { getTranslation } from './utils/translations';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { EmergencyModal } from './components/EmergencyModal';
import { LelapaRecommendationEngine } from './components/LelapaRecommendationEngine';
import { ChatCompanion } from './components/ChatCompanion';
import { CopingTools } from './components/CopingTools';
import { PeerCommunity } from './components/PeerCommunity';
import { CounselorConnect } from './components/CounselorConnect';
import { UssdSimulator } from './components/UssdSimulator';
import { ActivityHistory } from './components/ActivityHistory';
import { LelapaLanguageStudio } from './components/LelapaLanguageStudio';
import { InactivityBanner } from './components/InactivityBanner';
import { useInactivityAlert } from './hooks/useInactivityAlert';
import {
  Shield,
  Sparkles,
  Smartphone,
  Wind,
  Users,
  PhoneCall,
  Brain,
  ArrowRight,
  CheckCircle2,
  Lock,
  HeartHandshake,
  Zap,
  BookOpen,
  Mic,
  Smile,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Activity,
  Flame
} from 'lucide-react';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(getOrCreateUserProfile);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(userProfile.preferredLanguage || 'en');
  const [currentView, setCurrentView] = useState<'app' | 'ussd' | 'chat' | 'coping' | 'peer' | 'counselor' | 'activity' | 'training'>('app');
  const [copingInitialTab, setCopingInitialTab] = useState<'breathing' | 'grounding' | 'journal' | 'voice' | 'checkin'>('breathing');

  const [activities, setActivities] = useState<ActivityItem[]>(getActivities);
  const [recommendations, setRecommendations] = useState<RecommendationReport | null>(null);
  const [isRecsLoading, setIsRecsLoading] = useState(false);

  // Inactivity detection hook (calculates if user hasn't logged activity in > 48h)
  const {
    isInactiveOver48Hours,
    hoursSinceLastActivity,
    daysSinceLastActivity,
    dismissAlert,
  } = useInactivityAlert(activities, 48);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const t = getTranslation(selectedLanguage);

  // Active quick mood filter for home sequence
  const [quickSelectedMood, setQuickSelectedMood] = useState<MoodType>('Anxious');

  // Dynamic greetings in South African languages
  const greetings = [
    { text: 'Sawubona', lang: 'isiZulu' },
    { text: 'Lumela', lang: 'Sesotho' },
    { text: 'Molo', lang: 'isiXhosa' },
    { text: 'Dumela', lang: 'Setswana' },
    { text: 'Hallo', lang: 'Afrikaans' },
    { text: 'Hello', lang: 'English' },
  ];
  const [greetIdx, setGreetIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreetIdx((prev) => (prev + 1) % greetings.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch / recalculate personalized recommendations
  const loadRecommendations = async () => {
    setIsRecsLoading(true);
    try {
      const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage);
      const recs = await fetchLelapaRecommendations({
        activityHistory: activities,
        language: currentLang?.name || 'English',
        userProfile,
      });
      setRecommendations(recs);
    } catch (e) {
      console.error('Failed to load recommendations', e);
    } finally {
      setIsRecsLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [userProfile.id, selectedLanguage]);

  // Activity logger helper
  const handleLogActivity = (title: string, description: string, score?: number) => {
    const newAct: ActivityItem = {
      id: 'act_' + Date.now(),
      type: 'mood_checkin',
      title,
      description,
      timestamp: new Date().toISOString(),
      sentimentScore: score,
    };
    const updated = addActivity(newAct);
    setActivities(updated);
    setTimeout(() => {
      loadRecommendations();
    }, 300);
  };

  const handleSwitchAuthMode = (
    mode: 'anonymous' | 'email',
    emailData?: { email: string; displayName?: string; university?: string }
  ) => {
    const updated = switchAuthMode(userProfile, mode, emailData);
    setUserProfile(updated);
    setActivities(getActivities());
  };

  const handleSelectRecommendationAction = (actionType: CopingToolAction['actionType']) => {
    if (actionType === 'tool_box_breathing') {
      setCopingInitialTab('breathing');
      setCurrentView('coping');
    } else if (actionType === 'tool_grounding_54321') {
      setCopingInitialTab('grounding');
      setCurrentView('coping');
    } else if (actionType === 'tool_journal') {
      setCopingInitialTab('journal');
      setCurrentView('coping');
    } else if (actionType === 'open_peer_room') {
      setCurrentView('peer');
    } else if (actionType === 'open_counselor') {
      setCurrentView('counselor');
    } else if (actionType === 'open_hotlines') {
      setEmergencyModalOpen(true);
    }
  };

  const handleQuickMoodClick = (mood: MoodType) => {
    setQuickSelectedMood(mood);
    const scoreMap: Record<MoodType, number> = {
      Great: 90,
      Good: 75,
      Hopeful: 75,
      Neutral: 55,
      Anxious: 40,
      Stressed: 35,
      Down: 30,
      Overwhelmed: 20,
      Hopeless: 15,
    };
    handleLogActivity(
      'Quick Mood Pulse',
      `Felt ${mood} on student home dashboard`,
      scoreMap[mood] || 50
    );
  };

  // 3-step action sequence tailored to quick mood
  const getSequenceForMood = (mood: MoodType) => {
    if (mood === 'Overwhelmed' || mood === 'Anxious' || mood === 'Stressed') {
      return {
        tag: 'Acute Stress & Panic Protocol',
        tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
        summary: 'Your nervous system needs physical safety before cognitive problem-solving.',
        steps: [
          {
            num: '01',
            title: '2-Minute Box Breathing',
            desc: '4-4-4-4 rhythm to slow heart rate and lower cortisol.',
            actionLabel: 'Start Breathing',
            action: () => {
              setCopingInitialTab('breathing');
              setCurrentView('coping');
            },
            icon: Wind,
            accent: 'bg-emerald-600 text-white',
          },
          {
            num: '02',
            title: '5-4-3-2-1 Sensory Grounding',
            desc: 'Anchor your senses to the room to break thought loops.',
            actionLabel: 'Begin Grounding',
            action: () => {
              setCopingInitialTab('grounding');
              setCurrentView('coping');
            },
            icon: Zap,
            accent: 'bg-slate-900 text-white',
          },
          {
            num: '03',
            title: 'Talk with AI Companion or Helpline',
            desc: 'Unburden your mind in your mother tongue safely.',
            actionLabel: 'Open Chat',
            action: () => setCurrentView('chat'),
            icon: Brain,
            accent: 'bg-slate-100 text-slate-800 border border-slate-200',
          },
        ],
      };
    } else if (mood === 'Down') {
      return {
        tag: 'Gentle Expression & Warmth',
        tagColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        summary: 'When energy is low, small self-compassion steps rebuild steady resilience.',
        steps: [
          {
            num: '01',
            title: 'Voice Journal Reflection',
            desc: 'Speak freely in isiZulu, Sesotho, Afrikaans, or English without typing.',
            actionLabel: 'Record Voice',
            action: () => {
              setCopingInitialTab('voice');
              setCurrentView('coping');
            },
            icon: Mic,
            accent: 'bg-emerald-600 text-white',
          },
          {
            num: '02',
            title: 'Read Peer Stories',
            desc: 'See how fellow students navigate NSFAS, exams, and isolation.',
            actionLabel: 'Explore Circles',
            action: () => setCurrentView('peer'),
            icon: Users,
            accent: 'bg-slate-900 text-white',
          },
          {
            num: '03',
            title: 'Request Counselor Callback',
            desc: 'Discreet, free support from campus wellness units.',
            actionLabel: 'View Counselors',
            action: () => setCurrentView('counselor'),
            icon: HeartHandshake,
            accent: 'bg-slate-100 text-slate-800 border border-slate-200',
          },
        ],
      };
    } else {
      return {
        tag: 'Maintenance & Academic Focus',
        tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        summary: 'Your emotional state is balanced. Great time to plan study pace and support peers.',
        steps: [
          {
            num: '01',
            title: 'Daily Mind Check-In',
            desc: 'Track energy levels and keep your longitudinal resilience streak.',
            actionLabel: 'Log Check-In',
            action: () => {
              setCopingInitialTab('checkin');
              setCurrentView('coping');
            },
            icon: Smile,
            accent: 'bg-emerald-600 text-white',
          },
          {
            num: '02',
            title: 'Reflective Journaling',
            desc: 'Capture today’s wins, focus goals, and gratitude notes.',
            actionLabel: 'Open Journal',
            action: () => {
              setCopingInitialTab('journal');
              setCurrentView('coping');
            },
            icon: BookOpen,
            accent: 'bg-slate-900 text-white',
          },
          {
            num: '03',
            title: 'Encourage a Fellow Student',
            desc: 'Leave an anonymous word of strength on the student board.',
            actionLabel: 'Send Cheer',
            action: () => setCurrentView('peer'),
            icon: Users,
            accent: 'bg-slate-100 text-slate-800 border border-slate-200',
          },
        ],
      };
    }
  };

  const currentSequence = getSequenceForMood(quickSelectedMood);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        userProfile={userProfile}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={(lang) => {
          setSelectedLanguage(lang);
          setUserProfile({ ...userProfile, preferredLanguage: lang });
        }}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {/* USSD Simulator View */}
        {currentView === 'ussd' ? (
          <div className="py-8 px-4 sm:px-6">
            <UssdSimulator
              selectedLanguage={selectedLanguage}
              onSelectLanguage={(lang) => {
                setSelectedLanguage(lang);
                setUserProfile({ ...userProfile, preferredLanguage: lang });
              }}
              onBackToApp={() => setCurrentView('app')}
              onActivityLogged={handleLogActivity}
            />
          </div>
        ) : currentView === 'chat' ? (
          <div className="py-8 px-4 sm:px-6">
            <ChatCompanion
              userProfile={userProfile}
              selectedLanguage={selectedLanguage}
              onActivityLogged={handleLogActivity}
              onOpenCoping={() => {
                setCopingInitialTab('breathing');
                setCurrentView('coping');
              }}
              onOpenPeer={() => setCurrentView('peer')}
              onOpenCounselor={() => setCurrentView('counselor')}
            />
          </div>
        ) : currentView === 'coping' ? (
          <div className="py-8 px-4 sm:px-6">
            <CopingTools
              userProfile={userProfile}
              selectedLanguage={selectedLanguage}
              initialTab={copingInitialTab}
              onActivityLogged={handleLogActivity}
              onRefreshRecommendations={loadRecommendations}
            />
          </div>
        ) : currentView === 'peer' ? (
          <div className="py-8 px-4 sm:px-6">
            <PeerCommunity
              userProfile={userProfile}
              onActivityLogged={handleLogActivity}
            />
          </div>
        ) : currentView === 'counselor' ? (
          <div className="py-8 px-4 sm:px-6">
            <CounselorConnect
              userProfile={userProfile}
              selectedLanguage={selectedLanguage}
              onActivityLogged={handleLogActivity}
            />
          </div>
        ) : currentView === 'activity' ? (
          <div className="py-8 px-4 sm:px-6">
            <ActivityHistory
              activities={activities}
              userProfile={userProfile}
              onNavigate={(view, tab) => {
                if (tab) setCopingInitialTab(tab);
                setCurrentView(view);
              }}
              onLogActivity={handleLogActivity}
            />
          </div>
        ) : currentView === 'training' ? (
          <div className="py-8 px-4 sm:px-6 max-w-7xl mx-auto">
            <LelapaLanguageStudio
              userProfile={userProfile}
              currentLanguage={selectedLanguage}
              onSelectLanguage={(code) => setSelectedLanguage(code)}
              onOpenCompanionChat={() => setCurrentView('chat')}
            />
          </div>
        ) : (
          /* ================= PRIMARY DASHBOARD: HUMAN STUDENT USE CASE SEQUENCE ================= */
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* INACTIVITY ALERT BANNER (> 48 HOURS) */}
            {isInactiveOver48Hours && (
              <InactivityBanner
                hoursSinceLastActivity={hoursSinceLastActivity}
                daysSinceLastActivity={daysSinceLastActivity}
                onDismiss={dismissAlert}
                onQuickMoodCheckIn={(mood) => {
                  setQuickSelectedMood(mood);
                  const moodScores: Record<MoodType, number> = {
                    Great: 90,
                    Good: 80,
                    Hopeful: 80,
                    Neutral: 60,
                    Anxious: 45,
                    Stressed: 35,
                    Down: 30,
                    Overwhelmed: 20,
                    Hopeless: 10,
                  };
                  handleLogActivity(
                    `Check-in Pulse (${mood})`,
                    `Responded to 48h check-in prompt: feeling ${mood}`,
                    moodScores[mood] || 60
                  );
                }}
                onOpenCheckInTool={() => {
                  setCopingInitialTab('checkin');
                  setCurrentView('coping');
                }}
              />
            )}

            {/* STEP 1: HERO & IMMEDIATE EMOTIONAL TEMPERATURE PULSE */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="relative z-10 max-w-3xl space-y-6">
                {/* Status Bar */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold font-mono text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    100% Confidential · POPIA Protected
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 text-xs">
                    {userProfile.isAnonymous
                      ? 'Anonymous Student Session'
                      : `Signed in as ${userProfile.displayName} (${userProfile.university || 'Student'})`}
                  </span>
                </div>

                {/* Empathetic Greeting */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                    <span>{greetings[greetIdx].lang}:</span>
                    <span className="font-bold">{greetings[greetIdx].text}</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                    {t.home.greetingTitle ? t.home.greetingTitle(userProfile.displayName || 'Student') : 'How is your mind feeling right now?'}
                  </h1>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t.home.heroSubtitle || 'Select your current emotional state. comforTech provides immediate calming micro-steps, confidential expression in your mother tongue, and verified campus support.'}
                  </p>
                </div>

                {/* One-Tap Mood Pulse Triage Buttons */}
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {t.home.moodCheckinTitle || 'Tap your current state:'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { mood: 'Overwhelmed' as MoodType, label: t.moods.overwhelmed?.label || 'Overwhelmed / Panicked', icon: '🚨' },
                      { mood: 'Anxious' as MoodType, label: t.moods.anxious?.label || 'Exam / NSFAS Anxiety', icon: '⚡' },
                      { mood: 'Down' as MoodType, label: t.moods.depressed?.label || 'Down / Lonely / Drained', icon: '🌧️' },
                      { mood: 'Neutral' as MoodType, label: t.moods.good?.label || 'Managing Okay', icon: '⚖️' },
                      { mood: 'Hopeful' as MoodType, label: t.moods.great?.label || 'Grounded / Ready to Study', icon: '🌱' },
                    ].map((item) => (
                      <motion.button
                        key={item.mood}
                        onClick={() => handleQuickMoodClick(item.mood)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25, mass: 0.8 }}
                        className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer border select-none ${
                          quickSelectedMood === item.mood
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-emerald-500/30'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <motion.span
                          animate={quickSelectedMood === item.mood ? { scale: [1, 1.25, 1], rotate: [0, -6, 6, 0] } : { scale: 1, rotate: 0 }}
                          transition={{ duration: 0.35, ease: 'easeInOut' }}
                        >
                          {item.icon}
                        </motion.span>
                        <span>{item.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* STEP 2: ADAPTIVE 3-STEP CARE SEQUENCE */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-700">
                      Step-by-Step Care Sequence
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentSequence.tagColor}`}>
                      {currentSequence.tag}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    Your Recommended Action Steps
                  </h2>
                  <p className="text-xs text-slate-500">{currentSequence.summary}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentView('coping')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all tools</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3 Step Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentSequence.steps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            STEP {step.num}
                          </span>
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          {step.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>

                      <button
                        onClick={step.action}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${step.accent}`}
                      >
                        <span>{step.actionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* STEP 3: THE FOUR CORE STUDENT SUPPORT PILLARS */}
            <section className="space-y-4 pt-2">
              <div>
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                  Student Support Ecosystem
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Explore Care Modalities
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Pillar 1: Coping Tools */}
                <div
                  onClick={() => {
                    setCopingInitialTab('breathing');
                    setCurrentView('coping');
                  }}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Wind className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Somatic & Voice Coping
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Box breathing, 5-4-3-2-1 grounding, and multilingual voice journaling.
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <span>Open Coping Suite</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Pillar 2: AI Multilingual Companion */}
                <div
                  onClick={() => setCurrentView('chat')}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Multilingual Companion
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Safe conversational companion in 11 South African languages with voice audio readout.
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <span>Start Anonymous Chat</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Pillar 3: Peer Circles */}
                <div
                  onClick={() => setCurrentView('peer')}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Anonymous Peer Circles
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Read and share experiences on NSFAS, exams, loneliness, and campus res life.
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <span>Join Student Circle</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Pillar 4: Campus Counselors & Hotlines */}
                <div
                  onClick={() => setCurrentView('counselor')}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Campus Counselors & SADAG
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Verified contact info for PsyCaD, CCDU, SWS, UP Careline & free 24/7 toll-free lines.
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <span>Connect with Care</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </section>

            {/* STEP 4: ZERO-DATA / OFFLINE USSD ACCESS */}
            <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                    <Smartphone className="w-4 h-4" />
                    Zero Mobile Data Required
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Offline Mental Health Triage via USSD (*134*902#)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Experiencing load shedding or ran out of data bundle? Any student on MTN, Vodacom, Telkom, or Cell C can dial <strong>*134*902#</strong> from any basic mobile phone to complete triage and access emergency hotlines for free.
                  </p>
                </div>

                <button
                  onClick={() => setCurrentView('ussd')}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 shrink-0 transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Launch USSD Simulator</span>
                </button>
              </div>
            </section>

            {/* STEP 5: REAL-TIME LELAPA MULTILINGUAL AI LAB BANNER */}
            <section className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-md relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <Brain className="w-4 h-4" />
                    Real-Time Multilingual Model Training
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Lelapa AI Multilingual Training & Calibration Lab
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Help train Lelapa AI across all 11 official South African languages and student Tsotsitaal. Benchmark dialect translation, run sentiment inference tests, and contribute campus idioms to continuous real-time model calibration.
                  </p>
                </div>

                <button
                  onClick={() => setCurrentView('training')}
                  className="px-6 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 shrink-0 transition-all cursor-pointer"
                >
                  <Brain className="w-4 h-4" />
                  <span>Open Training Lab & Tester</span>
                </button>
              </div>
            </section>

            {/* STEP 6: PERSONALIZED WELLNESS INSIGHTS & RADAR */}
            <section className="pt-2">
              <LelapaRecommendationEngine
                recommendations={recommendations}
                isLoading={isRecsLoading}
                onRefresh={loadRecommendations}
                onSelectAction={handleSelectRecommendationAction}
                userProfile={userProfile}
                recentActivities={activities}
              />
            </section>
          </div>
        )}
      </main>

      {/* Reassuring Crisis Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-600">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Emergency Crisis Callout */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                24/7 Immediate Crisis Support (South Africa)
              </div>
              <p className="text-rose-800 text-xs leading-relaxed">
                If you are in danger: Call <strong>SADAG Suicide Crisis Line 0800 567 567</strong> or Higher Health <strong>0800 36 36 36</strong> (Free from all networks).
              </p>
            </div>
            <button
              onClick={() => setEmergencyModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shrink-0 transition-colors cursor-pointer"
            >
              View All Hotlines
            </button>
          </div>

          {/* Copyright & Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">comforTech</span>
              <span>· Culturally Attuned Student Wellness</span>
              <span>· Zero Data & Multilingual</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setAuthModalOpen(true)} className="hover:text-slate-900 underline cursor-pointer">
                {userProfile.isAnonymous ? 'Sign In / Account' : 'Switch to Anonymous'}
              </button>
              <button onClick={() => setCurrentView('ussd')} className="hover:text-slate-900 underline cursor-pointer">
                USSD *134*902#
              </button>
              <button onClick={() => setCurrentView('activity')} className="hover:text-slate-900 underline cursor-pointer">
                Mood Trends ({activities.length})
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        userProfile={userProfile}
        onSwitchMode={handleSwitchAuthMode}
      />

      <EmergencyModal
        isOpen={emergencyModalOpen}
        selectedLanguage={selectedLanguage}
        onClose={() => setEmergencyModalOpen(false)}
      />
    </div>
  );
}
