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
      <div className="bg-gradient-to-br from-[#212b4a] to-[#161d34] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#212b4a] relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#4f7c6f]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#e8a33d]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Row: Tag & Refresh */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#4f7c6f] text-white rounded-full text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-xs">
                <Brain className="w-3.5 h-3.5" />
                Lelapa Vulavula AI Engine
              </span>
              <span className="text-xs text-[#b9c0d6] font-medium hidden sm:inline">
                Real-Time Adaptive Triage
              </span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all border border-white/15"
              title="Recalculate recommendations from latest activity"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Analyzing...' : 'Recalculate Radar'}</span>
            </button>
          </div>

          {/* Radar Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Metric 1: Detected Sentiment & Wellbeing Score */}
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#b9c0d6]">
                <span>Emotional State</span>
                <span className="font-mono text-[11px]">Vulavula NLP</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white tracking-tight">
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
                <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${getScoreBg(sentiment.sentimentScore)}`}
                    style={{ width: `${Math.min(100, Math.max(10, sentiment.sentimentScore))}%` }}
                  />
                </div>
              )}
            </div>

            {/* Metric 2: Primary Stressor Factor */}
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#b9c0d6]">
                <span>Primary Context Trigger</span>
                <span className="font-mono text-[11px]">InkubaLM</span>
              </div>
              <div className="text-lg font-bold text-[#e8a33d] truncate">
                {sentiment?.primaryStressor || primaryStressor || 'Academics & Life'}
              </div>
              <div className="text-[11px] text-[#b9c0d6] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e8a33d]" />
                <span>{recentActivities.length} recent student interactions analyzed</span>
              </div>
            </div>

            {/* Metric 3: Safety Risk Priority */}
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#b9c0d6]">
                <span>Safety Triage Status</span>
                <span className="font-mono text-[11px]">Clinical Safety</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    sentiment?.riskLevel === 'high'
                      ? 'bg-[#c3503b] text-white'
                      : sentiment?.riskLevel === 'medium'
                      ? 'bg-[#e8a33d] text-[#1c1a16]'
                      : 'bg-[#4f7c6f] text-white'
                  }`}
                >
                  {sentiment?.riskLevel === 'high'
                    ? 'High Priority Escalate'
                    : sentiment?.riskLevel === 'medium'
                    ? 'Medium Attention Needed'
                    : 'Low / Stable State'}
                </span>
              </div>
              <div className="text-[11px] text-[#b9c0d6]">
                {sentiment?.riskLevel === 'high'
                  ? 'SADAG 24/7 hotline 0800 567 567 active'
                  : 'Self-guided & peer pathways active'}
              </div>
            </div>
          </div>

          {/* Cultural & Context Insight */}
          {sentiment?.culturalInsight && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-[#f3eee4] leading-relaxed flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-[#e8a33d] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#e8a33d]">Lelapa Cultural Context: </span>
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
            <h3 className="text-base font-bold text-[#1c1a16] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4f7c6f]" />
              Personalized Coping Toolkit (Real-Time)
            </h3>
            <p className="text-xs text-[#5c574c]">
              Curated by Lelapa AI based on your recent activity, stress level, and language preference.
            </p>
          </div>
        </div>

        {recommendations?.recommendedActions && recommendations.recommendedActions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.recommendedActions.map((action) => (
              <div
                key={action.id}
                onClick={() => onSelectAction(action.actionType)}
                className={`group bg-white rounded-2xl p-5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between ${
                  action.priority === 'immediate'
                    ? 'border-[#c3503b]/40 hover:border-[#c3503b] bg-linear-to-b from-white to-[#c3503b]/5'
                    : action.priority === 'recommended'
                    ? 'border-[#4f7c6f]/30 hover:border-[#4f7c6f]'
                    : 'border-[#e8e0d0] hover:border-[#212b4a]/40'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-[#f3eee4] flex items-center justify-center">
                      {getCategoryIcon(action.category)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#e8e0d0] text-[#5c574c]">
                        {action.duration}
                      </span>
                      {action.priority === 'immediate' && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-[#c3503b] text-white">
                          Priority
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[#1c1a16] group-hover:text-[#4f7c6f] transition-colors line-clamp-1">
                      {action.title}
                    </h4>
                    <p className="text-xs text-[#5c574c] mt-1 line-clamp-2 leading-relaxed">
                      {action.reason}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-[#f3eee4] flex items-center justify-between text-xs font-bold text-[#4f7c6f] group-hover:translate-x-0.5 transition-transform">
                  <span>Start Activity</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#e8e0d0] text-xs text-[#5c574c]">
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
            className="bg-white rounded-2xl p-5 border border-[#e8e0d0] hover:border-[#4f7c6f] transition-all cursor-pointer shadow-xs space-y-3 group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[#4f7c6f]">
              <Users className="w-4 h-4" />
              <span>Recommended Peer Circle</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1c1a16] group-hover:text-[#4f7c6f] transition-colors">
                {recommendations.peerCircleRecommendation.topic}
              </h4>
              <p className="text-xs text-[#5c574c] mt-1">
                {recommendations.peerCircleRecommendation.whyMatch}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-[#4f7c6f]">
              <span>Join Anonymous Student Room</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Daily Affirmation */}
        <div className="bg-gradient-to-br from-[#f3eee4] to-[#e8e0d0] rounded-2xl p-5 border border-[#e8e0d0] space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#c9822a]">
              <Sparkles className="w-4 h-4" />
              <span>Lelapa Daily Affirmation</span>
            </div>
            <p className="text-xs italic text-[#1c1a16] mt-2 leading-relaxed">
              "{recommendations?.affirmation || 'You are stronger than the stress of this moment. Take one slow breath at a time.'}"
            </p>
          </div>
          <div className="text-[11px] text-[#5c574c] pt-2 border-t border-[#e8e0d0]/60">
            Dedicated for {userProfile.isAnonymous ? 'Anonymous Student' : userProfile.displayName}
          </div>
        </div>
      </div>
    </div>
  );
};
