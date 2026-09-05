import React, { useState } from 'react';
import {
  Hourglass,
  Calendar,
  Clock,
  Lock,
  Unlock,
  CheckCircle2,
  Trash2,
  Edit2,
  Plus,
  Sparkles,
  ArrowRight,
  HelpCircle,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { FutureMeMessage, InteractionEntry } from '../types';
import { FutureMeReaderModal } from './FutureMeReaderModal';

interface FutureMeInboxProps {
  messages: FutureMeMessage[];
  entries: InteractionEntry[];
  onNewEntry: () => void;
  onSelectEntry: (entry: InteractionEntry) => void;
  onUpdateMessage: (messageId: string, updates: Partial<FutureMeMessage>) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onOpenMessage: (messageId: string) => Promise<void>;
  onSaveReflection: (messageId: string, reflection: string, modelUsed: string) => Promise<void>;
}

export const FutureMeInbox: React.FC<FutureMeInboxProps> = ({
  messages,
  entries,
  onNewEntry,
  onSelectEntry,
  onUpdateMessage,
  onDeleteMessage,
  onOpenMessage,
  onSaveReflection,
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedMessageForReader, setSelectedMessageForReader] = useState<FutureMeMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<FutureMeMessage | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const now = Date.now();

  // Categorize messages:
  // Upcoming = scheduled and scheduledFor > now
  // Past / Delivered = scheduledFor <= now or status === 'delivered'
  const upcomingMessages = messages
    .filter((m) => m.status === 'scheduled' && m.scheduledFor > now)
    .sort((a, b) => a.scheduledFor - b.scheduledFor);

  const pastMessages = messages
    .filter((m) => m.scheduledFor <= now || m.status === 'delivered')
    .sort((a, b) => (b.deliveredAt || b.scheduledFor) - (a.deliveredAt || a.scheduledFor));

  const unopenedCount = pastMessages.filter((m) => !m.openedAt).length;

  const handleOpenEditModal = (msg: FutureMeMessage) => {
    setEditingMessage(msg);
    setEditNote(msg.message || '');
    const dateObj = new Date(msg.scheduledFor);
    setEditDate(new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  };

  const handleSaveEdit = async () => {
    if (!editingMessage?.id || !editDate) return;
    const newTimestamp = new Date(editDate).getTime();
    if (newTimestamp <= now) {
      alert('Scheduled delivery date must be in the future.');
      return;
    }

    setIsSavingEdit(true);
    try {
      await onUpdateMessage(editingMessage.id, {
        scheduledFor: newTimestamp,
        message: editNote.trim(),
      });
      setEditingMessage(null);
    } catch (err) {
      console.error('Failed to update scheduled message:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async (messageId: string) => {
    try {
      await onDeleteMessage(messageId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to cancel message:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#FAF9F6] dark:bg-[#151514] overflow-hidden select-none">
      {/* Top Banner Header */}
      <div className="px-6 py-5 border-b border-stone-200/80 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60 shadow-2xs">
            <Hourglass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Future Me</span>
              {unopenedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                  {unopenedCount} to open
                </span>
              )}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Letters, wisdom, and reflections preserved for your future self.
            </p>
          </div>
        </div>

        {/* Action Button: Create Entry & Schedule */}
        <button
          type="button"
          onClick={onNewEntry}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-2xs active:scale-[0.99] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Write a Letter to Future Me</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 pt-3 border-b border-stone-200/60 dark:border-stone-800 flex items-center gap-6 bg-white/40 dark:bg-stone-900/40 text-xs font-medium shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'upcoming'
              ? 'border-amber-600 text-amber-900 dark:text-amber-300 font-semibold'
              : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <span>Upcoming</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            {upcomingMessages.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('past')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'past'
              ? 'border-amber-600 text-amber-900 dark:text-amber-300 font-semibold'
              : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <span>Opened / Past</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            {pastMessages.length}
          </span>
          {unopenedCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500" title={`${unopenedCount} unopened messages`} />
          )}
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {activeTab === 'upcoming' ? (
          /* UPCOMING MESSAGES */
          upcomingMessages.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-200/60 dark:border-amber-800/60">
                <Hourglass className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">
                Nothing scheduled yet.
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-5 leading-relaxed">
                Write something today that you want your future self to remember. You can send any journal entry into the future.
              </p>
              <button
                type="button"
                onClick={onNewEntry}
                className="px-4 py-2 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/80 shadow-2xs transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-amber-600" />
                <span>Write a Journal Entry</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMessages.map((item) => {
                const scheduledDate = new Date(item.scheduledFor);
                const daysRemaining = Math.max(1, Math.ceil((item.scheduledFor - now) / (1000 * 60 * 60 * 24)));
                const formattedDate = scheduledDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-800/80 transition-all group"
                  >
                    <div>
                      {/* Card Header: Delivery timing pill & status */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>In {daysRemaining} day{daysRemaining > 1 ? 's' : ''}</span>
                        </span>
                        <span className="text-[10px] text-stone-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Sealed</span>
                        </span>
                      </div>

                      {/* Source Entry Title */}
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1 line-clamp-1">
                        {item.title}
                      </h3>

                      {/* Personal Note teaser */}
                      {item.message ? (
                        <p className="text-xs text-stone-600 dark:text-stone-400 italic line-clamp-2 mb-2 font-serif bg-stone-50 dark:bg-stone-800/40 p-2 rounded-lg border border-stone-100 dark:border-stone-800">
                          &ldquo;{item.message}&rdquo;
                        </p>
                      ) : (
                        <p className="text-xs text-stone-400 dark:text-stone-500 italic mb-2">
                          (No custom note added)
                        </p>
                      )}

                      {/* Optional Question */}
                      {item.optionalFutureQuestion && (
                        <div className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 mb-2">
                          <HelpCircle className="w-3 h-3 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{item.optionalFutureQuestion}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Scheduled date and controls */}
                    <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        Delivers on <strong>{formattedDate}</strong>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Edit delivery date / note */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                          title="Reschedule or edit note"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Cancel / delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(item.id || null)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Cancel Future Me message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* OPENED / PAST MESSAGES */
          pastMessages.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center mb-4">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">
                No past messages yet.
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-5 leading-relaxed">
                When your scheduled delivery dates arrive, your letters will become available here for you to unseal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastMessages.map((item) => {
                const isUnopened = !item.openedAt;
                const writtenDate = new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const deliveredDate = new Date(item.scheduledFor).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl bg-white dark:bg-stone-900 border shadow-2xs flex flex-col justify-between transition-all group ${
                      isUnopened
                        ? 'border-amber-400/80 dark:border-amber-600/80 bg-gradient-to-br from-amber-50/20 to-transparent shadow-amber-500/5'
                        : 'border-stone-200/80 dark:border-stone-800'
                    }`}
                  >
                    <div>
                      {/* Status header */}
                      <div className="flex items-center justify-between mb-2">
                        {isUnopened ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                            <Lock className="w-3 h-3" />
                            <span>Ready to Open!</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Opened</span>
                          </span>
                        )}

                        {item.reflectionResult && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                            <Sparkles className="w-3 h-3" />
                            <span>Reflected</span>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1 line-clamp-1">
                        {item.title}
                      </h3>

                      {/* Note or question teaser */}
                      {item.message && (
                        <p className="text-xs text-stone-600 dark:text-stone-400 italic line-clamp-2 mb-2 font-serif bg-stone-50 dark:bg-stone-800/40 p-2 rounded-lg border border-stone-100 dark:border-stone-800">
                          &ldquo;{item.message}&rdquo;
                        </p>
                      )}

                      <div className="text-[11px] text-stone-500 dark:text-stone-400 space-y-0.5 mb-3">
                        <div>Written: <strong>{writtenDate}</strong></div>
                        <div>Available since: <strong>{deliveredDate}</strong></div>
                      </div>
                    </div>

                    {/* Action Button to Open / View */}
                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setSelectedMessageForReader(item)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isUnopened
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                            : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
                        }`}
                      >
                        {isUnopened ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Break Seal &amp; Read Letter</span>
                          </>
                        ) : (
                          <>
                            <span>View Letter &amp; Journey</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Reader Modal */}
      {selectedMessageForReader && (
        <FutureMeReaderModal
          isOpen={true}
          onClose={() => setSelectedMessageForReader(null)}
          message={selectedMessageForReader}
          onOpenMessage={onOpenMessage}
          onSaveReflection={onSaveReflection}
          currentEntries={entries}
          onViewCurrentEntry={(entryId) => {
            const match = entries.find((e) => e.id === entryId);
            if (match) {
              onSelectEntry(match);
            }
          }}
        />
      )}

      {/* Edit Scheduled Message Modal */}
      {editingMessage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-stone-950/80 backdrop-blur-xs animate-in fade-in select-none"
        >
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Reschedule Future Me Message
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Scheduled Delivery Date &amp; Time:
                </label>
                <input
                  type="datetime-local"
                  value={editDate}
                  min={new Date(now + 60000).toISOString().slice(0, 16)}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-medium mb-1">
                  Personal Note to Future Self:
                </label>
                <textarea
                  rows={3}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMessage(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingEdit ? 'Saving...' : 'Update Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel/Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-stone-950/80 backdrop-blur-xs animate-in fade-in select-none"
        >
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Cancel Scheduled Message?
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Are you sure you want to cancel this Future Me message? Your original journal entry will not be affected.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                Keep Message
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(deleteConfirmId)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer"
              >
                Yes, Cancel Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
