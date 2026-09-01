import React, { useState } from 'react';
import { LANGUAGES } from '../data/mockData';
import { LanguageCode, UserProfile } from '../types';
import { getTranslation } from '../utils/translations';
import { Shield, Smartphone, Globe, User, PhoneCall, Sparkles, Wind, MessageSquare, Users, HeartHandshake, Activity, Brain } from 'lucide-react';

interface NavbarProps {
  currentView: 'app' | 'ussd' | 'chat' | 'coping' | 'peer' | 'counselor' | 'activity' | 'training';
  onSelectView: (view: 'app' | 'ussd' | 'chat' | 'coping' | 'peer' | 'counselor' | 'activity' | 'training') => void;
  userProfile: UserProfile;
  selectedLanguage: LanguageCode;
  onSelectLanguage: (code: LanguageCode) => void;
  onOpenAuthModal: () => void;
  onOpenEmergencyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  userProfile,
  selectedLanguage,
  onSelectLanguage,
  onOpenAuthModal,
  onOpenEmergencyModal,
}) => {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];
  const t = getTranslation(selectedLanguage);

  const navItems = [
    { id: 'app', label: t.nav.home, icon: Sparkles },
    { id: 'coping', label: t.nav.coping, icon: Wind },
    { id: 'chat', label: t.nav.chat, icon: MessageSquare },
    { id: 'training', label: t.nav.training, icon: Brain },
    { id: 'peer', label: t.nav.peer, icon: Users },
    { id: 'counselor', label: t.nav.counselor, icon: HeartHandshake },
    { id: 'activity', label: t.nav.activity, icon: Activity },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Purpose */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectView('app')}
              className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-slate-800 transition-colors">
                <span className="text-emerald-400">c</span>T
              </div>
              <div>
                <div className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2">
                  comforTech
                  <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">
                    SA Student Care
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 hidden sm:block">
                  Mental Wellness & Triage Network
                </div>
              </div>
            </button>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* USSD Offline Pill */}
            <button
              onClick={() => onSelectView('ussd')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'ussd'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>USSD Offline</span>
            </button>
          </nav>

          {/* Right Actions: Language Selector, Auth Pill, Emergency SOS */}
          <div className="flex items-center gap-2">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-800 transition-colors cursor-pointer"
                title="Change Language"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline font-semibold">{currentLang.name}</span>
                <span className="sm:hidden font-semibold">{currentLang.code.toUpperCase()}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    {t.nav.selectLanguage}
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onSelectLanguage(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                          selectedLanguage === lang.code
                            ? 'font-bold text-emerald-700 bg-emerald-50/60'
                            : 'text-slate-700'
                        }`}
                      >
                        <span>{lang.name}</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {lang.nativeName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auth / Anonymous Status */}
            <button
              onClick={onOpenAuthModal}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              title="Account & Privacy Settings"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="max-w-[100px] truncate">
                {userProfile.isAnonymous ? t.nav.guestUser : userProfile.displayName}
              </span>
            </button>

            {/* Emergency Hotline Button */}
            <button
              onClick={onOpenEmergencyModal}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="24/7 Free Crisis Hotlines (SADAG & Higher Health)"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-semibold">{t.nav.emergencyBtn}</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => onSelectView('ussd')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all ${
              currentView === 'ussd'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-700 bg-emerald-50'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>USSD</span>
          </button>
        </div>
      </div>
    </header>
  );
};
