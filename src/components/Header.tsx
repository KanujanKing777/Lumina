import React from 'react';
import { User } from 'firebase/auth';
import { Sparkles, Search, Menu } from 'lucide-react';
import { SettingsMenu } from './SettingsMenu';

interface HeaderProps {
  user: User | null;
  onOpenThreatModel: () => void;
  onOpenNotifications?: () => void;
  notificationsEnabled?: boolean;
  onSignIn: () => void;
  isAuthenticating?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onToggleMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenThreatModel,
  onOpenNotifications,
  notificationsEnabled,
  onSignIn,
  isAuthenticating,
  searchQuery = '',
  onSearchChange,
  onToggleMobileNav,
}) => {
  return (
    <header className="shrink-0 z-40 w-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 transition-colors duration-150">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand & Identity (With Mobile Nav Hamburger) */}
        <div className="flex items-center gap-3 shrink-0">
          {onToggleMobileNav && (
            <button
              onClick={onToggleMobileNav}
              className="lg:hidden p-1.5 rounded-lg text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shadow-xs shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight whitespace-nowrap">
                Reflections AI
              </h1>
              <span className="hidden md:inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-100/70 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 tracking-wider">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-[11px] text-stone-700 dark:text-stone-300 hidden xl:block">
              Private, Isolated Firestore Journal
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        {onSearchChange && (
          <div className="flex-1 max-w-md mx-auto hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-700 dark:text-stone-300" />
              <input
                id="header-global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Global Search (journals, reflections, moods)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 rounded-xl placeholder:text-stone-600 dark:placeholder:text-stone-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white dark:focus:bg-stone-800 text-stone-900 dark:text-stone-100 transition-all"
              />
            </div>
          </div>
        )}

        {/* Profile & Settings Section */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Authenticated Profile Section (Unchanged presentation and functionality) */}
          {user ? (
            <div className="flex items-center gap-2 text-left">
              {user.photoURL ? (
                <img
                  id="user-avatar-img"
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-stone-300 dark:border-stone-700 object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-xs font-bold text-stone-700 dark:text-stone-300 shrink-0">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="hidden lg:block">
                <p className="text-xs font-medium text-stone-900 dark:text-stone-100 leading-none truncate max-w-[130px]">
                  {user.displayName || 'Authenticated User'}
                </p>
                <p className="text-[10px] text-stone-600 dark:text-stone-400 leading-none mt-1 truncate max-w-[130px]">
                  {user.email}
                </p>
              </div>
            </div>
          ) : (
            <button
              id="header-sign-in-btn"
              onClick={onSignIn}
              disabled={isAuthenticating}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold text-white bg-stone-900 dark:bg-amber-600 hover:bg-stone-800 dark:hover:bg-amber-500 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isAuthenticating ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
          )}

          {/* Unified Settings Gear Icon & Menu (Positioned directly near the profile section) */}
          <SettingsMenu
            user={user}
            onOpenThreatModel={onOpenThreatModel}
            onOpenNotifications={onOpenNotifications}
            notificationsEnabled={notificationsEnabled}
          />
        </div>
      </div>
    </header>
  );
};


