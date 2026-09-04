import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Calendar,
  Smile,
  Tag,
  Folder,
  Star,
  BookOpen,
  ArrowUpDown,
  Sparkles,
  Clock,
  RotateCcw
} from 'lucide-react';
import { InteractionEntry, MoodType, FolderItem, ReflectionMode } from '../types';

interface SearchViewProps {
  entries: InteractionEntry[];
  folders: FolderItem[];
  initialSearchQuery?: string;
  onSelectEntry: (entry: InteractionEntry) => void;
  onNewEntry: () => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  entries,
  folders,
  initialSearchQuery = '',
  onSelectEntry,
  onNewEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all'); // 'all' | 'today' | '7days' | '30days' | '90days' | 'this_year'
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'title_asc' | 'words_desc'>('newest');

  // Collect all unique tags from user's entries
  const allUserTags = useMemo(() => {
    const tagsSet = new Set<string>();
    entries.forEach((e) => {
      if (e.tags) e.tags.forEach((t) => tagsSet.add(t));
      if (e.emotionTags) e.emotionTags.forEach((t) => tagsSet.add(t));
    });
    return Array.from(tagsSet).sort();
  }, [entries]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMood('all');
    setSelectedMode('all');
    setSelectedFolderId('all');
    setDateRange('all');
    setOnlyFavorites(false);
    setSelectedTag('all');
    setSortOption('newest');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedMood !== 'all' ||
    selectedMode !== 'all' ||
    selectedFolderId !== 'all' ||
    dateRange !== 'all' ||
    onlyFavorites ||
    selectedTag !== 'all';

  // Filter and sort computation
  const filteredEntries = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return entries.filter((entry) => {
      const entryTimestamp = entry.journalDate || entry.createdAt;

      // 1. Search Query across title, content, prompt, summary, tags, mood
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = entry.title && entry.title.toLowerCase().includes(q);
        const matchesContent = entry.journalContent && entry.journalContent.toLowerCase().includes(q);
        const matchesPrompt = entry.initialPrompt && entry.initialPrompt.toLowerCase().includes(q);
        const matchesSummary = entry.summary && entry.summary.toLowerCase().includes(q);
        const matchesMood = entry.mood && entry.mood.toLowerCase().includes(q);
        const matchesTags = entry.tags && entry.tags.some((t) => t.toLowerCase().includes(q));
        const matchesEmotions = entry.emotionTags && entry.emotionTags.some((e) => e.toLowerCase().includes(q));

        if (!matchesTitle && !matchesContent && !matchesPrompt && !matchesSummary && !matchesMood && !matchesTags && !matchesEmotions) {
          return false;
        }
      }

      // 2. Favorites
      if (onlyFavorites && !entry.isFavorite) {
        return false;
      }

      // 3. Mood filter
      if (selectedMood !== 'all' && entry.mood !== selectedMood) {
        return false;
      }

      // 4. Mode filter
      if (selectedMode !== 'all' && entry.mode !== selectedMode) {
        return false;
      }

      // 5. Folder / Collection filter
      if (selectedFolderId !== 'all') {
        const inPrimary = entry.folderId === selectedFolderId;
        const inMultiple = entry.folderIds && entry.folderIds.includes(selectedFolderId);
        if (!inPrimary && !inMultiple) return false;
      }

      // 6. Tag filter
      if (selectedTag !== 'all') {
        const hasInTags = entry.tags && entry.tags.includes(selectedTag);
        const hasInEmotions = entry.emotionTags && entry.emotionTags.includes(selectedTag);
        if (!hasInTags && !hasInEmotions) return false;
      }

      // 7. Date Range filter
      if (dateRange !== 'all') {
        const diff = now - entryTimestamp;
        if (dateRange === 'today' && diff > oneDay) return false;
        if (dateRange === '7days' && diff > 7 * oneDay) return false;
        if (dateRange === '30days' && diff > 30 * oneDay) return false;
        if (dateRange === '90days' && diff > 90 * oneDay) return false;
        if (dateRange === 'this_year') {
          const entryYear = new Date(entryTimestamp).getFullYear();
          const currentYear = new Date().getFullYear();
          if (entryYear !== currentYear) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const dateA = a.journalDate || a.createdAt;
      const dateB = b.journalDate || b.createdAt;
      const wordsA = a.wordCount || ((a.journalContent || '').trim().split(/\s+/).filter(Boolean).length);
      const wordsB = b.wordCount || ((b.journalContent || '').trim().split(/\s+/).filter(Boolean).length);

      switch (sortOption) {
        case 'oldest':
          return dateA - dateB;
        case 'title_asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'words_desc':
          return wordsB - wordsA;
        case 'newest':
        default:
          return dateB - dateA;
      }
    });
  }, [
    entries,
    searchQuery,
    selectedMood,
    selectedMode,
    selectedFolderId,
    dateRange,
    onlyFavorites,
    selectedTag,
    sortOption,
  ]);

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

