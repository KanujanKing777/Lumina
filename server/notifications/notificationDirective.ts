/**
 * ============================================================================
 * NOTIFICATION API DIRECTIVE
 * ============================================================================
 * 
 * Defines the contract, security rules, and structural schemas for all external
 * notification provider integrations.
 */

export interface ProviderDirectiveSpecification {
  providerName: string;
  providerType: 'email' | 'webhook' | 'sandbox';
  endpoint: string;
  httpMethod: 'POST' | 'PUT';
  authentication: {
    type: 'bearer' | 'api_key' | 'basic' | 'hmac' | 'sandbox';
    headerKey?: string;
    secretSource: 'SECRET_MANAGER' | 'ENVIRONMENT';
  };
  requiredCredentials: string[];
  requestHeaders: Record<string, string>;
  payloadSchema: {
    eventType: string;
    timestamp: string;
    userReference: string;
    eventTitle: string;
    message: string;
    metadata?: Record<string, string>;
  };
  responseSchema: {
    expectedStatusCodes: number[];
    successField?: string;
  };
  timeoutMs: number;
  maxRetries: number;
  rateLimits: {
    maxPerUserPerHour: number;
    testCooldownSeconds: number;
  };
  supportedEventTypes: string[];
}

export const EMAIL_NOTIFICATION_DIRECTIVE: ProviderDirectiveSpecification = {
  providerName: 'SecureEmailDeliveryProvider',
  providerType: 'email',
  endpoint: process.env.NOTIFICATION_EMAIL_ENDPOINT || 'https://api.resend.com/emails',
  httpMethod: 'POST',
  authentication: {
    type: 'bearer',
    headerKey: 'Authorization',
    secretSource: 'ENVIRONMENT',
  },
  requiredCredentials: ['NOTIFICATION_EMAIL_API_KEY'],
  requestHeaders: {
    'Content-Type': 'application/json',
    'User-Agent': 'ReflectionsAI-NotificationService/1.0',
  },
  payloadSchema: {
    eventType: 'string (one of supported types)',
    timestamp: 'ISO8601 string or epoch ms',
    userReference: 'hashed/masked user identifier',
    eventTitle: 'sanitized event title (max 100 chars)',
    message: 'sanitized minimized snippet (max 300 chars)',
  },
  responseSchema: {
    expectedStatusCodes: [200, 201, 202],
    successField: 'id',
  },
  timeoutMs: 8000,
  maxRetries: 3,
  rateLimits: {
    maxPerUserPerHour: 20,
    testCooldownSeconds: 5,
  },
  supportedEventTypes: [
    'goal_detected',
    'task_detected',
    'reminder_detected',
    'important_event_detected',
    'achievement_detected',
    'custom_event',
  ],
};

export const WEBHOOK_NOTIFICATION_DIRECTIVE: ProviderDirectiveSpecification = {
  providerName: 'SecureWebhookDeliveryProvider',
  providerType: 'webhook',
  endpoint: 'User-configured HTTPS endpoint (Subject to SSRF IP validation)',
  httpMethod: 'POST',
  authentication: {
    type: 'hmac',
    headerKey: 'X-Reflections-Signature',
    secretSource: 'ENVIRONMENT',
  },
  requiredCredentials: [],
  requestHeaders: {
    'Content-Type': 'application/json',
    'User-Agent': 'ReflectionsAI-WebhookService/1.0',
  },
  payloadSchema: {
    eventType: 'string',
    timestamp: 'epoch timestamp ms',
    userReference: 'masked UID',
    eventTitle: 'sanitized event title',
    message: 'minimized event summary',
  },
  responseSchema: {
    expectedStatusCodes: [200, 201, 202, 204],
  },
  timeoutMs: 5000,
  maxRetries: 2,
  rateLimits: {
    maxPerUserPerHour: 30,
    testCooldownSeconds: 5,
  },
  supportedEventTypes: [
    'goal_detected',
    'task_detected',
    'reminder_detected',
    'important_event_detected',
    'achievement_detected',
    'custom_event',
  ],
};
