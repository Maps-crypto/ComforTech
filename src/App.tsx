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
  const [copingInitialTab, setCopingInitialTab] = useState<'breathing' | 'grounding' | 'journal' | 'checkin'>('breathing');

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
    <div className="min-h-screen bg-[#f3eee4] text-[#1c1a16] flex flex-col font-sans selection:bg-[#4f7c6f] selection:text-white">
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
            />
          </div>
        ) : (
          /* PRIMARY DASHBOARD / OVERVIEW VIEW */
          <div className="space-y-10 pb-16">
            {/* Hero Header Section */}
            <section className="bg-linear-to-b from-[#212b4a] via-[#1c243e] to-[#161d34] text-[#f3eee4] py-14 sm:py-20 px-4 sm:px-6 border-b border-[#212b4a]">
              <div className="max-w-4xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-[#b9c0d6] font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#4f7c6f] animate-pulse" />
                  <span>Multilingual · POPIA Protected · Zero Data USSD Ready</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#e8a33d] transition-opacity duration-300">
                  {greetings[heroGreetIdx]}
                </h1>

                <p className="text-base sm:text-lg text-[#b9c0d6] max-w-2xl mx-auto leading-relaxed">
                  Anonymous, culturally attuned mental health check-ins and triage for South African students — powered by Lelapa AI with offline fallback.
                </p>

                {/* Hero CTAs */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentView('chat')}
                    className="px-6 py-3 rounded-full bg-[#e8a33d] hover:bg-[#c9822a] text-[#1c1a16] font-bold text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Start AI Check-In</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('ussd')}
                    className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-[#f3eee4] font-bold text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-[#4f7c6f]" />
                    <span>Dial *134*902# (USSD)</span>
                  </button>

                  <button
                    onClick={() => {
                      setCopingInitialTab('breathing');
                      setCurrentView('coping');
                    }}
                    className="px-6 py-3 rounded-full bg-transparent hover:bg-white/5 text-[#b9c0d6] hover:text-white text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wind className="w-4 h-4" />
                    <span>Coping Tools</span>
                  </button>
                </div>

                {/* Auth Mode Status Pill */}
                <div className="pt-2">
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#b9c0d6] transition-colors"
                  >
                    <Lock className="w-3 h-3 text-[#e8a33d]" />
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 -mt-8">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e8e0d0] shadow-sm">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-[#c3503b]">92%</div>
                  <div className="text-xs text-[#5c574c] mt-1">SA students lack rapid mental health access</div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e8e0d0] shadow-sm">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-[#e8a33d]">&lt; 2 min</div>
                  <div className="text-xs text-[#5c574c] mt-1">Average comforTech triage response time</div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e8e0d0] shadow-sm">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-[#4f7c6f]">11</div>
                  <div className="text-xs text-[#5c574c] mt-1">Official South African languages supported</div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e8e0d0] shadow-sm">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-[#212b4a]">100%</div>
                  <div className="text-xs text-[#5c574c] mt-1">Anonymous & Zero Data USSD Compatible</div>
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
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#e8e0d0] shadow-xs space-y-6">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#4f7c6f]">
                    System Architecture
                  </span>
                  <h3 className="text-xl font-bold text-[#1c1a16] mt-1">
                    Six Steps from Distress to Sustained Support
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <div className="text-2xl font-bold font-mono text-[#e8a33d]">01</div>
                    <h4 className="text-sm font-bold text-[#1c1a16]">Anonymous or Email Entry</h4>
                    <p className="text-xs text-[#5c574c] leading-relaxed">
                      Enter anonymously without signing up, or sign in with your student email for cross-device sync.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-2xl font-bold font-mono text-[#4f7c6f]">02</div>
                    <h4 className="text-sm font-bold text-[#1c1a16]">Lelapa AI Check-In</h4>
                    <p className="text-xs text-[#5c574c] leading-relaxed">
                      Converse in your home language (isiZulu, Sesotho, Afrikaans, Xhosa, English) with Vulavula sentiment intelligence.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-2xl font-bold font-mono text-[#c3503b]">03</div>
                    <h4 className="text-sm font-bold text-[#1c1a16]">Real-Time Smart Triage</h4>
                    <p className="text-xs text-[#5c574c] leading-relaxed">
                      Evaluates risk level and routes you to immediate self-help, peer groups, or live counselors.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-2xl font-bold font-mono text-[#212b4a]">04</div>
                    <h4 className="text-sm font-bold text-[#1c1a16]">Personalized Coping Toolkit</h4>
                    <p className="text-xs text-[#5c574c] leading-relaxed">
                      Interactive 4-4-4-4 box breathing, 5-4-3-2-1 sensory grounding, and reflective AI journaling.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-2xl font-bold font-mono text-[#4f7c6f]">05</div>
                    <h4 className="text-sm font-bold text-[#1c1a16]">Offline USSD/SMS Fallback</h4>
                    <p className="text-xs text-[#5c574c] leading-relaxed">
                      Zero mobile data? Dial *134*902# to complete the exact same triage via basic GSM phone.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-2xl font-bold font-mono text-[#e8a33d]">06</div>
                    <h4 className="text-sm font-bold text-[#1c1a16]">Adaptive Follow-Up Loop</h4>
                    <p className="text-xs text-[#5c574c] leading-relaxed">
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
              <span>· Powered by Lelapa AI & Africa's Talking</span>
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