  return (
    <div className="h-full flex flex-col min-h-0 bg-stone-50 dark:bg-stone-900/60 overflow-hidden">
      {/* Search Header */}
      <div className="shrink-0 p-4 lg:px-8 border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Search className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              Journal Search & Filters
            </h1>
            <p className="text-xs text-stone-700 dark:text-stone-300 mt-0.5">
              Deep search across titles, contents, reflections, mood tags, and dates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'result' : 'results'}
            </span>
          </div>
        </div>

        {/* Global Search Input Box */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-600 dark:text-stone-300" />
          <input
            id="global-search-view-input"
            type="text"
            placeholder="Type anything to search (e.g. gratitude, morning walk, work goal, happy, #mindful)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl placeholder:text-stone-600 dark:placeholder:text-stone-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-600 hover:text-stone-800 dark:text-stone-300 dark:hover:text-stone-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-xs text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7days">Past 7 Days</option>
              <option value="30days">Past 30 Days</option>
              <option value="90days">Past 90 Days</option>
              <option value="this_year">This Year</option>
            </select>
          </div>

          {/* Mood Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <Smile className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="bg-transparent text-xs text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
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
          </div>

          {/* Folder / Collection Selector */}
          {folders.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <Folder className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="bg-transparent text-xs text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Collections</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tags Selector */}
          {allUserTags.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <Tag className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="bg-transparent text-xs text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Tags</option>
                {allUserTags.map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Favorites Only Toggle */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer shadow-2xs ${
              onlyFavorites
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-semibold'
                : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'text-amber-500 fill-amber-500' : 'text-stone-700 dark:text-stone-300'}`} />
            <span>Favorites only</span>
          </button>

          {/* Sort By Option */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 shadow-2xs ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-transparent text-xs text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="words_desc">Longest Entry</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Container (Strict Internal Scroll Container) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-700 dark:text-stone-300 space-y-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8 shadow-2xs">
              <BookOpen className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                No matching journal reflections found
              </p>
              <p className="text-stone-600 dark:text-stone-300 max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'Try broadening your search query or removing some active filters.'
                  : 'You have not written any journal reflections yet.'}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              ) : (
                <button
                  onClick={onNewEntry}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <span>Write Your First Reflection</span>
                </button>
              )}
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const entryDate = new Date(entry.journalDate || entry.createdAt);
              const moodEmoji = getMoodEmoji(entry.mood);
              const wordCount = entry.wordCount || ((entry.journalContent || '').trim().split(/\s+/).filter(Boolean).length);
              const matchingFolder = folders.find((f) => f.id === entry.folderId);

              return (
                <div
                  key={entry.id}
                  onClick={() => onSelectEntry(entry)}
                  className="group bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600 p-4 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {moodEmoji ? (
                        <span className="text-base shrink-0">{moodEmoji}</span>
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors truncate">
                        {entry.title || 'Untitled Entry'}
                      </h3>
                      {entry.isFavorite && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-stone-600 dark:text-stone-300 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{entryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Body preview */}
                  <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 mt-2 leading-relaxed">
                    {entry.journalContent || entry.initialPrompt || 'No written content'}
                  </p>

                  {/* Footer metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-700 dark:text-stone-300">
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.mood && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium capitalize border border-amber-200/50 dark:border-amber-800/50">
                          {entry.mood}
                        </span>
                      )}

                      {matchingFolder && (
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1">
                          <Folder className="w-2.5 h-2.5" />
                          <span>{matchingFolder.name}</span>
                        </span>
                      )}

                      {entry.tags && entry.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[10px]">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <span className="font-mono text-[10px]">
                      {wordCount} words
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
