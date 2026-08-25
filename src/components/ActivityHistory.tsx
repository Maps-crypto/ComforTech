import React from 'react';
import { ActivityItem, UserProfile } from '../types';
import { Clock, Activity, Flame, Shield, Sparkles, CheckCircle2 } from 'lucide-react';

interface ActivityHistoryProps {
  activities: ActivityItem[];
  userProfile: UserProfile;
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({
  activities,
  userProfile,
}) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex items-center gap-3.5 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">
              {userProfile.streakDays} Days
            </div>
            <div className="text-xs text-slate-400">Wellness Streak</div>
          </div>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex items-center gap-3.5 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">
              {activities.length} Events
            </div>
            <div className="text-xs text-slate-400">Interactions Logged</div>
          </div>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex items-center gap-3.5 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 truncate">
              {userProfile.isAnonymous ? 'Guest Anonymous' : userProfile.authProvider ? `${userProfile.authProvider} Synced` : 'Email Synced'}
            </div>
            <div className="text-xs text-slate-400">Session Privacy</div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Real-Time Activity Stream
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Lelapa Context Ledger
          </span>
        </div>

        <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
          {activities.map((item, idx) => (
            <div key={item.id || idx} className="relative flex items-start gap-4 pl-1">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 ring-4 ring-slate-900 z-10 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="bg-slate-950/70 rounded-2xl p-4 flex-1 border border-slate-800 hover:border-slate-700 space-y-1 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">{item.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

