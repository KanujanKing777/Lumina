import React from 'react';
import { Sparkles, Shield, Lock, Brain, BookOpen, ArrowRight, CheckCircle, Database } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  isAuthenticating: boolean;
  error?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  isAuthenticating,
  error,
}) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-150">
      <div className="max-w-3xl w-full text-center space-y-8">
        
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs font-semibold tracking-wide shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          <span>Private AI Journal & Multi-Turn Reflection</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-serif text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
            A sanctuary for your thoughts, unpacked by intelligent reflection.
          </h1>
          <p className="text-base sm:text-lg text-stone-700 dark:text-stone-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Converse freely, explore perspectives, and distill wisdom. Every thought is saved to a strictly isolated Firestore vault bound only to your verified identity.
          </p>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs font-medium max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Primary Call to Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="landing-sign-in-btn"
            onClick={onSignIn}
            disabled={isAuthenticating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-xl text-sm font-semibold text-white bg-stone-900 dark:bg-amber-600 hover:bg-stone-800 dark:hover:bg-amber-500 active:scale-[0.99] transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>{isAuthenticating ? 'Connecting to Firebase...' : 'Sign In with Google'}</span>
            <ArrowRight className="w-4 h-4 opacity-70" />
          </button>
        </div>

        {/* Feature Cards Grid (Clean, Flat Hierarchy) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 text-left">
          
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-200 dark:hover:border-amber-700/60 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-3">
              <Brain className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Gemini 3.6 Flash Engine</h3>
            <p className="text-xs text-stone-700 dark:text-stone-400 mt-1 leading-relaxed">
              Multi-turn conversational reflections, automated theme synthesis, brainstorming, and actionable task generation.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-emerald-200 dark:hover:border-emerald-700/60 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">User-Isolated Firestore</h3>
            <p className="text-xs text-stone-700 dark:text-stone-400 mt-1 leading-relaxed">
              Protected by cryptographic rules (<code className="text-[10px] bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded text-stone-800 dark:text-stone-300">request.auth.uid == userId</code>). Zero cross-tenant data leaks.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-blue-200 dark:hover:border-blue-700/60 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Zero Password Storing</h3>
            <p className="text-xs text-stone-700 dark:text-stone-400 mt-1 leading-relaxed">
              OAuth 2.0 federated identity keeps credentials completely out of application memory and database layers.
            </p>
          </div>

        </div>

        {/* Security & Verification Guarantee */}
        <div className="pt-4 flex items-center justify-center gap-6 text-xs text-stone-700 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>4-Tier Fallback Protocol</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Encrypted Server-Side Proxies</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Real-time Sync</span>
          </div>
        </div>

      </div>
    </div>
  );
};

