import { ActivityItem, JournalEntry, UserProfile, LanguageCode } from '../types';

const USER_PROFILE_KEY = 'comfortech_user_profile_v2';
const ACTIVITIES_KEY = 'comfortech_activities_v2';
const JOURNAL_KEY = 'comfortech_journal_v2';

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
