import React, { useState } from 'react';
import {
  Hourglass,
  Calendar,
  X,
  Sparkles,
  MessageSquare,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Clock,
  Send,
  Lock,
  Unlock,
  Smile
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FutureMeMessage, InteractionEntry } from '../types';

interface FutureMeReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: FutureMeMessage | null;
  onOpenMessage: (messageId: string) => Promise<void>;
  onSaveReflection: (messageId: string, reflection: string, modelUsed: string) => Promise<void>;
  onViewCurrentEntry?: (entryId: string) => void;
  currentEntries?: InteractionEntry[];
}

export const FutureMeReaderModal: React.FC<FutureMeReaderModalProps> = ({
  isOpen,
  onClose,
  message,
  onOpenMessage,
  onSaveReflection,
  onViewCurrentEntry,
  currentEntries = [],
}) => {
  const [isOpeningSeal, setIsOpeningSeal] = useState(false);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const [currentThoughts, setCurrentThoughts] = useState('');
  const [reflectionText, setReflectionText] = useState<string>(message?.reflectionResult || '');
  const [reflectionModel, setReflectionModel] = useState<string>(message?.reflectionModelUsed || '');
  const [reflectionError, setReflectionError] = useState<string | null>(null);

  if (!isOpen || !message) return null;

  const isUnopened = !message.openedAt;
  const createdDate = new Date(message.createdAt);
  const scheduledDate = new Date(message.scheduledFor);
  const formattedCreated = createdDate.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedScheduled = scheduledDate.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate elapsed time description
  const daysAgo = Math.max(1, Math.floor((Date.now() - message.createdAt) / (1000 * 60 * 60 * 24)));
  const timeAgoLabel =
    daysAgo >= 365
      ? `${Math.floor(daysAgo / 365)} year${Math.floor(daysAgo / 365) > 1 ? 's' : ''} ago`
      : daysAgo >= 30
      ? `${Math.floor(daysAgo / 30)} month${Math.floor(daysAgo / 30) > 1 ? 's' : ''} ago`
      : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;

  const handleBreakSeal = async () => {
    if (!message.id) return;
    setIsOpeningSeal(true);
    try {
      await onOpenMessage(message.id);
    } catch (err) {
      console.error('Failed to unseal Future Me message:', err);
    } finally {
      setIsOpeningSeal(false);
    }
  };

  const handleGenerateReflection = async () => {
    if (!message.id || isGeneratingReflection) return;
    setIsGeneratingReflection(true);
    setReflectionError(null);

    try {
      const response = await fetch('/api/gemini/future-me-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pastSnapshot: message.snapshot,
          pastMessage: message.message,
          pastQuestion: message.optionalFutureQuestion,
          currentThoughts,
          currentEntries: currentEntries.slice(0, 8),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate journey reflection.');
      }

      setReflectionText(data.reflection);
      setReflectionModel(data.modelUsed || 'gemini');
      await onSaveReflection(message.id, data.reflection, data.modelUsed || 'gemini');
    } catch (err: any) {
      console.error('Reflection error:', err);
      setReflectionError(err.message || 'Failed to connect to reflection service.');
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-150 select-none"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              {isUnopened ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <div>
              <h2 id="reader-modal-title" className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Letter to Future Me
              </h2>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <span>Written {formattedCreated} ({timeAgoLabel})</span>
                <span>•</span>
                <span>Delivered {formattedScheduled}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-700 dark:text-stone-300">
          {/* SEALED VIEW: If unopened */}
          {isUnopened ? (
            <div className="py-12 px-6 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5 shadow-inner">
                <Hourglass className="w-10 h-10 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-2">
                A Sealed Message From Your Past Self
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
                You wrote this on <strong>{formattedCreated}</strong> ({timeAgoLabel}) with the title <em>&ldquo;{message.title}&rdquo;</em>. Its scheduled date has arrived. Break the seal to read what your past self wanted you to remember.
              </p>
              <button
                type="button"
                onClick={handleBreakSeal}
                disabled={isOpeningSeal}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-md active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isOpeningSeal ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Unsealing Message...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Break Seal &amp; Open Letter</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* UNSEALED / OPENED VIEW */
            <>
              {/* Optional Personal Note to Future Self */}
              {message.message && (
                <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Note From Your Past Self</span>
                  </div>
                  <p className="text-xs font-serif italic text-stone-800 dark:text-stone-200 leading-relaxed">
                    &ldquo;{message.message}&rdquo;
                  </p>
                </div>
              )}

              {/* Optional Question Left for Future Self */}
              {message.optionalFutureQuestion && (
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/60">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Question You Asked Yourself</span>
                  </div>
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    {message.optionalFutureQuestion}
                  </p>
                </div>
              )}

              {/* Journal Snapshot Content */}
              <div className="p-5 rounded-2xl bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/70 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-700/50 pb-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                      Preserved Journal Entry
                    </span>
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mt-0.5">
                      {message.snapshot.title}
                    </h3>
                  </div>
                  {message.snapshot.mood && (
                    <div className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-[11px] font-medium flex items-center gap-1">
                      <Smile className="w-3 h-3 text-amber-500" />
                      <span className="capitalize">{message.snapshot.mood}</span>
                      {message.snapshot.moodIntensity && (
                        <span className="text-stone-400">({message.snapshot.moodIntensity}/10)</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="prose prose-stone dark:prose-invert max-w-none text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                  <ReactMarkdown>
                    {message.snapshot.journalContent || '(Empty entry)'}
                  </ReactMarkdown>
                </div>

                {/* Emotion Tags */}
                {message.snapshot.emotionTags && message.snapshot.emotionTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-100 dark:border-stone-700/40">
                    {message.snapshot.emotionTags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Original Entry Button (If present in workspace) */}
              {message.sourceEntryId && onViewCurrentEntry && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onViewCurrentEntry(message.sourceEntryId!);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open Current Journal Entry</span>
                  </button>
                </div>
              )}

              {/* AI "REFLECT ON THE JOURNEY" SECTION */}
              <div className="mt-6 pt-5 border-t border-stone-200 dark:border-stone-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                        Reflect on the Journey
                      </h4>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400">
                        Synthesize your evolution and how you have grown between then and now.
                      </p>
                    </div>
                  </div>

                  {(!reflectionText || isGeneratingReflection) && (
                    <button
                      type="button"
                      onClick={handleGenerateReflection}
                      disabled={isGeneratingReflection}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-900 dark:text-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/80 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isGeneratingReflection ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Reflecting...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Reflect on the Journey</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {reflectionError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs">
                    {reflectionError}
                  </div>
                )}

                {/* Optional thoughts input before generating */}
                {!reflectionText && !isGeneratingReflection && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] text-stone-600 dark:text-stone-400">
                      How does it feel reading this today? (Optional thought to guide the reflection):
                    </label>
                    <textarea
                      rows={2}
                      value={currentThoughts}
                      onChange={(e) => setCurrentThoughts(e.target.value)}
                      placeholder="e.g. It feels surreal. Back then I was worried about this, but things worked out better than expected..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>
                )}

                {/* Display Generated Reflection */}
                {reflectionText && (
                  <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50 space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-amber-800 dark:text-amber-400 font-medium">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        AI Journey Synthesis
                      </span>
                      {reflectionModel && <span>Model: {reflectionModel}</span>}
                    </div>

                    <div className="prose prose-stone dark:prose-invert max-w-none text-xs leading-relaxed text-stone-800 dark:text-stone-200">
                      <ReactMarkdown>{reflectionText}</ReactMarkdown>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleGenerateReflection}
                        disabled={isGeneratingReflection}
                        className="text-[11px] text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isGeneratingReflection ? 'animate-spin' : ''}`} />
                        <span>Regenerate Reflection</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50 shrink-0">
          <div className="text-[11px] text-stone-500 dark:text-stone-400">
            {isUnopened ? 'Seal intact' : `Opened on ${new Date(message.openedAt || Date.now()).toLocaleDateString()}`}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
