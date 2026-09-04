import React, { useState, useMemo } from 'react';
import {
  Clock,
  ArrowUpDown,
  Search,
  Star,
  Sparkles,
  Lightbulb,
  FileText,
  CheckSquare,
  BookOpen,
  Image as ImageIcon,
  Tag,
  Plus
} from 'lucide-react';
import { InteractionEntry, MoodType, ReflectionMode } from '../types';

interface TimelineViewProps {
  entries: InteractionEntry[];
  onSelectEntry: (entry: InteractionEntry) => void;
  onNewEntry: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  entries,
  onSelectEntry,
  onNewEntry,
}) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');

  const getModeIcon = (mode: ReflectionMode) => {
    switch (mode) {
      case 'brainstorm':
        return <Lightbulb className="w-3.5 h-3.5 text-amber-600" />;
      case 'summarize':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'action_plan':
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'reflect':
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  const getMoodEmoji = (mood?: MoodType) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'calm': return '🌿';
      case 'excited': return '✨';
      case 'grateful': return '🙏';
      case 'neutral': return '😐';
      case 'sad': return '🌧️';
      case 'anxious': return '⚡';
      case 'angry': return '🔥';
      case 'frustrated': return '😤';
      case 'tired': return '🌙';
      default: return null;
    }
  };

  // Filter and sort entries
  const filteredAndSorted = useMemo(() => {
    return entries
      .filter((entry) => {
        // Mood filter
        if (selectedMood !== 'all' && entry.mood !== selectedMood) {
          return false;
        }

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          (entry.title && entry.title.toLowerCase().includes(q)) ||
          (entry.journalContent && entry.journalContent.toLowerCase().includes(q)) ||
          (entry.initialPrompt && entry.initialPrompt.toLowerCase().includes(q)) ||
          (entry.mood && entry.mood.toLowerCase().includes(q)) ||
          (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(q))) ||
          (entry.emotionTags && entry.emotionTags.some((e) => e.toLowerCase().includes(q)))
        );
      })
      .sort((a, b) => {
        const dateA = a.journalDate || a.createdAt;
        const dateB = b.journalDate || b.createdAt;
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [entries, sortOrder, searchQuery, selectedMood]);

  // Group filtered entries by date header
  const groupedEntries = useMemo(() => {
    const groups: { dateLabel: string; items: InteractionEntry[] }[] = [];
    let currentLabel = '';
    let currentItems: InteractionEntry[] = [];

    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    filteredAndSorted.forEach((entry) => {
      const entryDate = new Date(entry.journalDate || entry.createdAt);
      const entryDateStr = entryDate.toDateString();

      let label = '';
      if (entryDateStr === todayStr) {
        label = 'Today';
      } else if (entryDateStr === yesterdayStr) {
        label = 'Yesterday';
      } else {
        label = entryDate.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }

      if (label !== currentLabel) {
        if (currentItems.length > 0) {
          groups.push({ dateLabel: currentLabel, items: currentItems });
        }
        currentLabel = label;
        currentItems = [entry];
      } else {
        currentItems.push(entry);
      }
    });

    if (currentItems.length > 0) {
      groups.push({ dateLabel: currentLabel, items: currentItems });
    }

    return groups;
  }, [filteredAndSorted]);

  return (
    <div className="h-full flex flex-col min-h-0 bg-stone-50 dark:bg-stone-900/60 overflow-hidden">
      {/* Header Bar */}
      <div className="shrink-0 p-4 lg:px-8 border-b border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            Journal Timeline
          </h1>
          <p className="text-xs text-stone-700 dark:text-stone-300 mt-0.5">
            Your life journey in chronological sequence.
          </p>
        </div>

        {/* Action & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 dark:text-stone-300" />
            <input
              type="text"
              placeholder="Search timeline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg placeholder:text-stone-600 dark:placeholder:text-stone-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Mood Filter */}
          <select
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
            className="text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-700 dark:text-stone-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">All Moods</option>
            <option value="happy">😊 Happy</option>
            <option value="calm">🌿 Calm</option>
            <option value="excited">✨ Excited</option>
            <option value="grateful">🙏 Grateful</option>
            <option value="neutral">😐 Neutral</option>
            <option value="sad">🌧️ Sad</option>
            <option value="anxious">⚡ Anxious</option>
            <option value="angry">🔥 Angry</option>
            <option value="frustrated">😤 Frustrated</option>
            <option value="tired">🌙 Tired</option>
          </select>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer transition-colors"
            title={`Sort: ${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>

          {/* New Entry Button */}
          <button
            onClick={onNewEntry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Timeline Stream (Strict Internal Scroll Container) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-3xl mx-auto">
          {filteredAndSorted.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-700 dark:text-stone-300 space-y-3">
              <BookOpen className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                No timeline entries found
              </p>
              <p className="text-stone-600 dark:text-stone-300 max-w-sm mx-auto">
                {searchQuery || selectedMood !== 'all'
                  ? 'No entries match your current search or mood filters.'
                  : 'Start your personal reflections timeline today.'}
              </p>
              <button
                onClick={onNewEntry}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Write First Entry</span>
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedEntries.map((group) => (
                <div key={group.dateLabel} className="space-y-4">
                  {/* Date Sticky Header */}
                  <div className="sticky top-0 z-10 py-1 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-xs flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 px-3 py-1 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-2xs">
                      {group.dateLabel}
                    </span>
                    <div className="flex-1 h-px bg-stone-200 dark:border-stone-800" />
                    <span className="text-[11px] text-stone-700 dark:text-stone-300 font-mono">
                      {group.items.length} {group.items.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>

                  {/* Entries along timeline rail */}
                  <div className="relative pl-6 sm:pl-8 space-y-4 border-l-2 border-stone-200 dark:border-stone-800 ml-3 sm:ml-4">
                    {group.items.map((entry) => {
                      const entryDate = new Date(entry.journalDate || entry.createdAt);
                      const moodEmoji = getMoodEmoji(entry.mood);
                      const mediaCount = entry.media ? entry.media.length : 0;
                      const wordCount = entry.wordCount || ((entry.journalContent || '').trim().split(/\s+/).filter(Boolean).length);

                      return (
                        <div
                          key={entry.id}
                          onClick={() => onSelectEntry(entry)}
                          className="group relative bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600 p-4 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs"
                        >
                          {/* Timeline dot */}
                          <div className="absolute -left-[31px] sm:-left-[39px] top-5 w-4 h-4 rounded-full bg-white dark:bg-stone-900 border-2 border-amber-500 flex items-center justify-center shadow-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          </div>

                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              {moodEmoji ? (
                                <span className="text-base shrink-0">{moodEmoji}</span>
                              ) : (
                                getModeIcon(entry.mode)
                              )}
                              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors truncate">
                                {entry.title || 'Untitled Reflection'}
                              </h3>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 text-xs text-stone-700 dark:text-stone-300">
                              {entry.isFavorite && (
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              )}
                              <span className="font-mono text-[11px]">
                                {entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {/* Preview snippet */}
                          <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3 mt-2 leading-relaxed">
                            {entry.journalContent || entry.initialPrompt || 'No written content'}
                          </p>

                          {/* Footer Tags & Metadata */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-700 dark:text-stone-300">
                            <div className="flex items-center gap-2 flex-wrap">
                              {entry.mood && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium capitalize border border-amber-200/50 dark:border-amber-800/50">
                                  {entry.mood}
                                </span>
                              )}

                              {entry.emotionTags && entry.emotionTags.map((tag) => (
                                <span key={tag} className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[10px]">
                                  #{tag}
                                </span>
                              ))}

                              {mediaCount > 0 && (
                                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                  <ImageIcon className="w-3 h-3" />
                                  <span>{mediaCount}</span>
                                </span>
                              )}
                            </div>

                            <span className="font-mono text-[10px]">
                              {wordCount} words
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
