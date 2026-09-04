import crypto from 'crypto';
import {
  NotificationEventType,
  UserNotificationRules,
  MinimizedEventPayload,
  DeliveryResult,
  INotificationProvider,
} from './types';
import { EmailNotificationProvider, maskEmail } from './emailProvider';
import { WebhookNotificationProvider } from './webhookProvider';
import { ExtractedEvent } from './eventParser';

// In-memory rate limiting and deduplication stores
interface RateLimitRecord {
  count: number;
  windowStart: number;
  lastTestTimestamp: number;
}

const userRateLimits = new Map<string, RateLimitRecord>();
const idempotencyRecords = new Map<string, { timestamp: number; result: DeliveryResult }>();

// Clean up stale records periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of userRateLimits.entries()) {
    if (now - record.windowStart > 3600000) {
      userRateLimits.delete(key);
    }
  }
  for (const [key, record] of idempotencyRecords.entries()) {
    if (now - record.timestamp > 86400000) {
      idempotencyRecords.delete(key);
    }
  }
}, 600000);

export class NotificationService {
  private emailProvider: INotificationProvider;
  private webhookProvider: INotificationProvider;

  constructor() {
    this.emailProvider = new EmailNotificationProvider();
    this.webhookProvider = new WebhookNotificationProvider();
  }

  /**
   * Generates a stable idempotency key for a journal event notification
   */
  public generateIdempotencyKey(userId: string, interactionId?: string, eventType?: string): string {
    const raw = `${userId}_${interactionId || 'global'}_${eventType || 'custom'}_${Math.floor(Date.now() / 60000)}`;
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 24);
  }

  /**
   * Check rate limit for a user
   */
  private checkRateLimit(userId: string, isTest: boolean = false): { allowed: boolean; reason?: string } {
    const now = Date.now();
    let record = userRateLimits.get(userId);

    if (!record || now - record.windowStart > 3600000) {
      record = { count: 0, windowStart: now, lastTestTimestamp: 0 };
      userRateLimits.set(userId, record);
    }

    if (isTest) {
      if (now - record.lastTestTimestamp < 5000) {
        const remaining = Math.ceil((5000 - (now - record.lastTestTimestamp)) / 1000);
        return {
          allowed: false,
          reason: `Test cooldown active. Please wait ${remaining}s before sending another test.`,
        };
      }
      record.lastTestTimestamp = now;
    }

    if (record.count >= 25) {
      return {
        allowed: false,
        reason: 'Hourly notification limit reached (25/hr). Protection active.',
      };
    }

    record.count += 1;
    return { allowed: true };
  }

  /**
   * Core dispatch function following the architecture:
   * Journal Entry -> Journal Parser -> Detected Event -> Notification Rules -> Notification Service -> External Provider -> Delivery Result
   */
  public async notify(
    event: ExtractedEvent,
    userRules: UserNotificationRules,
    context?: {
      interactionId?: string;
      journalTitle?: string;
      customSnippet?: string;
      isTest?: boolean;
    }
  ): Promise<DeliveryResult> {
    const isTest = !!context?.isTest;
    const idempotencyKey = this.generateIdempotencyKey(
      userRules.userId,
      context?.interactionId,
      event.eventType
    );

    // 1. Check Idempotency (Prevent duplicate notification within 1-minute window for same event)
    if (!isTest && idempotencyRecords.has(idempotencyKey)) {
      const cached = idempotencyRecords.get(idempotencyKey)!;
      console.log(`[Notification Service] Duplicate event suppressed via idempotency key: ${idempotencyKey}`);
      return cached.result;
    }

    // 2. Check User Rules & Consent
    if (!userRules.enabled && !isTest) {
      return {
        success: false,
        status: 'disabled',
        provider: userRules.providerType || 'email',
        destinationMasked: maskEmail(userRules.emailDestination || ''),
        idempotencyKey,
        attempts: 0,
        timestamp: Date.now(),
        error: 'External notifications are disabled in user settings.',
      };
    }

    // 3. Verify event type is explicitly subscribed in user's rules
    if (!isTest && !userRules.enabledEventTypes.includes(event.eventType)) {
      return {
        success: false,
        status: 'disabled',
        provider: userRules.providerType || 'email',
        destinationMasked: maskEmail(userRules.emailDestination || ''),
        idempotencyKey,
        attempts: 0,
        timestamp: Date.now(),
        error: `Event type '${event.eventType}' is not enabled in user notification preferences.`,
      };
    }

    // 4. Check Rate Limits
    const rateCheck = this.checkRateLimit(userRules.userId, isTest);
    if (!rateCheck.allowed) {
      return {
        success: false,
        status: 'failed',
        provider: userRules.providerType || 'email',
        destinationMasked: maskEmail(userRules.emailDestination || ''),
        idempotencyKey,
        attempts: 0,
        timestamp: Date.now(),
        error: rateCheck.reason,
        rateLimited: true,
      };
    }

    // 5. Data Minimization Payload Construction (NEVER send raw journal text)
    const sanitizedTitle = (event.title || 'Journal Event').substring(0, 80);
    const sanitizedSnippet = (context?.customSnippet || event.description || 'A new event was identified in your journal.').substring(0, 300);

    const payload: MinimizedEventPayload = {
      eventType: event.eventType,
      eventTitle: sanitizedTitle,
      eventSnippet: sanitizedSnippet,
      timestamp: Date.now(),
      userReference: `usr_${userRules.userId.substring(0, 8)}`,
      journalTitle: context?.journalTitle ? context.journalTitle.substring(0, 60) : undefined,
    };

    // 6. Select Provider
    const isWebhook = userRules.providerType === 'webhook' && !!userRules.webhookUrl;
    const provider = isWebhook ? this.webhookProvider : this.emailProvider;
    const destination = isWebhook ? userRules.webhookUrl! : userRules.emailDestination;
    const destinationMasked = isWebhook ? destination.substring(0, 25) + '...' : maskEmail(destination);

    // 7. Execute with Bounded Retries & Exponential Backoff
    let attempts = 0;
    const maxAttempts = isTest ? 1 : 3;
    let lastError = '';

    while (attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`[Notification Service] Attempt ${attempts}/${maxAttempts} for ${event.eventType} via ${provider.name}`);
        const result = await provider.send(destination, payload);

        if (result.success) {
          const successResult: DeliveryResult = {
            success: true,
            status: 'sent',
            provider: provider.name,
            destinationMasked,
            idempotencyKey,
            attempts,
            timestamp: Date.now(),
          };

          if (!isTest) {
            idempotencyRecords.set(idempotencyKey, { timestamp: Date.now(), result: successResult });
          }

          return successResult;
        }

        lastError = result.error || 'Provider rejected notification request.';
      } catch (err: any) {
        lastError = err.message || 'Network failure during delivery attempt.';
      }

      // Backoff before next attempt if retries remain
      if (attempts < maxAttempts) {
        const backoffMs = Math.pow(2, attempts) * 200;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    const failedResult: DeliveryResult = {
      success: false,
      status: 'failed',
      provider: provider.name,
      destinationMasked,
      idempotencyKey,
      attempts,
      timestamp: Date.now(),
      error: lastError,
    };

    if (!isTest) {
      idempotencyRecords.set(idempotencyKey, { timestamp: Date.now(), result: failedResult });
    }

    return failedResult;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
