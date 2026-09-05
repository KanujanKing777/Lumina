import React, { useState } from 'react';
import {
  Hourglass,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Bell,
  Sparkles,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { InteractionEntry, FutureMePreset, FutureMeEntrySnapshot } from '../types';

interface SendToFutureMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: InteractionEntry | null;
  currentContent?: string;
  currentTitle?: string;
  onSchedule: (data: {
    scheduledFor: number;
    message: string;
    optionalFutureQuestion: string;
    notificationEnabled: boolean;
    snapshot: FutureMeEntrySnapshot;
  }) => Promise<void>;
}

export const SendToFutureMeModal: React.FC<SendToFutureMeModalProps> = ({
  isOpen,
  onClose,
  entry,
  currentContent = '',
  currentTitle = '',
  onSchedule,
}) => {
  const [preset, setPreset] = useState<FutureMePreset>('1_month');
  const [customDate, setCustomDate] = useState<string>('');
  const [personalNote, setPersonalNote] = useState('');
  const [futureQuestion, setFutureQuestion] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate target delivery timestamp based on chosen preset or custom date
  const calculateScheduledTimestamp = (): number => {
    const now = new Date();
    if (preset === '1_week') {
      const d = new Date(now);
      d.setDate(d.getDate() + 7);
      return d.getTime();
    }
    if (preset === '1_month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() + 1);
      return d.getTime();
    }
    if (preset === '3_months') {
      const d = new Date(now);
      d.setMonth(d.getMonth() + 3);
      return d.getTime();
    }
    if (preset === '6_months') {
      const d = new Date(now);
      d.setMonth(d.getMonth() + 6);
      return d.getTime();
    }
    if (preset === '1_year') {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() + 1);
      return d.getTime();
    }
    if (preset === 'custom' && customDate) {
      return new Date(customDate).getTime();
    }
    // Fallback: 1 month
    const d = new Date(now);
    d.setMonth(d.getMonth() + 1);
    return d.getTime();
  };

  const handleSave = async () => {
    setValidationError(null);
    const scheduledTimestamp = calculateScheduledTimestamp();
    const now = Date.now();

    if (preset === 'custom' && !customDate) {
      setValidationError('Please select a custom delivery date.');
      return;
    }

    if (scheduledTimestamp <= now) {
      setValidationError('The scheduled date must be strictly in the future.');
      return;
    }

    const titleToSend = (currentTitle || entry?.title || 'Journal Entry').trim();
    const contentToSend = (currentContent || entry?.journalContent || entry?.initialPrompt || '').trim();

    if (!contentToSend && !personalNote.trim()) {
      setValidationError('Please write some journal content or a personal note before scheduling.');
      return;
    }

    const snapshot: FutureMeEntrySnapshot = {
      title: titleToSend,
      journalContent: contentToSend,
      mood: entry?.mood,
      moodIntensity: entry?.moodIntensity,
      emotionTags: entry?.emotionTags,
      journalDate: entry?.journalDate || entry?.createdAt || now,
    };

    setIsSubmitting(true);
    try {
      await onSchedule({
        scheduledFor: scheduledTimestamp,
        message: personalNote.trim(),
        optionalFutureQuestion: futureQuestion.trim(),
        notificationEnabled,
        snapshot,
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to schedule Future Me message:', err);
      setValidationError(err.message || 'Failed to schedule message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveTitle = currentTitle || entry?.title || 'Untitled Journal Entry';
  const effectiveContent = currentContent || entry?.journalContent || entry?.initialPrompt || '';
  const snippet = effectiveContent.slice(0, 160) + (effectiveContent.length > 160 ? '...' : '');

  // Calculate formatted preview date
  const previewTimestamp = calculateScheduledTimestamp();
  const formattedPreview = new Date(previewTimestamp).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="future-me-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-150 select-none"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60">
              <Hourglass className="w-5 h-5" />
            </div>
            <div>
              <h2 id="future-me-modal-title" className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Send to Future Me
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Your future self will receive this entry on the selected date.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-stone-700 dark:text-stone-300">
          {/* Error Banner */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Entry Snapshot Card */}
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-400">
                Entry Snapshot
              </span>
              <span className="text-[10px] text-stone-400">
                {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-xs mb-1">
              {effectiveTitle}
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 italic">
              {snippet || '(No content typed yet)'}
            </p>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block font-medium text-stone-800 dark:text-stone-200 mb-2">
              Deliver on:
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2.5">
              {[
                { id: '1_week' as FutureMePreset, label: '1 Week' },
                { id: '1_month' as FutureMePreset, label: '1 Month' },
                { id: '3_months' as FutureMePreset, label: '3 Months' },
                { id: '6_months' as FutureMePreset, label: '6 Months' },
                { id: '1_year' as FutureMePreset, label: '1 Year' },
                { id: 'custom' as FutureMePreset, label: 'Custom' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreset(item.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                    preset === item.id
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 shadow-2xs'
                      : 'bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Custom Date Input */}
            {preset === 'custom' && (
              <div className="mt-2.5">
                <label className="block text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                  Select a future delivery date & time:
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={customDate}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Delivery Date Preview Notice */}
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Scheduled delivery: <strong>{formattedPreview}</strong></span>
            </div>
          </div>

          {/* Optional Message / Note to Future Self */}
          <div>
            <label className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200 mb-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
              <span>Optional note to your future self:</span>
            </label>
            <textarea
              rows={2}
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              placeholder="e.g. Remember how nervous you felt today? I hope everything turned out well."
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              maxLength={2000}
            />
          </div>

          {/* Optional Question for Future Self */}
          <div>
            <label className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200 mb-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
              <span>Ask your future self a question (optional):</span>
            </label>
            <input
              type="text"
              value={futureQuestion}
              onChange={(e) => setFutureQuestion(e.target.value)}
              placeholder="e.g. Did we finish the marathon? Are you happy with the new job?"
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              maxLength={500}
            />
          </div>

          {/* Notification Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-medium text-stone-800 dark:text-stone-200">
                  Delivery Notification
                </div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400">
                  Notify me when this message becomes available to open
                </div>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notificationEnabled}
              onClick={() => setNotificationEnabled(!notificationEnabled)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                notificationEnabled ? 'bg-amber-600' : 'bg-stone-300 dark:bg-stone-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  notificationEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-end gap-3 bg-stone-50/50 dark:bg-stone-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 active:scale-[0.99] rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Scheduling...</span>
            ) : (
              <>
                <Hourglass className="w-3.5 h-3.5" />
                <span>Save for Future Me</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
