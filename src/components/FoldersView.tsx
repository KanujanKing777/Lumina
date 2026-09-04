import React, { useState } from 'react';
import {
  Folder as FolderIcon,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  Star,
  Clock,
  Check,
  X,
  AlertTriangle,
  FolderPlus,
  Sparkles
} from 'lucide-react';
import { FolderItem, InteractionEntry, MoodType } from '../types';

interface FoldersViewProps {
  folders: FolderItem[];
  entries: InteractionEntry[];
  onCreateFolder: (name: string, color?: string) => Promise<void>;
  onRenameFolder: (folderId: string, newName: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onSelectEntry: (entry: InteractionEntry) => void;
  onNewEntryInFolder: (folderId: string) => void;
}

export const FoldersView: React.FC<FoldersViewProps> = ({
  folders,
  entries,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onSelectEntry,
  onNewEntryInFolder,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(() => {
    return folders.length > 0 ? folders[0].id : null;
  });

  // Modal / Form states
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#D97706'); // amber-600 default
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingFolder, setDeletingFolder] = useState<FolderItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const COLOR_PALETTE = [
    '#D97706', // amber
    '#2563EB', // blue
    '#059669', // emerald
    '#7C3AED', // violet
    '#DC2626', // red
    '#DB2777', // pink
    '#4B5563', // stone/gray
  ];

  // If no selected folder but folders exist, default to first
  const activeFolderId = selectedFolderId || (folders.length > 0 ? folders[0].id : null);
  const currentFolder = folders.find((f) => f.id === activeFolderId);

  // Entries in current active folder
  const currentFolderEntries = entries.filter((e) => {
    if (!activeFolderId) return false;
    const inPrimary = e.folderId === activeFolderId;
    const inMultiple = e.folderIds && e.folderIds.includes(activeFolderId);
    return inPrimary || inMultiple;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await onCreateFolder(newFolderName.trim(), newFolderColor);
      setNewFolderName('');
      setIsCreating(false);
    } catch (err: any) {
      console.error('Failed to create collection:', err);
      setActionError(err.message || 'Failed to create collection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenameSubmit = async (folderId: string) => {
    if (!editingName.trim()) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await onRenameFolder(folderId, editingName.trim());
      setEditingFolderId(null);
      setEditingName('');
    } catch (err: any) {
      console.error('Failed to rename collection:', err);
      setActionError(err.message || 'Failed to rename collection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFolder) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await onDeleteFolder(deletingFolder.id);
      if (selectedFolderId === deletingFolder.id) {
        const remaining = folders.filter((f) => f.id !== deletingFolder.id);
        setSelectedFolderId(remaining.length > 0 ? remaining[0].id : null);
      }
      setDeletingFolder(null);
    } catch (err: any) {
      console.error('Failed to delete collection:', err);
      setActionError(err.message || 'Failed to delete collection.');
    } finally {
      setIsProcessing(false);
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

  return (
    <div className="h-full flex flex-col min-h-0 bg-stone-50 dark:bg-stone-900/60 overflow-hidden">
      {/* Header Bar */}
      <div className="shrink-0 p-4 lg:px-8 border-b border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <FolderIcon className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            Collections
          </h1>
          <p className="text-xs text-stone-700 dark:text-stone-300 mt-0.5">
            Organize your journal entries into custom mindful collections.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-2xs cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/80 border-b border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split Layout: Folders List on Left, Entries inside selected folder on Right */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Left Collections Navigation */}
        <div className="w-full md:w-72 lg:w-80 shrink-0 border-b md:border-b-0 md:border-r border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 flex flex-col min-h-0 overflow-hidden">
          <div className="p-3.5 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Your Collections ({folders.length})
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
            {folders.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-700 dark:text-stone-300 space-y-2">
                <FolderIcon className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
                <p className="font-medium text-stone-700 dark:text-stone-200">No collections yet</p>
                <p className="text-[11px] text-stone-600 dark:text-stone-300">
                  Create collections like &quot;Mindfulness&quot;, &quot;Work Ideas&quot;, or &quot;Gratitude&quot; to categorize entries.
                </p>
              </div>
            ) : (
              folders.map((folder) => {
                const count = entries.filter((e) => e.folderId === folder.id || (e.folderIds && e.folderIds.includes(folder.id))).length;
                const isSelected = folder.id === activeFolderId;
                const isEditing = folder.id === editingFolderId;

                return (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-50/80 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 font-semibold shadow-2xs'
                        : 'bg-transparent border-transparent text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: folder.color || '#D97706' }}
                      />
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1 flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSubmit(folder.id);
                              if (e.key === 'Escape') setEditingFolderId(null);
                            }}
                            autoFocus
                            className="w-full px-2 py-0.5 text-xs bg-white dark:bg-stone-800 border border-amber-500 rounded focus:outline-hidden"
                          />
                          <button
                            onClick={() => handleRenameSubmit(folder.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingFolderId(null)}
                            className="p-1 text-stone-600 hover:bg-stone-100 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="truncate">{folder.name}</span>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolderId(folder.id);
                            setEditingName(folder.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-600 hover:text-stone-800 dark:hover:text-stone-100 rounded cursor-pointer"
                          title="Rename collection"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingFolder(folder);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-600 hover:text-red-600 rounded cursor-pointer"
                          title="Delete collection"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Entries in active collection */}
        <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-stone-900 overflow-hidden">
          {currentFolder ? (
            <>
              {/* Collection details banner */}
              <div className="shrink-0 p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: currentFolder.color || '#D97706' }}
                  />
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {currentFolder.name}
                    </h2>
                    <span className="text-[11px] text-stone-700 dark:text-stone-300">
                      {currentFolderEntries.length} {currentFolderEntries.length === 1 ? 'reflection' : 'reflections'} in this collection
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onNewEntryInFolder(currentFolder.id)}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Write in Collection</span>
                </button>
              </div>

              {/* Entries list */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 space-y-3">
                {currentFolderEntries.length === 0 ? (
                  <div className="py-16 text-center text-xs text-stone-700 dark:text-stone-300 space-y-3">
                    <BookOpen className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                      No entries in this collection yet
                    </p>
                    <p className="text-stone-600 dark:text-stone-300 max-w-sm mx-auto">
                      Write a reflection directly into this collection or assign existing entries from the editor.
                    </p>
                    <button
                      onClick={() => onNewEntryInFolder(currentFolder.id)}
                      className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Write Reflection Now</span>
                    </button>
                  </div>
                ) : (
                  currentFolderEntries.map((entry) => {
                    const entryDate = new Date(entry.journalDate || entry.createdAt);
                    const moodEmoji = getMoodEmoji(entry.mood);
                    const wordCount = entry.wordCount || ((entry.journalContent || '').trim().split(/\s+/).filter(Boolean).length);

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

                        <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 mt-2 leading-relaxed">
                          {entry.journalContent || entry.initialPrompt || 'No written content'}
                        </p>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-700 dark:text-stone-300">
                          <div className="flex items-center gap-2">
                            {entry.mood && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium capitalize border border-amber-200/50 dark:border-amber-800/50">
                                {entry.mood}
                              </span>
                            )}
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
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-stone-700 dark:text-stone-300">
              <FolderIcon className="w-12 h-12 text-stone-300 dark:text-stone-600 mb-3" />
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                No collection selected
              </p>
              <p className="text-stone-600 dark:text-stone-300 max-w-xs mt-1 mb-4">
                Select an existing collection on the left or create a new collection to get started.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-2xs cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create Collection</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Collection */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-600" />
                Create New Collection
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 rounded-lg text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Daily Gratitude, Creative Sparks, Career Focus"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewFolderColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        newFolderColor === color ? 'ring-2 ring-offset-2 ring-stone-900 dark:ring-stone-100 scale-110' : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim() || isProcessing}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-2xs cursor-pointer transition-colors"
                >
                  {isProcessing ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Collection */}
      {deletingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Delete &quot;{deletingFolder.name}&quot;?
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Are you sure you want to delete this collection? <strong>Deleting this collection will NOT delete your journal reflections.</strong> Entries will safely remain in your All Journals vault.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingFolder(null)}
                className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isProcessing}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-2xs cursor-pointer transition-colors"
              >
                {isProcessing ? 'Deleting...' : 'Delete Collection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
