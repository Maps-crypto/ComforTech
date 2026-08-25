import React, { useState, useMemo } from 'react';
import { ActivityItem, UserProfile } from '../types';
import {
  Clock,
  Activity,
  Flame,
  Shield,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Smile,
  Meh,
  Frown,
  Calendar,
  Filter,
  BarChart3,
  LineChart as LineChartIcon,
  Wind,
  BookOpen,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface ActivityHistoryProps {
  activities: ActivityItem[];
  userProfile: UserProfile;
  onNavigate?: (view: 'app' | 'ussd' | 'chat' | 'coping' | 'peer' | 'counselor' | 'activity', tab?: any) => void;
  onLogActivity?: (title: string, desc: string, score?: number) => void;
}

type TimeframeFilter = 'all' | '7days' | 'checkins_only';
type ChartStyle = 'area' | 'bar';

interface ChartDataPoint {
  id: string;
  rawTimestamp: string;
  formattedTime: string;
  displayDate: string;
  fullDate: string;
  score: number;
  title: string;
  description: string;
  type: string;
  moodCategory: 'flourishing' | 'calm' | 'moderate' | 'elevated_stress' | 'distressed';
  moodLabel: string;
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({
  activities,
  userProfile,
  onNavigate,
  onLogActivity,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('area');
  const [activeDataIndex, setActiveDataIndex] = useState<number | null>(null);
  const [quickCheckinOpen, setQuickCheckinOpen] = useState(false);
  const [quickMood, setQuickMood] = useState<'Great' | 'Good' | 'Neutral' | 'Anxious' | 'Stressed' | 'Down'>('Good');

  // Convert and sort activities chronologically for the time-series chart
  const chartData: ChartDataPoint[] = useMemo(() => {
    const sorted = [...activities].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const filtered = sorted.filter((item) => {
      if (timeframe === '7days') {
        return new Date(item.timestamp).getTime() >= sevenDaysAgo;
      }
      if (timeframe === 'checkins_only') {
        return item.type === 'mood_checkin' || item.type === 'journal_entry';
      }
      return true;
    });

    return filtered.map((item, index) => {
      const date = new Date(item.timestamp);
      const formattedTime = date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const displayDate = date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
      const fullDate = date.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      // Default score based on activity if undefined
      let score = item.sentimentScore;
      if (typeof score !== 'number') {
        if (item.type === 'coping_tool') score = 70;
        else if (item.type === 'peer_post') score = 62;
        else if (item.type === 'journal_entry') score = 60;
        else score = 50;
      }

      let moodCategory: ChartDataPoint['moodCategory'] = 'moderate';
      let moodLabel = 'Managing Stress';

      if (score >= 75) {
        moodCategory = 'flourishing';
        moodLabel = 'Grounded & Optimistic';
      } else if (score >= 60) {
        moodCategory = 'calm';
        moodLabel = 'Calm & Stable';
      } else if (score >= 45) {
        moodCategory = 'moderate';
        moodLabel = 'Mild Tension / Coping';
      } else if (score >= 30) {
        moodCategory = 'elevated_stress';
        moodLabel = 'Elevated Anxiety';
      } else {
        moodCategory = 'distressed';
        moodLabel = 'High Distress';
      }

      return {
        id: item.id || `pt_${index}`,
        rawTimestamp: item.timestamp,
        formattedTime,
        displayDate,
        fullDate,
        score,
        title: item.title,
        description: item.description,
        type: item.type,
        moodCategory,
        moodLabel,
      };
    });
  }, [activities, timeframe]);

  // Statistical calculations
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        latestScore: 50,
        averageScore: 50,
        minScore: 50,
        maxScore: 50,
        scoreDelta: 0,
        trendDirection: 'neutral' as const,
        flourishingCount: 0,
        moderateCount: 0,
        stressedCount: 0,
      };
    }

    const scores = chartData.map((d) => d.score);
    const latestScore = scores[scores.length - 1];
    const firstScore = scores[0];
    const scoreDelta = latestScore - firstScore;
    const averageScore = Math.round(
      scores.reduce((acc, s) => acc + s, 0) / scores.length
    );
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    const flourishingCount = scores.filter((s) => s >= 65).length;
    const moderateCount = scores.filter((s) => s >= 45 && s < 65).length;
    const stressedCount = scores.filter((s) => s < 45).length;

    return {
      latestScore,
      averageScore,
      minScore,
      maxScore,
      scoreDelta,
      trendDirection: scoreDelta > 0 ? ('up' as const) : scoreDelta < 0 ? ('down' as const) : ('neutral' as const),
      flourishingCount,
      moderateCount,
      stressedCount,
    };
  }, [chartData]);

  // Quick check-in submit handler
  const handleQuickCheckinSubmit = () => {
    const scoreMap: Record<string, number> = {
      Great: 88,
      Good: 74,
      Neutral: 55,
      Anxious: 42,
      Stressed: 36,
      Down: 28,
    };
    const score = scoreMap[quickMood] || 50;
    if (onLogActivity) {
      onLogActivity(
        'Quick Mood Check-In',
        `Logged sentiment score ${score}/100 (${quickMood}) from Mood Trends view`,
        score
      );
    }
    setQuickCheckinOpen(false);
  };

  // Color generator for chart nodes
  const getScoreColor = (score: number) => {
    if (score >= 70) return '#10b981'; // Emerald
    if (score >= 50) return '#f59e0b'; // Amber
    return '#f43f5e'; // Rose
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Header & Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-indigo-300 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Lelapa Emotional Health Telemetry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Student Activity & Mood Trends
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Track your emotional well-being trajectory over time. Visualizing your sentiment score allows you to recognize stressors and measure the positive impact of grounding and peer support.
            </p>
          </div>

          {/* Quick Check-in CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setQuickCheckinOpen(!quickCheckinOpen)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Smile className="w-4 h-4" />
              <span>Log Mood Point</span>
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate('coping', 'breathing')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Wind className="w-4 h-4 text-emerald-400" />
                <span>Box Breathing</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Mood Logger Expansion */}
        {quickCheckinOpen && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-slate-950/80 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  Select your current emotional state to plot a new telemetry point:
                </span>
                <button
                  onClick={() => setQuickCheckinOpen(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['Great', 'Good', 'Neutral', 'Anxious', 'Stressed', 'Down'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setQuickMood(m)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      quickMood === m
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md scale-105'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleQuickCheckinSubmit}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Save & Update Mood Trend
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Latest Sentiment Score */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Current Sentiment</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {stats.latestScore}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 100</span>
          </div>
          <div className="text-[11px] flex items-center gap-1.5 font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                stats.latestScore >= 70
                  ? 'bg-emerald-400'
                  : stats.latestScore >= 50
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            />
            <span className="text-slate-300">
              {stats.latestScore >= 70
                ? 'Regulated / Grounded'
                : stats.latestScore >= 50
                ? 'Stable Resilience'
                : 'Elevated Support Needed'}
            </span>
          </div>
        </div>

        {/* 7-Day Trajectory Delta */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Trajectory</span>
            {stats.scoreDelta >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold font-mono ${
                stats.scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {stats.scoreDelta > 0 ? `+${stats.scoreDelta}` : stats.scoreDelta}
            </span>
            <span className="text-xs text-slate-400">pts</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {stats.scoreDelta >= 0
              ? 'Positive recovery since first check-in'
              : 'Trending under heavier semester load'}
          </div>
        </div>

        {/* Average Sentiment Index */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average Index</span>
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-300 font-mono">
              {stats.averageScore}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Across {chartData.length} recorded interactions
          </div>
        </div>

        {/* Streak & Privacy */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Wellness Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">
              {userProfile.streakDays}
            </span>
            <span className="text-xs text-slate-400">Days active</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>POPIA Protected</span>
          </div>
        </div>
      </div>

      {/* PRIMARY RECHARTS MOOD TRENDS VISUALIZATION */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl backdrop-blur-md space-y-6">
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">
                Emotional Well-Being Curve (Sentiment Index)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Sentiment score computed from Vulavula NLP and self-reported check-in metrics (0: High Distress $\to$ 100: Grounded & Thriving).
            </p>
          </div>

          {/* Controls: Timeframe filter & Style toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe Chips */}
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setTimeframe('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeframe === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Data
              </button>
              <button
                onClick={() => setTimeframe('7days')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeframe === '7days'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeframe('checkins_only')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeframe === 'checkins_only'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Check-Ins Only
              </button>
            </div>

            {/* Chart Type Toggle */}
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setChartStyle('area')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  chartStyle === 'area'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Continuous Area Trend"
              >
                <LineChartIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartStyle('bar')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  chartStyle === 'bar'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Discrete Bar Breakdown"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Legend / Zone Indicators */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
            <span className="text-slate-300 font-medium">70–100: Grounded & Resilient</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
            <span className="text-slate-300 font-medium">45–69: Coping with Stress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
            <span className="text-slate-300 font-medium">&lt;45: Needs Self-Care / Peer Care</span>
          </div>
        </div>

        {/* Recharts Render Container */}
        <div className="w-full h-72 sm:h-80 pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartStyle === 'area' ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  onMouseMove={(state) => {
                    if (state && state.activeTooltipIndex !== undefined) {
                      setActiveDataIndex(state.activeTooltipIndex);
                    }
                  }}
                  onMouseLeave={() => setActiveDataIndex(null)}
                >
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                      <stop offset="50%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

                  <XAxis
                    dataKey="displayDate"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    dy={8}
                  />

                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => `${val}%`}
                  />

                  {/* Reference Threshold Lines */}
                  <ReferenceLine
                    y={70}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                    label={{
                      value: 'Grounded Zone (70%)',
                      fill: '#10b981',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                  <ReferenceLine
                    y={40}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    label={{
                      value: 'Care Threshold (40%)',
                      fill: '#f43f5e',
                      fontSize: 10,
                      position: 'insideBottomRight',
                    }}
                  />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as ChartDataPoint;
                        return (
                          <div className="bg-slate-950/95 border border-slate-700 rounded-2xl p-4 shadow-2xl text-slate-100 space-y-2 backdrop-blur-md max-w-xs animate-in fade-in-50">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                              <span className="font-mono">{data.fullDate}</span>
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  data.score >= 70
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : data.score >= 50
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {data.moodLabel}
                              </span>
                            </div>

                            <div className="flex items-baseline justify-between pt-1">
                              <span className="text-xs font-bold text-white truncate max-w-[170px]">
                                {data.title}
                              </span>
                              <span className="text-xl font-bold font-mono text-emerald-400">
                                {data.score}
                                <span className="text-xs text-slate-400">/100</span>
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              {data.description}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#moodGradient)"
                    activeDot={{
                      r: 6,
                      fill: '#10b981',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as ChartDataPoint;
                        return (
                          <div className="bg-slate-950/95 border border-slate-700 rounded-2xl p-4 shadow-2xl text-slate-100 space-y-1.5 backdrop-blur-md max-w-xs">
                            <span className="text-[10px] text-slate-400 font-mono">{data.fullDate}</span>
                            <div className="text-sm font-bold text-white">{data.title}</div>
                            <div className="text-lg font-bold font-mono text-amber-400">
                              Score: {data.score} / 100
                            </div>
                            <p className="text-xs text-slate-300">{data.description}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-950/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              <Info className="w-8 h-8 text-slate-500 mb-2" />
              <span>No data points found for this filter. Log a check-in to begin tracking.</span>
            </div>
          )}
        </div>

        {/* Emotion Distribution Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                <Smile className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Grounded & Calm</div>
                <div className="text-[10px] text-slate-400">Score &ge; 65%</div>
              </div>
            </div>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {stats.flourishingCount}
            </span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                <Meh className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Mild Tension</div>
                <div className="text-[10px] text-slate-400">Score 45–64%</div>
              </div>
            </div>
            <span className="text-lg font-bold font-mono text-amber-400">
              {stats.moderateCount}
            </span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                <Frown className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Elevated Stress</div>
                <div className="text-[10px] text-slate-400">Score &lt; 45%</div>
              </div>
            </div>
            <span className="text-lg font-bold font-mono text-rose-400">
              {stats.stressedCount}
            </span>
          </div>
        </div>
      </div>

      {/* DETAILED ACTIVITY STREAM TIMELINE */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Real-Time Activity & Check-In Ledger
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {activities.length} Total Events
          </span>
        </div>

        <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
          {activities.map((item, idx) => {
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            });
            const formattedTime = date.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={item.id || idx} className="relative flex items-start gap-4 pl-1 group">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 ring-4 ring-slate-900 z-10 shadow-xs group-hover:bg-emerald-500 transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-950/70 rounded-2xl p-4 flex-1 border border-slate-800 hover:border-slate-700 space-y-2 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-100">{item.title}</span>
                    <div className="flex items-center gap-2">
                      {item.sentimentScore !== undefined && (
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            item.sentimentScore >= 70
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : item.sentimentScore >= 50
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {item.sentimentScore}% Sentiment
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400">
                        {formattedDate} · {formattedTime}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
