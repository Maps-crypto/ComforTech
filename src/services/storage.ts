import { ActivityItem, JournalEntry, UserProfile, LanguageCode, VoiceJournalEntry } from '../types';

const USER_PROFILE_KEY = 'comfortech_user_profile_v2';
const ACTIVITIES_KEY = 'comfortech_activities_v2';
const JOURNAL_KEY = 'comfortech_journal_v2';
const VOICE_ENTRIES_KEY = 'comfortech_voice_entries_v2';

export function getOrCreateUserProfile(): UserProfile {
  try {
    const saved = localStorage.getItem(USER_PROFILE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load profile from storage', e);
  }

  const randomDigits = Math.floor(100 + Math.random() * 900);
  const defaultAnonymousProfile: UserProfile = {
    id: 'anon_' + Math.random().toString(36).substring(2, 9),
    displayName: `Anon_Student_${randomDigits}`,
    isAnonymous: true,
    preferredLanguage: 'en',
    joinedAt: new Date().toISOString(),
    streakDays: 1,
    lastCheckIn: new Date().toISOString(),
  };

  saveUserProfile(defaultAnonymousProfile);
  return defaultAnonymousProfile;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

export function switchAuthMode(
  currentProfile: UserProfile,
  mode: 'anonymous' | 'email',
  emailData?: { email: string; displayName?: string; university?: string }
): UserProfile {
  if (mode === 'email' && emailData) {
    const updated: UserProfile = {
      ...currentProfile,
      email: emailData.email,
      displayName: emailData.displayName || emailData.email.split('@')[0] || currentProfile.displayName,
      isAnonymous: false,
      university: emailData.university || currentProfile.university,
    };
    saveUserProfile(updated);
    addActivity({
      id: 'act_' + Date.now(),
      type: 'mood_checkin',
      title: 'Signed in with Email',
      description: `Account verified for ${emailData.email}`,
      timestamp: new Date().toISOString(),
    });
    return updated;
  } else {
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const updated: UserProfile = {
      id: 'anon_' + Math.random().toString(36).substring(2, 9),
      displayName: `Anon_Student_${randomDigits}`,
      isAnonymous: true,
      email: undefined,
      preferredLanguage: currentProfile.preferredLanguage,
      joinedAt: new Date().toISOString(),
      streakDays: currentProfile.streakDays,
      lastCheckIn: new Date().toISOString(),
      university: currentProfile.university,
    };
    saveUserProfile(updated);
    addActivity({
      id: 'act_' + Date.now(),
      type: 'mood_checkin',
      title: 'Switched to Anonymous Mode',
      description: 'Privacy-first guest session active',
      timestamp: new Date().toISOString(),
    });
    return updated;
  }
}

export function getActivities(): ActivityItem[] {
  try {
    const saved = localStorage.getItem(ACTIVITIES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load activities', e);
  }

  const now = Date.now();
  const day = 86400000;
  const hour = 3600000;

  // Rich starter activity ledger with sentiment scores across past 5 days
  const defaultActivities: ActivityItem[] = [
    {
      id: 'init_6',
      type: 'mood_checkin',
      title: 'Daily Mental Check-In',
      description: 'Mood: Hopeful · Energy: 4/5 · Stress: Exams & Deadlines',
      timestamp: new Date(now - 2 * hour).toISOString(),
      sentimentScore: 78,
    },
    {
      id: 'init_5',
      type: 'coping_tool',
      title: '4-4-4-4 Box Breathing Reset',
      description: 'Completed 4 deep breath regulation cycles',
      timestamp: new Date(now - 14 * hour).toISOString(),
      sentimentScore: 72,
    },
    {
      id: 'init_4',
      type: 'journal_entry',
      title: 'Lelapa AI Journal Entry',
      description: 'Reflected on NSFAS & Finances with AI reframing',
      timestamp: new Date(now - 1 * day - 4 * hour).toISOString(),
      sentimentScore: 64,
    },
    {
      id: 'init_3',
      type: 'peer_post',
      title: 'Joined Peer Circle',
      description: 'Connected with Wits & UJ students in Exam Survival Room',
      timestamp: new Date(now - 2 * day - 6 * hour).toISOString(),
      sentimentScore: 58,
    },
    {
      id: 'init_2',
      type: 'coping_tool',
      title: '5-4-3-2-1 Sensory Grounding',
      description: 'Re-anchored senses during high study tension',
      timestamp: new Date(now - 3 * day - 2 * hour).toISOString(),
      sentimentScore: 50,
    },
    {
      id: 'init_1',
      type: 'mood_checkin',
      title: 'Initial comforTech Check-in',
      description: 'Entered with high semester fatigue and assignment pressure',
      timestamp: new Date(now - 4 * day - 8 * hour).toISOString(),
      sentimentScore: 38,
    },
  ];

  try {
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(defaultActivities));
  } catch (e) {
    // Local storage disabled or full
  }

  return defaultActivities;
}

export function addActivity(activity: ActivityItem): ActivityItem[] {
  const current = getActivities();
  const updated = [activity, ...current].slice(0, 30);
  try {
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save activities', e);
  }
  return updated;
}

export function getJournalEntries(): JournalEntry[] {
  try {
    const saved = localStorage.getItem(JOURNAL_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load journal entries', e);
  }
  return [];
}

export function saveJournalEntry(entry: JournalEntry): JournalEntry[] {
  const current = getJournalEntries();
  const updated = [entry, ...current];
  try {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save journal', e);
  }
  return updated;
}

export function getVoiceJournalEntries(): VoiceJournalEntry[] {
  try {
    const saved = localStorage.getItem(VOICE_ENTRIES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load voice journal entries', e);
  }

  const now = Date.now();
  const hour = 3600000;
  const day = 86400000;

  // Starter sample voice entries reflecting real university student emotional progression
  const defaultVoiceEntries: VoiceJournalEntry[] = [
    {
      id: 'v_seed_4',
      transcript: 'I managed to finish my chapter summary for tutorial prep and sat outside the library for 10 minutes in the sun. Breathing feels noticeably easier today.',
      sentimentScore: 82,
      detectedMood: 'Hopeful & Grounded',
      primaryThemes: ['Academic Progress', 'Self-Care Routine', 'Mindfulness'],
      reflection: 'Your vocal cadence is relaxed and confident. Acknowledging small daily wins grounds your nervous system.',
      culturalInsight: 'Ubuntu reminds us that celebrating small personal milestones builds collective strength.',
      suggestedMicroAction: 'Step away from screens for a 15-minute walk before your afternoon study block.',
      audioDurationSeconds: 19,
      language: 'English',
      topic: 'Daily win & self-gratitude',
      timestamp: new Date(now - 6 * hour).toISOString(),
    },
    {
      id: 'v_seed_3',
      transcript: 'Bengizizwa ngicindezelekile kakhulu ngezivivinyo zenyanga ezayo, kodwa ngikhulume nomngani wami ose-res. Kusize kakhulu ukukhulula lo mthwalo.',
      sentimentScore: 71,
      detectedMood: 'Reconnected & Relieved',
      primaryThemes: ['Peer Support', 'Res Life', 'Emotional Release'],
      reflection: 'Ukuthetha nokuvula isifuba kunikeza amandla amasha. Ubumuntu bakho bubonakala lapho wabelana nabanye.',
      culturalInsight: 'Umuntu ngumuntu ngabantu — lean on your peer community when campus demands peak.',
      suggestedMicroAction: 'Drink some warm tea and stretch your back for 2 minutes.',
      audioDurationSeconds: 24,
      language: 'isiZulu',
      topic: 'Missing home / loneliness in res',
      timestamp: new Date(now - 1 * day - 8 * hour).toISOString(),
    },
    {
      id: 'v_seed_2',
      transcript: 'Still checking the portal every few hours waiting on the NSFAS allowance update. It is hard to concentrate on assignments when grocery money is running tight.',
      sentimentScore: 44,
      detectedMood: 'Stressed & Distracted',
      primaryThemes: ['Financial & NSFAS Anxiety', 'Academic Focus', 'Survival Stress'],
      reflection: 'Financial stress carries real visceral weight. Validating this strain is crucial; you are managing a dual load of academics and logistics.',
      culturalInsight: 'Navigating institutional bureaucracy requires immense patience and stamina. Give yourself grace.',
      suggestedMicroAction: 'Take 4 cycles of box breathing to release tension from your jaw and neck.',
      audioDurationSeconds: 28,
      language: 'English',
      topic: 'Financial & NSFAS anxiety',
      timestamp: new Date(now - 2 * day - 14 * hour).toISOString(),
    },
    {
      id: 'v_seed_1',
      transcript: 'Everything is piling up all at once. Two tests on Friday, a lab report due Thursday midnight, and load shedding knocked out Wi-Fi during my lecture upload.',
      sentimentScore: 36,
      detectedMood: 'Overwhelmed & Fatigued',
      primaryThemes: ['Exam Overload', 'Infrastructure & Loadshedding', 'Deadline Panic'],
      reflection: 'We hear how suffocating deadline clustering can feel, especially when connectivity hurdles compound the load.',
      culturalInsight: 'You are resilient, but you do not have to carry everything simultaneously. Break the work into 25-minute Pomodoro intervals.',
      suggestedMicroAction: 'Do 3 minutes of 5-4-3-2-1 Sensory Grounding to exit fight-or-flight mode.',
      audioDurationSeconds: 32,
      language: 'English',
      topic: 'Exam stress & study pace',
      timestamp: new Date(now - 4 * day - 4 * hour).toISOString(),
    },
  ];

  try {
    localStorage.setItem(VOICE_ENTRIES_KEY, JSON.stringify(defaultVoiceEntries));
  } catch (e) {
    // Ignore storage errors
  }

  return defaultVoiceEntries;
}

export function saveVoiceJournalEntry(entry: VoiceJournalEntry): VoiceJournalEntry[] {
  const current = getVoiceJournalEntries();
  const updated = [entry, ...current].slice(0, 40);
  try {
    localStorage.setItem(VOICE_ENTRIES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save voice entry', e);
  }
  return updated;
}

export function deleteVoiceJournalEntry(id: string): VoiceJournalEntry[] {
  const current = getVoiceJournalEntries();
  const updated = current.filter((e) => e.id !== id);
  try {
    localStorage.setItem(VOICE_ENTRIES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete voice entry', e);
  }
  return updated;
}

