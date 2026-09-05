import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Sparkles, 
  Lightbulb, 
  FileText, 
  CheckSquare, 
  Copy, 
  Check, 
  RefreshCw, 
  Tag, 
  Compass, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  Mic, 
  MicOff, 
  X, 
  BookOpen,
  Calendar,
  Trash2,
  Smile,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Clock,
  Star,
  PanelRight,
  Hourglass
} from 'lucide-react';
import { 
  InteractionEntry, 
  ChatMessage, 
  ReflectionMode, 
  MediaAttachment, 
  MoodType, 
  JournalStatus,
  JournalLocation,
  FutureMeEntrySnapshot
} from '../types';
import { useVoiceDictation } from '../hooks/useVoiceDictation';
import { RichTextToolbar } from './RichTextToolbar';
import { MoodSelector } from './MoodSelector';
import { MediaManager } from './MediaManager';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { AIAssistancePanel } from './AIAssistancePanel';
import { LocationPicker } from './LocationPicker';
import { SendToFutureMeModal } from './SendToFutureMeModal';

interface ConversationViewProps {
  entry: InteractionEntry | null;
  onSendMessage: (content: string, mode: ReflectionMode, journalContent?: string, mood?: MoodType, moodIntensity?: number, emotionTags?: string[]) => Promise<void>;
  onSummarizeSession: () => Promise<void>;
  onUpdateEntry: (updates: Partial<InteractionEntry>) => Promise<void>;
  onDeleteCurrentEntry: (id: string) => Promise<void>;
  isGenerating: boolean;
  isSummarizing: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onRetrySave?: () => void;
  userDisplayName: string | null;
  userPhotoURL: string | null;
  onToggleMobileSidebar?: () => void;
  onToggleRightPanel?: () => void;
  isRightPanelOpen?: boolean;
  onToggleFavorite?: (id: string, currentFav: boolean) => void;
  onScheduleFutureMe?: (data: {
    scheduledFor: number;
    message: string;
    optionalFutureQuestion: string;
    notificationEnabled: boolean;
    snapshot: FutureMeEntrySnapshot;
  }) => Promise<void>;
}

const markdownComponents = {
  h1: ({ node, ...props }: any) => <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-4 mb-2 first:mt-0 tracking-tight" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-3 mb-1.5 first:mt-0 tracking-tight" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mt-2 mb-1 first:mt-0" {...props} />,
  p: ({ node, ...props }: any) => <p className="my-1.5 text-stone-800 dark:text-stone-200 leading-relaxed text-sm" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc list-outside my-2 pl-5 space-y-1 text-stone-800 dark:text-stone-200 text-sm" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal list-outside my-2 pl-5 space-y-1 text-stone-800 dark:text-stone-200 text-sm" {...props} />,
  li: ({ node, ...props }: any) => <li className="text-stone-800 dark:text-stone-200 leading-relaxed pl-0.5" {...props} />,
  blockquote: ({ node, ...props }: any) => (
    <blockquote className="border-l-4 border-amber-500/80 dark:border-amber-400/80 pl-3.5 py-1 my-2.5 italic text-stone-700 dark:text-stone-300 bg-stone-100/60 dark:bg-stone-800/40 rounded-r-lg" {...props} />
  ),
  code: ({ node, inline, ...props }: any) =>
    inline ? (
      <code className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-amber-700 dark:text-amber-400 font-mono text-xs font-medium" {...props} />
    ) : (
      <code className="block p-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-mono text-xs overflow-x-auto my-2 border border-stone-200 dark:border-stone-700" {...props} />
    ),
  pre: ({ node, ...props }: any) => <pre className="my-2 overflow-x-auto" {...props} />,
  hr: ({ node, ...props }: any) => <hr className="my-3 border-stone-200 dark:border-stone-800" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-bold text-stone-900 dark:text-stone-100" {...props} />,
  em: ({ node, ...props }: any) => <em className="italic" {...props} />,
  input: ({ node, ...props }: any) => (
    <input type="checkbox" className="mr-2 rounded border-stone-300 dark:border-stone-600 text-amber-600 focus:ring-amber-500 pointer-events-none align-middle" readOnly {...props} />
  ),
};

