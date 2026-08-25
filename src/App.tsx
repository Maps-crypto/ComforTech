import React, { useState, useEffect } from 'react';
import { LANGUAGES } from './data/mockData';
import { fetchLelapaRecommendations } from './services/api';
import { addActivity, getActivities, getOrCreateUserProfile, switchAuthMode } from './services/storage';
import { ActivityItem, CopingToolAction, LanguageCode, RecommendationReport, UserProfile } from './types';
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
import { Shield, Sparkles, Smartphone, Wind, Users, PhoneCall, Brain, ArrowRight, CheckCircle2, Lock, HeartHandshake } from 'lucide-react';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(getOrCreateUserProfile);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(userProfile.preferredLanguage || 'en');
  const [currentView, setCurrentView] = useState<'app' | 'ussd' | 'chat' | 'coping' | 'peer' | 'counselor' | 'activity'>('app');
  const [copingInitialTab, setCopingInitialTab] = useState<'breathing' | 'grounding' | 'journal' | 'voice' | 'checkin'>('breathing');

  const [activities, setActivities] = useState<ActivityItem[]>(getActivities);
  const [recommendations, setRecommendations] = useState<RecommendationReport | null>(null);
  const [isRecsLoading, setIsRecsLoading] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  // Hero greeting dynamic rotation
  const greetings = ['Sawubona.', 'Lumela.', 'Molo.', 'Hallo.', 'Dumela.'];
  const [heroGreetIdx, setHeroGreetIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroGreetIdx((prev) => (prev + 1) % greetings.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch / recalculate Lelapa Recommendations
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
      console.error('Failed to load Lelapa recommendations', e);
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
    // Trigger real-time Lelapa AI recommendations refresh
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
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
        ) : (
          /* PRIMARY DASHBOARD / OVERVIEW VIEW */
          <div className="space-y-10 pb-16">
            {/* Hero Header Section */}
            <section className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 text-slate-100 py-14 sm:py-20 px-4 sm:px-6 border-b border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Multilingual · POPIA Protected · Zero Data USSD Ready</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-amber-400 transition-opacity duration-300">
                  {greetings[heroGreetIdx]}
                </h1>

                <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Anonymous, culturally attuned mental health check-ins and triage for South African students — powered by Vulavula Voice & Language Engine with offline fallback.
                </p>

                {/* Hero CTAs */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentView('chat')}
                    className="px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Start AI Check-In</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('ussd')}
                    className="px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Dial *134*902# (USSD)</span>
                  </button>

                  <button
                    onClick={() => {
                      setCopingInitialTab('breathing');
                      setCurrentView('coping');
                    }}
                    className="px-6 py-3 rounded-full bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-800"
                  >
                    <Wind className="w-4 h-4" />
                    <span>Coping Tools</span>
                  </button>
                </div>

                {/* Auth Mode Status Pill */}
                <div className="pt-2">
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition-colors"
                  >
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>
                      {userProfile.isAnonymous
                        ? 'Browsing in Anonymous Guest Mode · Click to sign in with email'
                        : `Signed in as ${userProfile.email} (${userProfile.university || 'Student'})`}
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* Quick Stats Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 -mt-8 relative z-20">
                <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-400">92%</div>
                  <div className="text-xs text-slate-400 mt-1">SA students lack rapid mental health access</div>
                </div>

                <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">&lt; 2 min</div>
                  <div className="text-xs text-slate-400 mt-1">Average comforTech triage response time</div>
                </div>

                <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">11</div>
                  <div className="text-xs text-slate-400 mt-1">Official South African languages supported</div>
                </div>

                <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-indigo-400">100%</div>
                  <div className="text-xs text-slate-400 mt-1">Anonymous & Zero Data USSD Compatible</div>
                </div>
              </div>
            </div>

            {/* Real-Time Lelapa AI Recommendation Engine Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <LelapaRecommendationEngine
                recommendations={recommendations}
                isLoading={isRecsLoading}
                onRefresh={loadRecommendations}
                onSelectAction={handleSelectRecommendationAction}
                userProfile={userProfile}
                recentActivities={activities}
              />
            </div>

            {/* 6-Step Triage Pathway Explanation */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
              <div className="bg-slate-900/80 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl space-y-6">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                    System Architecture
                  </span>
                  <h3 className="text-xl font-bold text-slate-100 mt-1">
                    Six Steps from Distress to Sustained Support
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                    <div className="text-2xl font-bold font-mono text-amber-400">01</div>
                    <h4 className="text-sm font-bold text-slate-100">Anonymous or Email Entry</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Enter anonymously without signing up, or sign in with your student email for cross-device sync.
                    </p>
                  </div>

                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                    <div className="text-2xl font-bold font-mono text-emerald-400">02</div>
                    <h4 className="text-sm font-bold text-slate-100">Adaptive AI Check-In</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Converse in your home language (isiZulu, Sesotho, Afrikaans, Xhosa, English) with Vulavula sentiment intelligence.
                    </p>
                  </div>

                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                    <div className="text-2xl font-bold font-mono text-rose-400">03</div>
                    <h4 className="text-sm font-bold text-slate-100">Real-Time Smart Triage</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Evaluates risk level and routes you to immediate self-help, peer groups, or live counselors.
                    </p>
                  </div>

                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                    <div className="text-2xl font-bold font-mono text-indigo-400">04</div>
                    <h4 className="text-sm font-bold text-slate-100">Personalized Coping Toolkit</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Interactive 4-4-4-4 box breathing, 5-4-3-2-1 sensory grounding, and reflective AI journaling.
                    </p>
                  </div>

                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                    <div className="text-2xl font-bold font-mono text-emerald-400">05</div>
                    <h4 className="text-sm font-bold text-slate-100">Offline USSD/SMS Fallback</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Zero mobile data? Dial *134*902# to complete the exact same triage via basic GSM phone.
                    </p>
                  </div>

                  <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                    <div className="text-2xl font-bold font-mono text-amber-400">06</div>
                    <h4 className="text-sm font-bold text-slate-100">Adaptive Follow-Up Loop</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Automated gentle follow-up check-ins 48 hours later to monitor mood trajectory.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Banner */}
      <footer className="bg-[#1c1a16] text-[#b9c0d6] py-12 px-4 sm:px-6 lg:px-8 border-t border-[#212b4a]">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-[#212b4a] rounded-2xl p-5 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/10">
            <div className="space-y-1">
              <div className="text-xs uppercase font-mono font-bold text-[#e8a33d]">
                Emergency Crisis Notice
              </div>
              <p className="text-xs sm:text-sm text-[#f3eee4]">
                If you are in distress: Call <strong>SADAG 24/7 Suicide Crisis Line 0800 567 567</strong> or Higher Health <strong>0800 36 36 36</strong> (Free from all networks).
              </p>
            </div>
            <button
              onClick={() => setEmergencyModalOpen(true)}
              className="px-5 py-2.5 bg-[#c3503b] hover:bg-[#b0432f] text-white text-xs font-bold rounded-xl shrink-0 transition-colors"
            >
              View All Hotlines
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8a8578] pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#f3eee4]">comforTech</span>
              <span>· Built for South African Students</span>
              <span>· Powered by Vulavula Voice & Language Engine & Africa's Talking</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setAuthModalOpen(true)} className="hover:text-white underline">
                {userProfile.isAnonymous ? 'Sign In / Account' : 'Switch to Anonymous'}
              </button>
              <button onClick={() => setCurrentView('ussd')} className="hover:text-white underline">
                USSD *134*902#
              </button>
              <button onClick={() => setCurrentView('activity')} className="hover:text-white underline">
                Activity History ({activities.length})
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
        onClose={() => setEmergencyModalOpen(false)}
      />
    </div>
  );
}
