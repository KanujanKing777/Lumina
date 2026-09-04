export type NotificationEventType =
  | 'goal_detected'
  | 'task_detected'
  | 'reminder_detected'
  | 'important_event_detected'
  | 'achievement_detected'
  | 'custom_event';

export type NotificationProviderType = 'email' | 'webhook';

export type NotificationDeliveryStatus = 'pending' | 'sent' | 'failed' | 'retrying' | 'disabled';

export interface UserNotificationRules {
  userId: string;
  enabled: boolean;
  emailDestination: string;
  enabledEventTypes: NotificationEventType[];
  providerType: NotificationProviderType;
  webhookUrl?: string;
  includeSummary?: boolean;
  updatedAt: number;
}

export interface MinimizedEventPayload {
  eventType: NotificationEventType;
  eventTitle: string;
  eventSnippet: string;
  timestamp: number;
  userReference: string;
  journalTitle?: string;
  contextTag?: string;
}

export interface DeliveryResult {
  success: boolean;
  status: NotificationDeliveryStatus;
  provider: string;
  destinationMasked: string;
  idempotencyKey: string;
  attempts: number;
  timestamp: number;
  error?: string;
  rateLimited?: boolean;
}

export interface INotificationProvider {
  name: string;
  providerType: NotificationProviderType;
  send(
    destination: string,
    payload: MinimizedEventPayload,
    options?: { webhookUrl?: string; timeoutMs?: number }
  ): Promise<{ success: boolean; rawResponse?: any; error?: string }>;
}
