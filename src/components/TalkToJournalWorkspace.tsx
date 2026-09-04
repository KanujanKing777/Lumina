import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  Send,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Mic,
  MicOff,
  AlertCircle,
  BookOpen,
  HelpCircle,
  X,
  PlusCircle,
  PenTool,
} from 'lucide-react';
import { InteractionEntry } from '../types';
import { askJournalVaultDetailed } from '../utils/reflectionUtils';
import { useVoiceDictation } from '../hooks/useVoiceDictation';

export interface TalkToJournalWorkspaceProps {
  entries: InteractionEntry[];
  onSelectEntry?: (entry: InteractionEntry) => void;
  onNewEntryWithPrompt?: (prompt: string, title?: string) => void;
  onNewEntry?: () => void;
}

interface ChatItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  modelUsed?: string;
  isError?: boolean;
}

const STARTER_INQUIRIES = [
  {
    title: 'Worries & Pressures',
    prompt: 'What have I been worrying about recently?',
    category: 'Emotional Patterns',
    desc: 'Unpack recurring anxieties, doubts, or stressors across recent writings.',
  },
  {
    title: 'Recurring Goals',
    prompt: 'Find recurring goals and habits I have mentioned.',
    category: 'Growth & Intentions',
    desc: 'Identify aspirations, routines, or projects you intended to build.',
  },
  {
    title: 'Achievements & Wins',
    prompt: 'What achievements and proud moments have I logged?',
    category: 'Milestones',
    desc: 'Celebrate wins, breakthroughs, and moments of forward momentum.',
  },
  {
    title: 'Period Summary',
    prompt: 'Summarize my reflections over the past 2 weeks.',
    category: 'Chronological Synthesis',
    desc: 'Get an executive recap of your recent thoughts, mood trajectory, and themes.',
  },
  {
    title: 'Projects & Focus',
    prompt: 'Identify my most frequently mentioned projects and topics.',
    category: 'Themes & Work',
    desc: 'Discover where your mental energy and writing attention go most often.',
  },
  {
    title: 'Mindset Evolution',
    prompt: 'Compare how I felt in my earlier entries versus more recently.',
    category: 'Perspective Shift',
    desc: 'Analyze how your tone, confidence, or outlook has shifted over time.',
  },
];

const QUICK_PILLS = [
  'What have I been worrying about recently?',
  'Find recurring goals & habits',
  'What achievements have I logged?',
  'Summarize recent reflections',
  'Identify frequently mentioned projects',
  'Compare earlier versus recent mindset',
];

