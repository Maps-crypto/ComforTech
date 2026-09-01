import React from 'react';
import { CRISIS_CONTACTS } from '../data/mockData';
import { LanguageCode } from '../types';
import { getTranslation } from '../utils/translations';
import { PhoneCall, AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  selectedLanguage?: LanguageCode;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, selectedLanguage = 'en', onClose }) => {
  if (!isOpen) return null;
  const t = getTranslation(selectedLanguage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-rose-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 border border-rose-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans text-slate-900">24/7 Crisis & Emergency Helplines</h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-700 font-bold">
                Free Toll-Free National Lines (South Africa)
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {t.home.emergencyBannerText || 'Free, 24/7, confidential support across all South African provinces. You never have to carry this alone.'}
          </p>
        </div>

        {/* Helpline List */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {CRISIS_CONTACTS.map((c) => (
            <div
              key={c.id}
              className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 hover:border-slate-300 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900">{c.name}</div>
                <div className="text-[11px] text-slate-600">{c.description}</div>
                <div className="text-[10px] font-mono text-rose-700 font-bold">
                  {c.available} · {c.cost}
                </div>
              </div>

              <a
                href={`tel:${c.number.replace(/\s+/g, '')}`}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call {c.number}</span>
              </a>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 text-center text-xs text-slate-600 border-t border-slate-200">
          In an immediate physical emergency, dial <strong className="text-rose-700 font-bold">112</strong> from any mobile phone (free of airtime).
        </div>
      </div>
    </div>
  );
};
