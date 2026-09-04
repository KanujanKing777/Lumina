import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  MessageSquare, 
  Layers, 
  CalendarDays, 
  CalendarRange, 
  History, 
  ArrowRight, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  Target, 
  HelpCircle, 
  Clock, 
  TrendingUp, 
  Smile, 
  AlertCircle,
  BookOpen,
  Calendar,
  Compass,
  Heart,
  Shuffle
} from 'lucide-react';
import { 
  NavigationSection, 
  InteractionEntry, 
  DailyPromptItem, 
  PromptCategory, 
  PeriodicReflectionReport, 
  OnThisDayMemory,
  ChatMessage
} from '../types';
import { 
  CURATED_DAILY_PROMPTS, 
  getDailyPrompts, 
  findOnThisDayMemories, 
  fetchPeriodicReflection, 
  askJournalVault 
} from '../utils/reflectionUtils';

interface ReflectViewProps {
  section: NavigationSection;
  entries: InteractionEntry[];
  onNewEntry: () => void;
  onNewEntryWithPrompt?: (prompt: string, title?: string) => void;
  onSelectEntry: (entry: InteractionEntry) => void;
}

export const ReflectView: React.FC<ReflectViewProps> = ({
  section,
  entries,
  onNewEntry,
  onNewEntryWithPrompt,
  onSelectEntry,
}) => {
  // ----------------------------------------------------
  // 1. DAILY PROMPTS STATE
  // ----------------------------------------------------
  const [promptCategory, setPromptCategory] = useState<PromptCategory>('all');
  const [promptsList, setPromptsList] = useState<DailyPromptItem[]>(() => getDailyPrompts('all', 6));
  const [customPromptInput, setCustomPromptInput] = useState('');

  const handleShufflePrompts = () => {
    setPromptsList(getDailyPrompts(promptCategory, 6));
  };

  const handleCategoryChange = (cat: PromptCategory) => {
    setPromptCategory(cat);
    setPromptsList(getDailyPrompts(cat, 6));
  };

  // ----------------------------------------------------
  // 2. AI PERIODIC REFLECTION STATE (Insights, Themes, Weekly, Monthly)
  // ----------------------------------------------------
  const [reflectionTimeframe, setReflectionTimeframe] = useState<'week' | 'month' | 'all_time'>(
    section === 'weekly_reflection' ? 'week' : section === 'monthly_reflection' ? 'month' : 'week'
  );
  const [reflectionReport, setReflectionReport] = useState<PeriodicReflectionReport | null>(null);
  const [isLoadingReflection, setIsLoadingReflection] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);

  // Sync timeframe with section if user clicked Weekly or Monthly from sidebar
  useEffect(() => {
    if (section === 'weekly_reflection') {
      setReflectionTimeframe('week');
    } else if (section === 'monthly_reflection') {
      setReflectionTimeframe('month');
    }
  }, [section]);

  const loadReflectionReport = async (tf: 'week' | 'month' | 'all_time') => {
    setIsLoadingReflection(true);
    setReflectionError(null);
    try {
      const report = await fetchPeriodicReflection(tf, entries);
      setReflectionReport(report);
    } catch (err: any) {
      console.error('Reflection error:', err);
      setReflectionError(err.message || 'Unable to generate reflection. Please verify your connection or try again.');
    } finally {
      setIsLoadingReflection(false);
    }
  };

  // Auto-fetch reflection when entering AI Insights or Weekly/Monthly reflection if not yet loaded
  useEffect(() => {
    if (['ai_insights', 'patterns_themes', 'weekly_reflection', 'monthly_reflection'].includes(section)) {
      if (!reflectionReport || reflectionReport.timeframe !== reflectionTimeframe) {
        loadReflectionReport(reflectionTimeframe);
      }
    }
  }, [section, reflectionTimeframe, entries.length]);

  // ----------------------------------------------------
  // 3. TALK TO MY JOURNAL CHAT STATE
  // ----------------------------------------------------
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAskingVault, setIsAskingVault] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const handleSendVaultQuery = async (queryText?: string) => {
    const textToSend = (queryText || chatInput).trim();
    if (!textToSend || isAskingVault) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAskingVault(true);
    setChatError(null);

    try {
      const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
      const reply = await askJournalVault(textToSend, history, entries);
      const modelMsg: ChatMessage = {
        role: 'model',
        content: reply,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Talk to journal error:', err);
      setChatError(err.message || 'Could not query your journal vault. Please try again.');
    } finally {
      setIsAskingVault(false);
    }
  };

  // ----------------------------------------------------
  // 4. ON THIS DAY MEMORIES
  // ----------------------------------------------------
  const memories: OnThisDayMemory[] = useMemo(() => {
    return findOnThisDayMemories(entries);
  }, [entries]);

  // Format today's date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // ----------------------------------------------------
  // SECTION RENDERERS
  // ----------------------------------------------------

  // 1. DAILY PROMPTS VIEW
  const renderDailyPrompts = () => {
    const categories: { id: PromptCategory; label: string }[] = [
      { id: 'all', label: 'All Prompts' },
      { id: 'growth', label: 'Growth & Insight' },
      { id: 'gratitude', label: 'Gratitude & Joy' },
      { id: 'presence', label: 'Presence & Peace' },
      { id: 'challenges', label: 'Resilience' },
      { id: 'creativity', label: 'Creativity' },
      { id: 'relationships', label: 'Relationships' },
    ];

    return (
      <div className="space-y-6">
        {/* Intro & Shuffle Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
          <div>
            <h3 className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Thoughtful Daily Inquiries</span>
            </h3>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Gentle anchors to spark honest reflection. Pick any prompt to seed directly into your journal.
            </p>
          </div>

          <button
            id="btn-shuffle-prompts"
            onClick={handleShufflePrompts}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-amber-900 dark:text-amber-200 bg-white/80 dark:bg-stone-900/80 hover:bg-white dark:hover:bg-stone-800 border border-amber-200/80 dark:border-amber-800/80 transition-all shadow-2xs cursor-pointer shrink-0"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Fresh Prompts</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                promptCategory === cat.id
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-700/70'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Prompts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promptsList.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-xs transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                    {item.theme}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-snug font-serif">
                  "{item.prompt}"
                </h4>

                {item.followUp && (
                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed pt-1">
                    {item.followUp}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
                <span className="text-[10px] text-stone-600 dark:text-stone-400">
                  Ready to explore
                </span>
                <button
                  id={`btn-reflect-prompt-${item.id}`}
                  onClick={() => {
                    if (onNewEntryWithPrompt) {
                      onNewEntryWithPrompt(item.prompt, item.theme);
                    } else {
                      onNewEntry();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
                >
                  <span>Reflect on this</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Prompt Generator / Idea Box */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-3">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
            <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-xs font-semibold">Have a specific feeling or topic in mind?</h4>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customPromptInput}
              onChange={(e) => setCustomPromptInput(e.target.value)}
              placeholder="e.g. Navigating a career transition, feeling grateful for friends, morning anxiety..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-700 dark:placeholder:text-stone-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customPromptInput.trim()) {
                  if (onNewEntryWithPrompt) {
                    onNewEntryWithPrompt(customPromptInput.trim(), 'Custom Reflection');
                  }
                }
              }}
            />
            <button
              onClick={() => {
                if (customPromptInput.trim() && onNewEntryWithPrompt) {
                  onNewEntryWithPrompt(customPromptInput.trim(), 'Custom Reflection');
                }
              }}
              disabled={!customPromptInput.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
            >
              Start Journal
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 2. AI INSIGHTS & PERIODIC REFLECTION REPORT
  const renderAIInsights = () => {
    return (
      <div className="space-y-6">
        {/* Timeframe Controls & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Analysis Scope:
            </span>
            <div className="inline-flex rounded-xl bg-stone-100 dark:bg-stone-800 p-1">
              <button
                onClick={() => setReflectionTimeframe('week')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  reflectionTimeframe === 'week'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                Past 7 Days
              </button>
              <button
                onClick={() => setReflectionTimeframe('month')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  reflectionTimeframe === 'month'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setReflectionTimeframe('all_time')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  reflectionTimeframe === 'all_time'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                All Entries
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-refresh-reflection"
              onClick={() => loadReflectionReport(reflectionTimeframe)}
              disabled={isLoadingReflection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReflection ? 'animate-spin text-amber-600' : ''}`} />
              <span>{isLoadingReflection ? 'Analyzing Vault...' : 'Refresh AI Analysis'}</span>
            </button>
          </div>
        </div>

        {/* Security & Non-diagnostic Banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-stone-800 dark:text-stone-200">Private, Grounded Reflection:</span> AI insights are generated exclusively from your authorized entries using server-side Gemini 3.6 Flash. Observations reflect gentle writing patterns and are not psychological or clinical diagnoses.
          </div>
        </div>

        {/* Loading State */}
        {isLoadingReflection && (
          <div className="p-12 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin mx-auto" />
            <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100">
              Distilling your reflections...
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              Synthesizing recurring themes, emotional undertones, and notable milestones from your recent journal vault.
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoadingReflection && reflectionError && (
          <div className="p-6 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/60 space-y-3 text-center">
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto" />
            <h4 className="text-xs font-semibold text-rose-900 dark:text-rose-200">
              Unable to complete reflection synthesis
            </h4>
            <p className="text-[11px] text-rose-700 dark:text-rose-300 max-w-md mx-auto">
              {reflectionError}
            </p>
            <button
              onClick={() => loadReflectionReport(reflectionTimeframe)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Analysis</span>
            </button>
          </div>
        )}

        {/* Report Content */}
        {!isLoadingReflection && !reflectionError && reflectionReport && (
          <div className="space-y-6">
            {/* 1. Executive Summary Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {reflectionReport.timeframeLabel} Summary
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  Based on {reflectionReport.entryCountAnalyzed} entries
                </span>
              </div>
              <p className="text-sm text-stone-800 dark:text-stone-200 font-serif leading-relaxed italic">
                "{reflectionReport.summary}"
              </p>
            </div>

            {/* 2. Recurring Themes Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>Recurring Themes</span>
              </h4>

              {reflectionReport.themes && reflectionReport.themes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {reflectionReport.themes.map((th, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          {th.theme}
                        </h5>
                        {th.frequency && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                            {th.frequency}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                        {th.description}
                      </p>
                      {th.evolution && (
                        <p className="text-[11px] text-amber-800 dark:text-amber-300/90 font-medium pt-1">
                          Evolution: {th.evolution}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-800 text-xs text-stone-500">
                  Write more reflections across this timeframe to map emerging themes.
                </div>
              )}
            </div>

            {/* 3. Accomplishments & Goals Mentioned */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Notable Accomplishments */}
              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-3">
                <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-semibold">Notable Wins & Growth</h4>
                </div>
                {reflectionReport.notableAccomplishments && reflectionReport.notableAccomplishments.length > 0 ? (
                  <ul className="space-y-2">
                    {reflectionReport.notableAccomplishments.map((win, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>{win}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-stone-500 italic">No specific milestones detected in this timeframe.</p>
                )}
              </div>

              {/* Goals Identified in Writing */}
              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-3">
                <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
                  <Target className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-semibold">Goals & Intentions Mentioned</h4>
                </div>
                {reflectionReport.goalsMentioned && reflectionReport.goalsMentioned.length > 0 ? (
                  <ul className="space-y-2">
                    {reflectionReport.goalsMentioned.map((g, idx) => (
                      <li key={idx} className="text-xs space-y-0.5">
                        <div className="font-medium text-stone-900 dark:text-stone-100 flex items-center justify-between">
                          <span>{g.goal}</span>
                          <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                            {g.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">{g.observation}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-stone-500 italic">No direct goals identified yet.</p>
                )}
              </div>
            </div>

            {/* 4. Changes Over Time & Writing Patterns */}
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-3">
              <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>Writing Patterns & Shifts Over Time</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Rhythm</span>
                  <p className="text-stone-800 dark:text-stone-200">
                    {reflectionReport.patternsInWriting?.timePattern || 'Regular reflections'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Tone Observation</span>
                  <p className="text-stone-800 dark:text-stone-200">
                    {reflectionReport.patternsInWriting?.toneObservations || 'Grounded and honest'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Stylistic Arc</span>
                  <p className="text-stone-800 dark:text-stone-200">
                    {reflectionReport.patternsInWriting?.stylisticGrowth || 'Expanding clarity'}
                  </p>
                </div>
              </div>

              {reflectionReport.changesOverTime && reflectionReport.changesOverTime.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400">Observed transitions:</span>
                  <ul className="mt-1 space-y-1">
                    {reflectionReport.changesOverTime.map((c, idx) => (
                      <li key={idx} className="text-xs text-stone-700 dark:text-stone-300 flex items-start gap-1.5">
                        <span className="text-amber-500">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 5. Contemplative Reflection Questions */}
            {reflectionReport.reflectiveQuestions && reflectionReport.reflectiveQuestions.length > 0 && (
              <div className="p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-xs font-semibold">Questions for Your Next Journal Entry</h4>
                </div>

                <div className="space-y-2.5">
                  {reflectionReport.reflectiveQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white/90 dark:bg-stone-900/90 border border-amber-200/50 dark:border-amber-800/50 flex items-center justify-between gap-3"
                    >
                      <p className="text-xs text-stone-800 dark:text-stone-200 font-serif italic">
                        "{q}"
                      </p>
                      <button
                        onClick={() => {
                          if (onNewEntryWithPrompt) {
                            onNewEntryWithPrompt(q, 'Guided Reflection');
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 shrink-0 cursor-pointer"
                      >
                        <span>Write on this</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 3. TALK TO MY JOURNAL
  const renderTalkToJournal = () => {
    const starterSuggestions = [
      'What were my primary sources of joy or gratitude recently?',
      'What recurring challenges or stress have I written about?',
      'Summarize the goals and aspirations I have mentioned.',
      'How has my perspective shifted over my recent entries?',
    ];

    return (
      <div className="flex flex-col h-[calc(100vh-14rem)] min-h-[480px] bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-xs">
        {/* Chat Header */}
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                Talk to My Journal
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Grounded in your {entries.length} personal journal entries
              </p>
            </div>
          </div>

          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            Private & Isolated
          </span>
        </div>

        {/* Chat Messages Scroll Container */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-100/70 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Ask anything about your journal history
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Your journal archivist will search your reflections to illuminate patterns, recall past decisions, and remind you of milestones.
                </p>
              </div>

              {/* Starter Suggestions */}
              <div className="w-full space-y-2 pt-2 text-left">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Suggested inquiries:
                </span>
                {starterSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendVaultQuery(s)}
                    className="w-full text-left p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-200 dark:hover:border-amber-800 border border-stone-200/60 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span>"{s}"</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-2xl ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-tr-none'
                      : 'bg-stone-100/90 dark:bg-stone-800/90 text-stone-800 dark:text-stone-200 rounded-tl-none space-y-2'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}

          {isAskingVault && (
            <div className="flex gap-3 mr-auto max-w-2xl">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-stone-100/90 dark:bg-stone-800/90 text-xs text-stone-500">
                Searching your reflections...
              </div>
            </div>
          )}

          {chatError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
              {chatError}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendVaultQuery();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="input-talk-to-journal"
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about past reflections, themes, feelings, or decisions..."
              disabled={isAskingVault}
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-500 dark:placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
            />
            <button
              id="btn-send-vault-query"
              type="submit"
              disabled={!chatInput.trim() || isAskingVault}
              className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition-colors cursor-pointer shrink-0"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  };

  // 4. ON THIS DAY
  const renderOnThisDay = () => {
    return (
      <div className="space-y-6">
        {/* Header Callout */}
        <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Time Capsule & Retrospectives</span>
            </span>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Reflections written on {todayFormatted} in previous months or years
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Revisit who you were, what mattered to you, and how your mindset has evolved.
            </p>
          </div>

          <button
            onClick={onNewEntry}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <span>Write Today's Entry</span>
          </button>
        </div>

        {/* Memories List or Empty State */}
        {memories.length > 0 ? (
          <div className="space-y-4">
            {memories.map((mem, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-700 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300">
                      {mem.timeAgoLabel}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {mem.formattedDate}
                    </span>
                  </div>

                  {mem.entry.mood && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 capitalize flex items-center gap-1">
                      <Smile className="w-3 h-3 text-amber-600" />
                      {mem.entry.mood}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {mem.entry.title || 'Untitled Reflection'}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 line-clamp-3 leading-relaxed font-serif">
                    {mem.entry.journalContent || mem.entry.initialPrompt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-stone-400">
                    {mem.entry.wordCount ? `${mem.entry.wordCount} words` : ''}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectEntry(mem.entry)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
                    >
                      <span>Read Full Entry</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    {onNewEntryWithPrompt && (
                      <button
                        onClick={() => {
                          const prompt = `Reflecting on where I was on ${mem.formattedDate} ("${mem.entry.title}"): How has my perspective shifted since then, and what have I learned?`;
                          onNewEntryWithPrompt(prompt, `On This Day: Memory Reflection`);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 cursor-pointer"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Compare Past Self</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                No past reflections found for this exact calendar date
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                As you continue journaling consistently, entries written today will reappear here in future months and years as memorable milestones in your personal growth arc.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={onNewEntry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 cursor-pointer"
              >
                <span>Write an Entry Today</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Determine section icon and title
  const getSectionMetadata = () => {
    switch (section) {
      case 'daily_prompts':
        return {
          title: 'Daily Prompts',
          subtitle: 'Thoughtful, varied questions to spark mindful contemplation.',
          icon: Sparkles,
        };
      case 'ai_insights':
        return {
          title: 'AI Insights & Synthesis',
          subtitle: 'Deep reflection on recurring themes, notable wins, and growth over time.',
          icon: Lightbulb,
        };
      case 'talk_to_journal':
        return {
          title: 'Talk to My Journal',
          subtitle: 'Ask questions and uncover patterns across your authentic reflections.',
          icon: MessageSquare,
        };
      case 'patterns_themes':
        return {
          title: 'Patterns & Recurring Themes',
          subtitle: 'Longitudinal analysis of your habits, topics, and emotional currents.',
          icon: Layers,
        };
      case 'weekly_reflection':
        return {
          title: 'Weekly Reflection & Synthesis',
          subtitle: 'Synthesize your week, celebrate milestones, and set intentions.',
          icon: CalendarDays,
        };
      case 'monthly_reflection':
        return {
          title: 'Monthly Retrospective',
          subtitle: 'A high-level view of your growth, shifts in tone, and monthly arc.',
          icon: CalendarRange,
        };
      case 'on_this_day':
        return {
          title: 'On This Day',
          subtitle: 'Nostalgic time capsule of previous reflections written on this calendar date.',
          icon: History,
        };
      default:
        return {
          title: 'Reflect',
          subtitle: 'Contemplate your journey and distill meaningful patterns.',
          icon: Sparkles,
        };
    }
  };

  const meta = getSectionMetadata();
  const Icon = meta.icon;

  return (
    <div 
      id={`reflect-view-${section}`}
      className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {meta.title}
            </h2>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {meta.subtitle}
          </p>
        </div>

        <button
          onClick={onNewEntry}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] transition-all shadow-xs cursor-pointer shrink-0"
        >
          <span>New Entry</span>
        </button>
      </div>

      {/* Render Dynamic Section Content */}
      {section === 'daily_prompts' && renderDailyPrompts()}
      {(section === 'ai_insights' || section === 'patterns_themes' || section === 'weekly_reflection' || section === 'monthly_reflection') && renderAIInsights()}
      {section === 'talk_to_journal' && renderTalkToJournal()}
      {section === 'on_this_day' && renderOnThisDay()}
    </div>
  );
};
