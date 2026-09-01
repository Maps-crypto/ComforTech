import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  Bot,
  Brain,
  Calendar,
  Check,
  Clock,
  Copy,
  Download,
  Flame,
  Globe,
  HeartHandshake,
  Lightbulb,
  Mic,
  RefreshCw,
  Share2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { VoiceJournalEntry, VoiceSentimentSummaryReport } from '../types';

interface VoiceSummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: VoiceSentimentSummaryReport | null;
  isLoading: boolean;
  onRegenerate: () => void;
  voiceEntries: VoiceJournalEntry[];
  onOpenTool?: (tool: string) => void;
}

export const VoiceSummaryReportModal: React.FC<VoiceSummaryReportModalProps> = ({
  isOpen,
  onClose,
  report,
  isLoading,
  onRegenerate,
  voiceEntries,
  onOpenTool,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySummary = () => {
    if (!report) return;
    const text = `comforTech AI Voice Sentiment Summary Report
Trajectory: ${report.overallTrajectory.toUpperCase()} · Avg Sentiment: ${report.averageSentimentScore}%
Entries Analyzed: ${report.totalEntriesAnalyzed} (${Math.round(report.totalDurationSeconds / 60)} min total audio)

Key Trend:
${report.sentimentTrendSummary}

Top Speech Patterns:
${report.speechPatterns.map((p) => `• ${p.pattern}: ${p.description}`).join('\n')}

Acoustic & Cadence:
${report.acousticAndCadenceInsights}

Campus & Ubuntu Context:
${report.culturalAndContextualObservation}

Strategies:
${report.actionableGrowthStrategies.map((s) => `• ${s.title}: ${s.action}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const getTrajectoryBadge = (traj: string) => {
    switch (traj) {
      case 'improving':
        return {
          icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
          label: 'Upward Recovery Trajectory',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'declining':
        return {
          icon: <TrendingDown className="w-4 h-4 text-rose-500" />,
          label: 'Elevated Strain Detected',
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'fluctuating':
        return {
          icon: <Activity className="w-4 h-4 text-amber-500" />,
          label: 'Dynamic Fluctuating Pacing',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-sky-500" />,
          label: 'Stable Emotional Grounding',
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
        };
    }
  };

  const getKeywordBadge = (type: string) => {
    switch (type) {
      case 'stress':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'positive':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'grounded':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const trajBadge = report ? getTrajectoryBadge(report.overallTrajectory) : null;

  return (
    <div
      id="voice-summary-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Voice Speech & Sentiment Summary Report
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hidden sm:inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Vulavula AI Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pattern recognition across your spoken reflections and speech sentiment velocity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Re-analyze voice entries"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden md:inline">Re-analyze</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 text-slate-800 flex-1">
          {isLoading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  Synthesizing Speech Sentiment Patterns...
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Analyzing {voiceEntries.length} voice log recordings, vocabulary frequencies, vocal cadence, and African linguistic context.
                </p>
              </div>
            </div>
          ) : report ? (
            <>
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Metric 1: Trajectory */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Sentiment Trajectory
                  </span>
                  {trajBadge && (
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${trajBadge.bg}`}
                    >
                      {trajBadge.icon}
                      <span>{trajBadge.label}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-600 leading-snug pt-1">
                    Based on comparative delta across {report.totalEntriesAnalyzed} voice journal entries.
                  </p>
                </div>

                {/* Metric 2: Average Score */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Average Speech Sentiment
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-emerald-600">
                      {report.averageSentimentScore}%
                    </span>
                    <span className="text-xs text-slate-500">
                      {report.averageSentimentScore >= 70
                        ? 'High Clarity & Positivity'
                        : report.averageSentimentScore >= 50
                        ? 'Moderate / Mixed Load'
                        : 'Elevated Stress & Fatigue'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(5, report.averageSentimentScore)}%` }}
                    />
                  </div>
                </div>

                {/* Metric 3: Log Telemetry */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Spoken Telemetry Scope
                  </span>
                  <div className="flex items-center gap-4 pt-1">
                    <div>
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {report.totalEntriesAnalyzed}
                      </div>
                      <div className="text-[11px] text-slate-500">Voice Logs</div>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div>
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {Math.round(report.totalDurationSeconds)}s
                      </div>
                      <div className="text-[11px] text-slate-500">Spoken Audio</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-600" />
                    <span>Analyzed {new Date(report.generatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Trend Overview Summary Banner */}
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>AI Longitudinal Voice Sentiment Diagnosis</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed font-medium">
                  {report.sentimentTrendSummary}
                </p>
              </div>

              {/* Recent Entries Progression Timeline */}
              {voiceEntries.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                      Voice Sentiment Progression Timeline
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Chronological Spoken Entries
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {voiceEntries.slice(0, 4).map((entry, idx) => (
                      <div
                        key={entry.id || idx}
                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 transition-all space-y-2 text-left"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="font-mono font-bold">
                            #{voiceEntries.length - idx} · {entry.language || 'English'}
                          </span>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {entry.sentimentScore}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium line-clamp-2 italic">
                          "{entry.transcript}"
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                          <span className="truncate max-w-[110px]">{entry.detectedMood}</span>
                          <span>{new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Identified Speech Sentiment Patterns */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-emerald-600" />
                  Identified Speech & Sentiment Patterns
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {report.speechPatterns.map((pat, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-bold text-slate-900 leading-snug">
                            {pat.pattern}
                          </h5>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                              pat.frequency === 'frequent'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {pat.frequency}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {pat.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">Context: </span>
                        {pat.triggerOrContext}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dominant Emotional Keywords */}
              {report.dominantEmotionalKeywords && report.dominantEmotionalKeywords.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    Dominant Spoken Emotional Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {report.dominantEmotionalKeywords.map((kw, i) => (
                      <div
                        key={i}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${getKeywordBadge(
                          kw.sentimentType
                        )}`}
                      >
                        <span>{kw.word}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/70 font-mono font-bold shadow-2xs">
                          {kw.frequencyCount}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dual Insights: Acoustic Cadence & Ubuntu Campus Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Acoustic & Cadence */}
                <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Activity className="w-4 h-4" />
                    <span>Acoustic Cadence & Speaking Rhythm</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.acousticAndCadenceInsights}
                  </p>
                </div>

                {/* Ubuntu & SA Context */}
                <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-800/30 text-amber-950 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <HeartHandshake className="w-4 h-4 text-amber-600" />
                    <span>Ubuntu & Campus Life Perspective</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    {report.culturalAndContextualObservation}
                  </p>
                </div>
              </div>

              {/* Resilience Markers */}
              {report.keyStrengthsAndResilienceMarkers && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Detected Resilience & Self-Regulation Strengths</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {report.keyStrengthsAndResilienceMarkers.map((marker, i) => (
                      <li
                        key={i}
                        className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{marker}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actionable Growth Strategies */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  Personalized Coping & Pacing Strategies
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {report.actionableGrowthStrategies.map((strat, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                          <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{strat.title}</span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium">{strat.action}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                        {strat.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No report available yet. Tap Re-analyze to generate your speech sentiment summary.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              disabled={!report}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Summary'}</span>
            </button>

            {onOpenTool && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTool('breathing');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <span>Start Box Breathing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
export default VoiceSummaryReportModal;
