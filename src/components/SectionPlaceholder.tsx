import React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  Sparkles,
  Lightbulb,
  MessageSquare,
  Layers,
  CalendarDays,
  CalendarRange,
  History,
  Flame,
  Target,
  BarChart2,
  Plus,
  ArrowRight,
  BookOpen,
  Smile,
  Star,
  Folder
} from 'lucide-react';
import { NavigationSection, InteractionEntry, FolderItem, WritingGoal } from '../types';
import { CalendarView } from './CalendarView';
import { TimelineView } from './TimelineView';
import { SearchView } from './SearchView';
import { FoldersView } from './FoldersView';
import { ProgressView } from './ProgressView';
import { ReflectView } from './ReflectView';
import { TalkToJournalWorkspace } from './TalkToJournalWorkspace';

interface SectionPlaceholderProps {
  section: NavigationSection;
  entries: InteractionEntry[];
  folders?: FolderItem[];
  goals?: WritingGoal[];
  onCreateFolder?: (name: string, color?: string) => Promise<void>;
  onRenameFolder?: (folderId: string, newName: string) => Promise<void>;
  onDeleteFolder?: (folderId: string) => Promise<void>;
  onCreateGoal?: (goal: Omit<WritingGoal, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onToggleGoal?: (goalId: string, currentActive: boolean) => Promise<void>;
  onDeleteGoal?: (goalId: string) => Promise<void>;
  onNewEntryWithPrompt?: (prompt: string, title?: string) => void;
  onNewEntry: () => void;
  onNewEntryInFolder?: (folderId: string) => void;
  onSelectEntry: (entry: InteractionEntry) => void;
  searchQuery?: string;
}

export const SectionPlaceholder: React.FC<SectionPlaceholderProps> = ({
  section,
  entries,
  folders = [],
  goals = [],
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateGoal,
  onToggleGoal,
  onDeleteGoal,
  onNewEntryWithPrompt,
  onNewEntry,
  onNewEntryInFolder,
  onSelectEntry,
  searchQuery = '',
}) => {
  // 1. DEDICATED TALK TO MY JOURNAL WORKSPACE
  if (section === 'talk_to_journal') {
    return (
      <TalkToJournalWorkspace
        entries={entries}
        onSelectEntry={onSelectEntry}
        onNewEntryWithPrompt={onNewEntryWithPrompt}
        onNewEntry={onNewEntry}
      />
    );
  }

  // 2. REFLECT SUITE (Daily Prompts, AI Insights, Patterns & Themes, Weekly/Monthly Reflection, On This Day)
  if ([
    'daily_prompts',
    'ai_insights',
    'patterns_themes',
    'weekly_reflection',
    'monthly_reflection',
    'on_this_day',
  ].includes(section)) {
    return (
      <ReflectView
        section={section}
        entries={entries}
        onNewEntry={onNewEntry}
        onNewEntryWithPrompt={onNewEntryWithPrompt}
        onSelectEntry={onSelectEntry}
      />
    );
  }

  // 2. PROGRESS SUITE (Streaks, Writing Goals, Statistics)
  if (['streaks', 'writing_goals', 'statistics'].includes(section)) {
    return (
      <ProgressView
        entries={entries}
        goals={goals}
        section={section}
        onCreateGoal={onCreateGoal}
        onToggleGoal={onToggleGoal}
        onDeleteGoal={onDeleteGoal}
        onNewEntry={onNewEntry}
        onNewEntryWithPrompt={onNewEntryWithPrompt}
        onSelectEntry={onSelectEntry}
      />
    );
  }

  if (section === 'calendar') {
    return (
      <CalendarView
        entries={entries}
        onSelectEntry={onSelectEntry}
        onNewEntry={onNewEntry}
      />
    );
  }

  if (section === 'timeline') {
    return (
      <TimelineView
        entries={entries}
        onSelectEntry={onSelectEntry}
        onNewEntry={onNewEntry}
      />
    );
  }

  if (section === 'search') {
    return (
      <SearchView
        entries={entries}
        folders={folders}
        initialSearchQuery={searchQuery}
        onSelectEntry={onSelectEntry}
        onNewEntry={onNewEntry}
      />
    );
  }

  if (section === 'folders' && onCreateFolder && onRenameFolder && onDeleteFolder) {
    return (
      <FoldersView
        folders={folders}
        entries={entries}
        onCreateFolder={onCreateFolder}
        onRenameFolder={onRenameFolder}
        onDeleteFolder={onDeleteFolder}
        onSelectEntry={onSelectEntry}
        onNewEntryInFolder={onNewEntryInFolder || ((_fId) => onNewEntry())}
      />
    );
  }

  // Computed real statistics for grounding
  const totalEntries = entries.length;
  const favoritesCount = entries.filter((e) => e.isFavorite).length;
  const totalWords = entries.reduce((acc, curr) => {
    const text = (curr.journalContent || '') + ' ' + (curr.initialPrompt || '');
    return acc + (text.trim() ? text.trim().split(/\s+/).length : 0);
  }, 0);

  // Daily Prompts catalog
  const DAILY_PROMPTS = [
    {
      title: 'Grounding & Presence',
      prompt: 'What is one thing in this present moment that you feel grounded by or deeply appreciative of?',
      theme: 'Mindfulness',
    },
    {
      title: 'Emotional Landscape',
      prompt: 'What emotion was most present for you today, and what triggered or softened it?',
      theme: 'Self-Awareness',
    },
    {
      title: 'Gentle Horizon',
      prompt: 'If you could give your future self one piece of calm reassurance for tomorrow, what would it be?',
      theme: 'Perspective',
    },
    {
      title: 'Unspoken Words',
      prompt: 'What thought or intention has been circling in your mind that has not yet been spoken aloud?',
      theme: 'Clarity',
    },
  ];

  const renderSectionContent = () => {
    switch (section) {
      case 'daily_prompts':
        return {
          title: 'Daily Reflection Prompts',
          subtitle: 'Thoughtful anchors to cultivate mindfulness and honest introspection.',
          icon: Sparkles,
          content: (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {DAILY_PROMPTS.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-600 transition-all group"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        {item.theme}
                      </span>
                      <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 mt-2">
                        {item.title}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 italic mt-1.5 leading-relaxed font-serif">
                        "{item.prompt}"
                      </p>
                    </div>
                    <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                      <button
                        onClick={() => onNewEntryWithPrompt ? onNewEntryWithPrompt(item.prompt) : onNewEntry()}
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 cursor-pointer"
                      >
                        <span>Reflect on this</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        };

      case 'streaks':
      case 'writing_goals':
      case 'statistics':
        return {
          title: section === 'streaks' ? 'Streaks & Consistency' : section === 'writing_goals' ? 'Writing Goals' : 'Journal Statistics',
          subtitle: 'Nurture your daily practice through steady reflection and measurable clarity.',
          icon: section === 'streaks' ? Flame : section === 'writing_goals' ? Target : BarChart2,
          content: (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
                  <span className="text-[11px] text-stone-700 dark:text-stone-300 uppercase tracking-wider font-semibold">
                    Total Entries
                  </span>
                  <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                    {totalEntries}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
                  <span className="text-[11px] text-stone-700 dark:text-stone-300 uppercase tracking-wider font-semibold">
                    Words Written
                  </span>
                  <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                    {totalWords.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
                  <span className="text-[11px] text-stone-700 dark:text-stone-300 uppercase tracking-wider font-semibold">
                    Favorite Reflections
                  </span>
                  <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                    {favoritesCount}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                  Weekly Commitment Goal
                </h4>
                <div className="w-full bg-stone-100 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-600 dark:bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(15, (totalEntries % 7) * 14.2))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-stone-700 dark:text-stone-300">
                  <span>{totalEntries % 7} of 7 weekly reflections completed</span>
                  <span>{Math.round(((totalEntries % 7) / 7) * 100)}%</span>
                </div>
              </div>
            </div>
          ),
        };

      default:
        // Generic fallback for any other section (ai_insights, talk_to_journal, patterns_themes, weekly_reflection, monthly_reflection, on_this_day, search)
        return {
          title: section.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          subtitle: 'Reflect deeply on your journey and distill meaningful patterns over time.',
          icon: BookOpen,
          content: (
            <div className="p-8 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center space-y-3">
              <Sparkles className="w-7 h-7 text-amber-600 dark:text-amber-400 mx-auto" />
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Connected to your {totalEntries} journal entries
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                As your journal vault grows, this space will distill key reflections, recurring emotional themes, and longitudinal insights using Gemini 3.6 Flash.
              </p>
              <div className="pt-2">
                <button
                  onClick={onNewEntry}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Write an Entry</span>
                </button>
              </div>
            </div>
          ),
        };
    }
  };

  const current = renderSectionContent();
  const Icon = current.icon;

  return (
    <div 
      id={`section-view-${section}`}
      className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 max-w-4xl mx-auto w-full space-y-6 select-none"
    >
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {current.title}
            </h2>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {current.subtitle}
          </p>
        </div>

        <button
          onClick={onNewEntry}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Section Body */}
      {current.content}
    </div>
  );
};
