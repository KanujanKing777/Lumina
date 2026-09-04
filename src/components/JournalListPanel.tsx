import React, { useState } from 'react';
import {
  Search,
  Trash2,
  Sparkles,
  Lightbulb,
  FileText,
  CheckSquare,
  Clock,
  BookOpen,
  Star,
  Image as ImageIcon,
  Folder
} from 'lucide-react';
import { InteractionEntry, ReflectionMode, MoodType, NavigationSection, FolderItem } from '../types';
import { ArrowUpDown } from 'lucide-react';

interface JournalListPanelProps {
  entries: InteractionEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: InteractionEntry) => void;
  onDeleteEntry: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite?: (id: string, currentFav: boolean, e: React.MouseEvent) => void;
  isLoading: boolean;
  activeSection: NavigationSection;
  searchFilter: string;
  onSearchChange: (q: string) => void;
  folders?: FolderItem[];
  selectedFolderId?: string;
  onSelectFolder?: (folderId: string) => void;
}

export const JournalListPanel: React.FC<JournalListPanelProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onDeleteEntry,
  onToggleFavorite,
  isLoading,
  activeSection,
  searchFilter,
  onSearchChange,
  folders = [],
  selectedFolderId = 'all',
  onSelectFolder,
}) => {
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const getModeIcon = (mode: ReflectionMode) => {
    switch (mode) {
      case 'brainstorm':
        return <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'summarize':
        return <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'action_plan':
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'reflect':
      default:
        return <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
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

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Filter and sort entries based on activeSection, searchFilter, mode, and folder
  const filteredEntries = entries
    .filter((entry) => {
      // 1. Navigation Section Filter
      if (activeSection === 'favorites' && !entry.isFavorite) {
        return false;
      }

      // 2. Mode Filter
      if (selectedModeFilter !== 'all' && entry.mode !== selectedModeFilter) {
        return false;
      }

      // 3. Folder Filter
      if (selectedFolderId !== 'all') {
        const inPrimary = entry.folderId === selectedFolderId;
        const inMultiple = entry.folderIds && entry.folderIds.includes(selectedFolderId);
        if (!inPrimary && !inMultiple) return false;
      }

      // 4. Search Filter
      const query = searchFilter.toLowerCase().trim();
      if (!query) return true;

      return (
        (entry.title && entry.title.toLowerCase().includes(query)) ||
        (entry.journalContent && entry.journalContent.toLowerCase().includes(query)) ||
        (entry.initialPrompt && entry.initialPrompt.toLowerCase().includes(query)) ||
        (entry.mood && entry.mood.toLowerCase().includes(query)) ||
        (entry.emotionTags && entry.emotionTags.some((t) => t.toLowerCase().includes(query))) ||
        (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(query)))
      );
    })
    .sort((a, b) => {
      const dateA = a.journalDate || a.createdAt;
      const dateB = b.journalDate || b.createdAt;
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const getSectionHeading = () => {
    switch (activeSection) {
      case 'favorites':
        return {
          title: 'Favorites',
          icon: <Star className="w-4 h-4 text-amber-500 fill-amber-500" />,
          count: filteredEntries.length,
        };
      case 'folders':
        return {
          title: 'Folders & Collections',
          icon: <Folder className="w-4 h-4 text-stone-600 dark:text-stone-400" />,
          count: filteredEntries.length,
        };
      case 'all':
      default:
        return {
          title: 'All Journals',
          icon: <BookOpen className="w-4 h-4 text-stone-600 dark:text-stone-400" />,
          count: filteredEntries.length,
        };
    }
  };

  const heading = getSectionHeading();

  return (
    <div className="h-full flex flex-col min-h-0 bg-stone-50/50 dark:bg-stone-900/50 border-r border-stone-200/80 dark:border-stone-800 shrink-0 select-none overflow-hidden w-80 lg:w-88 xl:w-96 transition-colors duration-150">
      {/* Header & Filter Controls */}
      <div className="shrink-0 p-3.5 border-b border-stone-200/80 dark:border-stone-800 space-y-2.5 bg-white/70 dark:bg-stone-900/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {heading.icon}
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
              {heading.title}
            </h2>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
              {heading.count}
            </span>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 text-[11px] font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 px-1.5 py-0.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title={`Sort: ${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`}
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-700 dark:text-stone-300" />
          <input
            id="journal-panel-search-input"
            type="text"
            placeholder="Search entries, mood, tags..."
            value={searchFilter}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 rounded-lg placeholder:text-stone-600 dark:placeholder:text-stone-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-stone-900 dark:text-stone-100 transition-colors"
          />
        </div>

        {/* Optional Folder quick selector if folders exist and not in specific section */}
        {folders.length > 0 && onSelectFolder && (
          <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-0.5 no-scrollbar">
            <button
              onClick={() => onSelectFolder('all')}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedFolderId === 'all'
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200/60 dark:border-stone-700'
              }`}
            >
              All Folders
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => onSelectFolder(f.id)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedFolderId === f.id
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200/60 dark:border-stone-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color || '#D97706' }} />
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Mode filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
          {['all', 'reflect', 'brainstorm', 'summarize', 'action_plan'].map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedModeFilter(mode)}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedModeFilter === mode
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200/60 dark:border-stone-700'
              }`}
            >
              {mode === 'all' ? 'All' : mode === 'action_plan' ? 'Action' : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List (Strict Internal Scroll Container) */}
      <div 
        id="journal-entries-scroll-container"
        className="flex-1 min-h-0 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/80 p-2 space-y-1"
      >
        {isLoading && entries.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-700 dark:text-stone-300 space-y-2">
            <div className="w-5 h-5 border-2 border-stone-300 dark:border-stone-700 border-t-amber-600 dark:border-t-amber-500 rounded-full animate-spin mx-auto" />
            <p>Loading entries from isolated Firestore...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-700 dark:text-stone-300 space-y-2">
            <BookOpen className="w-7 h-7 text-stone-300 dark:text-stone-600 mx-auto" />
            <p className="font-medium text-stone-700 dark:text-stone-200">
              {activeSection === 'favorites' ? 'No favorites starred yet' : 'No entries found'}
            </p>
            <p className="text-[11px] text-stone-600 dark:text-stone-300">
              {searchFilter
                ? 'Try adjusting your search criteria.'
                : activeSection === 'favorites'
                ? 'Click the star icon on any entry to add it to your favorites.'
                : 'Write your first journal reflection!'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = selectedEntryId === entry.id;
            const moodEmoji = getMoodEmoji(entry.mood);
            const mediaCount = entry.media ? entry.media.length : 0;
            const entryDate = entry.journalDate || entry.createdAt;

            return (
              <div
                key={entry.id}
                id={`journal-entry-card-${entry.id}`}
                onClick={() => onSelectEntry(entry)}
                className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-150 border ${
                  isSelected
                    ? 'bg-white dark:bg-stone-800/90 border-amber-300/80 dark:border-amber-500/80 shadow-xs'
                    : 'bg-transparent border-transparent hover:bg-white/80 dark:hover:bg-stone-800/50 hover:border-stone-200 dark:hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {moodEmoji ? (
                      <span className="text-xs shrink-0" title={`Mood: ${entry.mood}`}>
                        {moodEmoji}
                      </span>
                    ) : (
                      getModeIcon(entry.mode)
                    )}
                    <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate leading-snug">
                      {entry.title || 'Untitled Entry'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Favorite Star Button */}
                    <button
                      type="button"
                      onClick={(e) => onToggleFavorite && onToggleFavorite(entry.id!, !!entry.isFavorite, e)}
                      className={`p-0.5 rounded transition-colors cursor-pointer ${
                        entry.isFavorite
                          ? 'text-amber-500 hover:text-amber-600'
                          : 'text-stone-300 hover:text-amber-500 dark:text-stone-600 dark:hover:text-amber-400'
                      }`}
                      title={entry.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                    >
                      <Star className={`w-3.5 h-3.5 ${entry.isFavorite ? 'fill-amber-500' : ''}`} />
                    </button>

                    <span className="text-[10px] text-stone-600 dark:text-stone-300 flex items-center gap-0.5 ml-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDate(entryDate)}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-2 mt-1 leading-relaxed">
                  {entry.journalContent || entry.initialPrompt || (entry.messages[0] ? entry.messages[0].content : 'No content yet')}
                </p>

                {/* Footer metadata & Delete button */}
                <div className="flex items-center justify-between pt-2 mt-1">
                  <div className="flex items-center gap-1.5 overflow-hidden flex-wrap">
                    {entry.mood && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
                        {entry.mood}
                      </span>
                    )}

                    {mediaCount > 0 && (
                      <span className="text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                        <ImageIcon className="w-2.5 h-2.5" />
                        {mediaCount}
                      </span>
                    )}

                    {entry.status === 'draft' && (
                      <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                        Draft
                      </span>
                    )}
                  </div>

                  <button
                    id={`delete-entry-${entry.id}`}
                    onClick={(e) => onDeleteEntry(entry.id!, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-opacity cursor-pointer shrink-0"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
