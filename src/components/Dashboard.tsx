import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  subscribeToUserInteractions, 
  saveInteraction, 
  updateInteraction, 
  deleteInteraction,
  saveNotificationLog,
  subscribeToUserFolders,
  saveFolder,
  updateFolder,
  deleteFolder,
  subscribeToUserGoals,
  saveGoal,
  updateGoal,
  deleteGoal,
  subscribeToUserFutureMe,
  saveFutureMeMessage,
  updateFutureMeMessage,
  markFutureMeOpened,
  deleteFutureMeMessage,
} from '../firebase';
import { 
  InteractionEntry, 
  ReflectionMode, 
  ChatMessage, 
  NotificationSettings, 
  DetectedJournalEvent, 
  MoodType,
  NavigationSection,
  FolderItem,
  WritingGoal,
  JournalStatus,
  FutureMeMessage,
  FutureMeEntrySnapshot,
} from '../types';
import { LeftSidebar } from './LeftSidebar';
import { JournalListPanel } from './JournalListPanel';
import { ConversationView } from './ConversationView';
import { ContextualRightPanel } from './ContextualRightPanel';
import { SectionPlaceholder } from './SectionPlaceholder';
import { AlertTriangle, Send } from 'lucide-react';

interface DashboardProps {
  user: User;
  notificationSettings?: NotificationSettings | null;
  onOpenNotifications?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  isMobileNavOpen?: boolean;
  onCloseMobileNav?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  notificationSettings,
  onOpenNotifications,
  searchQuery = '',
  onSearchChange,
  isMobileNavOpen = false,
  onCloseMobileNav,
}) => {
  const [entries, setEntries] = useState<InteractionEntry[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [goals, setGoals] = useState<WritingGoal[]>([]);
  const [futureMeMessages, setFutureMeMessages] = useState<FutureMeMessage[]>([]);
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('all');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [currentEntryDraft, setCurrentEntryDraft] = useState<InteractionEntry | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [notificationToast, setNotificationToast] = useState<{ title: string; desc: string } | null>(null);

  // New Navigation and Layout States
  const [activeSection, setActiveSection] = useState<NavigationSection>('all');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [panelSearchQuery, setPanelSearchQuery] = useState('');

  // Subscribe to isolated Firestore collection for the authenticated user
  useEffect(() => {
    setIsLoadingHistory(true);
    const unsubscribe = subscribeToUserInteractions(
      user.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setIsLoadingHistory(false);
        
        // If an entry is selected, sync it with the latest data from Firestore
        if (selectedEntryId) {
          const matched = fetchedEntries.find((e) => e.id === selectedEntryId);
          if (matched) {
            setCurrentEntryDraft(matched);
          }
        }
      },
      (err) => {
        console.error('Failed to subscribe to user reflections:', err);
        setErrorNotification('Could not connect to your Firestore vault. Please verify permissions.');
        setIsLoadingHistory(false);
      }
    );

    return () => unsubscribe();
  }, [user.uid, selectedEntryId]);

  // Subscribe to isolated Folders collection for the authenticated user
  useEffect(() => {
    const unsubscribe = subscribeToUserFolders(
      user.uid,
      (fetchedFolders) => {
        setFolders(fetchedFolders);
      },
      (err) => {
        console.error('Failed to subscribe to folders:', err);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);

  // Subscribe to isolated Goals collection for the authenticated user
  useEffect(() => {
    const unsubscribe = subscribeToUserGoals(
      user.uid,
      (fetchedGoals) => {
        setGoals(fetchedGoals);
      },
      (err) => {
        console.error('Failed to subscribe to goals:', err);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);

  // Subscribe to isolated Future Me collection for the authenticated user
  useEffect(() => {
    const unsubscribe = subscribeToUserFutureMe(
      user.uid,
      (fetched) => {
        setFutureMeMessages(fetched);

        // Check for delivered items that matured past their delivery timestamp
        const now = Date.now();
        fetched.forEach((msg) => {
          if (msg.status === 'scheduled' && msg.scheduledFor <= now && msg.id) {
            updateFutureMeMessage(user.uid, msg.id, {
              status: 'delivered',
              deliveredAt: now,
            }).catch(console.error);

            if (msg.notificationEnabled) {
              setNotificationToast({
                title: 'Letter from Future Me is ready!',
                desc: `"${msg.title}" is ready to be opened.`,
              });
            }
          }
        });
      },
      (err) => {
        console.error('Failed to subscribe to Future Me messages:', err);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);

  // Handle selecting an entry from the list
  const handleSelectEntry = (entry: InteractionEntry) => {
    setSelectedEntryId(entry.id || null);
    setCurrentEntryDraft(entry);
    // When an entry is selected, ensure we are in a journal view
    if (!['all', 'favorites', 'folders'].includes(activeSection)) {
      setActiveSection('all');
    }
  };

  // Handle initiating a new reflection
  const handleNewEntry = () => {
    setSelectedEntryId(null);
    setCurrentEntryDraft(null);
    setActiveSection('all');
  };

  // Handle initiating a new reflection with a pre-seeded prompt and title
  const handleNewEntryWithPrompt = (prompt: string, title?: string) => {
    setSelectedEntryId(null);
    setCurrentEntryDraft({
      userId: user.uid,
      title: title || 'Daily Reflection',
      mode: 'reflect',
      initialPrompt: prompt,
      journalContent: prompt + '\n\n',
      status: 'draft',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setActiveSection('all');
  };

  // Handle deleting an entry
  const handleDeleteEntry = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    try {
      await deleteInteraction(user.uid, id);
      if (selectedEntryId === id) {
        handleNewEntry();
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      setErrorNotification('Failed to delete the entry: ' + (err.message || 'Unknown error'));
    }
  };

  // Folder Operations
  const handleCreateFolder = async (name: string, color?: string) => {
    await saveFolder(user.uid, {
      name,
      color: color || '#D97706',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    await updateFolder(user.uid, folderId, { name: newName });
  };

  const handleDeleteFolder = async (folderId: string) => {
    await deleteFolder(user.uid, folderId);
  };

  // Writing Goal Operations
  const handleCreateGoal = async (goal: Omit<WritingGoal, 'id' | 'userId' | 'createdAt'>) => {
    await saveGoal(user.uid, {
      ...goal,
      createdAt: Date.now(),
    });
  };

  const handleToggleGoal = async (goalId: string, currentActive: boolean) => {
    await updateGoal(user.uid, goalId, { isActive: !currentActive });
  };

  const handleDeleteGoal = async (goalId: string) => {
    await deleteGoal(user.uid, goalId);
  };

  const handleNewEntryInFolder = (folderId: string) => {
    setSelectedEntryId(null);
    setCurrentEntryDraft({
      userId: user.uid,
      title: 'Untitled Reflection',
      mode: 'reflect',
      initialPrompt: '',
      journalContent: '',
      folderId: folderId,
      status: 'draft',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setActiveSection('all');
  };

  // Handle toggling favorite status
  const handleToggleFavorite = async (id: string, currentFav: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateInteraction(user.uid, id, { isFavorite: !currentFav });
      if (selectedEntryId === id && currentEntryDraft) {
        setCurrentEntryDraft((prev) => (prev ? { ...prev, isFavorite: !currentFav } : null));
      }
    } catch (err: any) {
      console.error('Toggle favorite error:', err);
      setErrorNotification('Failed to update favorite status: ' + (err.message || 'Unknown error'));
    }
  };

  // Future Me Handlers
  const handleScheduleFutureMe = async (data: {
    scheduledFor: number;
    message: string;
    optionalFutureQuestion: string;
    notificationEnabled: boolean;
    snapshot: FutureMeEntrySnapshot;
  }) => {
    try {
      await saveFutureMeMessage(user.uid, {
        sourceEntryId: currentEntryDraft?.id,
        title: data.snapshot.title || 'Untitled Journal Entry',
        message: data.message,
        optionalFutureQuestion: data.optionalFutureQuestion,
        scheduledFor: data.scheduledFor,
        status: 'scheduled',
        notificationEnabled: data.notificationEnabled,
        snapshot: data.snapshot,
        createdAt: Date.now(),
      });

      setNotificationToast({
        title: 'Saved for Future Me!',
        desc: `Your letter has been safely scheduled for ${new Date(data.scheduledFor).toLocaleDateString()}.`,
      });
    } catch (err: any) {
      console.error('Failed to schedule Future Me message:', err);
      setErrorNotification('Failed to schedule letter for Future Me: ' + (err.message || 'Unknown error'));
      throw err;
    }
  };

  const handleUpdateFutureMe = async (messageId: string, updates: Partial<FutureMeMessage>) => {
    try {
      await updateFutureMeMessage(user.uid, messageId, updates);
      setNotificationToast({
        title: 'Schedule updated',
        desc: 'Your Future Me delivery details have been updated.',
      });
    } catch (err: any) {
      console.error('Failed to update Future Me message:', err);
      setErrorNotification('Failed to update message: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteFutureMe = async (messageId: string) => {
    try {
      await deleteFutureMeMessage(user.uid, messageId);
      setNotificationToast({
        title: 'Message canceled',
        desc: 'The scheduled Future Me message was canceled.',
      });
    } catch (err: any) {
      console.error('Failed to delete Future Me message:', err);
      setErrorNotification('Failed to remove message: ' + (err.message || 'Unknown error'));
    }
  };

  const handleOpenFutureMe = async (messageId: string) => {
    try {
      await markFutureMeOpened(user.uid, messageId);
    } catch (err: any) {
      console.error('Failed to open Future Me message:', err);
    }
  };

  const handleSaveFutureMeReflection = async (messageId: string, reflection: string, modelUsed: string) => {
    try {
      await updateFutureMeMessage(user.uid, messageId, {
        reflectionResult: reflection,
        reflectionModelUsed: modelUsed,
      });
    } catch (err: any) {
      console.error('Failed to save reflection:', err);
    }
  };

  // Update entry fields directly (autosave & explicit save)
  const handleUpdateEntry = async (updates: Partial<InteractionEntry>) => {
    setSaveStatus('saving');
    try {
      if (selectedEntryId) {
        await updateInteraction(user.uid, selectedEntryId, updates);
        setCurrentEntryDraft((prev) => (prev ? { ...prev, ...updates, updatedAt: Date.now() } : null));
        setSaveStatus('saved');
      } else {
        // Create initial entry with current updates
        const newEntryData = {
          title: updates.title || 'Untitled Journal Entry',
          mode: updates.mode || 'reflect',
          initialPrompt: updates.journalContent || updates.title || 'Journal Entry',
          journalContent: updates.journalContent || '',
          mood: updates.mood,
          moodIntensity: updates.moodIntensity,
          emotionTags: updates.emotionTags || [],
          media: updates.media || [],
          journalDate: updates.journalDate || Date.now(),
          status: updates.status || ('draft' as JournalStatus),
          isFavorite: updates.isFavorite || false,
          folderId: updates.folderId,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const newId = await saveInteraction(user.uid, newEntryData);
        const fullEntry: InteractionEntry = {
          id: newId,
          userId: user.uid,
          ...newEntryData,
        };
        setSelectedEntryId(newId);
        setCurrentEntryDraft(fullEntry);
        setEntries((prev) => [fullEntry, ...prev.filter((e) => e.id !== newId)]);
        setSaveStatus('saved');
      }
    } catch (err: any) {
      console.error('Update entry error:', err);
      setSaveStatus('error');
    }
  };

  // Send message and get Gemini reflection
  const handleSendMessage = async (
    promptText: string, 
    mode: ReflectionMode,
    journalContent?: string,
    mood?: MoodType,
    moodIntensity?: number,
    emotionTags?: string[]
  ) => {
    if ((!promptText.trim() && !journalContent?.trim()) || isGenerating) return;

    setErrorNotification(null);
    setIsGenerating(true);
    setSaveStatus('saving');

    const userMessage: ChatMessage = {
      role: 'user',
      content: promptText.trim() || 'Please reflect on this journal entry.',
      timestamp: Date.now(),
    };

    // Calculate optimistic state
    const existingMessages = currentEntryDraft ? currentEntryDraft.messages : [];
    const updatedMessages = [...existingMessages, userMessage];

    // Auto-generate title if needed
    let title = currentEntryDraft?.title;
    if (!title || title === 'New Reflection' || title === 'New Journal Entry') {
      const sourceForTitle = promptText || journalContent || 'Journal Reflection';
      title = sourceForTitle.length > 40 ? `${sourceForTitle.substring(0, 40)}...` : sourceForTitle;
    }

    // Optimistically update current draft so user prompt appears immediately
    setCurrentEntryDraft((prev) => {
      if (prev) {
        return {
          ...prev,
          title: title || prev.title,
          mode,
          journalContent: journalContent !== undefined ? journalContent : prev.journalContent,
          mood: mood !== undefined ? mood : prev.mood,
          moodIntensity: moodIntensity !== undefined ? moodIntensity : prev.moodIntensity,
          emotionTags: emotionTags !== undefined ? emotionTags : prev.emotionTags,
          messages: updatedMessages,
        };
      }
      return {
        id: '',
        userId: user.uid,
        title: title || 'New Journal Entry',
        mode,
        initialPrompt: promptText || journalContent || 'Initial Entry',
        journalContent: journalContent || '',
        mood,
        moodIntensity,
        emotionTags: emotionTags || [],
        media: [],
        journalDate: Date.now(),
        status: 'draft',
        isFavorite: false,
        messages: updatedMessages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    });

    try {
      // 1. Call secure Express backend proxy for Gemini 3.6 Flash
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          history: existingMessages,
          mode,
          contextTitle: title,
          journalContent,
          mood,
          moodIntensity,
          emotionTags,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to receive reflection from Gemini.');
      }

      const modelMessage: ChatMessage = {
        role: 'model',
        content: data.reply,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
        isFallback: data.isFallback,
      };

      const finalMessages = [...updatedMessages, modelMessage];
      const detectedEvents: DetectedJournalEvent[] = data.detectedEvents || [];

      // 2. Persist directly to isolated Firestore collection & update local state immediately
      let savedInteractionId = selectedEntryId;
      if (selectedEntryId) {
        const updatePayload = {
          title,
          mode,
          journalContent: journalContent !== undefined ? journalContent : (currentEntryDraft?.journalContent || ''),
          mood,
          moodIntensity,
          emotionTags: emotionTags || [],
          messages: finalMessages,
          detectedEvents,
          modelUsed: data.modelUsed,
          status: 'saved' as JournalStatus,
        };
        await updateInteraction(user.uid, selectedEntryId, updatePayload);
        setCurrentEntryDraft((prev) => (prev ? { ...prev, ...updatePayload, updatedAt: Date.now() } : null));
        setEntries((prev) =>
          prev.map((e) => (e.id === selectedEntryId ? { ...e, ...updatePayload, updatedAt: Date.now() } : e))
        );
        setSaveStatus('saved');
      } else {
        const newEntryData = {
          title,
          mode,
          initialPrompt: promptText || journalContent || 'Initial Entry',
          journalContent: journalContent || '',
          mood,
          moodIntensity,
          emotionTags: emotionTags || [],
          media: currentEntryDraft?.media || [],
          journalDate: currentEntryDraft?.journalDate || Date.now(),
          status: 'saved' as JournalStatus,
          isFavorite: currentEntryDraft?.isFavorite || false,
          messages: finalMessages,
          detectedEvents,
          modelUsed: data.modelUsed,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const newId = await saveInteraction(user.uid, newEntryData);
        const fullEntry: InteractionEntry = {
          id: newId,
          userId: user.uid,
          ...newEntryData,
        };
        setSelectedEntryId(newId);
        setCurrentEntryDraft(fullEntry);
        setEntries((prev) => [fullEntry, ...prev.filter((e) => e.id !== newId)]);
        savedInteractionId = newId;
        setSaveStatus('saved');
      }

      // 3. Asynchronously trigger external notifications if user has enabled them
      if (
        notificationSettings?.enabled &&
        detectedEvents.length > 0 &&
        savedInteractionId
      ) {
        (async () => {
          try {
            const notifRes = await fetch('/api/notifications/process-events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.uid,
                interactionId: savedInteractionId,
                events: detectedEvents,
                userRules: notificationSettings,
                journalTitle: title,
              }),
            });

            const notifData = await notifRes.json();
            if (notifData.success && Array.isArray(notifData.results)) {
              for (const r of notifData.results) {
                if (r.status === 'sent') {
                  await saveNotificationLog(user.uid, {
                    interactionId: savedInteractionId,
                    eventType: (r.eventType || 'goal_detected') as any,
                    provider: r.provider,
                    destination: r.destinationMasked,
                    status: 'sent',
                    idempotencyKey: r.idempotencyKey,
                    attempts: r.attempts,
                    timestamp: r.timestamp || Date.now(),
                    summarySnippet: `Notification delivered for event in "${title}"`,
                  });

                  setNotificationToast({
                    title: 'Notification Dispatched',
                    desc: `Delivered alert to ${r.destinationMasked} based on your event rules.`,
                  });
                  setTimeout(() => setNotificationToast(null), 4000);
                }
              }
            }
          } catch (notifErr) {
            console.error('Non-fatal notification background dispatch error:', notifErr);
          }
        })();
      }

    } catch (err: any) {
      console.error('Generation & Save failure:', err);
      setSaveStatus('error');
      setErrorNotification(
        err.message || 'An error occurred during Gemini reflection. Your prompt remains intact.'
      );
      setCurrentEntryDraft((prev) => (prev ? { ...prev, messages: existingMessages } : null));
    } finally {
      setIsGenerating(false);
    }
  };

  // Summarize the current session
  const handleSummarizeSession = async () => {
    if (!currentEntryDraft || currentEntryDraft.messages.length < 2 || isSummarizing) return;

    setIsSummarizing(true);
    setErrorNotification(null);

    try {
      const response = await fetch('/api/gemini/summarize-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentEntryDraft.messages,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to summarize session.');
      }

      const { title, summary, keyInsights, tags } = data.data;

      if (selectedEntryId) {
        await updateInteraction(user.uid, selectedEntryId, {
          title: title || currentEntryDraft.title,
          summary,
          keyInsights,
          tags,
        });
        setSaveStatus('saved');
      }
    } catch (err: any) {
      console.error('Summarize error:', err);
      setErrorNotification('Failed to generate summary: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSummarizing(false);
    }
  };

  // Determine whether to show the Journal workspace or an Explore/Reflect/Progress section
  const isJournalSection = ['all', 'favorites'].includes(activeSection);
  const activeEffectiveSearch = searchQuery || panelSearchQuery;

  const favoritesCount = entries.filter((e) => e.isFavorite).length;
  const now = Date.now();
  const futureMeUnopenedCount = futureMeMessages.filter(
    (m) => (m.scheduledFor <= now || m.status === 'delivered') && !m.openedAt
  ).length;
  const futureMeTotalCount = futureMeMessages.length;

  return (
    <div className="flex-1 flex flex-row w-full h-full min-h-0 overflow-hidden bg-stone-100 dark:bg-stone-950 transition-colors duration-150 relative select-none">
      
      {/* Notification Toast */}
      {notificationToast && (
        <div className="absolute top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-amber-300 dark:border-amber-800 shadow-xl flex items-center gap-3 text-xs max-w-sm">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Send className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-stone-900 dark:text-stone-100">{notificationToast.title}</div>
              <div className="text-[11px] text-stone-600 dark:text-stone-300">{notificationToast.desc}</div>
            </div>
          </div>
        </div>
      )}

      {/* Error notification banner if active */}
      {errorNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>{errorNotification}</span>
            </div>
            <button
              onClick={() => setErrorNotification(null)}
              className="ml-2 font-bold hover:underline shrink-0 text-red-700 dark:text-red-300 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 1. LEFT SIDEBAR: Standard Hierarchical Navigation (JOURNAL, EXPLORE, REFLECT, PROGRESS) */}
      <LeftSidebar
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          if (onCloseMobileNav) onCloseMobileNav();
        }}
        onNewEntry={handleNewEntry}
        entriesCount={entries.length}
        favoritesCount={favoritesCount}
        foldersCount={folders.length}
        futureMeUnopenedCount={futureMeUnopenedCount}
        futureMeTotalCount={futureMeTotalCount}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={onCloseMobileNav}
      />

      {/* 2. MAIN WORKSPACE */}
      {isJournalSection ? (
        <div className="flex-1 flex flex-row min-w-0 h-full min-h-0 overflow-hidden">
          {/* Journal Entries List Panel */}
          <JournalListPanel
            entries={entries}
            selectedEntryId={selectedEntryId}
            onSelectEntry={handleSelectEntry}
            onDeleteEntry={handleDeleteEntry}
            onToggleFavorite={handleToggleFavorite}
            isLoading={isLoadingHistory}
            activeSection={activeSection}
            searchFilter={activeEffectiveSearch}
            onSearchChange={(q) => {
              setPanelSearchQuery(q);
              if (onSearchChange) onSearchChange(q);
            }}
            folders={folders}
            selectedFolderId={selectedFolderFilter}
            onSelectFolder={(fId) => setSelectedFolderFilter(fId)}
          />

          {/* Journal Editor & Conversation View */}
          <div className="flex-1 min-w-0 h-full min-h-0 overflow-hidden flex flex-col">
            <ConversationView
              entry={currentEntryDraft}
              onSendMessage={handleSendMessage}
              onSummarizeSession={handleSummarizeSession}
              onUpdateEntry={handleUpdateEntry}
              onDeleteCurrentEntry={handleDeleteEntry}
              isGenerating={isGenerating}
              isSummarizing={isSummarizing}
              saveStatus={saveStatus}
              onRetrySave={() => setSaveStatus('idle')}
              userDisplayName={user.displayName}
              userPhotoURL={user.photoURL}
              onToggleMobileSidebar={onCloseMobileNav}
              onToggleRightPanel={() => setIsRightPanelOpen((prev) => !prev)}
              isRightPanelOpen={isRightPanelOpen}
              onToggleFavorite={(id, curFav) => handleToggleFavorite(id, curFav)}
              onScheduleFutureMe={handleScheduleFutureMe}
            />
          </div>

          {/* 3. OPTIONAL CONTEXTUAL RIGHT PANEL */}
          <ContextualRightPanel
            entry={currentEntryDraft}
            isOpen={isRightPanelOpen}
            onClose={() => setIsRightPanelOpen(false)}
          />
        </div>
      ) : (
        /* Render Selected Explore / Reflect / Progress Section */
        <div className="flex-1 flex flex-col min-w-0 h-full min-h-0 overflow-hidden bg-white dark:bg-stone-900">
          <SectionPlaceholder
            section={activeSection}
            entries={entries}
            folders={folders}
            goals={goals}
            futureMeMessages={futureMeMessages}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onCreateGoal={handleCreateGoal}
            onToggleGoal={handleToggleGoal}
            onDeleteGoal={handleDeleteGoal}
            onUpdateFutureMe={handleUpdateFutureMe}
            onDeleteFutureMe={handleDeleteFutureMe}
            onOpenFutureMe={handleOpenFutureMe}
            onSaveFutureMeReflection={handleSaveFutureMeReflection}
            onNewEntry={handleNewEntry}
            onNewEntryWithPrompt={handleNewEntryWithPrompt}
            onNewEntryInFolder={handleNewEntryInFolder}
            onSelectEntry={handleSelectEntry}
            searchQuery={activeEffectiveSearch}
          />
        </div>
      )}

    </div>
  );
};
