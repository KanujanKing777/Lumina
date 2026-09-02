import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle } from './firebase';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { ThreatModelModal } from './components/ThreatModelModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isThreatModelOpen, setIsThreatModelOpen] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      // Don't show intimidating error if user simply closed the popup
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Failed to authenticate with Google. Please try again.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-amber-600 rounded-full animate-spin" />
          <p className="text-xs font-medium text-stone-700">Verifying session security...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] font-sans antialiased text-stone-900 selection:bg-amber-100 selection:text-amber-900">
      
      {/* App Header */}
      <Header
        user={user}
        onOpenThreatModel={() => setIsThreatModelOpen(true)}
        onSignIn={handleSignIn}
        isAuthenticating={isAuthenticating}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {user ? (
          <Dashboard user={user} />
        ) : (
          <LandingPage
            onSignIn={handleSignIn}
            isAuthenticating={isAuthenticating}
            error={authError}
          />
        )}
      </main>

      {/* Threat Model Modal */}
      <ThreatModelModal
        isOpen={isThreatModelOpen}
        onClose={() => setIsThreatModelOpen(false)}
      />

    </div>
  );
}
