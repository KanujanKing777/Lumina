import React from 'react';
import {
  BookOpen,
  Star,
  Folder,
  Calendar,
  Clock,
  Search,
  Sparkles,
  Lightbulb,
  MessageSquare,
  Layers,
  CalendarDays,
  CalendarRange,
  History,
  Flame,
  Target,
  BarChart2,
  Plus,
  X
} from 'lucide-react';
import { NavigationSection } from '../types';

interface LeftSidebarProps {
  activeSection: NavigationSection;
  onSelectSection: (section: NavigationSection) => void;
  onNewEntry: () => void;
  entriesCount: number;
  favoritesCount: number;
  foldersCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeSection,
  onSelectSection,
  onNewEntry,
  entriesCount,
  favoritesCount,
  foldersCount = 0,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navGroups = [
    {
      label: 'JOURNAL',
      items: [
        {
          id: 'all' as NavigationSection,
          label: 'All Journals',
          icon: BookOpen,
          badge: entriesCount > 0 ? entriesCount : undefined,
        },
        {
          id: 'favorites' as NavigationSection,
          label: 'Favorites',
          icon: Star,
          badge: favoritesCount > 0 ? favoritesCount : undefined,
        },
        {
          id: 'folders' as NavigationSection,
          label: 'Folders / Collections',
          icon: Folder,
          badge: foldersCount > 0 ? foldersCount : undefined,
        },
      ],
    },
    {
      label: 'EXPLORE',
      items: [
        {
          id: 'calendar' as NavigationSection,
          label: 'Calendar',
          icon: Calendar,
        },
        {
          id: 'timeline' as NavigationSection,
          label: 'Timeline',
          icon: Clock,
        },
        {
          id: 'search' as NavigationSection,
          label: 'Search',
          icon: Search,
        },
      ],
    },
    {
      label: 'REFLECT',
      items: [
        {
          id: 'daily_prompts' as NavigationSection,
          label: 'Daily Prompts',
          icon: Sparkles,
        },
        {
          id: 'ai_insights' as NavigationSection,
          label: 'AI Insights',
          icon: Lightbulb,
        },
        {
          id: 'talk_to_journal' as NavigationSection,
          label: 'Talk to My Journal',
          icon: MessageSquare,
        },
        {
          id: 'patterns_themes' as NavigationSection,
          label: 'Patterns & Themes',
          icon: Layers,
        },
        {
          id: 'weekly_reflection' as NavigationSection,
          label: 'Weekly Reflection',
          icon: CalendarDays,
        },
        {
          id: 'monthly_reflection' as NavigationSection,
          label: 'Monthly Reflection',
          icon: CalendarRange,
        },
        {
          id: 'on_this_day' as NavigationSection,
          label: 'On This Day',
          icon: History,
        },
      ],
    },
    {
      label: 'PROGRESS',
      items: [
        {
          id: 'streaks' as NavigationSection,
          label: 'Streaks',
          icon: Flame,
        },
        {
          id: 'writing_goals' as NavigationSection,
          label: 'Writing Goals',
          icon: Target,
        },
        {
          id: 'statistics' as NavigationSection,
          label: 'Statistics',
          icon: BarChart2,
        },
      ],
    },
  ];

  const renderNavContent = () => (
    <div className="h-full flex flex-col min-h-0 bg-stone-50/80 dark:bg-stone-900/80 border-r border-stone-200/80 dark:border-stone-800 transition-colors duration-150 select-none">
      {/* Top CTA: + New Journal Entry */}
      <div className="p-3.5 border-b border-stone-200/70 dark:border-stone-800 shrink-0">
        <button
          id="new-journal-entry-nav-btn"
          onClick={() => {
            onNewEntry();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Navigation Sections (Scrollable within container) */}
      <nav 
        id="main-navigation-sidebar"
        className="flex-1 min-h-0 overflow-y-auto p-3 space-y-5"
        aria-label="Application Sections"
      >
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <h3 className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              {group.label}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => {
                      onSelectSection(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-amber-100/70 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/70 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-stone-700 dark:text-stone-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-medium ${
                          isActive
                            ? 'bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Subtle Bottom Information */}
      <div className="p-3 border-t border-stone-200/70 dark:border-stone-800 shrink-0 text-[11px] text-stone-700 dark:text-stone-300 flex items-center justify-between">
        <span className="font-mono">v1.2</span>
        <span>Isolated Firestore</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Navigation Sidebar */}
      <aside className="hidden lg:flex lg:w-56 xl:w-60 h-full min-h-0 flex-col shrink-0 overflow-hidden">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-xs h-full bg-stone-50 dark:bg-stone-900 shadow-2xl flex flex-col min-h-0 z-10 border-r border-stone-200 dark:border-stone-800 overflow-hidden animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-3 border-b border-stone-200 dark:border-stone-800">
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                Navigation
              </span>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-stone-700 hover:text-stone-800 dark:text-stone-300 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              {renderNavContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
