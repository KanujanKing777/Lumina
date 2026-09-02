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
  BookOpen
} from 'lucide-react';
import { InteractionEntry, ReflectionMode } from '../types';

interface InteractionHistoryProps {
  entries: InteractionEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: InteractionEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (id: string, e: React.MouseEvent) => void;
  isLoading: boolean;
}

export const InteractionHistory: React.FC<InteractionHistoryProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('all');

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
        return <Sparkles className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  const getModeLabel = (mode: ReflectionMode) => {
    switch (mode) {
      case 'brainstorm': return 'Brainstorm';
      case 'summarize': return 'Summary';
      case 'action_plan': return 'Action Plan';
      case 'reflect': default: return 'Reflection';
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
    const matchesSearch =
      searchQuery === '' ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.initialPrompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesMode =
      selectedModeFilter === 'all' || entry.mode === selectedModeFilter;

    return matchesSearch && matchesMode;
  });

  return (
    <div className="h-full flex flex-col bg-stone-50/70 border-r border-stone-200/80 w-full md:w-80 lg:w-96 shrink-0 select-none">
      
      {/* Top Header & New Entry Button */}
      <div className="p-4 border-b border-stone-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-stone-700" />
            <h2 className="text-sm font-semibold text-stone-900 tracking-tight">Journal Vault</h2>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 font-medium">
              {entries.length}
            </span>
          </div>
          <button
            id="new-reflection-btn"
            onClick={onNewEntry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Reflection</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-700" />
          <input
            id="journal-search-input"
            type="text"
            placeholder="Search entries or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg placeholder:text-stone-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-stone-900"
          />
        </div>

        {/* Mode filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
          <button
            onClick={() => setSelectedModeFilter('all')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              selectedModeFilter === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/60'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedModeFilter('reflect')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              selectedModeFilter === 'reflect'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/60'
            }`}
          >
            Reflect
          </button>
          <button
            onClick={() => setSelectedModeFilter('brainstorm')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              selectedModeFilter === 'brainstorm'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/60'
            }`}
          >
            Brainstorm
          </button>
          <button
            onClick={() => setSelectedModeFilter('summarize')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              selectedModeFilter === 'summarize'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/60'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setSelectedModeFilter('action_plan')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              selectedModeFilter === 'action_plan'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/60'
            }`}
          >
            Action
          </button>
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2 space-y-1">
        {isLoading && entries.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-700 space-y-2">
            <div className="w-5 h-5 border-2 border-stone-300 border-t-amber-600 rounded-full animate-spin mx-auto" />
            <p>Loading entries from isolated Firestore...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-700 space-y-2">
            <BookOpen className="w-7 h-7 text-stone-300 mx-auto" />
            <p className="font-medium text-stone-600">No reflections found</p>
            <p className="text-[11px] text-stone-700">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Create your first journal reflection with Gemini!'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = selectedEntryId === entry.id;
            return (
              <div
                key={entry.id}
                id={`entry-item-${entry.id}`}
                onClick={() => onSelectEntry(entry)}
                className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-150 border ${
                  isSelected
                    ? 'bg-white border-amber-300/80 shadow-xs'
                    : 'bg-transparent border-transparent hover:bg-white/80 hover:border-stone-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getModeIcon(entry.mode)}
                    <h3 className="text-xs font-semibold text-stone-900 truncate leading-snug">
                      {entry.title || 'Untitled Reflection'}
                    </h3>
                  </div>
                  <span className="text-[10px] text-stone-700 shrink-0 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDate(entry.createdAt)}
                  </span>
                </div>

                <p className="text-[11px] text-stone-700 line-clamp-2 mt-1 leading-relaxed">
                  {entry.initialPrompt || (entry.messages[0] ? entry.messages[0].content : 'No content yet')}
                </p>

                {/* Footer metadata & Delete button */}
                <div className="flex items-center justify-between pt-2 mt-1">
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200/50">
                      {getModeLabel(entry.mode)}
                    </span>
                    {entry.messages && (
                      <span className="text-[10px] text-stone-700">
                        {entry.messages.length} {entry.messages.length === 1 ? 'msg' : 'msgs'}
                      </span>
                    )}
                    {entry.tags && entry.tags.length > 0 && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium truncate max-w-[80px]">
                        #{entry.tags[0]}
                      </span>
                    )}
                  </div>

                  <button
                    id={`delete-entry-${entry.id}`}
                    onClick={(e) => onDeleteEntry(entry.id!, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-700 hover:text-red-600 rounded hover:bg-red-50 transition-opacity"
                    title="Delete reflection from Firestore"
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
