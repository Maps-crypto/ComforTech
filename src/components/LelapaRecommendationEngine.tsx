import React, { useState } from 'react';
import { ActivityItem, CopingToolAction, MoodType, RecommendationReport, StressorCategory, UserProfile } from '../types';
import { Sparkles, Brain, Wind, BookOpen, Users, PhoneCall, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

interface LelapaRecommendationEngineProps {
  recommendations: RecommendationReport | null;
  isLoading: boolean;
  onRefresh: () => void;
  onSelectAction: (actionType: CopingToolAction['actionType']) => void;
  userProfile: UserProfile;
  currentMood?: MoodType;
  primaryStressor?: StressorCategory;
  recentActivities: ActivityItem[];
}

export const LelapaRecommendationEngine: React.FC<LelapaRecommendationEngineProps> = ({
  recommendations,
  isLoading,
  onRefresh,
  onSelectAction,
  userProfile,
  currentMood,
  primaryStressor,
  recentActivities,
}) => {
  const sentiment = recommendations?.sentimentSummary;

  const getScoreColor = (score: number) => {
    if (score < 40) return 'text-[#c3503b]';
    if (score < 65) return 'text-[#e8a33d]';
    return 'text-[#4f7c6f]';
  };

  const getScoreBg = (score: number) => {
    if (score < 40) return 'bg-[#c3503b]';
    if (score < 65) return 'bg-[#e8a33d]';
    return 'bg-[#4f7c6f]';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mindfulness':
        return <Wind className="w-4 h-4 text-[#4f7c6f]" />;
      case 'grounding':
        return <Zap className="w-4 h-4 text-[#e8a33d]" />;
      case 'journaling':
        return <BookOpen className="w-4 h-4 text-[#212b4a]" />;
      case 'peer_support':
        return <Users className="w-4 h-4 text-[#4f7c6f]" />;
      case 'counselor':
      case 'crisis':
        return <PhoneCall className="w-4 h-4 text-[#c3503b]" />;
      default:
        return <Brain className="w-4 h-4 text-[#212b4a]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Lelapa AI Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Row: Tag & Refresh */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                <Brain className="w-3.5 h-3.5" />
                Vulavula AI Wellness Engine
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                Real-Time Adaptive Triage
              </span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-all border border-slate-700 cursor-pointer"
              title="Recalculate recommendations from latest activity"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Analyzing...' : 'Recalculate Radar'}</span>
            </button>
          </div>

          {/* Radar Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Metric 1: Detected Sentiment & Wellbeing Score */}
            <div className="bg-slate-950/60 backdrop-blur-xs rounded-2xl p-4 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Emotional State</span>
                <span className="font-mono text-[11px] text-slate-500">Vulavula NLP</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-100 tracking-tight">
                  {sentiment?.detectedMood || currentMood || 'Processing...'}
                </span>
                {sentiment?.sentimentScore !== undefined && (
                  <span className={`text-xs font-mono font-bold ${getScoreColor(sentiment.sentimentScore)}`}>
                    ({sentiment.sentimentScore}/100)
                  </span>
                )}
              </div>
              {/* Score Bar */}
              {sentiment?.sentimentScore !== undefined && (
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${getScoreBg(sentiment.sentimentScore)}`}
                    style={{ width: `${Math.min(100, Math.max(10, sentiment.sentimentScore))}%` }}
                  />
                </div>
              )}
            </div>

            {/* Metric 2: Primary Stressor Factor */}
            <div className="bg-slate-950/60 backdrop-blur-xs rounded-2xl p-4 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Primary Context Trigger</span>
                <span className="font-mono text-[11px] text-slate-500">InkubaLM</span>
              </div>
              <div className="text-lg font-bold text-amber-400 truncate">
                {sentiment?.primaryStressor || primaryStressor || 'Academics & Life'}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{recentActivities.length} recent student interactions analyzed</span>
              </div>
            </div>

            {/* Metric 3: Safety Risk Priority */}
            <div className="bg-slate-950/60 backdrop-blur-xs rounded-2xl p-4 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Safety Triage Status</span>
                <span className="font-mono text-[11px] text-slate-500">Clinical Safety</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    sentiment?.riskLevel === 'high'
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                      : sentiment?.riskLevel === 'medium'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                      : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  {sentiment?.riskLevel === 'high'
                    ? 'High Priority Escalate'
                    : sentiment?.riskLevel === 'medium'
                    ? 'Medium Attention Needed'
                    : 'Low / Stable State'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {sentiment?.riskLevel === 'high'
                  ? 'SADAG 24/7 hotline 0800 567 567 active'
                  : 'Self-guided & peer pathways active'}
              </div>
            </div>
          </div>

          {/* Cultural & Context Insight */}
          {sentiment?.culturalInsight && (
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-400">Cultural & Ubuntu Context: </span>
                {sentiment.culturalInsight}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Next Best Actions Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Personalized Coping Toolkit (Real-Time)
            </h3>
            <p className="text-xs text-slate-400">
              Curated by AI Wellness Engine based on your recent activity, stress level, and language preference.
            </p>
          </div>
        </div>

        {recommendations?.recommendedActions && recommendations.recommendedActions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.recommendedActions.map((action) => (
              <div
                key={action.id}
                onClick={() => onSelectAction(action.actionType)}
                className={`group bg-slate-900/90 rounded-2xl p-5 border transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl flex flex-col justify-between ${
                  action.priority === 'immediate'
                    ? 'border-rose-500/40 hover:border-rose-500 bg-gradient-to-b from-slate-900 to-rose-950/20'
                    : action.priority === 'recommended'
                    ? 'border-emerald-500/30 hover:border-emerald-500'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700/60">
                      {getCategoryIcon(action.category)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {action.duration}
                      </span>
                      {action.priority === 'immediate' && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-rose-500 text-white">
                          Priority
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {action.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {action.reason}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Start Activity</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-400">
            Loading personalized recommendations...
          </div>
        )}
      </div>

      {/* Matched Peer Support Room & Daily Affirmation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Peer Support Recommendation */}
        {recommendations?.peerCircleRecommendation && (
          <div
            onClick={() => onSelectAction('open_peer_room')}
            className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-emerald-500 transition-all cursor-pointer shadow-lg space-y-3 group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Users className="w-4 h-4" />
              <span>Recommended Peer Circle</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                {recommendations.peerCircleRecommendation.topic}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {recommendations.peerCircleRecommendation.whyMatch}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
              <span>Join Anonymous Student Room</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Daily Affirmation */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-5 border border-slate-800 space-y-2 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Daily AI Affirmation</span>
            </div>
            <p className="text-xs italic text-slate-200 mt-2 leading-relaxed">
              "{recommendations?.affirmation || 'You are stronger than the stress of this moment. Take one slow breath at a time.'}"
            </p>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            Dedicated for {userProfile.isAnonymous ? 'Anonymous Student' : userProfile.displayName}
          </div>
        </div>
      </div>
    </div>
  );
};
