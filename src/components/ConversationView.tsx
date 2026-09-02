import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
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
  Database,
  Share2
} from 'lucide-react';
import { InteractionEntry, ChatMessage, ReflectionMode } from '../types';

interface ConversationViewProps {
  entry: InteractionEntry | null;
  onSendMessage: (content: string, mode: ReflectionMode) => Promise<void>;
  onSummarizeSession: () => Promise<void>;
  onUpdateTitle: (title: string) => Promise<void>;
  isGenerating: boolean;
  isSummarizing: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onRetrySave?: () => void;
  userDisplayName: string | null;
  userPhotoURL: string | null;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  entry,
  onSendMessage,
  onSummarizeSession,
  onUpdateTitle,
  isGenerating,
  isSummarizing,
  saveStatus,
  onRetrySave,
  userDisplayName,
  userPhotoURL,
}) => {
  const [inputText, setInputText] = useState('');
  const [activeMode, setActiveMode] = useState<ReflectionMode>(entry ? entry.mode : 'reflect');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(entry?.title || '');
  const [copiedMsgIdx, setCopiedMsgIdx] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync mode and title draft when entry changes
  useEffect(() => {
    if (entry) {
      setActiveMode(entry.mode);
      setTitleDraft(entry.title);
    } else {
      setActiveMode('reflect');
      setTitleDraft('New Reflection');
    }
  }, [entry?.id]);

  // Scroll to bottom when messages update or during generation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry?.messages, isGenerating]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgIdx(idx);
    setTimeout(() => setCopiedMsgIdx(null), 2000);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isGenerating) return;

    setInputText('');
    await onSendMessage(text, activeMode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTitleSubmit = async () => {
    setIsEditingTitle(false);
    if (titleDraft.trim() && titleDraft !== entry?.title) {
      await onUpdateTitle(titleDraft.trim());
    }
  };

  const getModePlaceholder = (mode: ReflectionMode) => {
    switch (mode) {
      case 'brainstorm':
        return 'What topic or question would you like to explore divergently? (e.g. "Ideas for improving my focus at work")...';
      case 'summarize':
        return 'Write or paste your thoughts to distill key themes and insights...';
      case 'action_plan':
        return 'What challenge or goal do you want to translate into structured next steps?...';
      case 'reflect':
      default:
        return 'What is on your mind today? Write freely... (Press Enter to reflect, Shift+Enter for newline)';
    }
  };

  const messages = entry?.messages || [];

  return (
    <div className="flex-1 h-full flex flex-col bg-white overflow-hidden">
      
      {/* Workspace Top Bar */}
      <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-stone-50/40">
        
        {/* Title and Edit control */}
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                id="edit-title-input"
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="text-sm font-semibold text-stone-900 border border-stone-300 rounded-md px-2 py-0.5 focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-white"
              />
              <button
                onClick={handleTitleSubmit}
                className="p-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
              <h2 className="text-base font-semibold text-stone-900 tracking-tight truncate">
                {entry?.title || 'New Reflection Session'}
              </h2>
              <Edit3 className="w-3.5 h-3.5 text-stone-700 group-hover:text-stone-700 transition-colors" />
            </div>
          )}
        </div>

        {/* Action Controls & Persistence State */}
        <div className="flex items-center gap-2.5">
          {/* Firestore Save status */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-stone-700">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-amber-600">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Saving to Firestore...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Firestore Synced</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <button
                onClick={onRetrySave}
                className="flex items-center gap-1 text-red-600 hover:underline"
              >
                <AlertCircle className="w-3 h-3" />
                <span>Save failed (Retry)</span>
              </button>
            )}
          </div>

          {/* Summarize & Extract Insights button */}
          {entry && entry.messages.length >= 2 && (
            <button
              id="summarize-session-btn"
              onClick={onSummarizeSession}
              disabled={isSummarizing || isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 active:scale-[0.98] transition-all shadow-2xs disabled:opacity-50"
              title="Generate automatic title, summary, key insights, and tags"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-600 ${isSummarizing ? 'animate-spin' : ''}`} />
              <span>{isSummarizing ? 'Synthesizing...' : 'Distill Insights'}</span>
            </button>
          )}
        </div>

      </div>

      {/* Summary / Key Insights Banner if generated */}
      {entry && entry.summary && (
        <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-semibold text-amber-900 tracking-tight uppercase">Distilled Session Insights</h3>
            </div>
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {entry.tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <p className="text-xs text-amber-950/90 leading-relaxed font-serif italic">
            "{entry.summary}"
          </p>

          {entry.keyInsights && entry.keyInsights.length > 0 && (
            <div className="pt-1.5 border-t border-amber-200/60">
              <span className="text-[11px] font-semibold text-amber-900">Core Takeaways:</span>
              <ul className="mt-1 space-y-1 text-xs text-amber-950/85 list-disc list-inside">
                {entry.keyInsights.map((insight, idx) => (
                  <li key={idx} className="leading-snug">{insight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 my-auto py-12">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shadow-xs">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900">Begin Your Reflection</h3>
              <p className="text-xs text-stone-700 mt-1 leading-relaxed">
                Choose a reflection mode below, write your thoughts, and converse with Gemini 3.6 Flash. Every interaction will be secured and saved to your private Firestore.
              </p>
            </div>
            
            {/* Quick Prompts */}
            <div className="w-full space-y-2 pt-2">
              <button
                onClick={() => setInputText("What is one thing that brought me clarity today, and why?")}
                className="w-full text-left p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-xs text-stone-700 transition-colors"
              >
                💭 "What is one thing that brought me clarity today, and why?"
              </button>
              <button
                onClick={() => setInputText("I'm feeling stuck deciding between two paths. Can you help me brainstorm angles to consider?")}
                className="w-full text-left p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-xs text-stone-700 transition-colors"
              >
                ⚖️ "I'm feeling stuck deciding between two paths. Can you help me brainstorm?"
              </button>
              <button
                onClick={() => setInputText("Here is what happened today: [Write event]. Help me reflect on what I can learn from this.")}
                className="w-full text-left p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-xs text-stone-700 transition-colors"
              >
                🌱 "Here is what happened today... Help me reflect on lessons learned."
              </button>
            </div>
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
                        className="w-8 h-8 rounded-full border border-stone-300 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
                        {userDisplayName ? userDisplayName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 flex items-center justify-center shadow-2xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`flex flex-col space-y-1.5 ${
                    isUser
                      ? 'items-end'
                      : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[11px] font-semibold text-stone-700">
                      {isUser ? (userDisplayName || 'You') : 'Gemini 3.6 Flash'}
                    </span>
                    <span className="text-[10px] text-stone-700">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!isUser && (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        AI
                      </span>
                    )}
                  </div>

                  <div
                    className={`rounded-2xl p-4.5 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-stone-900 text-stone-50 rounded-tr-xs shadow-xs'
                        : 'bg-stone-50/90 border border-stone-200/90 text-stone-800 rounded-tl-xs shadow-2xs prose prose-stone max-w-none'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                    ) : (
                      <div className="space-y-2 text-stone-800 font-sans">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Copy button for model responses */}
                  {!isUser && (
                    <div className="flex items-center gap-2 pt-0.5 px-1">
                      <button
                        onClick={() => handleCopy(msg.content, index)}
                        className="inline-flex items-center gap-1 text-[11px] text-stone-700 hover:text-stone-700 transition-colors"
                      >
                        {copiedMsgIdx === index ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy response</span>
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

        {/* Generating indicator */}
        {isGenerating && (
          <div className="flex gap-3.5 max-w-3xl mr-auto animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin text-amber-600" />
            </div>
            <div className="bg-stone-50 border border-stone-200/90 rounded-2xl rounded-tl-xs p-4 flex items-center gap-2 text-xs text-stone-600">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="font-medium">Gemini is reflecting on your entry...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Footer */}
      <div className="p-4 sm:p-6 border-t border-stone-200 bg-white">
        
        {/* Reflection Mode Switcher */}
        <div className="flex items-center gap-1.5 pb-3 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider mr-1">Goal:</span>
          
          <button
            onClick={() => setActiveMode('reflect')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'reflect'
                ? 'bg-indigo-50 border border-indigo-200 text-indigo-800 shadow-2xs font-semibold'
                : 'text-stone-600 hover:bg-stone-100 border border-transparent'
            }`}
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>Deep Reflection</span>
          </button>

          <button
            onClick={() => setActiveMode('brainstorm')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'brainstorm'
                ? 'bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs font-semibold'
                : 'text-stone-600 hover:bg-stone-100 border border-transparent'
            }`}
          >
            <Lightbulb className="w-3 h-3 text-amber-600" />
            <span>Brainstorm Ideas</span>
          </button>

          <button
            onClick={() => setActiveMode('summarize')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'summarize'
                ? 'bg-blue-50 border border-blue-200 text-blue-800 shadow-2xs font-semibold'
                : 'text-stone-600 hover:bg-stone-100 border border-transparent'
            }`}
          >
            <FileText className="w-3 h-3 text-blue-600" />
            <span>Summary & Insights</span>
          </button>

          <button
            onClick={() => setActiveMode('action_plan')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'action_plan'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs font-semibold'
                : 'text-stone-600 hover:bg-stone-100 border border-transparent'
            }`}
          >
            <CheckSquare className="w-3 h-3 text-emerald-600" />
            <span>Action Steps</span>
          </button>
        </div>

        {/* Text Input Box */}
        <div className="relative bg-stone-50 border border-stone-300/80 rounded-2xl p-2.5 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:bg-white transition-all shadow-xs">
          <textarea
            id="journal-input-textarea"
            ref={textareaRef}
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getModePlaceholder(activeMode)}
            disabled={isGenerating}
            className="w-full bg-transparent resize-none text-sm text-stone-900 placeholder:text-stone-700 focus:outline-hidden leading-relaxed px-1.5"
          />

          <div className="flex items-center justify-between pt-2 px-1">
            <div className="text-[11px] text-stone-700 hidden sm:block">
              <span>Auto-saved to your private Firestore vault</span>
            </div>

            <button
              id="send-reflection-btn"
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 active:scale-[0.98] transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{isGenerating ? 'Reflecting...' : 'Send & Reflect'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
