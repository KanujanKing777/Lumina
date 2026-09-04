import { INotificationProvider, MinimizedEventPayload, NotificationProviderType } from './types';
import { WEBHOOK_NOTIFICATION_DIRECTIVE } from './notificationDirective';

/**
 * Validates a webhook URL against SSRF threats:
 * Blocks internal networks, loopback, AWS/GCP metadata endpoints (169.254.169.254), etc.
 */
export function isSafeWebhookUrl(urlStr: string): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(urlStr);

    // Enforce HTTPS
    if (parsed.protocol !== 'https:') {
      return { safe: false, reason: 'Webhook URL must use secure HTTPS protocol.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost and internal names
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === 'metadata.google.internal' ||
      hostname === 'metadata'
    ) {
      return { safe: false, reason: 'Targeting internal/local hostnames is prohibited.' };
    }

    // IP address checks
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);

    if (ipMatch) {
      const octets = ipMatch.slice(1, 5).map(Number);
      const [o1, o2] = octets;

      // 127.0.0.0/8 (Loopback)
      if (o1 === 127) return { safe: false, reason: 'Loopback IP addresses are prohibited.' };
      // 10.0.0.0/8 (Private)
      if (o1 === 10) return { safe: false, reason: 'Private IP space (10.0.0.0/8) is prohibited.' };
      // 172.16.0.0/12 (Private)
      if (o1 === 172 && o2 >= 16 && o2 <= 31) return { safe: false, reason: 'Private IP space (172.16.0.0/12) is prohibited.' };
      // 192.168.0.0/16 (Private)
      if (o1 === 192 && o2 === 168) return { safe: false, reason: 'Private IP space (192.168.0.0/16) is prohibited.' };
      // 169.254.0.0/16 (Link-local / Cloud Metadata)
      if (o1 === 169 && o2 === 254) return { safe: false, reason: 'Cloud metadata / link-local addresses (169.254.0.0/16) are prohibited.' };
      // 0.0.0.0/8
      if (o1 === 0) return { safe: false, reason: 'Invalid IP address.' };
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: 'Invalid URL format.' };
  }
}

export class WebhookNotificationProvider implements INotificationProvider {
  name = 'SecureWebhookDeliveryProvider';
  providerType: NotificationProviderType = 'webhook';

  async send(
    destinationUrl: string,
    payload: MinimizedEventPayload,
    options?: { timeoutMs?: number }
  ): Promise<{ success: boolean; rawResponse?: any; error?: string }> {
    const safetyCheck = isSafeWebhookUrl(destinationUrl);
    if (!safetyCheck.safe) {
      return {
        success: false,
        error: `SSRF Security Block: ${safetyCheck.reason}`,
      };
    }

    const timeoutMs = options?.timeoutMs || WEBHOOK_NOTIFICATION_DIRECTIVE.timeoutMs;
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(destinationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ReflectionsAI-WebhookService/1.0',
        },
        body: JSON.stringify({
          source: 'ReflectionsAI',
          version: '1.0',
          eventType: payload.eventType,
          eventTitle: payload.eventTitle,
          message: payload.eventSnippet,
          timestamp: payload.timestamp,
          userReference: payload.userReference,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutTimer);

      if (!response.ok) {
        return {
          success: false,
          error: `Webhook returned HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        rawResponse: { status: response.status },
      };
    } catch (err: any) {
      clearTimeout(timeoutTimer);
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: `Webhook timed out after ${timeoutMs}ms`,
        };
      }
      return {
        success: false,
        error: err.message || 'Failed to dispatch webhook.',
      };
    }
  }
}
