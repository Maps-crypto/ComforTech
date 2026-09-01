import { useState, useMemo, useCallback } from 'react';
import { ActivityItem } from '../types';

interface InactivityCheckResult {
  isInactiveOver48Hours: boolean;
  hoursSinceLastActivity: number | null;
  daysSinceLastActivity: number | null;
  lastActivity: ActivityItem | null;
  isDismissed: boolean;
  dismissAlert: () => void;
  resetDismissal: () => void;
}

const DISMISS_STORAGE_KEY = 'comfortech_inactivity_banner_dismissed_at';
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export function useInactivityAlert(
  activities: ActivityItem[] = [],
  thresholdHours: number = 48
): InactivityCheckResult {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      const dismissedAt = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (dismissedAt) {
        const timestamp = parseInt(dismissedAt, 10);
        // If dismissed within the last 12 hours, keep dismissed
        if (Date.now() - timestamp < 12 * 60 * 60 * 1000) {
          return true;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return false;
  });

  const thresholdMs = thresholdHours * 60 * 60 * 1000;

  // Find the most recent activity
  const { latestActivity, hoursSince, daysSince, isInactive } = useMemo(() => {
    if (!activities || activities.length === 0) {
      return {
        latestActivity: null,
        hoursSince: null,
        daysSince: null,
        isInactive: true, // No recorded activities in over 48 hours
      };
    }

    let latestTime = 0;
    let latestAct: ActivityItem | null = null;

    for (const act of activities) {
      const actTime = new Date(act.timestamp).getTime();
      if (!isNaN(actTime) && actTime > latestTime) {
        latestTime = actTime;
        latestAct = act;
      }
    }

    if (latestTime === 0) {
      return {
        latestActivity: null,
        hoursSince: null,
        daysSince: null,
        isInactive: true,
      };
    }

    const elapsedMs = Math.max(0, Date.now() - latestTime);
    const calculatedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const calculatedDays = Math.floor(calculatedHours / 24);
    const exceedsThreshold = elapsedMs >= thresholdMs;

    return {
      latestActivity: latestAct,
      hoursSince: calculatedHours,
      daysSince: calculatedDays,
      isInactive: exceedsThreshold,
    };
  }, [activities, thresholdMs]);

  const dismissAlert = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
    } catch {
      // Ignore
    }
  }, []);

  const resetDismissal = useCallback(() => {
    setIsDismissed(false);
    try {
      localStorage.removeItem(DISMISS_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    isInactiveOver48Hours: isInactive && !isDismissed,
    hoursSinceLastActivity: hoursSince,
    daysSinceLastActivity: daysSince,
    lastActivity: latestActivity,
    isDismissed,
    dismissAlert,
    resetDismissal,
  };
}
