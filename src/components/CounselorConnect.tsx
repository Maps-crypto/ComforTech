import React, { useState } from 'react';
import { CRISIS_CONTACTS, LANGUAGES } from '../data/mockData';
import { LanguageCode, UserProfile } from '../types';
import { PhoneCall, ShieldCheck, Clock, CheckCircle2, Building, HeartHandshake, AlertTriangle, ArrowRight } from 'lucide-react';

interface CounselorConnectProps {
  userProfile: UserProfile;
  selectedLanguage: LanguageCode;
  onActivityLogged: (title: string, desc: string, score?: number) => void;
}

export const CounselorConnect: React.FC<CounselorConnectProps> = ({
  userProfile,
  selectedLanguage,
  onActivityLogged,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callbackLang, setCallbackLang] = useState<LanguageCode>(selectedLanguage);
  const [urgency, setUrgency] = useState<'Standard (within 24h)' | 'Urgent (within 2 hours)' | 'Immediate Crisis'>('Standard (within 24h)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRequestCallback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 9) {
      alert('Please enter a valid South African phone number');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      onActivityLogged(
        'Counselor Callback Requested',
        `Requested support callback (${urgency})`,
        urgency === 'Immediate Crisis' ? 20 : 50
      );
    }, 800);
  };

  const universityUnits = [
    { name: 'Wits University (CCDU)', location: 'Braamfontein, JHB', phone: '011 717 9140 / Crisis: 0800 111 331' },
    { name: 'UCT Student Wellness Service', location: 'Rondebosch, Cape Town', phone: '021 650 1017 / 0800 24 25 26' },
    { name: 'University of Pretoria (Student Counselling)', location: 'Hatfield, Pretoria', phone: '0800 747 747 (24/7 UP Careline)' },
    { name: 'University of Johannesburg (PsyCaD)', location: 'Auckland Park / Soweto', phone: '011 559 3106 / 0800 011 800' },
    { name: 'UKZN Student Support Services', location: 'Durban / Pietermaritzburg', phone: '031 260 7340' },
    { name: 'Stellenbosch University (CSCD)', location: 'Stellenbosch / Tygerberg', phone: '021 808 4707 / Crisis 010 205 3056' },
    { name: 'UNISA Student Development & Counselling', location: 'National / Distance', phone: '012 441 5388' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900/90 border border-slate-800 text-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <HeartHandshake className="w-4 h-4" />
            Confidential Human Care
          </div>
          <h2 className="text-2xl font-bold font-sans text-white">
            Connect with a Dedicated Student Counselor
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Free, professional, and non-judgmental counseling through SADAG, Higher Health, and South African University Support Divisions.
          </p>
        </div>
      </div>

      {/* 24/7 National Emergency Helplines Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-rose-400" />
          Instant Toll-Free Helplines (24/7 Available)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CRISIS_CONTACTS.slice(0, 3).map((contact) => (
            <div
              key={contact.id}
              className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between space-y-3 backdrop-blur-md transition-colors"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {contact.category}
                </span>
                <h4 className="text-sm font-bold text-slate-100 mt-1">{contact.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{contact.description}</p>
              </div>

              <a
                href={`tel:${contact.number.replace(/\s+/g, '')}`}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-600/20 cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call {contact.number}</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Request Callback Form */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Request a Free Confidential Callback
            </h3>
            <p className="text-xs text-slate-400">
              We route your request to SADAG & Higher Health student liaison officers in your preferred language.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-100">Callback Request Queued</h4>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              A trained student counselor will call or SMS you on <strong>{phoneNumber}</strong> within your selected timeframe.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline pt-2 cursor-pointer"
            >
              Submit another request
            </button>
          </div>
        ) : (
          <form onSubmit={handleRequestCallback} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Cell Phone / WhatsApp <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 072 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Preferred Language
                </label>
                <select
                  value={callbackLang}
                  onChange={(e) => setCallbackLang(e.target.value as LanguageCode)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-700 bg-slate-950/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-slate-900 text-slate-100">
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Urgency Level
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-700 bg-slate-950/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Standard (within 24h)" className="bg-slate-900 text-slate-100">Standard (within 24h)</option>
                  <option value="Urgent (within 2 hours)" className="bg-slate-900 text-slate-100">Urgent (within 2 hours)</option>
                  <option value="Immediate Crisis" className="bg-slate-900 text-slate-100">Immediate Crisis (Priority)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{isSubmitting ? 'Dispatching callback...' : 'Request Free Counselor Callback'}</span>
            </button>
          </form>
        )}
      </div>

      {/* University Counseling Units Directory */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-200">
            Campus Student Wellness & Counselling Directory
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {universityUnits.map((u, i) => (
            <div
              key={i}
              className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs space-y-1"
            >
              <div className="font-bold text-slate-100">{u.name}</div>
              <div className="text-[11px] text-slate-400">{u.location}</div>
              <div className="text-[11px] font-mono text-emerald-400 font-semibold">{u.phone}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

