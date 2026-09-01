export type LanguageCode = 'en' | 'zu' | 'st' | 'xh' | 'af' | 'tn' | 'nso' | 'ts' | 'ss' | 've' | 'nr';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  greeting: string;
}

export type AuthMode = 'anonymous' | 'email';

export interface UserProfile {
  id: string;
  email?: string;
  displayName: string;
  isAnonymous: boolean;
  university?: string;
  preferredLanguage: LanguageCode;
  joinedAt: string;
  streakDays: number;
  lastCheckIn?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  detectedSentiment?: 'positive' | 'neutral' | 'anxious' | 'distressed';
  language?: string;
}

export type StressorCategory =
  | 'Exams & Deadlines'
  | 'NSFAS & Finances'
  | 'Loneliness & Homesickness'
  | 'Burnout & Exhaustion'
  | 'Family Expectations'
  | 'Relationship & Social'
  | 'Post-Grad / Career Uncertainty'
  | 'Health & Sleep';

export type MoodType =
  | 'Great'
  | 'Good'
  | 'Hopeful'
  | 'Neutral'
  | 'Anxious'
  | 'Stressed'
  | 'Down'
  | 'Overwhelmed'
  | 'Hopeless';

export interface ActivityItem {
  id: string;
  type: 'mood_checkin' | 'chat_message' | 'journal_entry' | 'voice_journal' | 'coping_tool' | 'peer_post' | 'counselor_request';
  title: string;
  description: string;
  timestamp: string;
  data?: any;
  sentimentScore?: number; // 0 - 100
}

export interface VoiceJournalResult {
  transcript: string;
  sentimentScore: number;
  detectedMood: string;
  primaryThemes: string[];
  reflection: string;
  culturalInsight?: string;
  suggestedMicroAction?: string;
  audioDurationSeconds?: number;
}

export interface VoiceJournalEntry {
  id: string;
  transcript: string;
  sentimentScore: number;
  detectedMood: string;
  primaryThemes: string[];
  reflection: string;
  culturalInsight?: string;
  suggestedMicroAction?: string;
  audioDurationSeconds?: number;
  language: string;
  topic: string;
  timestamp: string;
}

export interface VoiceSpeechPattern {
  pattern: string;
  description: string;
  triggerOrContext: string;
  frequency: 'frequent' | 'occasional' | 'emerging';
}

export interface VoiceEmotionalKeyword {
  word: string;
  sentimentType: 'positive' | 'stress' | 'grounded' | 'neutral';
  frequencyCount: number;
}

export interface VoiceSentimentSummaryReport {
  overallTrajectory: 'improving' | 'declining' | 'stabilizing' | 'fluctuating';
  averageSentimentScore: number; // 0 - 100
  totalEntriesAnalyzed: number;
  totalDurationSeconds: number;
  sentimentTrendSummary: string;
  speechPatterns: VoiceSpeechPattern[];
  dominantEmotionalKeywords: VoiceEmotionalKeyword[];
  acousticAndCadenceInsights: string;
  culturalAndContextualObservation: string;
  keyStrengthsAndResilienceMarkers: string[];
  actionableGrowthStrategies: {
    title: string;
    action: string;
    reason: string;
  }[];
  generatedAt: string;
}

export interface CopingToolAction {
  id: string;
  title: string;
  category: 'mindfulness' | 'grounding' | 'peer_support' | 'counselor' | 'journaling' | 'study_pacing' | 'crisis';
  duration: string;
  reason: string;
  actionType: 'tool_box_breathing' | 'tool_grounding_54321' | 'tool_journal' | 'open_peer_room' | 'open_counselor' | 'open_hotlines';
  priority: 'immediate' | 'recommended' | 'optional';
}

export interface LelapaSentimentSummary {
  detectedMood: string;
  sentimentScore: number; // 0 - 100
  primaryStressor: string;
  culturalInsight: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RecommendationReport {
  sentimentSummary: LelapaSentimentSummary;
  recommendedActions: CopingToolAction[];
  peerCircleRecommendation: {
    topic: string;
    whyMatch: string;
    channelId: string;
  };
  affirmation: string;
}

export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  mood: MoodType;
  stressors: StressorCategory[];
  timestamp: string;
  aiReflection?: string;
}

export interface PeerPost {
  id: string;
  authorAlias: string;
  isAnonymous: boolean;
  avatarColor: string;
  tag: StressorCategory;
  title: string;
  content: string;
  timestamp: string;
  university?: string;
  cheers: number;
  repliesCount: number;
  replies: {
    id: string;
    authorAlias: string;
    content: string;
    timestamp: string;
    isCounselor?: boolean;
  }[];
}

export interface CrisisContact {
  id: string;
  name: string;
  number: string;
  description: string;
  available: string;
  cost: string;
  category: '24/7 National' | 'Student Specific' | 'Emergency';
}

export type SALanguageCategory = 'Nguni' | 'Sotho-Tswana' | 'Tswa-Ronga' | 'Venda' | 'West Germanic' | 'Vernacular & Tsotsitaal';

export interface LinguisticDataPoint {
  id: string;
  languageCode: LanguageCode | 'vernac';
  languageName: string;
  source: 'voice_journal' | 'chat_interaction' | 'peer_forum' | 'community_submission' | 'realtime_sensor';
  phrase: string;
  englishTranslation: string;
  culturalContext: string;
  emotionalSentiment: 'positive' | 'anxious' | 'grounded' | 'distressed' | 'neutral';
  confidenceScore: number; // 0 - 100
  verified: boolean;
  upvotes: number;
  regionOrCampus: string;
  timestamp: string;
}

export interface LanguageModelTrainingStatus {
  totalDataPoints: number;
  languagesCovered: number;
  activeEpochs: number;
  trainingLoss: number;
  asrAccuracyPercent: number;
  vernacAlignmentScore: number;
  lastFineTunedAt: string;
  realTimeStreamActive: boolean;
  vocabularySize: number;
  languageBreakdown: {
    code: string;
    name: string;
    nativeName: string;
    family: SALanguageCategory;
    samplesCount: number;
    accuracyPercent: number;
    status: 'optimal' | 'calibrating' | 'training';
    recentSlangAdded: string[];
  }[];
}

export interface BenchmarkTestResult {
  inputText: string;
  detectedLanguage: string;
  languageCode: string;
  confidencePercent: number;
  englishTranslation: string;
  culturalNuance: string;
  detectedMood: string;
  sentimentScore: number;
  ubuntuResonanceScore: number;
  modelResponseInDialect: string;
  responseLatencyMs: number;
  engine: string;
  vernacularSlangDetected: string[];
}

export interface LinguisticContributionPayload {
  languageCode: LanguageCode | 'vernac';
  languageName: string;
  phrase: string;
  englishMeaning: string;
  emotionalContext: string;
  campusOrRegion: string;
  contributorAlias?: string;
}

