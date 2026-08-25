import React, { useState } from 'react';
import { LANGUAGES } from '../data/mockData';
import { LanguageCode, UserProfile } from '../types';
import { Shield, Smartphone, Globe, User, PhoneCall, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentView: 'app' | 'ussd' | 'chat' | 'coping' | 'peer' | 'counselor' | 'activity';
  onSelectView: (view: 'app' | 'ussd' | 'chat' | 'coping' | 'peer' | 'counselor' | 'activity') => void;
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

  return (
    <header className="sticky top-0 z-40 bg-[#f3eee4]/95 backdrop-blur-md border-b border-[#e8e0d0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tag */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectView('app')}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-[#212b4a] text-[#f3eee4] flex items-center justify-center font-bold text-lg shadow-sm">
                c<span className="text-[#e8a33d]">T</span>
              </div>
              <div>
                <div className="font-bold text-[#1c1a16] text-lg tracking-tight flex items-center gap-1.5">
                  comforTech
                  <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 bg-[#4f7c6f] text-white rounded-full font-semibold">
                    Lelapa AI
                  </span>
                </div>
                <div className="text-[11px] text-[#5c574c] hidden sm:block">
                  Student Mental Wellness & Triage
                </div>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#e8e0d0]/50 p-1 rounded-xl">
            <button
              onClick={() => onSelectView('app')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'app'
                  ? 'bg-[#212b4a] text-white shadow-xs'
                  : 'text-[#5c574c] hover:text-[#1c1a16] hover:bg-[#e8e0d0]'
              }`}
            >
              Overview & AI Radar
            </button>
            <button
              onClick={() => onSelectView('chat')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'chat'
                  ? 'bg-[#212b4a] text-white shadow-xs'
                  : 'text-[#5c574c] hover:text-[#1c1a16] hover:bg-[#e8e0d0]'
              }`}
            >
              AI Check-In
            </button>
            <button
              onClick={() => onSelectView('coping')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'coping'
                  ? 'bg-[#212b4a] text-white shadow-xs'
                  : 'text-[#5c574c] hover:text-[#1c1a16] hover:bg-[#e8e0d0]'
              }`}
            >
              Coping Suite
            </button>
            <button
              onClick={() => onSelectView('peer')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'peer'
                  ? 'bg-[#212b4a] text-white shadow-xs'
                  : 'text-[#5c574c] hover:text-[#1c1a16] hover:bg-[#e8e0d0]'
              }`}
            >
              Peer Circles
            </button>
            <button
              onClick={() => onSelectView('counselor')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'counselor'
                  ? 'bg-[#212b4a] text-white shadow-xs'
                  : 'text-[#5c574c] hover:text-[#1c1a16] hover:bg-[#e8e0d0]'
              }`}
            >
              Counselors
            </button>
            <button
              onClick={() => onSelectView('ussd')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentView === 'ussd'
                  ? 'bg-[#4f7c6f] text-white shadow-xs'
                  : 'text-[#4f7c6f] hover:bg-[#4f7c6f]/10 font-bold'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              USSD Offline
            </button>
          </nav>

          {/* Right Actions: Language, Auth & SOS */}
          <div className="flex items-center gap-2">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#e8e0d0] bg-white hover:bg-[#f3eee4] text-xs font-medium text-[#1c1a16] transition-colors"
                title="Change Language"
              >
                <Globe className="w-3.5 h-3.5 text-[#4f7c6f]" />
                <span className="hidden sm:inline">{currentLang.nativeName}</span>
                <span className="sm:hidden">{currentLang.code.toUpperCase()}</span>
              </button>

              {langDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLangDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#e8e0d0] py-1.5 z-50 max-h-72 overflow-y-auto">
                    <div className="px-3 py-1 text-[11px] font-semibold text-[#8a8578] uppercase tracking-wider">
                      South African Languages
                    </div>
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          onSelectLanguage(l.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-[#f3eee4] transition-colors ${
                          selectedLanguage === l.code
                            ? 'font-bold text-[#4f7c6f] bg-[#f3eee4]/60'
                            : 'text-[#1c1a16]'
                        }`}
                      >
                        <span>{l.nativeName}</span>
                        <span className="text-[11px] text-[#8a8578]">({l.greeting})</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Auth Mode Toggle / Profile Button */}
            <button
              onClick={onOpenAuthModal}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                userProfile.isAnonymous
                  ? 'border-[#e8e0d0] bg-white text-[#5c574c] hover:bg-[#f3eee4]'
                  : 'border-[#4f7c6f]/30 bg-[#4f7c6f]/10 text-[#4f7c6f] font-semibold hover:bg-[#4f7c6f]/20'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  userProfile.isAnonymous ? 'bg-[#e8a33d]' : 'bg-[#4f7c6f]'
                }`}
              />
              <span className="max-w-[110px] truncate">
                {userProfile.isAnonymous ? 'Guest Mode' : userProfile.displayName}
              </span>
            </button>

            {/* Emergency SOS Button */}
            <button
              onClick={onOpenEmergencyModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c3503b] hover:bg-[#b0432f] text-white text-xs font-bold shadow-xs transition-colors"
              title="Immediate Crisis Hotlines (SADAG 0800 567 567 / 112)"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">24/7 SOS</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-[#e8e0d0] overflow-x-auto gap-1 text-xs">
          <button
            onClick={() => onSelectView('app')}
            className={`px-3 py-1 rounded-md shrink-0 font-medium ${
              currentView === 'app' ? 'bg-[#212b4a] text-white' : 'text-[#5c574c]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onSelectView('chat')}
            className={`px-3 py-1 rounded-md shrink-0 font-medium ${
              currentView === 'chat' ? 'bg-[#212b4a] text-white' : 'text-[#5c574c]'
            }`}
          >
            AI Chat
          </button>
          <button
            onClick={() => onSelectView('coping')}
            className={`px-3 py-1 rounded-md shrink-0 font-medium ${
              currentView === 'coping' ? 'bg-[#212b4a] text-white' : 'text-[#5c574c]'
            }`}
          >
            Coping Suite
          </button>
          <button
            onClick={() => onSelectView('peer')}
            className={`px-3 py-1 rounded-md shrink-0 font-medium ${
              currentView === 'peer' ? 'bg-[#212b4a] text-white' : 'text-[#5c574c]'
            }`}
          >
            Peer Circles
          </button>
          <button
            onClick={() => onSelectView('counselor')}
            className={`px-3 py-1 rounded-md shrink-0 font-medium ${
              currentView === 'counselor' ? 'bg-[#212b4a] text-white' : 'text-[#5c574c]'
            }`}
          >
            Counselors
          </button>
          <button
            onClick={() => onSelectView('ussd')}
            className={`px-3 py-1 rounded-md shrink-0 font-bold ${
              currentView === 'ussd' ? 'bg-[#4f7c6f] text-white' : 'text-[#4f7c6f]'
            }`}
          >
            USSD
          </button>
        </div>
      </div>
    </header>
  );
};
