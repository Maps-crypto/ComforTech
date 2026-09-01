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
      setSuccessMsg('Account synced successfully! Your check-ins and journal reflections are now secured.');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1400);
    }, 600);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 relative bg-slate-50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-sans text-slate-900">Student Privacy & Identity</h2>
              <span className="text-[11px] font-mono text-emerald-800 font-bold uppercase tracking-wider">
                POPIA Act Compliant
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Choose whether to remain completely anonymous or sync your wellness trajectory across devices.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setTab('anonymous')}
            className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer ${
              tab === 'anonymous'
                ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            100% Anonymous Mode
          </button>
          <button
            onClick={() => setTab('email')}
            className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer ${
              tab === 'email'
                ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sync Account (Optional)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4">
          {successMsg ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-center gap-2 font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          ) : tab === 'anonymous' ? (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Your Protected Alias: <span className="font-mono text-emerald-700">{userProfile.displayName}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  You are browsing in Zero-Data Trace mode. No student numbers, legal names, or emails are stored on our servers.
                </p>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No login or password needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Full access to AI Chat, Coping Suite, & Circles</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Activity saved in your private local browser cache</span>
                </div>
              </div>

              <button
                onClick={handleContinueAnonymous}
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isLoading ? 'Refreshing Session...' : 'Continue as Anonymous Student'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Alias / Name</label>
                <input
                  type="text"
                  placeholder="e.g. HopefulLion92"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Student / Personal Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. student@wits.ac.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">University / Campus</label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                >
                  {SA_UNIVERSITIES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isLoading ? 'Syncing...' : 'Save & Sync Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