export const TalkToJournalWorkspace: React.FC<TalkToJournalWorkspaceProps> = ({
  entries,
  onNewEntryWithPrompt,
  onNewEntry,
}) => {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCapabilities, setShowCapabilities] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, errorMessage]);

  // Voice Dictation Integration
  const {
    isSupported: isVoiceSupported,
    status: voiceStatus,
    isListening,
    errorMessage: voiceError,
    toggleDictation,
    stopDictation,
  } = useVoiceDictation({
    onFinalTranscript: (transcript) => {
      if (transcript && transcript.trim()) {
        setInput((prev) => (prev ? `${prev.trim()} ${transcript.trim()}` : transcript.trim()));
      }
    },
  });

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const handleSendMessage = async (queryToSend?: string) => {
    const query = (queryToSend || input).trim();
    if (!query || isLoading) return;

    if (isListening) {
      stopDictation();
    }

    const userMessage: ChatItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    // Optimistically update conversation history
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setErrorMessage(null);
    setLastFailedPrompt(null);
    setIsLoading(true);

    try {
      // Build history for API (last 8 messages)
      const historyPayload = updatedMessages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { reply, modelUsed } = await askJournalVaultDetailed(query, historyPayload, entries);

      const assistantMessage: ChatItem = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: reply,
        timestamp: Date.now(),
        modelUsed,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorText = err.message || 'An error occurred while inquiring with your journal companion.';
      setErrorMessage(errorText);
      setLastFailedPrompt(query);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedPrompt) {
      handleSendMessage(lastFailedPrompt);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear this conversation history?')) {
      setMessages([]);
      setErrorMessage(null);
      setLastFailedPrompt(null);
    }
  };

  return (
    <div
      id="talk-to-journal-workspace"
      className="w-full h-full flex flex-col min-h-0 overflow-hidden bg-stone-50/50 dark:bg-stone-950"
    >
      {/* 1. TOP BAR: AI Journal Companion Header */}
      <header
        id="talk-to-journal-header"
        className="shrink-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xs border-b border-stone-200/80 dark:border-stone-800 px-4 sm:px-6 py-3.5 flex items-center justify-between z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <span>✨ AI Journal Companion</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                <ShieldCheck className="w-3 h-3" />
                <span>Isolated & Private</span>
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-stone-400" />
                <span>Grounded in {entries.length} reflections</span>
              </span>
              <span className="text-stone-300 dark:text-stone-700">•</span>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                Talk to My Journal
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="btn-journal-capabilities"
            onClick={() => setShowCapabilities(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100/80 dark:bg-stone-800/80 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 transition-colors cursor-pointer"
            title="View Companion Capabilities"
          >
            <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">Capabilities</span>
          </button>

          {messages.length > 0 && (
            <button
              id="btn-clear-journal-chat"
              onClick={handleClearChat}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-stone-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          {onNewEntry && (
            <button
              id="btn-companion-new-entry"
              onClick={onNewEntry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. MIDDLE: CONVERSATION HISTORY (ONLY THIS SCROLLS) */}
      <main
        id="talk-to-journal-messages-container"
        className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-6 space-y-6">
            {/* Welcome Greeting Banner */}
            <div className="text-center space-y-2 p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Welcome to your AI Journal Companion
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-lg mx-auto leading-relaxed">
                Converse directly with your reflections. Ask about recurring patterns, worries,
                creative ideas, personal goals, or summarize past periods of your life.
              </p>
            </div>

            {/* Structured Capabilities Cards Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  Starter Inquiries
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400">
                  Click any prompt to ask
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STARTER_INQUIRIES.map((item, idx) => (
                  <button
                    key={idx}
                    id={`starter-inquiry-${idx}`}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-4 rounded-xl text-left bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/60">
                          {item.category}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                        "{item.prompt}"
                      </h3>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                id={`chat-msg-${msg.id}`}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200/60 dark:border-amber-800/60 shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-tr-xs'
                      : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 rounded-tl-xs border border-stone-200/80 dark:border-stone-800'
                  }`}
                >
                  {/* Message Content */}
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                  ) : (
                    <div className="markdown-body prose prose-stone dark:prose-invert max-w-none text-xs leading-relaxed space-y-2">
                      <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                    </div>
                  )}

                  {/* Message Footer / Metadata */}
                  <div
                    className={`flex items-center justify-between gap-2 pt-1 border-t text-[10px] ${
                      msg.role === 'user'
                        ? 'border-white/10 text-white/70'
                        : 'border-stone-100 dark:border-stone-800 text-stone-400'
                    }`}
                  >
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                    {msg.role === 'model' && (
                      <div className="flex items-center gap-1.5">
                        {msg.modelUsed && (
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm bg-stone-100 dark:bg-stone-800 text-stone-500">
                            {msg.modelUsed.includes('heuristic') ? 'Local Vault Engine' : msg.modelUsed}
                          </span>
                        )}

                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-[10px] text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>

                        {onNewEntryWithPrompt && (
                          <button
                            onClick={() => onNewEntryWithPrompt(`Reflecting on Companion Insight:\n\n${msg.content.slice(0, 300)}...`, 'Reflection on Journal Insight')}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 transition-colors cursor-pointer"
                            title="Turn into a journal entry"
                          >
                            <PenTool className="w-3 h-3" />
                            <span className="text-[10px]">Journal on this</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-800/60 shadow-2xs">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-600" />
                </div>
                <div className="p-3.5 rounded-2xl rounded-tl-xs bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-xs text-stone-500 flex items-center gap-2 shadow-2xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Synthesizing your journal reflections...</span>
                </div>
              </div>
            )}

            {/* Error Banner with Retry */}
            {errorMessage && (
              <div
                id="talk-to-journal-error-banner"
                className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 flex items-start justify-between gap-3 text-xs text-rose-700 dark:text-rose-300 shadow-2xs"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Unable to complete query</p>
                    <p className="text-[11px] text-rose-600/90 dark:text-rose-400/90">{errorMessage}</p>
                  </div>
                </div>

                {lastFailedPrompt && (
                  <button
                    id="btn-retry-journal-query"
                    onClick={handleRetry}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* 3. BOTTOM: FIXED CHAT COMPOSER (STAYS VISIBLE AT ALL TIMES) */}
      <footer
        id="talk-to-journal-composer-container"
        className="shrink-0 bg-white dark:bg-stone-900 border-t border-stone-200/80 dark:border-stone-800 p-3 sm:p-4 z-10 shadow-xs"
      >
        <div className="max-w-3xl mx-auto space-y-2.5">
          {/* Quick Query Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_PILLS.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(pill)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap bg-stone-100 dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-stone-600 dark:text-stone-300 hover:text-amber-800 dark:hover:text-amber-300 border border-stone-200/60 dark:border-stone-700/60 hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Form & Input Controls */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2 bg-stone-50 dark:bg-stone-800/80 rounded-2xl p-2 border border-stone-200 dark:border-stone-700/80 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all"
          >
            {/* Auto-growing Textarea */}
            <textarea
              id="input-talk-to-journal-chat"
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                isListening
                  ? 'Listening to speech... (speak now)'
                  : "Ask about your journal history (e.g., 'What have I been worrying about recently?')..."
              }
              disabled={isLoading}
              className="flex-1 bg-transparent border-0 resize-none text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-hidden p-1.5 max-h-32 min-h-[36px]"
            />

            {/* Voice Dictation Button */}
            {isVoiceSupported && (
              <button
                type="button"
                id="btn-talk-to-journal-mic"
                onClick={toggleDictation}
                disabled={isLoading}
                aria-label={isListening ? 'Stop voice dictation' : 'Start voice dictation'}
                className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                    : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700/60'
                }`}
                title={isListening ? 'Stop dictation' : 'Dictate question via microphone'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Send Button */}
            <button
              id="btn-talk-to-journal-send"
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-2xs"
              aria-label="Send query to companion"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Voice Error Notice if any */}
          {voiceError && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 pl-1">{voiceError}</p>
          )}

          {/* Privacy Footnote */}
          <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Grounded strictly in your authenticated entries. Shift+Enter for new line.</span>
            </span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
        </div>
      </footer>

      {/* Capabilities Info Modal */}
      {showCapabilities && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Companion Capabilities
                </h3>
              </div>
              <button
                onClick={() => setShowCapabilities(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Your AI Journal Companion processes your personal reflection archive securely without
              training public models. Here is what you can ask:
            </p>

            <ul className="text-xs space-y-2 text-stone-700 dark:text-stone-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Identify Worries & Obstacles:</strong> Ask what you have been worrying about recently to uncover mental bottlenecks.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Track Goals & Habits:</strong> Identify recurring intentions, commitments, or routines you have planned.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Summarize Time Periods:</strong> Recap reflections from the past week, month, or season with emotional arcs.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Compare Mindsets:</strong> Compare how your outlook or tone evolved between earlier entries and recent entries.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Celebrate Accomplishments:</strong> Recall proud milestones and breakthroughs you documented.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Discuss Specific Entries:</strong> Explore thoughts or decisions recorded on specific dates or topics.
                </span>
              </li>
            </ul>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowCapabilities(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
