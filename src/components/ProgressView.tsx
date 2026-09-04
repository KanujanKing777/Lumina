import React, { useState, useMemo } from 'react';
import {
  Flame,
  Target,
  BarChart2,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  BookOpen,
  Sparkles,
  ArrowRight,
  Smile,
  Trash2,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Award,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import {
  InteractionEntry,
  WritingGoal,
  NavigationSection,
  GoalType,
} from '../types';
import {
  calculateHabitStats,
  evaluateGoalProgress,
  DEFAULT_WRITING_GOALS,
} from '../utils/habitUtils';

interface ProgressViewProps {
  entries: InteractionEntry[];
  goals?: WritingGoal[];
  section: NavigationSection; // 'streaks' | 'writing_goals' | 'statistics' | 'weekly_reflection' | 'monthly_reflection'
  onCreateGoal?: (goal: Omit<WritingGoal, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onToggleGoal?: (goalId: string, currentActive: boolean) => Promise<void>;
  onDeleteGoal?: (goalId: string) => Promise<void>;
  onNewEntry: () => void;
  onNewEntryWithPrompt?: (prompt: string, title?: string) => void;
  onSelectEntry?: (entry: InteractionEntry) => void;
}

const WEEKLY_PROMPT_SUGGESTIONS = [
  {
    title: 'Weekly Wins & Horizons',
    prompt: 'What was the single most meaningful realization or victory you experienced this past week, and why did it matter to you?',
    theme: 'Growth',
  },
  {
    title: 'Friction to Flow',
    prompt: 'Where did you feel internal friction or overwhelm this week? What boundary or practice could support you moving forward?',
    theme: 'Clarity',
  },
  {
    title: 'Gratitude Anchor',
    prompt: 'Who or what brought unexpected warmth, support, or grounded calmness to your life over the last seven days?',
    theme: 'Gratitude',
  },
];

const MONTHLY_PROMPT_SUGGESTIONS = [
  {
    title: 'Monthly Landscape',
    prompt: 'Looking back over the entire past month, what major shift occurred in your mindset, priorities, or relationships?',
    theme: 'Evolution',
  },
  {
    title: 'What to Release',
    prompt: 'What pattern, worry, or unresolved tension from this month are you ready to consciously leave behind as you step forward?',
    theme: 'Renewal',
  },
  {
    title: 'North Star for Next Month',
    prompt: 'If next month had a single guiding word or intention (e.g., Courage, Rest, Focus, Patience), what would it be and how will you embody it?',
    theme: 'Intention',
  },
];

export const ProgressView: React.FC<ProgressViewProps> = ({
  entries,
  goals = [],
  section,
  onCreateGoal,
  onToggleGoal,
  onDeleteGoal,
  onNewEntry,
  onNewEntryWithPrompt,
}) => {
  // Compute habit statistics directly from actual entries
  const stats = useMemo(() => calculateHabitStats(entries), [entries]);

  // Merge default goals if user has none persisted
  const activeGoalsList: WritingGoal[] = useMemo(() => {
    if (goals && goals.length > 0) {
      return goals;
    }
    // Fallback default sample goals for client-side rendering until saved
    return DEFAULT_WRITING_GOALS.map((g, idx) => ({
      id: `default-${idx}`,
      userId: 'local',
      createdAt: Date.now(),
      ...g,
    }));
  }, [goals]);

  // Modal state for creating a custom goal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalType, setNewGoalType] = useState<GoalType>('words_per_day');
  const [newGoalTarget, setNewGoalTarget] = useState<number>(200);
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);

  // Tab filter inside Progress
  const [activeTab, setActiveTab] = useState<'all' | 'streaks' | 'goals' | 'statistics'>(() => {
    if (section === 'streaks') return 'streaks';
    if (section === 'writing_goals') return 'goals';
    if (section === 'statistics') return 'statistics';
    return 'all';
  });

  const handleCreateNewGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || newGoalTarget <= 0) return;

    let unit = 'words';
    let timeframe: 'daily' | 'weekly' | 'milestone' = 'daily';
    if (newGoalType === 'minutes_per_day') {
      unit = 'minutes';
      timeframe = 'daily';
    } else if (newGoalType === 'entries_per_week') {
      unit = 'entries';
      timeframe = 'weekly';
    } else if (newGoalType === 'days_per_week') {
      unit = 'days';
      timeframe = 'weekly';
    } else if (newGoalType === 'streak_target') {
      unit = 'days streak';
      timeframe = 'milestone';
    }

    if (onCreateGoal) {
      setIsSubmittingGoal(true);
      try {
        await onCreateGoal({
          title: newGoalTitle.trim(),
          type: newGoalType,
          targetValue: newGoalTarget,
          unit,
          timeframe,
          isActive: true,
        });
        setNewGoalTitle('');
        setNewGoalTarget(200);
        setIsCreateModalOpen(false);
      } catch (err) {
        console.error('Failed to create goal:', err);
      } finally {
        setIsSubmittingGoal(false);
      }
    } else {
      setIsCreateModalOpen(false);
    }
  };

  // Dedicated Weekly Reflection View
  if (section === 'weekly_reflection') {
    return (
      <div className="flex-1 h-full min-h-0 overflow-y-auto bg-stone-50/50 dark:bg-stone-900/50 p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                <CalendarDays className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                Weekly Reflection
              </h2>
            </div>
            <p className="text-xs text-stone-700 dark:text-stone-300 mt-1">
              Close your week with mindful clarity, celebrating progress and preparing intentions.
            </p>
          </div>
          <button
            onClick={() => onNewEntryWithPrompt?.(WEEKLY_PROMPT_SUGGESTIONS[0].prompt, 'Weekly Reflection')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Start Weekly Review</span>
          </button>
        </div>

        {/* This Week's Quick Snapshot */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
            <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">Sessions This Week</span>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
              {stats.entriesThisWeek} {stats.entriesThisWeek === 1 ? 'entry' : 'entries'}
            </div>
            <span className="text-[10px] text-stone-700 dark:text-stone-300">Across 7 calendar days</span>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
            <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">Active Streak</span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
              <span>{stats.currentStreak} days</span>
            </div>
            <span className="text-[10px] text-stone-700 dark:text-stone-300">Consistent daily momentum</span>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
            <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">Primary Tone</span>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1 capitalize">
              {stats.mostFrequentMood || 'Exploring'}
            </div>
            <span className="text-[10px] text-stone-700 dark:text-stone-300">Dominant logged feeling</span>
          </div>
        </div>

        {/* Weekly Prompts Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
            Guided Weekly Review Prompts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {WEEKLY_PROMPT_SUGGESTIONS.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-700 transition-all group"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    {item.theme}
                  </span>
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mt-2.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                    {item.prompt}
                  </p>
                </div>
                <button
                  onClick={() => onNewEntryWithPrompt?.(item.prompt, `Weekly Reflection - ${item.title}`)}
                  className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 group-hover:translate-x-0.5 transition-all cursor-pointer"
                >
                  <span>Write on this prompt</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Dedicated Monthly Reflection View
  if (section === 'monthly_reflection') {
    return (
      <div className="flex-1 h-full min-h-0 overflow-y-auto bg-stone-50/50 dark:bg-stone-900/50 p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                <Calendar className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                Monthly Reflection
              </h2>
            </div>
            <p className="text-xs text-stone-700 dark:text-stone-300 mt-1">
              Step back for a broader vantage point across the chapters of your recent weeks.
            </p>
          </div>
          <button
            onClick={() => onNewEntryWithPrompt?.(MONTHLY_PROMPT_SUGGESTIONS[0].prompt, 'Monthly Reflection')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Start Monthly Review</span>
          </button>
        </div>

        {/* Monthly Snapshot */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
            <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">Sessions This Month</span>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
              {stats.entriesThisMonth} {stats.entriesThisMonth === 1 ? 'entry' : 'entries'}
            </div>
            <span className="text-[10px] text-stone-700 dark:text-stone-300">Total reflections logged</span>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
            <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">Words Authored</span>
            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
              {stats.totalWords.toLocaleString()}
            </div>
            <span className="text-[10px] text-stone-700 dark:text-stone-300">Across all vault archives</span>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
            <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">Longest Streak</span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-amber-500" />
              <span>{stats.longestStreak} days</span>
            </div>
            <span className="text-[10px] text-stone-700 dark:text-stone-300">Best consistency milestone</span>
          </div>
        </div>

        {/* Monthly Prompts */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
            Monthly Review Anchors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MONTHLY_PROMPT_SUGGESTIONS.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    {item.theme}
                  </span>
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mt-2.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                    {item.prompt}
                  </p>
                </div>
                <button
                  onClick={() => onNewEntryWithPrompt?.(item.prompt, `Monthly Reflection - ${item.title}`)}
                  className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 group-hover:translate-x-0.5 transition-all cursor-pointer"
                >
                  <span>Write on this prompt</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Primary Progress Dashboard (Streaks, Goals, Statistics)
  return (
    <div className="flex-1 h-full min-h-0 overflow-y-auto bg-stone-50/50 dark:bg-stone-900/50 p-5 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Your Progress
          </h2>
          <p className="text-xs text-stone-700 dark:text-stone-300 mt-1">
            Habit tracking, writing targets, and rhythm metrics calculated from your real journal history.
          </p>
        </div>

        {/* Sub-view switcher */}
        <div className="flex items-center gap-1.5 bg-stone-200/70 dark:bg-stone-800/70 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('streaks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'streaks'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Streaks
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'goals'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Goals
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'statistics'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Statistics
          </button>
        </div>
      </div>

      {/* 1. Daily Journaling Reminder / "You haven't journaled today" Callout */}
      {!stats.hasJournaledToday ? (
        <div
          id="haven-not-journaled-today-banner"
          className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs animate-in fade-in"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-950 dark:text-amber-200">
                You haven't journaled today
              </h3>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed max-w-xl">
                {stats.currentStreak > 0 ? (
                  <>Take 2 to 5 minutes to reflect and keep your <strong>{stats.currentStreak}-day streak</strong> active.</>
                ) : (
                  <>Anchor your mind with a short reflection today to begin building your consistency streak.</>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onNewEntry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Write Today's Entry</span>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/80 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                You've journaled today!
              </span>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                {stats.todayWords} words authored today. Your streak is securely protected.
              </p>
            </div>
          </div>
          <button
            onClick={onNewEntry}
            className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
          >
            + Add Another Entry
          </button>
        </div>
      )}

      {/* 2. Grid: Current Streak, Today's Goal Progress, and This Week Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* CURRENT STREAK CARD */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Current Streak
              </span>
              <span className="p-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {stats.currentStreak}
              </span>
              <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                {stats.currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>

            <p className="text-xs text-stone-700 dark:text-stone-300 mt-2 leading-relaxed">
              {stats.currentStreak > 0
                ? 'Consecutive days with saved reflections.'
                : 'Start an entry today to ignite your streak.'}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
            <span className="text-stone-700 dark:text-stone-300">Longest Streak</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              {stats.longestStreak} days
            </span>
          </div>
        </div>

        {/* TODAY'S GOAL CARD */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Today's Goal
              </span>
              <span className="p-1 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                <Target className="w-4 h-4" />
              </span>
            </div>

            {/* Find daily word target goal or default to 200 words */}
            {(() => {
              const dailyGoal = activeGoalsList.find((g) => g.type === 'words_per_day' && g.isActive) || {
                title: 'Daily Words',
                type: 'words_per_day' as GoalType,
                targetValue: 200,
                unit: 'words',
                timeframe: 'daily' as const,
                isActive: true,
                id: 'tmp-daily',
                userId: 'local',
                createdAt: 0,
              };
              const evalRes = evaluateGoalProgress(dailyGoal, stats);

              return (
                <div className="mt-3 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                      {evalRes.progressPercent}%
                    </span>
                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      {evalRes.formattedProgress}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        evalRes.isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-amber-500 dark:bg-amber-400'
                      }`}
                      style={{ width: `${Math.max(5, evalRes.progressPercent)}%` }}
                    />
                  </div>

                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                    {evalRes.isCompleted
                      ? '✓ Target achieved for today!'
                      : `${Math.max(0, evalRes.targetValue - evalRes.currentValue)} more words needed to reach daily target.`}
                  </p>
                </div>
              );
            })()}
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
            <span className="text-stone-700 dark:text-stone-300">Reflection Time</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              ~{stats.todayMinutes} min today
            </span>
          </div>
        </div>

        {/* THIS WEEK ACTIVITY MATRIX */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                This Week
              </span>
              <span className="text-xs text-stone-700 dark:text-stone-300">
                {stats.weekActivity.filter((d) => d.hasEntry).length} / 7 active
              </span>
            </div>

            {/* Matrix row of Mon-Sun */}
            <div className="grid grid-cols-7 gap-1.5 mt-3 text-center">
              {stats.weekActivity.map((day) => (
                <div key={day.dateStr} className="flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-semibold ${day.isToday ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-stone-600 dark:text-stone-400'}`}>
                    {day.dayName}
                  </span>
                  <div
                    title={`${day.dayName}, ${day.dateStr}: ${day.hasEntry ? `${day.entriesCount} entries (${day.wordsCount} words)` : 'No entries'}`}
                    className={`w-full h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      day.hasEntry
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                        : day.isToday
                        ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-dashed border-amber-400 dark:border-amber-600'
                        : 'bg-stone-100/60 dark:bg-stone-800/40 text-stone-400 dark:text-stone-600 border border-stone-200/40 dark:border-stone-800'
                    }`}
                  >
                    {day.hasEntry ? '✓' : '—'}
                  </div>
                  <span className="text-[9px] text-stone-600 dark:text-stone-400">
                    {day.dateNumber}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
            <span className="text-stone-700 dark:text-stone-300">Week Total</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              {stats.entriesThisWeek} {stats.entriesThisWeek === 1 ? 'reflection' : 'reflections'}
            </span>
          </div>
        </div>

      </div>

      {/* 3. GOALS SECTION */}
      {(activeTab === 'all' || activeTab === 'goals') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Writing Goals
              </h3>
              <p className="text-xs text-stone-700 dark:text-stone-300 mt-0.5">
                Set and track manageable habits designed to sustain honest self-expression.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200/80 dark:border-amber-800/80 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Target</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeGoalsList.map((goal) => {
              const evalRes = evaluateGoalProgress(goal, stats);
              return (
                <div
                  key={goal.id}
                  className={`p-4 rounded-xl bg-white dark:bg-stone-900 border transition-all ${
                    evalRes.isCompleted
                      ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-stone-200/80 dark:border-stone-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => onToggleGoal?.(goal.id, goal.isActive)}
                        className="mt-0.5 text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
                        title={evalRes.isCompleted ? 'Goal Completed' : 'In Progress'}
                      >
                        {evalRes.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-stone-400 dark:text-stone-600" />
                        )}
                      </button>
                      <div>
                        <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                          {goal.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                            {goal.timeframe}
                          </span>
                          <span className="text-xs text-stone-600 dark:text-stone-400">
                            {evalRes.formattedProgress}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        {evalRes.progressPercent}%
                      </span>
                      {onDeleteGoal && goal.userId !== 'local' && (
                        <button
                          onClick={() => onDeleteGoal(goal.id)}
                          className="p-1 text-stone-400 hover:text-red-500 cursor-pointer"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden mt-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        evalRes.isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-amber-500 dark:bg-amber-400'
                      }`}
                      style={{ width: `${Math.max(4, evalRes.progressPercent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. STATISTICS SECTION */}
      {(activeTab === 'all' || activeTab === 'statistics') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Progress Statistics
              </h3>
              <p className="text-xs text-stone-700 dark:text-stone-300 mt-0.5">
                Objective reflection statistics measured across your authenticated journal vault.
              </p>
            </div>
            <span className="text-[11px] text-stone-700 dark:text-stone-300">
              {stats.totalEntries} entries total
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
              <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">Total Words</span>
              <div className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                {stats.totalWords.toLocaleString()}
              </div>
              <span className="text-[10px] text-stone-700 dark:text-stone-300">All authored words</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
              <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">Avg Words/Session</span>
              <div className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                {stats.averageWordsPerEntry}
              </div>
              <span className="text-[10px] text-stone-700 dark:text-stone-300">Per reflection depth</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
              <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">Most Active Day</span>
              <div className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1 truncate">
                {stats.mostActiveDayOfWeek}
              </div>
              <span className="text-[10px] text-stone-700 dark:text-stone-300">Peak writing cadence</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
              <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">Frequent Mood</span>
              <div className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1 capitalize truncate">
                {stats.mostFrequentMood || 'Exploring'}
              </div>
              <span className="text-[10px] text-stone-700 dark:text-stone-300">Most logged state</span>
            </div>
          </div>
        </div>
      )}

      {/* CREATE GOAL MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Add Writing Target
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Choose a metric to establish a gentle, measurable habit.
            </p>

            <form onSubmit={handleCreateNewGoal} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g., Morning Mindful Words, 3 Entries / Week"
                  className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Goal Type
                  </label>
                  <select
                    value={newGoalType}
                    onChange={(e) => {
                      const t = e.target.value as GoalType;
                      setNewGoalType(t);
                      if (t === 'words_per_day') setNewGoalTarget(200);
                      else if (t === 'minutes_per_day') setNewGoalTarget(5);
                      else if (t === 'entries_per_week') setNewGoalTarget(3);
                      else if (t === 'days_per_week') setNewGoalTarget(5);
                      else if (t === 'streak_target') setNewGoalTarget(14);
                    }}
                    className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100 cursor-pointer"
                  >
                    <option value="words_per_day">Words / Day</option>
                    <option value="minutes_per_day">Minutes / Day</option>
                    <option value="days_per_week">Days / Week</option>
                    <option value="entries_per_week">Entries / Week</option>
                    <option value="streak_target">Streak Target (Days)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    required
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGoal || !newGoalTitle.trim()}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingGoal ? 'Saving...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
