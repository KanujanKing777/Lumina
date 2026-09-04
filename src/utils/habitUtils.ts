import { InteractionEntry, HabitProgressStats, DayActivity, WritingGoal } from '../types';

/**
 * Convert timestamp or date object into local 'YYYY-MM-DD' string safely
 */
export function getLocalDateString(dateInput?: number | Date | string): string {
  if (!dateInput) return getLocalDateString(new Date());
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return getLocalDateString(new Date());

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date string for the previous calendar day using noon offset to prevent DST boundary drift
 */
export function getPreviousDateString(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d, 12, 0, 0);
  date.setDate(date.getDate() - 1);
  return getLocalDateString(date);
}

/**
 * Count words cleanly in entry text
 */
export function countWordsInText(text?: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Calculate comprehensive habit statistics from actual user journal entries
 */
export function calculateHabitStats(entries: InteractionEntry[]): HabitProgressStats {
  const todayStr = getLocalDateString(new Date());
  const yesterdayStr = getPreviousDateString(todayStr);

  // Group entries and calculate metrics by local date
  const dateMap = new Map<string, { count: number; words: number; entries: InteractionEntry[] }>();
  let totalWords = 0;
  const moodCounts = new Map<string, number>();
  const dayOfWeekCounts = new Map<number, number>(); // 0 (Sun) - 6 (Sat)

  for (const entry of entries) {
    const rawDate = entry.journalDate || entry.createdAt;
    const dateStr = getLocalDateString(rawDate);
    const text = (entry.journalContent || '') + ' ' + (entry.initialPrompt || '');
    const words = countWordsInText(text);
    totalWords += words;

    const existing = dateMap.get(dateStr) || { count: 0, words: 0, entries: [] };
    existing.count += 1;
    existing.words += words;
    existing.entries.push(entry);
    dateMap.set(dateStr, existing);

    // Track mood frequency
    if (entry.mood) {
      moodCounts.set(entry.mood, (moodCounts.get(entry.mood) || 0) + 1);
    }

    // Track day of week frequency
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      const dow = d.getDay();
      dayOfWeekCounts.set(dow, (dayOfWeekCounts.get(dow) || 0) + 1);
    }
  }

  // Determine streak values
  const hasJournaledToday = dateMap.has(todayStr);
  let currentStreak = 0;

  if (hasJournaledToday) {
    currentStreak = 1;
    let checkDate = getPreviousDateString(todayStr);
    while (dateMap.has(checkDate)) {
      currentStreak += 1;
      checkDate = getPreviousDateString(checkDate);
    }
  } else if (dateMap.has(yesterdayStr)) {
    // Yesterday was logged; streak is alive pending today's reflection
    currentStreak = 1;
    let checkDate = getPreviousDateString(yesterdayStr);
    while (dateMap.has(checkDate)) {
      currentStreak += 1;
      checkDate = getPreviousDateString(checkDate);
    }
  } else {
    currentStreak = 0;
  }

  // Calculate longest streak
  const sortedDates = Array.from(dateMap.keys()).sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let lastEvaluatedDate = '';

  for (const dStr of sortedDates) {
    if (!lastEvaluatedDate) {
      runningStreak = 1;
    } else {
      const expectedNext = getPreviousDateString(dStr);
      if (expectedNext === lastEvaluatedDate) {
        runningStreak += 1;
      } else {
        runningStreak = 1;
      }
    }
    lastEvaluatedDate = dStr;
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Most frequent mood (purely observational label, no psychological assertions)
  let mostFrequentMood: string | null = null;
  let maxMoodCount = 0;
  for (const [mood, count] of moodCounts.entries()) {
    if (count > maxMoodCount) {
      maxMoodCount = count;
      mostFrequentMood = mood;
    }
  }

  // Most active day of the week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let mostActiveDowIdx = -1;
  let maxDowCount = 0;
  for (const [dow, count] of dayOfWeekCounts.entries()) {
    if (count > maxDowCount) {
      maxDowCount = count;
      mostActiveDowIdx = dow;
    }
  }
  const mostActiveDayOfWeek = mostActiveDowIdx >= 0 ? dayNames[mostActiveDowIdx] : 'None yet';

  // Today metrics
  const todayData = dateMap.get(todayStr);
  const todayWords = todayData ? todayData.words : 0;
  const todayEntriesCount = todayData ? todayData.count : 0;
  // Estimated minutes: ~40 words/min writing speed, minimum 2 minutes per entry written
  const todayMinutes = todayEntriesCount > 0 
    ? Math.max(todayEntriesCount * 2, Math.round(todayWords / 40)) 
    : 0;

  // Calculate current week activity (Monday to Sunday)
  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - currentDayIndex, 12, 0, 0);

  const weekDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekActivity: DayActivity[] = [];
  let entriesThisWeek = 0;

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12, 0, 0);
    const dStr = getLocalDateString(dayDate);
    const dayData = dateMap.get(dStr);
    const hasEntry = Boolean(dayData && dayData.count > 0);
    const wordsCount = dayData ? dayData.words : 0;
    const count = dayData ? dayData.count : 0;

    if (hasEntry) {
      entriesThisWeek += count;
    }

    const isToday = dStr === todayStr;
    const isFuture = i > currentDayIndex;

    weekActivity.push({
      dayName: weekDayNames[i],
      dayShort: weekDayNames[i].charAt(0),
      dateStr: dStr,
      dateNumber: dayDate.getDate(),
      isToday,
      isFuture,
      hasEntry,
      entriesCount: count,
      wordsCount,
    });
  }

  // Entries this month
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const entriesThisMonth = entries.filter((e) => {
    const d = new Date(e.journalDate || e.createdAt);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }).length;

  const totalEntries = entries.length;
  const averageWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

  return {
    currentStreak,
    longestStreak,
    hasJournaledToday,
    lastJournaledDate: sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null,
    totalEntries,
    totalWords,
    averageWordsPerEntry,
    todayWords,
    todayMinutes,
    todayEntriesCount,
    entriesThisWeek,
    entriesThisMonth,
    mostActiveDayOfWeek,
    mostFrequentMood,
    weekActivity,
  };
}

