import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Check,
  X,
  RefreshCw,
  FileText,
  HelpCircle,
  Tag,
  Smile,
  Mic,
  ArrowRight,
  AlertCircle,
  Plus,
  Copy,
  CheckCheck
} from 'lucide-react';
import { WritingAssistantAction, WritingAssistantSuggestion, MoodType } from '../types';

interface AIAssistancePanelProps {
  journalContent: string;
  currentTitle: string;
  voiceTranscript?: string;
  currentMood?: MoodType;
  currentTags?: string[];
  onAcceptText: (newText: string, mode: 'replace' | 'append') => void;
  onAcceptTitle: (newTitle: string) => void;
  onAcceptTags: (tags: string[]) => void;
  onAcceptMood: (mood: MoodType, intensity: number) => void;
  onAcceptSummary: (summary: string) => void;
  onInsertPrompt: (promptText: string) => void;
}

export const AIAssistancePanel: React.FC<AIAssistancePanelProps> = ({
  journalContent,
  currentTitle,
  voiceTranscript,
  currentMood,
  currentTags,
  onAcceptText,
  onAcceptTitle,
  onAcceptTags,
  onAcceptMood,
  onAcceptSummary,
  onInsertPrompt,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<WritingAssistantAction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSuggestion, setCurrentSuggestion] = useState<WritingAssistantSuggestion | null>(null);
  const [selectedTagsToApply, setSelectedTagsToApply] = useState<string[]>([]);
  const [copiedText, setCopiedText] = useState(false);

  // Available AI writing actions
  const actions: { id: WritingAssistantAction; label: string; icon: any; description: string }[] = [
    { id: 'improve_writing', label: 'Improve Writing', icon: Sparkles, description: 'Enhance vocabulary, flow, and cadence while keeping your authentic voice.' },
    { id: 'fix_grammar', label: 'Fix Grammar', icon: CheckCheck, description: 'Correct typos, punctuation, capitalization, and grammar seamlessly.' },
    { id: 'make_clearer', label: 'Make Clearer', icon: Wand2, description: 'Streamline run-on sentences and eliminate clutter for maximum clarity.' },
    { id: 'generate_title', label: 'Generate Title', icon: FileText, description: 'Propose a poignant, grounding title matching your entry content.' },
    { id: 'summarize', label: 'Summarize Entry', icon: FileText, description: 'Distill core thoughts and emotional takeaways into an executive reflection.' },
    { id: 'suggest_questions', label: 'Reflection Questions', icon: HelpCircle, description: 'Generate thoughtful introspective prompts to guide deeper writing.' },
    { id: 'extract_tags', label: 'Extract Tags', icon: Tag, description: 'Discover relevant thematic hashtags for your journal collection.' },
    { id: 'suggest_mood', label: 'Suggest Mood', icon: Smile, description: 'Detect emotional tone and recommended intensity based on sentiment.' },
  ];

  // If voice transcript or speech is available, include convert voice option
  const hasVoice = Boolean(voiceTranscript && voiceTranscript.trim().length > 0);

  const handleTriggerAction = async (action: WritingAssistantAction) => {
    setActiveAction(action);
    setIsLoading(true);
    setError(null);
    setCurrentSuggestion(null);
    setCopiedText(false);

    try {
      const res = await fetch('/api/gemini/writing-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          journalContent,
          currentTitle,
          voiceTranscript,
          currentMood,
          currentTags,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process writing assistance.');
      }

      const suggestion: WritingAssistantSuggestion = {
        action,
        suggestedText: data.result?.suggestedText,
        suggestedTitle: data.result?.suggestedTitle,
        suggestedTags: data.result?.suggestedTags,
        suggestedMood: data.result?.suggestedMood,
        suggestedMoodIntensity: data.result?.suggestedMoodIntensity,
        suggestedQuestions: data.result?.suggestedQuestions,
        summary: data.result?.summary,
        explanation: data.result?.explanation,
        modelUsed: data.modelUsed,
      };

      setCurrentSuggestion(suggestion);

      if (suggestion.suggestedTags && suggestion.suggestedTags.length > 0) {
        setSelectedTagsToApply([...suggestion.suggestedTags]);
      }
    } catch (err: any) {
      console.error('Writing assistant error:', err);
      setError(err.message || 'Unable to connect to writing assistant. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissSuggestion = () => {
    setCurrentSuggestion(null);
    setActiveAction(null);
    setError(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="border-b border-stone-200 dark:border-stone-800 bg-amber-50/40 dark:bg-stone-900/50 p-2.5 transition-colors">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-950/60 hover:bg-amber-200/80 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
            aria-label="Toggle AI Writing Assistant Tools"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>AI Writing Assistant</span>
            <span className="text-[10px] font-normal opacity-75">
              {isOpen ? '(Hide)' : '(Show Tools)'}
            </span>
          </button>

          {hasVoice && (
            <button
              type="button"
              onClick={() => handleTriggerAction('convert_voice')}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/50 hover:bg-emerald-200/70 transition-colors cursor-pointer"
              title="Transform voice dictation into a structured journal entry"
            >
              <Mic className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Format Voice Dictation</span>
            </button>
          )}
        </div>

        {/* Quick hint */}
        <span className="text-[11px] text-stone-500 dark:text-stone-400 italic">
          Suggestions never overwrite your text without your approval.
        </span>
      </div>

      {/* Collapsible Action Buttons Grid */}
      {isOpen && (
        <div className="mt-2.5 pt-2 border-t border-amber-200/60 dark:border-stone-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
          {actions.map((act) => {
            const IconComponent = act.icon;
            const isCurrent = activeAction === act.id && isLoading;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => handleTriggerAction(act.id)}
                disabled={isLoading}
                title={act.description}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-center text-xs transition-all cursor-pointer border ${
                  activeAction === act.id && !currentSuggestion
                    ? 'bg-amber-100 border-amber-300 dark:bg-amber-950 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                    : 'bg-white/80 dark:bg-stone-800/70 border-stone-200/90 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 text-stone-700 dark:text-stone-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <IconComponent className={`w-3.5 h-3.5 mb-1 ${isCurrent ? 'animate-spin text-amber-600' : 'text-amber-600 dark:text-amber-400'}`} />
                <span className="text-[11px] font-medium leading-tight">{act.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mt-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-pulse">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
            <span className="font-medium">
              Generating suggestion with Reflections AI...
            </span>
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase tracking-wider font-semibold">
            Untrusted Input Guard Active
          </span>
        </div>
      )}

      {/* Error Banner */}
      {error && !isLoading && (
        <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => activeAction && handleTriggerAction(activeAction)}
            className="px-2.5 py-1 bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 text-rose-900 dark:text-rose-200 rounded-md font-medium cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* PREVIEW / ACCEPT / REJECT WORKFLOW CARD */}
      {currentSuggestion && !isLoading && (
        <div className="mt-3 rounded-xl border-2 border-amber-300 dark:border-amber-600/80 bg-white dark:bg-stone-900 shadow-md p-4 space-y-3.5 transition-all">
          
          {/* Card Top Label */}
          <div className="flex items-center justify-between border-b border-amber-100 dark:border-stone-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Suggestion Preview
              </span>
              {currentSuggestion.modelUsed && (
                <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                  {currentSuggestion.modelUsed}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => activeAction && handleTriggerAction(activeAction)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
                title="Regenerate suggestion"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDismissSuggestion}
                className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
                title="Dismiss suggestion"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Explanation Banner */}
          {currentSuggestion.explanation && (
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed italic">
              {currentSuggestion.explanation}
            </p>
          )}

          {/* CONTENT PREVIEW: Text Revisions (Improve / Grammar / Clarify / Voice) */}
          {currentSuggestion.suggestedText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-stone-800 dark:text-stone-200">Suggested Version Preview:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentSuggestion.suggestedText!)}
                  className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {copiedText ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-50/40 dark:bg-stone-800/60 border border-amber-200/80 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 font-sans leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                {currentSuggestion.suggestedText}
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleDismissSuggestion}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Reject & Keep Original
                </button>
                {journalContent.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      onAcceptText(currentSuggestion.suggestedText!, 'append');
                      handleDismissSuggestion();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 transition-colors cursor-pointer"
                  >
                    Append to Entry
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onAcceptText(currentSuggestion.suggestedText!, 'replace');
                    handleDismissSuggestion();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept & Replace</span>
                </button>
              </div>
            </div>
          )}

          {/* CONTENT PREVIEW: Suggested Title */}
          {currentSuggestion.suggestedTitle && (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">Suggested Title:</div>
              <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm font-semibold text-stone-900 dark:text-stone-100">
                "{currentSuggestion.suggestedTitle}"
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDismissSuggestion}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAcceptTitle(currentSuggestion.suggestedTitle!);
                    handleDismissSuggestion();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Set as Title</span>
                </button>
              </div>
            </div>
          )}

          {/* CONTENT PREVIEW: Reflection Questions */}
          {currentSuggestion.suggestedQuestions && currentSuggestion.suggestedQuestions.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                Thought-Provoking Reflection Questions:
              </div>
              <div className="space-y-2">
                {currentSuggestion.suggestedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-start justify-between gap-3 text-xs leading-relaxed"
                  >
                    <span className="text-stone-800 dark:text-stone-200 italic font-serif">"{q}"</span>
                    <button
                      type="button"
                      onClick={() => onInsertPrompt(`\n\n### Reflection Prompt:\n*${q}*\n\n`)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 hover:bg-amber-200 text-[11px] font-medium shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Insert Prompt</span>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleDismissSuggestion}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* CONTENT PREVIEW: Extracted Tags */}
          {currentSuggestion.suggestedTags && currentSuggestion.suggestedTags.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                Suggested Thematic Tags (Select to Apply):
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentSuggestion.suggestedTags.map((tag, idx) => {
                  const isSelected = selectedTagsToApply.includes(tag);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedTagsToApply((prev) =>
                          isSelected ? prev.filter((t) => t !== tag) : [...prev, tag]
                        );
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                      }`}
                    >
                      #{tag} {isSelected ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDismissSuggestion}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  disabled={selectedTagsToApply.length === 0}
                  onClick={() => {
                    onAcceptTags(selectedTagsToApply);
                    handleDismissSuggestion();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply {selectedTagsToApply.length} Tags</span>
                </button>
              </div>
            </div>
          )}

          {/* CONTENT PREVIEW: Suggested Mood */}
          {currentSuggestion.suggestedMood && (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                Recommended Mood & Intensity:
              </div>
              <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smile className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100 capitalize">
                      {currentSuggestion.suggestedMood}
                    </span>
                    <span className="ml-2 text-xs font-medium text-stone-500 dark:text-stone-400">
                      Intensity: {currentSuggestion.suggestedMoodIntensity || 5}/10
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDismissSuggestion}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAcceptMood(
                      currentSuggestion.suggestedMood as MoodType,
                      currentSuggestion.suggestedMoodIntensity || 5
                    );
                    handleDismissSuggestion();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Mood</span>
                </button>
              </div>
            </div>
          )}

          {/* CONTENT PREVIEW: Entry Summary */}
          {currentSuggestion.summary && (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                Executive Entry Summary:
              </div>
              <blockquote className="p-3.5 rounded-lg bg-amber-50/50 dark:bg-stone-800/70 border-l-4 border-amber-500 text-xs italic font-serif leading-relaxed text-stone-800 dark:text-stone-200">
                "{currentSuggestion.summary}"
              </blockquote>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDismissSuggestion}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAcceptSummary(currentSuggestion.summary!);
                    handleDismissSuggestion();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save as Summary</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
