import React, { useState, useEffect } from 'react';
import { CRISIS_CONTACTS, LANGUAGES } from '../data/mockData';
import { LanguageCode, UserProfile } from '../types';
import { PhoneCall, ShieldCheck, Clock, CheckCircle2, Building, HeartHandshake, AlertTriangle, ArrowRight, MapPin, Globe } from 'lucide-react';

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

  useEffect(() => {
    setCallbackLang(selectedLanguage);
  }, [selectedLanguage]);

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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Info */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider font-mono">
          <HeartHandshake className="w-4 h-4" />
          Confidential Human Care Network
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Connect with Professional Student Counselors
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
          Free, professional, and non-judgmental counseling through SADAG, Higher Health, and South African University Psychological Services.
        </p>
      </div>

      {/* 24/7 National Emergency Helplines Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-rose-600" />
          Instant Toll-Free Helplines (24/7 Available Free of Airtime)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CRISIS_CONTACTS.slice(0, 3).map((contact) => (
            <div
              key={contact.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 flex flex-col justify-between space-y-3 transition-colors"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {contact.category}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">{contact.name}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{contact.description}</p>
                <div className="text-[10px] text-emerald-700 font-bold font-mono">
                  {contact.available} · {contact.cost}
                </div>
              </div>

              <a
                href={`tel:${contact.number.replace(/\s+/g, '')}`}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call {contact.number}</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Request Callback Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Request a Free Confidential Callback
            </h3>
            <p className="text-xs text-slate-600">
              We route your callback request to Higher Health & SADAG student officers in your preferred language.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">Callback Request Received</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              A student wellness officer will reach out via discreet SMS / call within your requested timeframe.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setPhoneNumber('');
              }}
              className="text-xs font-bold text-emerald-700 underline pt-2 cursor-pointer"
            >
              Submit another request
            </button>
          </div>
        ) : (
          <form onSubmit={handleRequestCallback} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  South African Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 082 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Callback Language
                </label>
                <select
                  value={callbackLang}
                  onChange={(e) => setCallbackLang(e.target.value as LanguageCode)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Urgency Level</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  'Standard (within 24h)',
                  'Urgent (within 2 hours)',
                  'Immediate Crisis',
                ].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setUrgency(lvl as any)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      urgency === lvl
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {isSubmitting ? 'Routing request securely...' : 'Submit Confidential Callback Request'}
            </button>
          </form>
        )}
      </div>

      {/* University Psychological Services Directory */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Building className="w-4 h-4 text-emerald-600" />
          South African University Campus Psychological Centers
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {universityUnits.map((u, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">{u.name}</h4>
                <span className="text-[10px] text-slate-500 font-mono">{u.location}</span>
              </div>
              <div className="text-xs font-bold text-emerald-700 font-mono">
                {u.phone}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
