import React, { useState } from 'react';
import { SA_UNIVERSITIES } from '../data/mockData';
import { UserProfile } from '../types';
import { Shield, Mail, UserCheck, Lock, CheckCircle2, X, Sparkles, LogIn, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSwitchMode: (
    mode: 'anonymous' | 'email',
    emailData?: { email: string; displayName?: string; university?: string; authProvider?: string }
  ) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSwitchMode,
}) => {
  const [tab, setTab] = useState<'anonymous' | 'email'>(userProfile.isAnonymous ? 'anonymous' : 'email');
  const [email, setEmail] = useState(userProfile.email || '');
  const [displayName, setDisplayName] = useState(userProfile.displayName || '');
  const [university, setUniversity] = useState(userProfile.university || SA_UNIVERSITIES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      alert('Please provide a valid email address');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      onSwitchMode('email', {
        email: email.trim(),
        displayName: displayName.trim() || email.split('@')[0],
        university,
        authProvider: 'Email',
      });
      setIsLoading(false);
      setSuccessMsg('Account synced successfully! Your check-ins, journal reflections, and Lelapa recommendations are now secured.');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1400);
    }, 600);
  };

  const handleSocialSignIn = (provider: 'Google' | 'Facebook') => {
    setIsLoading(true);
    setTimeout(() => {
      const generatedEmail =
        provider === 'Google'
          ? `${(displayName || 'student').toLowerCase().replace(/\s+/g, '')}@gmail.com`
          : `${(displayName || 'student').toLowerCase().replace(/\s+/g, '')}@student.za`;
      onSwitchMode('email', {
        email: generatedEmail,
        displayName: displayName || (provider === 'Google' ? 'Google Student' : 'Facebook Student'),
        university,
        authProvider: provider,
      });
      setIsLoading(false);
      setSuccessMsg(`Signed in with ${provider}! Your anonymous session history is merged.`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1400);
    }, 700);
  };

  const handleContinueAnonymous = () => {
    setIsLoading(true);
    setTimeout(() => {
      onSwitchMode('anonymous');
      setIsLoading(false);
      setSuccessMsg('Anonymous guest session refreshed! No personal identity is attached.');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="bg-slate-950/80 border-b border-slate-800 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans text-slate-100">Choose Your Access Mode</h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                POPIA & Health Privacy Protected
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Access immediate support without creating an account, or sign in to save your personal streak and cross-device recommendations.
          </p>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setTab('anonymous')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tab === 'anonymous'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              100% Anonymous Mode
            </button>
            <button
              onClick={() => setTab('email')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tab === 'email'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In & Sync
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {successMsg ? (
            <div className="p-6 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
              <p className="text-sm font-semibold text-slate-100">{successMsg}</p>
            </div>
          ) : tab === 'anonymous' ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Active Guest Alias</span>
                  <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {userProfile.displayName}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No sign-up required. Your check-ins, journal reflections, and Lelapa AI recommendations stay strictly inside this browser session until you choose to register.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Instant access to AI check-ins, coping exercises & peer support</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Zero tracking of personal identity, email, or physical location</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Seamlessly link activity to an email or social account later</span>
                </div>
              </div>

              <button
                onClick={handleContinueAnonymous}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                {isLoading ? 'Setting up session...' : 'Continue as Anonymous Guest'}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Social Sign-In Options */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-300">
                  Instant Social Sign-In
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialSignIn('Google')}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 p-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialSignIn('Facebook')}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 p-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                  </button>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                  Or Email Sign In
                </span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Student or Personal Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g., student@students.wits.ac.za or name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Display Name / Alias
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Thabo M. or JoziStudent"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      University / Institution
                    </label>
                    <select
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {SA_UNIVERSITIES.map((u) => (
                        <option key={u} value={u} className="bg-slate-900 text-slate-100">
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  {isLoading ? 'Saving profile...' : 'Sign In & Save Activity'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="bg-slate-950/80 px-6 py-3.5 border-t border-slate-800 text-center text-[11px] text-slate-400">
          Confidential & POPIA Compliant · Emergency? Call SADAG <strong className="text-slate-200">0800 567 567</strong> or dial <strong className="text-slate-200">112</strong>
        </div>
      </div>
    </div>
  );
};

