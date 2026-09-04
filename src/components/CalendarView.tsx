import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  Plus,
  Star,
  Sparkles,
  Smile,
  Image as ImageIcon
} from 'lucide-react';
import { InteractionEntry, MoodType } from '../types';

interface CalendarViewProps {
  entries: InteractionEntry[];
  onSelectEntry: (entry: InteractionEntry) => void;
  onNewEntry: (timestamp?: number) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  entries,
  onSelectEntry,
  onNewEntry,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today);
  };

  // Group entries by Date string YYYY-MM-DD
  const entriesByDate = useMemo(() => {
    const map = new Map<string, InteractionEntry[]>();
    entries.forEach((entry) => {
      const dateVal = new Date(entry.journalDate || entry.createdAt);
      const key = `${dateVal.getFullYear()}-${String(dateVal.getMonth() + 1).padStart(2, '0')}-${String(dateVal.getDate()).padStart(2, '0')}`;
      const existing = map.get(key) || [];
      existing.push(entry);
      map.set(key, existing);
    });
    return map;
  }, [entries]);

  // Calendar grid math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

  // Entries for currently selected day
  const selectedDayKey = selectedDay
    ? `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`
    : null;

  const selectedDayEntries = selectedDayKey ? entriesByDate.get(selectedDayKey) || [] : [];

  const isToday = (dayNum: number) => {
    const today = new Date();
    return (
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonth &&
      today.getDate() === dayNum
    );
  };

  const isSelected = (dayNum: number) => {
    if (!selectedDay) return false;
    return (
      selectedDay.getFullYear() === currentYear &&
      selectedDay.getMonth() === currentMonth &&
      selectedDay.getDate() === dayNum
    );
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-stone-50 dark:bg-stone-900/60 overflow-hidden">
      {/* Header Bar */}
      <div className="shrink-0 p-4 lg:px-8 border-b border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            Reflection Calendar
          </h1>
          <p className="text-xs text-stone-700 dark:text-stone-300 mt-0.5">
            Explore your reflections across days and track your writing rhythm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 cursor-pointer transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 p-0.5 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-stone-800 dark:text-stone-200 min-w-32 text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Calendar Grid on left/top, Selected Day Entries on right/bottom */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Calendar Grid Container */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-8 flex flex-col">
          <div className="max-w-4xl w-full mx-auto bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 lg:p-6 shadow-2xs">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-2 text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {/* Previous month filler days */}
              {Array.from({ length: firstDayIndex }).map((_, i) => {
                const dayNum = prevMonthDays - firstDayIndex + 1 + i;
                return (
                  <div
                    key={`prev-${dayNum}`}
                    className="min-h-16 sm:min-h-20 p-1.5 rounded-xl border border-transparent bg-stone-50/50 dark:bg-stone-900/30 text-stone-300 dark:text-stone-600 opacity-40 select-none text-xs"
                  >
                    <span>{dayNum}</span>
                  </div>
                );
              })}

              {/* Current month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayEntries = entriesByDate.get(dateKey) || [];
                const hasEntries = dayEntries.length > 0;
                const todayActive = isToday(dayNum);
                const selectedActive = isSelected(dayNum);

                return (
                  <div
                    key={`curr-${dayNum}`}
                    onClick={() => setSelectedDay(new Date(currentYear, currentMonth, dayNum))}
                    className={`min-h-16 sm:min-h-20 p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                      selectedActive
                        ? 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/40 shadow-xs'
                        : todayActive
                        ? 'bg-stone-50 dark:bg-stone-800/80 border-amber-300 dark:border-amber-600'
                        : hasEntries
                        ? 'bg-stone-50/80 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 hover:border-amber-300 hover:bg-white dark:hover:bg-stone-800'
                        : 'bg-transparent border-stone-100 dark:border-stone-800/60 hover:bg-stone-50 dark:hover:bg-stone-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                          todayActive
                            ? 'bg-amber-600 text-white font-bold'
                            : selectedActive
                            ? 'text-amber-900 dark:text-amber-200'
                            : 'text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {hasEntries && (
                        <span className="text-[10px] font-mono px-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold">
                          {dayEntries.length}
                        </span>
                      )}
                    </div>

                    {/* Entry dots / mood previews */}
                    <div className="flex items-center gap-1 mt-1 overflow-hidden flex-wrap">
                      {dayEntries.slice(0, 3).map((entry, idx) => {
                        const emoji = getMoodEmoji(entry.mood);
                        return (
                          <div
                            key={entry.id || idx}
                            title={entry.title}
                            className="text-[10px] leading-none"
                          >
                            {emoji || (
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            )}
                          </div>
                        );
                      })}
                      {dayEntries.length > 3 && (
                        <span className="text-[9px] text-stone-600 dark:text-stone-300">
                          +{dayEntries.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Day Entries Panel */}
        <div className="w-full lg:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                {selectedDay ? selectedDay.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Select a date'}
              </h2>
              <span className="text-[11px] text-stone-700 dark:text-stone-300">
                {selectedDayEntries.length} {selectedDayEntries.length === 1 ? 'reflection' : 'reflections'}
              </span>
            </div>

            <button
              onClick={() => {
                if (selectedDay) {
                  onNewEntry(selectedDay.getTime());
                } else {
                  onNewEntry();
                }
              }}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write</span>
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
            {selectedDayEntries.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-700 dark:text-stone-300 space-y-3">
                <BookOpen className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
                <p className="font-medium text-stone-700 dark:text-stone-200">
                  No reflections on this day
                </p>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 max-w-xs mx-auto">
                  Take a mindful pause and capture what was present for you.
                </p>
                <button
                  onClick={() => selectedDay && onNewEntry(selectedDay.getTime())}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start entry for this day</span>
                </button>
              </div>
            ) : (
              selectedDayEntries.map((entry) => {
                const dateVal = new Date(entry.journalDate || entry.createdAt);
                const moodEmoji = getMoodEmoji(entry.mood);
                const mediaCount = entry.media ? entry.media.length : 0;

                return (
                  <div
                    key={entry.id}
                    onClick={() => onSelectEntry(entry)}
                    className="group p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-600 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {moodEmoji ? (
                          <span className="text-sm">{moodEmoji}</span>
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors truncate">
                          {entry.title || 'Untitled Entry'}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-stone-600 dark:text-stone-300">
                        {entry.isFavorite && (
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        )}
                        <Clock className="w-2.5 h-2.5" />
                        <span>{dateVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-2 mt-2 leading-relaxed">
                      {entry.journalContent || entry.initialPrompt || 'No content written.'}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-[10px] text-stone-700 dark:text-stone-300">
                      <div className="flex items-center gap-2">
                        {entry.mood && (
                          <span className="capitalize font-medium text-amber-700 dark:text-amber-400">
                            {entry.mood}
                          </span>
                        )}
                        {mediaCount > 0 && (
                          <span className="flex items-center gap-0.5">
                            <ImageIcon className="w-2.5 h-2.5" />
                            {mediaCount}
                          </span>
                        )}
                      </div>
                      <span className="font-mono">
                        {entry.wordCount || ((entry.journalContent || '').trim().split(/\s+/).filter(Boolean).length)} words
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
