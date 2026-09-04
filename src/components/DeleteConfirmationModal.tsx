import React from 'react';
import { Trash2, AlertTriangle, X, Check, FileText, Image as ImageIcon, Smile } from 'lucide-react';
import { InteractionEntry } from '../types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  entry: InteractionEntry | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  entry,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !entry) return null;

  const mediaCount = entry.media?.length || 0;
  const messageCount = entry.messages?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Delete Journal Entry?
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-5 space-y-3 bg-stone-50/50 dark:bg-stone-950/40">
          <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-2">
            <div className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate">
              {entry.title || 'Untitled Reflection'}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-stone-400" />
                {messageCount} {messageCount === 1 ? 'reflection turn' : 'reflection turns'}
              </span>

              {mediaCount > 0 && (
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                  {mediaCount} {mediaCount === 1 ? 'media attachment' : 'media attachments'}
                </span>
              )}

              {entry.mood && (
                <span className="flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5 text-indigo-500" />
                  Mood: {entry.mood}
                </span>
              )}
            </div>

            <div className="text-[11px] text-stone-400">
              Created on {new Date(entry.createdAt).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            Deleting this entry will remove all written text, attached media, voice memos, sketches, and mood tags from your isolated Firestore vault.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2 bg-stone-50/80 dark:bg-stone-900">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer shadow-xs"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
