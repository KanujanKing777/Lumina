import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Mail,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Sliders,
  Webhook,
} from 'lucide-react';
import {
  NotificationSettings,
  NotificationEventType,
  NotificationLogEntry,
  NotificationProviderType,
} from '../types';
import {
  saveNotificationSettings,
  subscribeToNotificationLogs,
  saveNotificationLog,
} from '../firebase';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string | null;
  currentSettings: NotificationSettings | null;
}

const AVAILABLE_EVENT_TYPES: { type: NotificationEventType; label: string; desc: string }[] = [
  {
    type: 'goal_detected',
    label: 'Goals & Aspirations',
    desc: 'Triggers when a target, ambition, or personal objective is identified.',
  },
  {
    type: 'task_detected',
    label: 'Action Items & Tasks',
    desc: 'Triggers when actionable next steps or todo items are discovered.',
  },
  {
    type: 'reminder_detected',
    label: 'Reminders & Dates',
    desc: 'Triggers for time-sensitive commitments or scheduled reviews.',
  },
  {
    type: 'important_event_detected',
    label: 'Major Milestones',
    desc: 'Triggers for breakthroughs, critical life events, or major decisions.',
  },
  {
    type: 'achievement_detected',
    label: 'Wins & Achievements',
    desc: 'Triggers when a goal is reached or a win is celebrated.',
  },
];

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  currentSettings,
}) => {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [emailDestination, setEmailDestination] = useState<string>('');
  const [providerType, setProviderType] = useState<NotificationProviderType>('email');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [enabledEventTypes, setEnabledEventTypes] = useState<NotificationEventType[]>([
    'goal_detected',
    'task_detected',
  ]);
  const [activeTab, setActiveTab] = useState<'settings' | 'logs'>('settings');
  const [logs, setLogs] = useState<NotificationLogEntry[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync settings when opened
  useEffect(() => {
    if (currentSettings) {
      setEnabled(currentSettings.enabled ?? false);
      setEmailDestination(currentSettings.emailDestination || userEmail || '');
      setProviderType(currentSettings.providerType || 'email');
      setWebhookUrl(currentSettings.webhookUrl || '');
      setEnabledEventTypes(currentSettings.enabledEventTypes || ['goal_detected', 'task_detected']);
    } else if (userEmail) {
      setEmailDestination(userEmail);
    }
  }, [currentSettings, userEmail]);

  // Subscribe to delivery logs
  useEffect(() => {
    if (!userId || !isOpen) return;
    const unsubscribe = subscribeToNotificationLogs(
      userId,
      (fetchedLogs) => setLogs(fetchedLogs),
      (err) => console.error('Error fetching logs:', err)
    );
    return () => unsubscribe();
  }, [userId, isOpen]);

  if (!isOpen) return null;

  const toggleEventType = (type: NotificationEventType) => {
    if (enabledEventTypes.includes(type)) {
      setEnabledEventTypes(enabledEventTypes.filter((t) => t !== type));
    } else {
      setEnabledEventTypes([...enabledEventTypes, type]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await saveNotificationSettings(userId, {
        enabled,
        emailDestination: emailDestination.trim(),
        enabledEventTypes,
        providerType,
        webhookUrl: webhookUrl.trim(),
      });
      setStatusMessage({ type: 'success', text: 'Notification preferences saved securely.' });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    setIsTesting(true);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          destination: emailDestination.trim(),
          providerType,
          webhookUrl: webhookUrl.trim(),
          eventType: enabledEventTypes[0] || 'goal_detected',
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Record test log in Firestore
        await saveNotificationLog(userId, {
          eventType: enabledEventTypes[0] || 'goal_detected',
          provider: data.result?.provider || 'SecureEmailDeliveryProvider',
          destination: data.result?.destinationMasked || emailDestination,
          status: 'sent',
          idempotencyKey: data.result?.idempotencyKey || `test_${Date.now()}`,
          attempts: 1,
          timestamp: Date.now(),
          summarySnippet: 'Verification test notification successfully delivered.',
        });

        setStatusMessage({
          type: 'success',
          text: `Test notification sent successfully to ${data.result?.destinationMasked || 'destination'}!`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to send test notification.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error sending test.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="notification-settings-modal"
        className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                External Notifications & Privacy
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Get notified when goals, tasks, or milestones are detected in your journal
              </p>
            </div>
          </div>
          <button
            id="close-notification-modal-btn"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 px-6 bg-white dark:bg-stone-900">
          <button
            id="tab-notification-rules-btn"
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'settings'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Rules & Triggers
          </button>
          <button
            id="tab-notification-logs-btn"
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-4 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'logs'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Delivery Audit Log ({logs.length})
          </button>
        </div>

        {/* Status Message Banner */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800/40'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-b border-rose-200 dark:border-rose-800/40'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'settings' ? (
            <>
              {/* Privacy / Data Minimization Notice */}
              <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
                  <strong className="font-semibold text-amber-950 dark:text-amber-100">
                    Privacy Guarantee (Data Minimization):
                  </strong>{' '}
                  Your complete journal entries are never transmitted externally. Only high-level event snippets
                  are delivered to your verified destination according to the explicit triggers you enable below.
                </div>
              </div>

              {/* Master Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800">
                <div className="space-y-0.5">
                  <label htmlFor="toggle-enable-notifications" className="text-sm font-semibold text-stone-900 dark:text-stone-100 cursor-pointer">
                    Enable External Notifications
                  </label>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Dispatch notifications when parsed journal events match your enabled rules
                  </p>
                </div>
                <button
                  id="toggle-enable-notifications"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => setEnabled(!enabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                    enabled ? 'bg-amber-600' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Destination & Provider Configuration */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Delivery Destination
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProviderType('email')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      providerType === 'email'
                        ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 text-stone-900 dark:text-stone-100 ring-1 ring-amber-500'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold">Email Delivery</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">Standard Email Digest</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProviderType('webhook')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      providerType === 'webhook'
                        ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 text-stone-900 dark:text-stone-100 ring-1 ring-amber-500'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <Webhook className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold">Secure Webhook</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">HTTPS REST Endpoint</div>
                    </div>
                  </button>
                </div>

                {providerType === 'email' ? (
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      Recipient Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        id="notification-email-input"
                        type="email"
                        value={emailDestination}
                        onChange={(e) => setEmailDestination(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-9 pr-4 py-2.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                      Secure Webhook URL (HTTPS only)
                    </label>
                    <div className="relative">
                      <Webhook className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        id="notification-webhook-input"
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://api.example.com/webhooks/journal"
                        className="w-full pl-9 pr-4 py-2.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                      Target URL must use HTTPS and public IP space (SSRF protection enforced).
                    </p>
                  </div>
                )}
              </div>

              {/* Event Type Triggers */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Subscribed Journal Event Triggers
                </h3>
                <div className="space-y-2">
                  {AVAILABLE_EVENT_TYPES.map((evt) => {
                    const isChecked = enabledEventTypes.includes(evt.type);
                    return (
                      <label
                        key={evt.type}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60'
                            : 'bg-white dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEventType(evt.type)}
                          className="mt-0.5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                        />
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                            <span>{evt.label}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded">
                              {evt.type}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 dark:text-stone-400">{evt.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Delivery Audit Log Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Recent Dispatch Audit Log
                </h3>
                <span className="text-xs text-stone-400 font-mono">Real-time sync</span>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-10 px-4 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
                  <Clock className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
                    No notification deliveries recorded yet
                  </p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                    Trigger a test notification or save journal entries with actionable events.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id || log.idempotencyKey}
                      className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-900 dark:text-stone-100">
                            {log.eventType.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              log.status === 'sent'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : log.status === 'failed'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                          {log.summarySnippet}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-stone-400 font-mono">
                          <span>To: {log.destination}</span>
                          <span>•</span>
                          <span>Via: {log.provider}</span>
                          <span>•</span>
                          <span>Key: {log.idempotencyKey.substring(0, 10)}...</span>
                        </div>
                        {log.errorMessage && (
                          <div className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2 rounded border border-rose-200 dark:border-rose-900/40 mt-1">
                            Error: {log.errorMessage}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-400 flex-shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 flex items-center justify-between">
          <button
            id="test-notification-btn"
            type="button"
            disabled={isTesting || !emailDestination}
            onClick={handleSendTest}
            className="px-3.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{isTesting ? 'Dispatching...' : 'Send Test Notification'}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-notification-settings-btn"
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
