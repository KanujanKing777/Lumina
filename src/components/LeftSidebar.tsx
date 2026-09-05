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
  History,
  BarChart2,
  Plus,
  X,
  Hourglass
} from 'lucide-react';
import { NavigationSection } from '../types';

interface LeftSidebarProps {
  activeSection: NavigationSection;
  onSelectSection: (section: NavigationSection) => void;
  onNewEntry: () => void;
  entriesCount: number;
  favoritesCount: number;
  foldersCount?: number;
  futureMeUnopenedCount?: number;
  futureMeTotalCount?: number;
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
  futureMeUnopenedCount = 0,
  futureMeTotalCount = 0,
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
          label: 'Collections',
          icon: Folder,
          badge: foldersCount > 0 ? foldersCount : undefined,
        },
        {
          id: 'future_me' as NavigationSection,
          label: 'Future Me',
          icon: Hourglass,
          badge: futureMeUnopenedCount > 0 ? `${futureMeUnopenedCount} new` : (futureMeTotalCount > 0 ? futureMeTotalCount : undefined),
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
          id: 'statistics' as NavigationSection,
          label: 'Statistics',
          icon: BarChart2,
        },
      ],
    },
  ];

  const renderNavContent = () => (
    <div className="h-full flex flex-col min-h-0 bg-[#F8F8F6] dark:bg-[#161615] border-r border-stone-200/70 dark:border-stone-800/80 transition-colors duration-150 select-none">
      {/* Top CTA: + New Journal Entry */}
      <div className="p-3 border-b border-stone-200/60 dark:border-stone-800/70 shrink-0">
        <button
          id="new-journal-entry-nav-btn"
          onClick={() => {
            onNewEntry();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full h-9 flex items-center justify-center gap-2 px-3 rounded-lg text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-500 active:scale-[0.99] transition-all shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Navigation Sections (Scrollable within container) */}
      <nav 
        id="main-navigation-sidebar"
        className="flex-1 min-h-0 overflow-y-auto px-2.5 py-3 space-y-4"
        aria-label="Application Sections"
      >
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            <h3 className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
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
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-stone-200/70 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 font-medium'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/40 dark:hover:bg-stone-800/50 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive
                            ? 'text-stone-900 dark:text-amber-400'
                            : 'text-stone-400 dark:text-stone-500'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-medium ${
                          isActive
                            ? 'bg-stone-300/80 dark:bg-stone-700/80 text-stone-900 dark:text-stone-200'
                            : 'bg-stone-200/60 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
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
      <div className="p-3 border-t border-stone-200/60 dark:border-stone-800/70 shrink-0 text-[10px] text-stone-400 dark:text-stone-500 flex items-center justify-between">
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
