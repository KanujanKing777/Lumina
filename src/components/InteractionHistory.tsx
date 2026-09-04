import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Sparkles, 
  Lightbulb, 
  FileText, 
  CheckSquare, 
  Tag, 
  Clock, 
  ChevronRight,
  BookOpen,
  X,
  Smile,
  Image as ImageIcon,
  Mic,
  Video,
  PenTool
} from 'lucide-react';
import { InteractionEntry, ReflectionMode, MoodType } from '../types';

interface InteractionHistoryProps {
  entries: InteractionEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: InteractionEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (id: string, e: React.MouseEvent) => void;
  isLoading: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const InteractionHistory: React.FC<InteractionHistoryProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isLoading,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('all');

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

  const getModeLabel = (mode: ReflectionMode) => {
    switch (mode) {
      case 'brainstorm': return 'Brainstorm';
      case 'summarize': return 'Summary';
      case 'action_plan': return 'Action';
      case 'reflect': default: return 'Reflect';
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

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      query === '' ||
      entry.title.toLowerCase().includes(query) ||
      (entry.journalContent && entry.journalContent.toLowerCase().includes(query)) ||
      (entry.initialPrompt && entry.initialPrompt.toLowerCase().includes(query)) ||
      (entry.mood && entry.mood.toLowerCase().includes(query)) ||
      (entry.emotionTags && entry.emotionTags.some((t) => t.toLowerCase().includes(query))) ||
      (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(query)));

    const matchesMode =
      selectedModeFilter === 'all' || entry.mode === selectedModeFilter;

    return matchesSearch && matchesMode;
  });

  const renderContent = (isMobileDrawer = false) => (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Top Header & New Entry Button */}
      <div className="shrink-0 p-4 border-b border-stone-200/80 dark:border-stone-800 space-y-3 bg-stone-50/90 dark:bg-stone-900/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-stone-700 dark:text-stone-400" />
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Journal Vault</h2>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
              {entries.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id={isMobileDrawer ? 'new-reflection-btn-mobile' : 'new-reflection-btn'}
              onClick={onNewEntry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>

            {isMobileDrawer && onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1.5 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer ml-1"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-700 dark:text-stone-400" />
          <input
            id={isMobileDrawer ? 'journal-search-input-mobile' : 'journal-search-input'}
            type="text"
            placeholder="Search entries, mood, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 rounded-lg placeholder:text-stone-500 dark:placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-stone-900 dark:text-stone-100 transition-colors"
          />
        </div>

        {/* Mode filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
          <button
            onClick={() => setSelectedModeFilter('all')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedModeFilter === 'all'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200/60 dark:border-stone-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedModeFilter('reflect')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedModeFilter === 'reflect'
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200/60 dark:border-stone-700'
            }`}
          >
            Reflect
          </button>
          <button
            onClick={() => setSelectedModeFilter('brainstorm')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedModeFilter === 'brainstorm'
                ? 'bg-amber-600 dark:bg-amber-500 text-white'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200/60 dark:border-stone-700'
            }`}
          >
            Brainstorm
          </button>
          <button
            onClick={() => setSelectedModeFilter('summarize')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedModeFilter === 'summarize'
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200/60 dark:border-stone-700'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setSelectedModeFilter('action_plan')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedModeFilter === 'action_plan'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200/60 dark:border-stone-700'
            }`}
          >
            Action
          </button>
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/80 p-2 space-y-1">
        {isLoading && entries.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-700 dark:text-stone-400 space-y-2">
            <div className="w-5 h-5 border-2 border-stone-300 dark:border-stone-700 border-t-amber-600 dark:border-t-amber-500 rounded-full animate-spin mx-auto" />
            <p>Loading entries from isolated Firestore...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-700 dark:text-stone-400 space-y-2">
            <BookOpen className="w-7 h-7 text-stone-300 dark:text-stone-600 mx-auto" />
            <p className="font-medium text-stone-600 dark:text-stone-300">No reflections found</p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Create your first rich journal entry!'}
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
                id={`entry-item-${entry.id}`}
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
                      <span className="text-xs shrink-0" title={`Mood: ${entry.mood} (${entry.moodIntensity || 5}/10)`}>
                        {moodEmoji}
                      </span>
                    ) : (
                      getModeIcon(entry.mode)
                    )}
                    <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate leading-snug">
                      {entry.title || 'Untitled Entry'}
                    </h3>
                  </div>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 shrink-0 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDate(entryDate)}
                  </span>
                </div>

                <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-2 mt-1 leading-relaxed">
                  {entry.journalContent || entry.initialPrompt || (entry.messages[0] ? entry.messages[0].content : 'No content yet')}
                </p>

                {/* Footer metadata & Delete button */}
                <div className="flex items-center justify-between pt-2 mt-1">
                  <div className="flex items-center gap-1.5 overflow-hidden flex-wrap">
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-200/50 dark:border-stone-600">
                      {getModeLabel(entry.mode)}
                    </span>

                    {entry.mood && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
                        {entry.mood} {entry.moodIntensity ? `${entry.moodIntensity}/10` : ''}
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

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-80 lg:w-96 h-full min-h-0 flex-col bg-stone-50/70 dark:bg-stone-900/70 border-r border-stone-200/80 dark:border-stone-800 shrink-0 select-none transition-colors duration-150 overflow-hidden">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
            onClick={onCloseMobile} 
          />
          <div className="relative w-4/5 max-w-sm h-full bg-stone-50 dark:bg-stone-900 shadow-2xl flex flex-col min-h-0 z-10 border-r border-stone-200 dark:border-stone-800 overflow-hidden animate-in slide-in-from-left duration-200">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
