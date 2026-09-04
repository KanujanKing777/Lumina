import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  Settings, 
  Moon, 
  Sun, 
  Bell, 
  ShieldCheck, 
  LogOut, 
  Check, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logOut } from '../firebase';
import { useTheme } from '../context/ThemeContext';

interface SettingsMenuProps {
  user: User | null;
  onOpenThreatModel: () => void;
  onOpenNotifications?: () => void;
  notificationsEnabled?: boolean;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  user,
  onOpenThreatModel,
  onOpenNotifications,
  notificationsEnabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Close menu on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
      return;
    }

    const focusableItems = itemRefs.current.filter((item): item is HTMLButtonElement => item !== null && !item.disabled);
    if (focusableItems.length === 0) return;

    const currentIndex = focusableItems.findIndex((item) => item === document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = currentIndex < focusableItems.length - 1 ? currentIndex + 1 : 0;
      focusableItems[nextIndex]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableItems.length - 1;
      focusableItems[prevIndex]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusableItems[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      focusableItems[focusableItems.length - 1]?.focus();
    }
  }, [isOpen]);

  // Focus first item when opening via keyboard
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const first = itemRefs.current.find((item) => item && !item.disabled);
        first?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleToggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const handleOpenNotifications = () => {
    setIsOpen(false);
    if (onOpenNotifications) {
      onOpenNotifications();
    }
  };

  const handleOpenThreatModel = () => {
    setIsOpen(false);
    onOpenThreatModel();
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    try {
      await logOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="relative inline-block text-left" onKeyDown={handleKeyDown}>
      {/* Settings Trigger Gear Icon */}
      <button
        ref={buttonRef}
        id="settings-menu-toggle-btn"
        type="button"
        onClick={handleToggleMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Application Settings and Preferences"
        title="Settings & Preferences"
        className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
            : 'bg-stone-100/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-stone-700 hover:bg-stone-200/70 dark:hover:bg-stone-700/80 hover:text-stone-900 dark:hover:text-stone-100'
        }`}
      >
        <Settings className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-90 text-amber-600 dark:text-amber-400' : 'text-stone-600 dark:text-stone-300'}`} />
        
        {/* Subtle Notification / Active Indicator Dot */}
        {notificationsEnabled && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1 ring-2 ring-white dark:ring-stone-900" />
        )}
      </button>

      {/* Dropdown Menu Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="settings-menu-toggle-btn"
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xl shadow-stone-900/10 dark:shadow-black/50 z-50 overflow-hidden focus:outline-hidden"
          >
            {/* Header: User Session & Status */}
            <div className="p-4 bg-stone-50/70 dark:bg-stone-800/50 border-b border-stone-200/80 dark:border-stone-800">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                      {user ? (user.displayName || 'Reflections Journal') : 'Guest Session'}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      {user ? user.email : 'Sign in to sync your reflections'}
                    </p>
                  </div>
                </div>

                {user && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Isolated
                  </span>
                )}
              </div>
            </div>

            {/* Menu Options Group */}
            <div className="p-2 space-y-1">
              
              {/* Option 1: Dark / Light Mode Toggle */}
              <div
                role="none"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100/80 dark:hover:bg-stone-800/70 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                    {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                      Appearance
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400">
                      {isDark ? 'Dark Mode active' : 'Light Mode active'}
                    </div>
                  </div>
                </div>

                <button
                  ref={(el) => { itemRefs.current[0] = el; }}
                  id="theme-toggle-btn"
                  role="menuitem"
                  type="button"
                  onClick={toggleTheme}
                  aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900 ${
                    isDark ? 'bg-amber-600' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                >
                  <span className="sr-only">Toggle theme</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                      isDark ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    {isDark ? (
                      <Moon className="w-3 h-3 text-amber-600" />
                    ) : (
                      <Sun className="w-3 h-3 text-amber-500" />
                    )}
                  </span>
                </button>
              </div>

              {/* Option 2: Notifications (If logged in & handler available) */}
              {user && onOpenNotifications && (
                <button
                  ref={(el) => { itemRefs.current[1] = el; }}
                  id="notifications-modal-toggle-btn"
                  role="menuitem"
                  type="button"
                  onClick={handleOpenNotifications}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100/80 dark:hover:bg-stone-800/70 transition-colors text-left group cursor-pointer focus:outline-hidden focus:bg-stone-100 dark:focus:bg-stone-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <span>Notifications</span>
                        {notificationsEnabled && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        {notificationsEnabled ? 'Active (Triggers ready)' : 'Alerts & Webhooks'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      notificationsEnabled 
                        ? 'bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}>
                      {notificationsEnabled ? 'Enabled' : 'Off'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              )}

              {/* Option 3: Security Posture */}
              <button
                ref={(el) => { itemRefs.current[2] = el; }}
                id="threat-model-toggle-btn"
                role="menuitem"
                type="button"
                onClick={handleOpenThreatModel}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100/80 dark:hover:bg-stone-800/70 transition-colors text-left group cursor-pointer focus:outline-hidden focus:bg-stone-100 dark:focus:bg-stone-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                      Security Posture
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400">
                      Threat model & RBAC status
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    Verified
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

            </div>

            {/* Option 4: Sign Out (Only when logged in) */}
            {user && (
              <div className="p-2 border-t border-stone-200/80 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40">
                <button
                  ref={(el) => { itemRefs.current[3] = el; }}
                  id="sign-out-btn"
                  role="menuitem"
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-800 dark:hover:text-red-300 transition-colors text-left group cursor-pointer focus:outline-hidden focus:bg-red-50 dark:focus:bg-red-950/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">
                      Sign Out
                    </div>
                    <div className="text-[11px] text-red-600/70 dark:text-red-400/70">
                      Securely end session
                    </div>
                  </div>
                </button>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
