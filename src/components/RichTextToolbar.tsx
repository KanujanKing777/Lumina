import React from 'react';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  CheckSquare, 
  Code,
  Eye,
  Edit3
} from 'lucide-react';

interface RichTextToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsertMarkdown: (prefix: string, suffix?: string, defaultPlaceholder?: string) => void;
  viewMode: 'edit' | 'preview' | 'split';
  onChangeViewMode: (mode: 'edit' | 'preview' | 'split') => void;
}

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  textareaRef,
  onInsertMarkdown,
  viewMode,
  onChangeViewMode,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-stone-100/90 dark:bg-stone-800/90 border-b border-stone-200 dark:border-stone-700/80 text-stone-700 dark:text-stone-300">
      
      {/* Formatting Action Buttons */}
      <div className="flex items-center gap-0.5 flex-wrap">
        {/* Bold */}
        <button
          type="button"
          onClick={() => onInsertMarkdown('**', '**', 'bold text')}
          className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 dark:hover:text-stone-100 transition-colors cursor-pointer"
          title="Bold (Ctrl+B)"
          aria-label="Format Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => onInsertMarkdown('*', '*', 'italic text')}
          className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 dark:hover:text-stone-100 transition-colors cursor-pointer"
          title="Italic (Ctrl+I)"
          aria-label="Format Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-stone-300 dark:bg-stone-700 mx-1" />

        {/* Heading 1 */}
        <button
          type="button"
          onClick={() => onInsertMarkdown('# ', '', 'Heading 1')}
          className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 dark:hover:text-stone-100 transition-colors cursor-pointer font-bold text-xs"
          title="Heading 1 (#)"
          aria-label="Insert Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>

        {/* Heading 2 */}
        <button
          type="button"
          onClick={() => onInsertMarkdown('## ', '', 'Heading 2')}
          className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 dark:hover:text-stone-100 transition-colors cursor-pointer font-semibold text-xs"
          title="Heading 2 (##)"
          aria-label="Insert Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>

        {/* Heading 3 */}
        <button
          type="button"
          onClick={() => onInsertMarkdown('### ', '', 'Heading 3')}
          className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 dark:hover:text-stone-100 transition-colors cursor-pointer font-medium text-xs"
          title="Heading 3 (###)"
          aria-label="Insert Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-stone-300 dark:bg-stone-700 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => onInsertMarkdown('- ', '', 'List item')}
          className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 dark:hover:text-stone-100 transition-colors cursor-pointer"
          title="Bullet List (-)"
          aria-label="Insert Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onClick={() => onInsertMarkdown('1. ', '', 'Numbered item')}
          className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 dark:hover:text-stone-100 transition-colors cursor-pointer"
          title="Numbered List (1.)"
          aria-label="Insert Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        {/* Checklist */}
        <button
          type="button"
          onClick={() => onInsertMarkdown('- [ ] ', '', 'Task to complete')}
          className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 dark:hover:text-stone-100 transition-colors cursor-pointer"
          title="Checklist (- [ ])"
          aria-label="Insert Checklist"
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>

        {/* Quote */}
        <button
          type="button"
          onClick={() => onInsertMarkdown('> ', '', 'Reflective quote')}
          className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 dark:hover:text-stone-100 transition-colors cursor-pointer"
          title="Blockquote (>)"
          aria-label="Insert Quote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        {/* Code / Monospace */}
        <button
          type="button"
          onClick={() => onInsertMarkdown('`', '`', 'code')}
          className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 dark:hover:text-stone-100 transition-colors cursor-pointer"
          title="Inline Code (`)"
          aria-label="Insert Inline Code"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* View Toggle: Edit vs Preview */}
      <div className="flex items-center gap-1 bg-stone-200/70 dark:bg-stone-900/80 p-0.5 rounded-lg text-xs border border-stone-300/40 dark:border-stone-700/60">
        <button
          type="button"
          onClick={() => onChangeViewMode('edit')}
          className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
            viewMode === 'edit'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold shadow-2xs border border-stone-200/50 dark:border-stone-700'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <Edit3 className="w-3 h-3" />
          <span>Write</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeViewMode('preview')}
          className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
            viewMode === 'preview'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold shadow-2xs border border-stone-200/50 dark:border-stone-700'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <Eye className="w-3 h-3" />
          <span>Preview</span>
        </button>
      </div>

    </div>
  );
};
