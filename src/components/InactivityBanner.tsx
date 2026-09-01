import React from 'react';
import { motion } from 'motion/react';
import { Heart, X, Sparkles, Clock, ArrowRight, Smile, Wind } from 'lucide-react';
import { MoodType } from '../types';

interface InactivityBannerProps {
  hoursSinceLastActivity: number | null;
  daysSinceLastActivity: number | null;
  onDismiss: () => void;
  onQuickMoodCheckIn: (mood: MoodType) => void;
  onOpenCheckInTool: () => void;
}

export const InactivityBanner: React.FC<InactivityBannerProps> = ({
  hoursSinceLastActivity,
  daysSinceLastActivity,
  onDismiss,
  onQuickMoodCheckIn,
  onOpenCheckInTool,
}) => {
  const timeText = daysSinceLastActivity !== null && daysSinceLastActivity >= 2
    ? `${daysSinceLastActivity} days`
    : hoursSinceLastActivity !== null
    ? `${hoursSinceLastActivity} hours`
    : 'over 48 hours';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.99 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative overflow-hidden bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-slate-50 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 shadow-xs"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Icon & Copy */}
        <div className="flex items-start gap-3.5 max-w-2xl">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Heart className="w-4 h-4 fill-emerald-100 text-emerald-100" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>We missed you, checking in?</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                <Clock className="w-2.5 h-2.5" />
                Last check-in {timeText} ago
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              University demands can easily get overwhelming. Take 30 seconds to anchor your mind and register your emotional pulse.
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action Pills & Dismiss */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 self-start md:self-center">
          <div className="flex items-center gap-1.5">
            {[
              { mood: 'Good' as MoodType, emoji: '🌱', label: 'Good' },
              { mood: 'Neutral' as MoodType, emoji: '⚖️', label: 'Okay' },
              { mood: 'Anxious' as MoodType, emoji: '⚡', label: 'Anxious' },
              { mood: 'Overwhelmed' as MoodType, emoji: '🚨', label: 'Stressed' },
            ].map((item) => (
              <motion.button
                key={item.mood}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={() => onQuickMoodCheckIn(item.mood)}
                className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                title={`Quick log: ${item.label}`}
              >
                <span>{item.emoji}</span>
                <span className="hidden lg:inline text-[11px]">{item.label}</span>
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenCheckInTool}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
          >
            <span>Full Check-In</span>
            <ArrowRight className="w-3 h-3 text-emerald-400" />
          </motion.button>

          <button
            onClick={onDismiss}
            aria-label="Dismiss check-in alert"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
