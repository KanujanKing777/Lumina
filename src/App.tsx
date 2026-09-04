import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, subscribeToNotificationSettings } from './firebase';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { ThreatModelModal } from './components/ThreatModelModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { NotificationSettings } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isThreatModelOpen, setIsThreatModelOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to user notification settings in real-time
  useEffect(() => {
    if (!user) {
      setNotificationSettings(null);
      return;
    }

    const unsubscribe = subscribeToNotificationSettings(
      user.uid,
      (settings) => setNotificationSettings(settings),
      (err) => console.error('Notification settings error:', err)
    );

    return () => unsubscribe();
  }, [user]);

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
      <div className="h-full h-[100dvh] bg-[#FBFBF9] dark:bg-[#121211] flex items-center justify-center transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-stone-300 dark:border-stone-700 border-t-amber-600 dark:border-t-amber-500 rounded-full animate-spin" />
          <p className="text-xs font-medium text-stone-700 dark:text-stone-400">Verifying session security...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full h-[100dvh] flex flex-col bg-[#FBFBF9] dark:bg-[#121211] font-sans antialiased text-stone-900 dark:text-stone-100 selection:bg-amber-100 dark:selection:bg-amber-950/60 selection:text-amber-900 dark:selection:text-amber-200 transition-colors duration-150 overflow-hidden">
      
      {/* App Header */}
      <Header
        user={user}
        onOpenThreatModel={() => setIsThreatModelOpen(true)}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        notificationsEnabled={notificationSettings?.enabled ?? false}
        onSignIn={handleSignIn}
        isAuthenticating={isAuthenticating}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {user ? (
          <Dashboard
            user={user}
            notificationSettings={notificationSettings}
            onOpenNotifications={() => setIsNotificationsModalOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isMobileNavOpen={isMobileNavOpen}
            onCloseMobileNav={() => setIsMobileNavOpen(false)}
          />
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <LandingPage
              onSignIn={handleSignIn}
              isAuthenticating={isAuthenticating}
              error={authError}
            />
          </div>
        )}
      </main>

      {/* Notification Settings Modal */}
      {user && (
        <NotificationSettingsModal
          isOpen={isNotificationsModalOpen}
          onClose={() => setIsNotificationsModalOpen(false)}
          userId={user.uid}
          userEmail={user.email}
          currentSettings={notificationSettings}
        />
      )}

      {/* Threat Model Modal */}
      <ThreatModelModal
        isOpen={isThreatModelOpen}
        onClose={() => setIsThreatModelOpen(false)}
      />

    </div>
  );
}