/**
 * Evaluate writing goal progress against computed habit statistics
 */
export function evaluateGoalProgress(
  goal: WritingGoal,
  stats: HabitProgressStats
): {
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  isCompleted: boolean;
  formattedProgress: string;
} {
  let currentValue = 0;
  const targetValue = Math.max(1, goal.targetValue);

  switch (goal.type) {
    case 'words_per_day':
      currentValue = stats.todayWords;
      break;
    case 'minutes_per_day':
      currentValue = stats.todayMinutes;
      break;
    case 'entries_per_week':
      currentValue = stats.entriesThisWeek;
      break;
    case 'days_per_week':
      currentValue = stats.weekActivity.filter((d) => d.hasEntry).length;
      break;
    case 'streak_target':
      currentValue = stats.currentStreak;
      break;
    default:
      currentValue = 0;
  }

  const progressPercent = Math.min(100, Math.round((currentValue / targetValue) * 100));
  const isCompleted = currentValue >= targetValue;

  return {
    currentValue,
    targetValue,
    progressPercent,
    isCompleted,
    formattedProgress: `${currentValue} / ${targetValue} ${goal.unit}`,
  };
}

/**
 * Standard default writing goals seeded for new users
 */
export const DEFAULT_WRITING_GOALS: Omit<WritingGoal, 'id' | 'userId' | 'createdAt'>[] = [
  {
    title: 'Daily Word Target',
    type: 'words_per_day',
    targetValue: 200,
    unit: 'words',
    timeframe: 'daily',
    isActive: true,
  },
  {
    title: 'Daily Reflection Time',
    type: 'minutes_per_day',
    targetValue: 5,
    unit: 'minutes',
    timeframe: 'daily',
    isActive: true,
  },
  {
    title: 'Journal 5 Days This Week',
    type: 'days_per_week',
    targetValue: 5,
    unit: 'days',
    timeframe: 'weekly',
    isActive: true,
  },
  {
    title: '3 Entries This Week',
    type: 'entries_per_week',
    targetValue: 3,
    unit: 'entries',
    timeframe: 'weekly',
    isActive: true,
  },
  {
    title: 'Reach 14-Day Streak',
    type: 'streak_target',
    targetValue: 14,
    unit: 'days streak',
    timeframe: 'milestone',
    isActive: true,
  },
];