export const ConversationView: React.FC<ConversationViewProps> = ({
  entry,
  onSendMessage,
  onSummarizeSession,
  onUpdateEntry,
  onDeleteCurrentEntry,
  isGenerating,
  isSummarizing,
  saveStatus,
  onRetrySave,
  userDisplayName,
  userPhotoURL,
  onToggleMobileSidebar,
  onToggleRightPanel,
  isRightPanelOpen,
  onToggleFavorite,
  onScheduleFutureMe,
}) => {
  // Local Form & Content States
  const [titleDraft, setTitleDraft] = useState(entry?.title || 'New Journal Entry');
  const [journalContent, setJournalContent] = useState(entry?.journalContent || '');
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>(entry?.mood);
  const [moodIntensity, setMoodIntensity] = useState<number>(entry?.moodIntensity || 5);
  const [emotionTags, setEmotionTags] = useState<string[]>(entry?.emotionTags || []);
  const [mediaAttachments, setMediaAttachments] = useState<MediaAttachment[]>(entry?.media || []);
  const [journalDate, setJournalDate] = useState<number>(entry?.journalDate || entry?.createdAt || Date.now());
  const [entryLocation, setEntryLocation] = useState<JournalLocation | null>(entry?.location || null);
  
  // UI & Mode States
  const [activeMode, setActiveMode] = useState<ReflectionMode>(entry ? entry.mode : 'reflect');
  const [inputText, setInputText] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isMoodOpen, setIsMoodOpen] = useState(true);
  const [isMediaOpen, setIsMediaOpen] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFutureMeModalOpen, setIsFutureMeModalOpen] = useState(false);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState<number | null>(null);

  // Autosave tracking ref
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);
  const lastSavedStateRef = useRef<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const journalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state when selected entry changes
  useEffect(() => {
    if (entry) {
      setTitleDraft(entry.title);
      setJournalContent(entry.journalContent || '');
      setSelectedMood(entry.mood);
      setMoodIntensity(entry.moodIntensity || 5);
      setEmotionTags(entry.emotionTags || []);
      setMediaAttachments(entry.media || []);
      setJournalDate(entry.journalDate || entry.createdAt || Date.now());
      setEntryLocation(entry.location || null);
      setActiveMode(entry.mode || 'reflect');
    } else {
      setTitleDraft('New Journal Entry');
      setJournalContent('');
      setSelectedMood(undefined);
      setMoodIntensity(5);
      setEmotionTags([]);
      setMediaAttachments([]);
      setJournalDate(Date.now());
      setEntryLocation(null);
      setActiveMode('reflect');
    }
    isInitialMountRef.current = true;
  }, [entry?.id]);

  // Voice dictation hook - appends transcript to current focused field or journal content
  const handleAppendTranscript = useCallback((transcriptChunk: string) => {
    const cleanChunk = transcriptChunk.trim();
    if (!cleanChunk) return;

    if (document.activeElement === journalTextareaRef.current) {
      setJournalContent((prev) => {
        if (!prev) return cleanChunk;
        const needsSpace = !prev.endsWith(' ') && !prev.endsWith('\n');
        return prev + (needsSpace ? ' ' : '') + cleanChunk;
      });
    } else {
      setInputText((prev) => {
        if (!prev) return cleanChunk;
        const needsSpace = !prev.endsWith(' ') && !prev.endsWith('\n');
        return prev + (needsSpace ? ' ' : '') + cleanChunk;
      });
    }
  }, []);

  const {
    isSupported: isSpeechSupported,
    status: dictationStatus,
    isListening,
    errorMessage: dictationError,
    interimTranscript,
    toggleDictation,
    stopDictation,
    clearError: clearDictationError,
  } = useVoiceDictation({
    onFinalTranscript: handleAppendTranscript,
    lang: 'en-US',
  });

  // Debounced Autosave (1500ms) for journal changes
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      lastSavedStateRef.current = JSON.stringify({
        titleDraft,
        journalContent,
        selectedMood,
        moodIntensity,
        emotionTags,
        mediaAttachments,
        journalDate,
        entryLocation,
      });
      return;
    }

    const currentStateStr = JSON.stringify({
      titleDraft,
      journalContent,
      selectedMood,
      moodIntensity,
      emotionTags,
      mediaAttachments,
      journalDate,
      entryLocation,
    });

    if (currentStateStr === lastSavedStateRef.current) {
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      if (entry?.id) {
        try {
          await onUpdateEntry({
            title: titleDraft.trim() || 'Untitled Journal Entry',
            journalContent,
            mood: selectedMood,
            moodIntensity,
            emotionTags,
            media: mediaAttachments,
            journalDate,
            location: entryLocation,
            status: 'draft',
          });
          lastSavedStateRef.current = currentStateStr;
        } catch (err) {
          console.error('Autosave error:', err);
        }
      }
    }, 1500);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    titleDraft,
    journalContent,
    selectedMood,
    moodIntensity,
    emotionTags,
    mediaAttachments,
    journalDate,
    entryLocation,
    entry?.id,
    onUpdateEntry
  ]);

  // AI Assistant Callbacks (Preview / Accept / Reject pipeline)
  const handleAcceptText = (newText: string, mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setJournalContent(newText);
    } else {
      setJournalContent((prev) => (prev.trim() ? `${prev}\n\n${newText}` : newText));
    }
  };

  const handleAcceptTitle = (newTitle: string) => {
    setTitleDraft(newTitle);
  };

  const handleAcceptTags = (newTags: string[]) => {
    setEmotionTags((prev) => {
      const set = new Set([...prev, ...newTags]);
      return Array.from(set);
    });
  };

  const handleAcceptMood = (mood: MoodType, intensity: number) => {
    setSelectedMood(mood);
    setMoodIntensity(intensity);
  };

  const handleAcceptSummary = async (summaryText: string) => {
    if (entry?.id) {
      await onUpdateEntry({ summary: summaryText });
    }
  };

  const handleInsertPrompt = (promptMarkdown: string) => {
    setJournalContent((prev) => (prev.trim() ? `${prev}\n\n${promptMarkdown}` : promptMarkdown));
  };

  // Insert markdown at textarea cursor
  const handleInsertMarkdown = (prefix: string, suffix = '', defaultPlaceholder = '') => {
    const textarea = journalTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    const selectedText = currentVal.substring(start, end);
    const replacement = selectedText || defaultPlaceholder;

    const updated = currentVal.substring(0, start) + prefix + replacement + suffix + currentVal.substring(end);
    setJournalContent(updated);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + replacement.length
      );
    }, 10);
  };

  // Explicit Save Entry button
  const handleExplicitSave = async () => {
    try {
      await onUpdateEntry({
        title: titleDraft.trim() || 'Untitled Journal Entry',
        journalContent,
        mood: selectedMood,
        moodIntensity,
        emotionTags,
        media: mediaAttachments,
        journalDate,
        location: entryLocation,
        status: 'saved',
      });
      lastSavedStateRef.current = JSON.stringify({
        titleDraft,
        journalContent,
        selectedMood,
        moodIntensity,
        emotionTags,
        mediaAttachments,
        journalDate,
        entryLocation,
      });
    } catch (err) {
      console.error('Explicit save failed:', err);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!entry?.id) return;
    setIsDeleting(true);
    try {
      await onDeleteCurrentEntry(entry.id);
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgIdx(idx);
    setTimeout(() => setCopiedMsgIdx(null), 2000);
  };

  // Send message for AI reflection
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isListening) stopDictation();

    const text = inputText.trim();
    if ((!text && !journalContent.trim()) || isGenerating) return;

    setInputText('');
    await onSendMessage(
      text, 
      activeMode, 
      journalContent, 
      selectedMood, 
      moodIntensity, 
      emotionTags
    );
  };

  const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTitleSubmit = async () => {
    setIsEditingTitle(false);
    const sanitizedTitle = titleDraft.trim().substring(0, 120) || 'Untitled Reflection';
    setTitleDraft(sanitizedTitle);
    if (entry?.id && sanitizedTitle !== entry.title) {
      await onUpdateEntry({ title: sanitizedTitle });
    }
  };

  const messages = entry?.messages || [];
  const entryStatus: JournalStatus = entry?.status || 'draft';

  // Auto-scroll to bottom of conversation whenever messages update or generation starts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isGenerating]);

  return (
    <div className="flex-1 min-w-0 h-full min-h-0 flex flex-col bg-white dark:bg-stone-900 overflow-hidden transition-colors duration-150 relative">
      
      {/* 1. Header Toolbar */}
      <div className="shrink-0 px-4 sm:px-6 py-3 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 bg-stone-50/70 dark:bg-stone-900/80">
        
        {/* Left: Mobile Sidebar trigger, Editable Title, Status Badge */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {onToggleMobileSidebar && (
            <button
              id="mobile-vault-toggle-btn"
              type="button"
              onClick={onToggleMobileSidebar}
              className="md:hidden p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer mr-0.5"
              title="Open Journal Vault"
              aria-label="Open Journal Vault"
            >
              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </button>
          )}

          {/* Title Editor */}
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 min-w-0 max-w-md w-full">
              <input
                id="edit-title-input"
                type="text"
                value={titleDraft}
                maxLength={120}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="w-full text-sm font-semibold text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-md px-2.5 py-1 focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-white dark:bg-stone-800"
              />
              <button
                onClick={handleTitleSubmit}
                className="px-2.5 py-1 rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold cursor-pointer shrink-0"
              >
                Done
              </button>
            </div>
          ) : (
            <div 
              className="flex items-center gap-2 group cursor-pointer min-w-0" 
              onClick={() => setIsEditingTitle(true)}
              title="Click to edit title"
            >
              <h2 className="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight truncate max-w-[280px] sm:max-w-md">
                {titleDraft || 'Untitled Journal Entry'}
              </h2>
              <Edit3 className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200 transition-colors shrink-0" />
            </div>
          )}

          {/* Status & Date Badges */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span 
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                entryStatus === 'saved'
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              }`}
            >
              {entryStatus}
            </span>

            {/* Date & Time Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="inline-flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 px-2 py-0.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="Change Entry Date"
              >
                <Clock className="w-3 h-3 text-stone-400" />
                <span>{new Date(journalDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </button>

              {isDatePickerOpen && (
                <div className="absolute top-full left-0 mt-1 z-30 p-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl flex flex-col gap-2">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase">Set Journal Date & Time</span>
                  <input
                    type="datetime-local"
                    value={new Date(journalDate - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                    onChange={(e) => {
                      if (e.target.value) {
                        setJournalDate(new Date(e.target.value).getTime());
                      }
                    }}
                    className="text-xs p-1.5 rounded-md border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                  />
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(false)}
                    className="text-[11px] font-semibold py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Location Picker */}
            <LocationPicker
              location={entryLocation}
              onUpdateLocation={setEntryLocation}
            />
          </div>
        </div>

        {/* Right Action Controls: Sync status, Save button, Delete button */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Sync status */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-stone-600 dark:text-stone-400">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="hidden md:inline">Autosaving...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span className="hidden md:inline">Saved</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <button
                onClick={onRetrySave || handleExplicitSave}
                className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:underline cursor-pointer"
              >
                <AlertCircle className="w-3 h-3" />
                <span>Save failed (Retry)</span>
              </button>
            )}
          </div>

          {/* Favorite Toggle button */}
          {entry?.id && onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(entry.id!, !!entry.isFavorite)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                entry.isFavorite
                  ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-stone-400 hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              title={entry.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
              aria-label="Toggle favorite"
            >
              <Star className={`w-4 h-4 ${entry.isFavorite ? 'fill-amber-500' : ''}`} />
            </button>
          )}

          {/* Send to Future Me (Time capsule) */}
          {onScheduleFutureMe && (
            <button
              type="button"
              onClick={() => setIsFutureMeModalOpen(true)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
              title="Send to Future Me (Time Capsule)"
              aria-label="Send to Future Me"
            >
              <Hourglass className="w-4 h-4" />
            </button>
          )}

          {/* Delete button (If entry exists) */}
          {entry?.id && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Delete journal entry"
              aria-label="Delete entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Toggle Contextual Right Panel */}
          {onToggleRightPanel && (
            <button
              type="button"
              onClick={onToggleRightPanel}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isRightPanelOpen
                  ? 'text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              title={isRightPanelOpen ? 'Hide entry details' : 'Show entry details & insights'}
              aria-label="Toggle entry details"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          )}

          {/* Summarize & Insights button */}
          {entry && entry.messages.length >= 2 && (
            <button
              id="summarize-session-btn"
              onClick={onSummarizeSession}
              disabled={isSummarizing || isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              title="Distill session takeaways"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSummarizing ? 'Distilling...' : 'Distill Insights'}</span>
            </button>
          )}
        </div>

      </div>

      {/* 2. Scrollable Journal & Chat Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-4xl mx-auto space-y-5">
        
        {/* Module A: Rich Text Journal Workspace */}
        <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#181817] shadow-2xs overflow-hidden">
          
          {/* AI Writing Assistant Panel (Contextual to current entry, Preview/Accept/Reject Workflow) */}
          <AIAssistancePanel
            journalContent={journalContent}
            currentTitle={titleDraft}
            voiceTranscript={interimTranscript}
            currentMood={selectedMood}
            currentTags={emotionTags}
            onAcceptText={handleAcceptText}
            onAcceptTitle={handleAcceptTitle}
            onAcceptTags={handleAcceptTags}
            onAcceptMood={handleAcceptMood}
            onAcceptSummary={handleAcceptSummary}
            onInsertPrompt={handleInsertPrompt}
          />

          {/* Formatting Toolbar & View Mode Toggle */}
          <RichTextToolbar
            textareaRef={journalTextareaRef}
            onInsertMarkdown={handleInsertMarkdown}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
          />

          {/* Editor Area */}
          <div className="p-5 sm:p-7 bg-white dark:bg-[#181817]">
            {viewMode === 'edit' && (
              <textarea
                ref={journalTextareaRef}
                rows={10}
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                placeholder="What is on your mind today? Write your thoughts, reflections, or experiences freely..."
                className="w-full bg-transparent resize-y min-h-[260px] text-[15px] sm:text-base text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-hidden leading-[1.75] font-sans"
              />
            )}

            {viewMode === 'preview' && (
              <div className="min-h-[260px] text-[15px] sm:text-base leading-[1.75] p-1 markdown-preview">
                {journalContent.trim() ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {journalContent}
                  </ReactMarkdown>
                ) : (
                  <p className="text-stone-400 dark:text-stone-500 italic">No text written yet. Switch to "Write" mode to begin your journal entry.</p>
                )}
              </div>
            )}

            {viewMode === 'split' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <textarea
                  ref={journalTextareaRef}
                  rows={10}
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="Write your journal entry..."
                  className="w-full bg-transparent resize-none min-h-[260px] text-[15px] text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-hidden leading-[1.75] font-sans border-b md:border-b-0 md:border-r border-stone-200 dark:border-stone-800 pb-4 md:pb-0 md:pr-4"
                />
                <div className="min-h-[260px] text-[15px] leading-[1.75] overflow-y-auto max-h-96 p-1 markdown-preview">
                  {journalContent.trim() ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {journalContent}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-stone-400 dark:text-stone-500 italic text-xs">Preview will appear here as you type.</p>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Module B: Mood & Emotion Tracking Section (Collapsible) */}
        <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#181817] shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => setIsMoodOpen(!isMoodOpen)}
            className="w-full px-4 py-2.5 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-stone-100/50 dark:hover:bg-stone-800/40 transition-colors flex items-center justify-between text-xs font-medium text-stone-800 dark:text-stone-200 border-b border-stone-200/70 dark:border-stone-800/70 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Mood & Emotion Tracker</span>
              {selectedMood && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold uppercase">
                  {selectedMood} ({moodIntensity}/10)
                </span>
              )}
            </div>
            {isMoodOpen ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
          </button>

          {isMoodOpen && (
            <div className="p-4 sm:p-5">
              <MoodSelector
                selectedMood={selectedMood}
                moodIntensity={moodIntensity}
                emotionTags={emotionTags}
                onChangeMood={setSelectedMood}
                onChangeIntensity={setMoodIntensity}
                onAddTag={(tag) => setEmotionTags((prev) => [...prev, tag])}
                onRemoveTag={(tag) => setEmotionTags((prev) => prev.filter((t) => t !== tag))}
              />
            </div>
          )}
        </div>

        {/* Module C: Photos & Media Section (Collapsible) */}
        <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#181817] shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => setIsMediaOpen(!isMediaOpen)}
            className="w-full px-4 py-2.5 bg-stone-50/60 dark:bg-stone-900/60 hover:bg-stone-100/50 dark:hover:bg-stone-800/40 transition-colors flex items-center justify-between text-xs font-medium text-stone-800 dark:text-stone-200 border-b border-stone-200/70 dark:border-stone-800/70 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              <span>Photos, Audio Memos & Sketches</span>
              {mediaAttachments.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold">
                  {mediaAttachments.length} attached
                </span>
              )}
            </div>
            {isMediaOpen ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
          </button>

          {isMediaOpen && (
            <div className="p-4 sm:p-5">
              <MediaManager
                media={mediaAttachments}
                onAddMedia={(item) => setMediaAttachments((prev) => [...prev, item])}
                onRemoveMedia={(id) => setMediaAttachments((prev) => prev.filter((m) => m.id !== id))}
                maxItems={6}
              />
            </div>
          )}
        </div>

        {/* Module D: Distilled Insights & Event Badges Banner (If generated) */}
        {entry && entry.summary && (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Distilled Session Insights
                </h3>
              </div>
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {entry.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <p className="text-xs text-amber-950/90 dark:text-amber-200/90 leading-relaxed font-serif italic">
              "{entry.summary}"
            </p>

            {entry.keyInsights && entry.keyInsights.length > 0 && (
              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60">
                <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-300">Core Takeaways:</span>
                <ul className="mt-1 space-y-1 text-xs text-amber-950/85 dark:text-amber-200/80 list-disc list-inside">
                  {entry.keyInsights.map((insight, idx) => (
                    <li key={idx} className="leading-snug">{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Module E: AI Reflection & Conversation Turns */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
              AI Reflection Conversation ({messages.length} turns)
            </span>
          </div>

          {(messages.some((m) => m.modelUsed === 'local-heuristic-companion' || m.isFallback) || entry?.modelUsed === 'local-heuristic-companion') && (
            <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-amber-950 dark:text-amber-100 flex items-center gap-2">
                  <span>Adaptive Reflection Mode Active</span>
                  <span className="text-[10px] bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.2 rounded font-normal text-amber-800 dark:text-amber-300">
                    HTTP 429 Notice
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-300/90">
                  Your Google AI Studio API key has depleted prepayment credits. The built-in semantic reflection engine is currently generating context-aware reflections directly from your prompt and journal text. Once credits are replenished at{' '}
                  <a href="https://ai.studio/projects" target="_blank" rel="noreferrer" className="underline font-medium hover:text-amber-950 dark:hover:text-amber-100">
                    ai.studio/projects
                  </a>
                  , queries will automatically resume through Gemini 3.6 Flash.
                </p>
              </div>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="p-6 rounded-2xl bg-stone-50/60 dark:bg-stone-800/40 border border-dashed border-stone-200 dark:border-stone-800 text-center space-y-2">
              <Compass className="w-6 h-6 text-amber-600 mx-auto" />
              <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">Ready to Reflect</div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                Write a thought below or click "Send & Reflect" to have Gemini 3.6 Flash provide compassionate, philosophical perspectives on your journal entry.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* Avatar */}
                  <div className="shrink-0 mt-0.5">
                    {isUser ? (
                      userPhotoURL ? (
                        <img
                          src={userPhotoURL}
                          alt="User"
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full border border-stone-300 dark:border-stone-700 object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-stone-900 dark:bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
                          {userDisplayName ? userDisplayName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )
                    ) : (
                      <div className="w-7 h-7 rounded-xl bg-amber-500/10 dark:bg-amber-950/60 border border-amber-500/20 dark:border-amber-700/50 text-amber-800 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-400">
                        {isUser ? (
                          userDisplayName || 'You'
                        ) : msg.modelUsed === 'local-heuristic-companion' || msg.isFallback || entry?.modelUsed === 'local-heuristic-companion' ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span>Reflection Companion</span>
                            <span className="text-[9px] font-normal px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                              Built-in
                            </span>
                          </span>
                        ) : (
                          <span>{msg.modelUsed || entry?.modelUsed || 'Gemini 3.6 Flash'}</span>
                        )}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`rounded-2xl p-4 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-stone-900 dark:bg-amber-600 text-stone-50 rounded-tr-xs shadow-xs'
                          : 'bg-stone-50 dark:bg-stone-800/90 border border-stone-200/90 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-tl-xs shadow-2xs markdown-preview max-w-none'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                      ) : (
                        <div className="space-y-2 text-stone-800 dark:text-stone-200 font-sans">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {!isUser && (
                      <div className="flex items-center gap-2 pt-0.5 px-1">
                        <button
                          onClick={() => handleCopy(msg.content, index)}
                          className="inline-flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
                        >
                          {copiedMsgIdx === index ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy reflection</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Generating Loading State */}
          {isGenerating && (
            <div className="flex gap-3.5 max-w-3xl mr-auto animate-in fade-in duration-200">
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 dark:bg-amber-950/60 border border-amber-500/20 dark:border-amber-700/50 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
              </div>
              <div className="bg-stone-50 dark:bg-stone-800/90 border border-stone-200/90 dark:border-stone-700 rounded-2xl rounded-tl-xs p-3.5 flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="font-medium">Gemini is reflecting on your entry and mood...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        </div>
      </div>

      {/* 3. Input Composer Footer (Fixed at bottom) */}
      <div className="shrink-0 p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 transition-colors duration-150">
        
        {/* Reflection Mode Switcher */}
        <div className="flex items-center gap-1.5 pb-2.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mr-1">Goal:</span>
          
          <button
            type="button"
            onClick={() => setActiveMode('reflect')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeMode === 'reflect'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 shadow-2xs font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>Deep Reflection</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('brainstorm')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeMode === 'brainstorm'
                ? 'bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 shadow-2xs font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Lightbulb className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Brainstorm</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('summarize')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeMode === 'summarize'
                ? 'bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 shadow-2xs font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>Summary</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('action_plan')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeMode === 'action_plan'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-2xs font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <CheckSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Action Steps</span>
          </button>
        </div>

        {/* Live Listening Banner */}
        {isListening && (
          <div 
            id="voice-dictation-listening-banner"
            className="flex items-center justify-between px-3 py-1.5 bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-900 rounded-xl mb-2 text-xs text-red-950 dark:text-red-200"
          >
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="font-semibold shrink-0">Listening...</span>
              <span className="italic truncate text-[11px] font-normal">
                {interimTranscript ? `"${interimTranscript}"` : 'Speak into microphone...'}
              </span>
            </div>
            <button
              type="button"
              onClick={stopDictation}
              className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-semibold cursor-pointer shrink-0"
            >
              Done
            </button>
          </div>
        )}

        {/* Text Input Box */}
        <div className="relative bg-stone-50 dark:bg-stone-800/90 border border-stone-300/80 dark:border-stone-700 rounded-2xl p-2.5 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:bg-white dark:focus-within:bg-stone-800 transition-all shadow-xs">
          <textarea
            id="journal-input-textarea"
            ref={promptTextareaRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handlePromptKeyDown}
            placeholder="Add a reflection question or prompt for Gemini... (Press Enter to send, Shift+Enter for newline)"
            disabled={isGenerating}
            className="w-full bg-transparent resize-none text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-500 focus:outline-hidden leading-relaxed px-1.5"
          />

          <div className="flex items-center justify-between pt-1 px-1 gap-2">
            <span className="text-[10px] text-stone-400 hidden sm:inline">
              Your journal content, mood, and media will be integrated into the AI reflection
            </span>

            <div className="flex items-center gap-2 ml-auto">
              {/* Voice Dictation */}
              <button
                type="button"
                onClick={toggleDictation}
                disabled={isGenerating}
                title={isListening ? 'Stop listening' : 'Voice dictation'}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600'
                }`}
              >
                {isListening ? (
                  <>
                    <Mic className="w-3.5 h-3.5 animate-bounce" />
                    <span>Listening</span>
                  </>
                ) : !isSpeechSupported ? (
                  <MicOff className="w-3.5 h-3.5 text-stone-400" />
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-stone-500" />
                    <span className="hidden sm:inline">Dictate</span>
                  </>
                )}
              </button>

              {/* Send Button */}
              <button
                id="send-reflection-btn"
                onClick={() => handleSend()}
                disabled={(!inputText.trim() && !journalContent.trim()) || isGenerating}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-stone-900 dark:bg-amber-600 hover:bg-stone-800 dark:hover:bg-amber-500 active:scale-[0.98] transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{isGenerating ? 'Reflecting...' : 'Send & Reflect'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        entry={entry}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Send to Future Me Modal */}
      {onScheduleFutureMe && (
        <SendToFutureMeModal
          isOpen={isFutureMeModalOpen}
          onClose={() => setIsFutureMeModalOpen(false)}
          entry={entry}
          currentContent={journalContent}
          currentTitle={titleDraft}
          onSchedule={onScheduleFutureMe}
        />
      )}

    </div>
  );
};
