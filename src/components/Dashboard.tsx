import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  subscribeToUserInteractions, 
  saveInteraction, 
  updateInteraction, 
  deleteInteraction 
} from '../firebase';
import { InteractionEntry, ReflectionMode, ChatMessage } from '../types';
import { InteractionHistory } from './InteractionHistory';
import { ConversationView } from './ConversationView';
import { AlertTriangle, Database, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [entries, setEntries] = useState<InteractionEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [currentEntryDraft, setCurrentEntryDraft] = useState<InteractionEntry | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorNotification, setErrorNotification] = useState<string | null>(null);

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

  // Handle selecting an entry from the history sidebar
  const handleSelectEntry = (entry: InteractionEntry) => {
    setSelectedEntryId(entry.id || null);
    setCurrentEntryDraft(entry);
  };

  // Handle initiating a new reflection
  const handleNewEntry = () => {
    setSelectedEntryId(null);
    setCurrentEntryDraft(null);
  };

  // Handle deleting an entry
  const handleDeleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this reflection entry from your isolated Firestore vault?')) {
      return;
    }

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

  // Send message and get Gemini reflection
  const handleSendMessage = async (promptText: string, mode: ReflectionMode) => {
    if (!promptText.trim() || isGenerating) return;

    setErrorNotification(null);
    setIsGenerating(true);
    setSaveStatus('saving');

    const userMessage: ChatMessage = {
      role: 'user',
      content: promptText,
      timestamp: Date.now(),
    };

    // Calculate optimistic state
    const existingMessages = currentEntryDraft ? currentEntryDraft.messages : [];
    const updatedMessages = [...existingMessages, userMessage];

    // Auto-generate title if this is the first turn of a new reflection
    let title = currentEntryDraft?.title;
    if (!title || title === 'New Reflection') {
      title = promptText.length > 35 ? `${promptText.substring(0, 35)}...` : promptText;
    }

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
      };

      const finalMessages = [...updatedMessages, modelMessage];

      // 2. Persist directly to isolated Firestore collection
      if (selectedEntryId) {
        await updateInteraction(user.uid, selectedEntryId, {
          title,
          mode,
          messages: finalMessages,
          modelUsed: data.modelUsed,
        });
        setSaveStatus('saved');
      } else {
        const newId = await saveInteraction(user.uid, {
          title,
          mode,
          initialPrompt: promptText,
          messages: finalMessages,
          modelUsed: data.modelUsed,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        setSelectedEntryId(newId);
        setSaveStatus('saved');
      }

    } catch (err: any) {
      console.error('Generation & Save failure:', err);
      setSaveStatus('error');
      setErrorNotification(
        err.message || 'An error occurred during Gemini reflection. Your prompt remains intact.'
      );
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

  // Update title directly
  const handleUpdateTitle = async (newTitle: string) => {
    if (!selectedEntryId) return;
    try {
      setSaveStatus('saving');
      await updateInteraction(user.uid, selectedEntryId, { title: newTitle });
      setSaveStatus('saved');
    } catch (err: any) {
      console.error('Update title error:', err);
      setSaveStatus('error');
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-stone-100">
      
      {/* Error notification banner if active */}
      {errorNotification && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorNotification}</span>
            </div>
            <button
              onClick={() => setErrorNotification(null)}
              className="ml-2 font-bold hover:underline shrink-0 text-red-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* History Sidebar */}
      <InteractionHistory
        entries={entries}
        selectedEntryId={selectedEntryId}
        onSelectEntry={handleSelectEntry}
        onNewEntry={handleNewEntry}
        onDeleteEntry={handleDeleteEntry}
        isLoading={isLoadingHistory}
      />

      {/* Main Conversation & Journal Workspace */}
      <ConversationView
        entry={currentEntryDraft}
        onSendMessage={handleSendMessage}
        onSummarizeSession={handleSummarizeSession}
        onUpdateTitle={handleUpdateTitle}
        isGenerating={isGenerating}
        isSummarizing={isSummarizing}
        saveStatus={saveStatus}
        onRetrySave={() => setSaveStatus('idle')}
        userDisplayName={user.displayName}
        userPhotoURL={user.photoURL}
      />

    </div>
  );
};
