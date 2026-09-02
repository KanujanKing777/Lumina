import React from 'react';
import { User } from 'firebase/auth';
import { Sparkles, LogOut, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';
import { logOut } from '../firebase';

interface HeaderProps {
  user: User | null;
  onOpenThreatModel: () => void;
  onSignIn: () => void;
  isAuthenticating?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenThreatModel,
  onSignIn,
  isAuthenticating,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-stone-900 tracking-tight">Reflections AI</h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-800 border border-amber-200/60 tracking-wider">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-[11px] text-stone-700 hidden sm:block">Private, Isolated Firestore Journal</p>
          </div>
        </div>

        {/* Security & Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Threat Model & Security Button */}
          <button
            id="threat-model-toggle-btn"
            onClick={onOpenThreatModel}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 bg-stone-100/80 hover:bg-stone-200/70 border border-stone-200/60 transition-colors"
            title="Inspect Agentic Threat Model & Security Posture"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Security Posture</span>
          </button>

          {/* User Auth State */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-stone-200">
              <div className="flex items-center gap-2 text-left">
                {user.photoURL ? (
                  <img
                    id="user-avatar-img"
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-stone-300 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-700">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden lg:block">
                  <p className="text-xs font-medium text-stone-900 leading-none truncate max-w-[120px]">
                    {user.displayName || 'Authenticated User'}
                  </p>
                  <p className="text-[10px] text-stone-700 leading-none mt-1 truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                id="sign-out-btn"
                onClick={logOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
                title="Sign out of your private session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              id="header-sign-in-btn"
              onClick={onSignIn}
              disabled={isAuthenticating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-all shadow-xs disabled:opacity-50"
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
        </div>
      </div>
    </header>
  );
};
