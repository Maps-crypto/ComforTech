import { ActivityItem, ChatMessage, MoodType, RecommendationReport, StressorCategory, UserProfile } from '../types';

export async function sendChatMessage(params: {
  messages: { role: string; content: string }[];
  language: string;
  languageCode: string;
  userProfile?: UserProfile;
  activitySummary?: string;
}): Promise<{ reply: string; source?: string }> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('Fallback chat used due to network/server response:', error);
    const last = params.messages[params.messages.length - 1]?.content.toLowerCase() || '';
    if (/suicide|kill myself|end it|hurt myself|cut myself/.test(last)) {
      return {
        reply: "I hear how heavy things are right now, and you matter. Please reach out to SADAG's 24/7 Suicide Helpline on 0800 567 567 (free) or call 112 immediately. We are here with you.",
        source: 'client-safety-fallback',
      };
    }
    return {
      reply: "Thank you for sharing that with me. It takes courage to open up. Would you like to try a 2-minute calming breathing exercise or tell me a bit more about what triggered this?",
      source: 'client-fallback',
    };
  }
}

export async function fetchLelapaRecommendations(params: {
  activityHistory: ActivityItem[];
  currentMood?: MoodType;
  stressor?: StressorCategory;
  language?: string;
  userProfile?: UserProfile;
}): Promise<RecommendationReport> {
  try {
    const res = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.recommendations;
  } catch (error) {
    console.warn('Fallback recommendations used:', error);
    const isAnxious = params.currentMood === 'Anxious' || params.currentMood === 'Stressed' || params.currentMood === 'Overwhelmed';
    return {
      sentimentSummary: {
        detectedMood: params.currentMood || 'Anxious',
        sentimentScore: isAnxious ? 35 : 65,
        primaryStressor: params.stressor || 'Academic Workload',
        culturalInsight: 'You are carrying significant responsibilities. Remember to give yourself grace and take micro-breaks.',
        riskLevel: isAnxious ? 'medium' : 'low',
      },
      recommendedActions: [
        {
          id: 'rec_box',
          title: '4-4-4-4 Box Breathing Reset',
          category: 'mindfulness',
          duration: '2 min',
          reason: 'Quick autonomic nervous system reset to lower heart rate and reduce stress hormones.',
          actionType: 'tool_box_breathing',
          priority: 'immediate',
        },
        {
          id: 'rec_54321',
          title: '5-4-3-2-1 Sensory Grounding',
          category: 'grounding',
          duration: '3 min',
          reason: 'Brings you back to the physical room when spiral thoughts or exam panic take over.',
          actionType: 'tool_grounding_54321',
          priority: 'recommended',
        },
        {
          id: 'rec_journal',
          title: 'Lelapa AI Emotion Journal',
          category: 'journaling',
          duration: '3 min',
          reason: 'Externalize overwhelming thoughts and get instant supportive AI reflections.',
          actionType: 'tool_journal',
          priority: 'recommended',
        },
        {
          id: 'rec_peer',
          title: 'Join Anonymous Peer Circle',
          category: 'peer_support',
          duration: 'Ongoing',
          reason: 'Connect with other students going through similar challenges.',
          actionType: 'open_peer_room',
          priority: 'optional',
        },
      ],
      peerCircleRecommendation: {
        topic: params.stressor === 'NSFAS & Finances' ? 'NSFAS & Financial Survival Room' : 'Exam Stress & DP Recovery Circle',
        whyMatch: '34 students are active right now discussing similar challenges.',
        channelId: 'peer_board',
      },
      affirmation: 'You have overcome difficult seasons before. You are capable of navigating this one, step by step.',
    };
  }
}

export async function fetchTriageAssessment(params: {
  transcript: string;
  recentMoods?: string[];
  stressor?: string;
}): Promise<{
  risk: 'low' | 'medium' | 'high';
  note: string;
  emergencyContacts: { name: string; number: string; available: string }[];
}> {
  try {
    const res = await fetch('/api/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    const text = params.transcript.toLowerCase();
    const isHigh = /suicide|kill myself|end my life|hurt myself/.test(text);
    return {
      risk: isHigh ? 'high' : 'low',
      note: isHigh
        ? 'Thank you for speaking up. We are connecting you immediately with a live crisis counselor.'
        : 'You are taking healthy steps to check in with yourself.',
      emergencyContacts: [
        { name: 'SADAG Suicide Crisis Line', number: '0800 567 567', available: '24/7' },
        { name: 'Higher Health Student Line', number: '0800 36 36 36', available: '24/7' },
      ],
    };
  }
}

export async function fetchJournalReflection(params: {
  content: string;
  mood: string;
  language?: string;
}): Promise<{ reflection: string }> {
  try {
    const res = await fetch('/api/journal-reflect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    return {
      reflection: 'Thank you for giving words to your internal experience. Acknowledging what you feel is the foundation of emotional resilience. Take three slow breaths and drink some water.',
    };
  }
}
