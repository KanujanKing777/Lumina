import React, { useState } from 'react';
import { 
  Smile, 
  Heart, 
  Sparkles, 
  CloudRain, 
  Zap, 
  Flame, 
  Moon, 
  Meh, 
  Wind,
  Plus, 
  X, 
  Info,
  Sliders
} from 'lucide-react';
import { MoodType } from '../types';

interface MoodSelectorProps {
  selectedMood?: MoodType;
  moodIntensity?: number; // 1 - 10
  emotionTags?: string[];
  onChangeMood: (mood?: MoodType) => void;
  onChangeIntensity: (intensity: number) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export const PREDEFINED_MOODS: { type: MoodType; label: string; icon: string; bgLight: string; textLight: string }[] = [
  { type: 'happy', label: 'Happy', icon: '😊', bgLight: 'bg-amber-100 dark:bg-amber-950/60', textLight: 'text-amber-800 dark:text-amber-300' },
  { type: 'calm', label: 'Calm', icon: '🌿', bgLight: 'bg-emerald-100 dark:bg-emerald-950/60', textLight: 'text-emerald-800 dark:text-emerald-300' },
  { type: 'excited', label: 'Excited', icon: '✨', bgLight: 'bg-indigo-100 dark:bg-indigo-950/60', textLight: 'text-indigo-800 dark:text-indigo-300' },
  { type: 'grateful', label: 'Grateful', icon: '🙏', bgLight: 'bg-rose-100 dark:bg-rose-950/60', textLight: 'text-rose-800 dark:text-rose-300' },
  { type: 'neutral', label: 'Neutral', icon: '😐', bgLight: 'bg-stone-100 dark:bg-stone-800', textLight: 'text-stone-700 dark:text-stone-300' },
  { type: 'sad', label: 'Sad', icon: '🌧️', bgLight: 'bg-blue-100 dark:bg-blue-950/60', textLight: 'text-blue-800 dark:text-blue-300' },
  { type: 'anxious', label: 'Anxious', icon: '⚡', bgLight: 'bg-yellow-100 dark:bg-yellow-950/60', textLight: 'text-yellow-800 dark:text-yellow-300' },
  { type: 'angry', label: 'Angry', icon: '🔥', bgLight: 'bg-red-100 dark:bg-red-950/60', textLight: 'text-red-800 dark:text-red-300' },
  { type: 'frustrated', label: 'Frustrated', icon: '🌪️', bgLight: 'bg-orange-100 dark:bg-orange-950/60', textLight: 'text-orange-800 dark:text-orange-300' },
  { type: 'tired', label: 'Tired', icon: '🌙', bgLight: 'bg-purple-100 dark:bg-purple-950/60', textLight: 'text-purple-800 dark:text-purple-300' },
];

const SUGGESTED_EMOTIONS = [
  'clarity', 'mindful', 'optimistic', 'creative', 'grounded', 
  'focused', 'overwhelmed', 'hopeful', 'restless', 'resilient'
];

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMood,
  moodIntensity = 5,
  emotionTags = [],
  onChangeMood,
  onChangeIntensity,
  onAddTag,
  onRemoveTag,
}) => {
  const [customTagInput, setCustomTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = customTagInput.trim().replace(/^#/, '').toLowerCase();
    if (cleanTag && !emotionTags.includes(cleanTag) && emotionTags.length < 12) {
      onAddTag(cleanTag);
      setCustomTagInput('');
      setIsAddingTag(false);
    }
  };

  const getIntensityLabel = (val: number) => {
    if (val <= 3) return 'Mild / Subtle';
    if (val <= 7) return 'Moderate / Balanced';
    return 'Intense / Peak';
  };

  return (
    <div className="p-4 rounded-xl bg-stone-50/80 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-4 transition-colors">
      
      {/* Mood Header & Selector Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Smile className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
              Mood Check-in
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-normal">
              (Optional)
            </span>
          </div>
          
          {selectedMood && (
            <button
              type="button"
              onClick={() => onChangeMood(undefined)}
              className="text-[11px] text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:underline cursor-pointer"
            >
              Clear mood
            </button>
          )}
        </div>

        {/* 10 Mood Buttons */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {PREDEFINED_MOODS.map((item) => {
            const isSelected = selectedMood === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => onChangeMood(isSelected ? undefined : item.type)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? `${item.bgLight} ${item.textLight} border-amber-500 ring-2 ring-amber-500/30 scale-105 shadow-2xs font-semibold`
                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700/80 text-stone-700 dark:text-stone-300 hover:bg-stone-100/80 dark:hover:bg-stone-700'
                }`}
                title={item.label}
              >
                <span className="text-base select-none">{item.icon}</span>
                <span className="text-[10px] mt-0.5 truncate max-w-[50px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mood Intensity Slider (Shown if a mood is selected) */}
      {selectedMood && (
        <div className="p-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span className="text-xs font-medium text-stone-800 dark:text-stone-200">
              Mood Intensity:
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {moodIntensity} / 10
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              ({getIntensityLabel(moodIntensity)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-400">1</span>
            <input
              id="mood-intensity-slider"
              type="range"
              min="1"
              max="10"
              value={moodIntensity}
              onChange={(e) => onChangeIntensity(parseInt(e.target.value, 10))}
              className="w-36 accent-amber-600 cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg"
              title={`Intensity: ${moodIntensity}`}
            />
            <span className="text-[10px] text-stone-400">10</span>
          </div>
        </div>
      )}

      {/* Emotion Tags Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
            Emotion & Focus Tags
          </span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            {emotionTags.length}/12 tags
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Active Tags */}
          {emotionTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 shadow-2xs"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="p-0.5 hover:bg-amber-200 dark:hover:bg-amber-900 rounded-full transition-colors cursor-pointer"
                title={`Remove #${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Suggested Quick Tags */}
          {SUGGESTED_EMOTIONS.filter((s) => !emotionTags.includes(s)).slice(0, 5).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onAddTag(suggestion)}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
            >
              <span>+ #{suggestion}</span>
            </button>
          ))}

          {/* Custom Tag Input Toggle */}
          {isAddingTag ? (
            <form onSubmit={handleAddCustomTag} className="inline-flex items-center gap-1">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                placeholder="tag name..."
                maxLength={24}
                autoFocus
                className="px-2 py-0.5 text-xs bg-white dark:bg-stone-900 border border-amber-400 rounded-md text-stone-900 dark:text-stone-100 focus:outline-hidden w-24"
              />
              <button
                type="submit"
                className="px-2 py-0.5 text-[11px] font-semibold bg-amber-600 text-white rounded-md hover:bg-amber-700 cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingTag(false)}
                className="p-0.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingTag(true)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-amber-700 dark:text-amber-400 border border-dashed border-amber-300 dark:border-amber-700/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Custom Tag</span>
            </button>
          )}
        </div>
      </div>

      {/* Non-diagnostic Disclaimer */}
      <div className="flex items-start gap-1.5 pt-1 text-[10px] text-stone-500 dark:text-stone-400">
        <Info className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
        <span>
          Mood and emotion tracking is strictly for personal reflection and self-awareness, and does not constitute medical, clinical, or psychological diagnosis.
        </span>
      </div>
    </div>
  );
};
