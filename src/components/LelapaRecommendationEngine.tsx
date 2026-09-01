import React from 'react';
import { ActivityItem, CopingToolAction, MoodType, RecommendationReport, StressorCategory, UserProfile } from '../types';
import { Sparkles, Brain, Wind, BookOpen, Users, PhoneCall, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, Zap, ShieldCheck } from 'lucide-react';

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
    if (score < 40) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (score < 65) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mindfulness':
        return <Wind className="w-4 h-4 text-emerald-600" />;
      case 'grounding':
        return <Zap className="w-4 h-4 text-amber-600" />;
      case 'journaling':
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'peer_support':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'counselor':
      case 'crisis':
        return <PhoneCall className="w-4 h-4 text-rose-600" />;
      default:
        return <Brain className="w-4 h-4 text-slate-700" />;
    }
  };

  const defaultActions: CopingToolAction[] = [
    {
      id: 'act_1',
      title: '2-Minute Box Breathing',
      reason: 'Slow down heart rate and lower adrenaline before studying.',
      duration: '2 min',
      category: 'mindfulness',
      actionType: 'tool_box_breathing',
      priority: 'immediate',
    },
    {
      id: 'act_2',
      title: 'Multilingual Voice Reflection',
      reason: 'Speak your thoughts freely in your home language.',
      duration: '3 min',
      category: 'journaling',
      actionType: 'tool_journal',
      priority: 'recommended',
    },
    {
      id: 'act_3',
      title: 'Connect with Campus Circle',
      reason: 'See how other students navigate exam pressure.',
      duration: '5 min',
      category: 'peer_support',
      actionType: 'open_peer_room',
      priority: 'optional',
    },
  ];

  const actions: CopingToolAction[] =
    (recommendations?.recommendedActions && Array.isArray(recommendations.recommendedActions) && recommendations.recommendedActions.length > 0)
      ? recommendations.recommendedActions
      : ((recommendations as any)?.suggestedActions && Array.isArray((recommendations as any).suggestedActions))
      ? (recommendations as any).suggestedActions.map((a: any) => ({
          id: a.id || 'act_gen',
          title: a.title || 'Wellness Micro-Action',
          reason: a.reason || a.description || 'Supportive exercise',
          duration: a.duration || `${a.durationMinutes || 3} min`,
          category: a.category || 'mindfulness',
          actionType: a.actionType || 'tool_box_breathing',
          priority: a.priority || 'recommended',
        }))
      : defaultActions;

  const wellbeingScore = sentiment?.sentimentScore ?? (recommendations as any)?.wellbeingScore ?? 65;
  const detectedMood = sentiment?.detectedMood || (recommendations as any)?.detectedMood || currentMood || 'Processing...';
  const primaryFocus = primaryStressor || sentiment?.primaryStressor || (sentiment as any)?.primaryStressors?.[0] || 'Academic Pacing & Exams';
  const culturalReflection = sentiment?.culturalInsight || (recommendations as any)?.culturalInsight || recommendations?.affirmation;

  return (
    <div className="space-y-4">
      {/* Personalized Wellness Insights Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded-md text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Brain className="w-3.5 h-3.5 text-emerald-400" />
                Adaptive Wellness Radar
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Continuously learning from your check-ins & reflections
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Personalized Student Wellness Insights
            </h3>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-all border border-slate-200 cursor-pointer"
            title="Recalculate recommendations from latest activity"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Refresh Insights'}</span>
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Emotional State */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Detected Emotional State
            </span>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-xl font-bold text-slate-900">
                {detectedMood}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-tight">
              {(sentiment as any)?.trendAnalysis || 'Based on your recent check-in pulse and journal logs.'}
            </p>
          </div>

          {/* Card 2: Resilience Index */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Wellbeing & Resilience Index
            </span>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {wellbeingScore}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 100</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getScoreColor(wellbeingScore)}`}>
                {wellbeingScore >= 65 ? 'Resilient' : wellbeingScore >= 40 ? 'Moderate Strain' : 'Support Needed'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-tight">
              Continuously calibrated through coping practices and self-reflections.
            </p>
          </div>

          {/* Card 3: Key Area of Focus */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Primary Life Area
            </span>
            <div className="pt-1">
              <span className="text-base font-bold text-slate-900">
                {primaryFocus}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-tight">
              Focusing micro-coping tools and peer stories around this stressor.
            </p>
          </div>
        </div>

        {/* Culturally Grounded Insight Message */}
        {culturalReflection && (
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-emerald-950">
                Culturally Grounded Reflection & Strength
              </h4>
              <p className="text-xs text-emerald-900 leading-relaxed">
                {culturalReflection}
              </p>
            </div>
          </div>
        )}

        {/* Recommended Actions List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Suggested Micro-Actions for You Right Now
            </h4>
            <span className="text-xs text-slate-500">
              {actions.length} tailored {actions.length === 1 ? 'option' : 'options'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {actions.map((action) => (
              <div
                key={action.id}
                className="bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between space-y-3 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                      {getCategoryIcon(action.category)}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {action.duration || `${(action as any).durationMinutes || 2} min`}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900">{action.title}</h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {action.reason || (action as any).description}
                  </p>
                </div>

                <button
                  onClick={() => onSelectAction(action.actionType)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <span>Start Activity</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
