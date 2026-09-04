import React from 'react';
import {
  X,
  FileText,
  Sparkles,
  Info,
  Clock,
  Smile,
  Tag,
  Paperclip,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { InteractionEntry } from '../types';

interface ContextualRightPanelProps {
  entry: InteractionEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContextualRightPanel: React.FC<ContextualRightPanelProps> = ({
  entry,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const content = entry?.journalContent || '';
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <aside 
      id="contextual-right-panel"
      className="w-72 xl:w-80 h-full min-h-0 bg-stone-50/70 dark:bg-stone-900/70 border-l border-stone-200/80 dark:border-stone-800 flex flex-col shrink-0 overflow-hidden transition-colors duration-150 animate-in slide-in-from-right-2 duration-200"
      aria-label="Contextual Entry Details and Insights"
    >
      {/* Top Header */}
      <div className="p-3.5 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between shrink-0 bg-white/60 dark:bg-stone-900/60">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-stone-700 dark:text-stone-300" />
          <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
            Entry Details & Insights
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 cursor-pointer"
          aria-label="Close details panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Scroll Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Section 1: Writing Metrics */}
        <div className="space-y-2.5">
          <div className="text-[10px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
            Writing Metrics
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 text-center">
              <span className="text-[10px] text-stone-700 dark:text-stone-300 block">Words</span>
              <span className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono">
                {wordCount}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 text-center">
              <span className="text-[10px] text-stone-700 dark:text-stone-300 block">Chars</span>
              <span className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono">
                {charCount}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 text-center">
              <span className="text-[10px] text-stone-700 dark:text-stone-300 block">Read Time</span>
              <span className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono">
                ~{readingTimeMin}m
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Metadata Information */}
        <div className="space-y-2.5">
          <div className="text-[10px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
            Metadata & Timing
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 space-y-2">
            <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span>Journal Date</span>
              </span>
              <span className="font-mono text-stone-800 dark:text-stone-200">
                {entry?.journalDate
                  ? new Date(entry.journalDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Today'}
              </span>
            </div>

            <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                <span>Last Updated</span>
              </span>
              <span className="font-mono text-stone-800 dark:text-stone-200">
                {entry?.updatedAt
                  ? new Date(entry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Just now'}
              </span>
            </div>

            {entry?.mood && (
              <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-700">
                <span className="flex items-center gap-1.5">
                  <Smile className="w-3 h-3" />
                  <span>Mood Checked</span>
                </span>
                <span className="font-semibold text-amber-700 dark:text-amber-400 capitalize">
                  {entry.mood} ({entry.moodIntensity || 5}/10)
                </span>
              </div>
            )}

            {entry?.media && entry.media.length > 0 && (
              <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-700">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3 h-3" />
                  <span>Attached Media</span>
                </span>
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {entry.media.length} items
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Distilled AI Insights */}
        {entry?.summary && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Session Distillation</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 space-y-2">
              <p className="italic text-stone-700 dark:text-stone-300 leading-relaxed font-serif">
                "{entry.summary}"
              </p>

              {entry.keyInsights && entry.keyInsights.length > 0 && (
                <ul className="space-y-1 pt-1 border-t border-amber-200/60 dark:border-amber-800/60 list-disc list-inside text-stone-700 dark:text-stone-300">
                  {entry.keyInsights.map((insight, idx) => (
                    <li key={idx} className="leading-snug">{insight}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Section 4: AI Model & Privacy Shield */}
        <div className="p-3 rounded-xl bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800 text-[11px] text-stone-700 dark:text-stone-300 space-y-1">
          <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Isolated Cloud Vault</span>
          </div>
          <p className="leading-relaxed">
            All reflections are isolated to your authenticated Google account and verified server-side with zero cross-user access.
          </p>
        </div>
      </div>
    </aside>
  );
};
