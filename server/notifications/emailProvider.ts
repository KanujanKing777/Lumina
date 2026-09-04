import { INotificationProvider, MinimizedEventPayload, NotificationProviderType } from './types';
import { EMAIL_NOTIFICATION_DIRECTIVE } from './notificationDirective';

/**
 * Strips CRLF and control characters to strictly prevent email header injection
 */
export function sanitizeHeaderValue(val: string): string {
  if (!val || typeof val !== 'string') return '';
  return val.replace(/[\r\n\0\t]/g, ' ').trim();
}

/**
 * HTML entity encoder to prevent XSS / HTML injection in email bodies
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates basic email structure
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
 * Mask destination email for audit logging and UI display (e.g., k***@domain.com)
 */
export function maskEmail(email: string): string {
  if (!email) return '***';
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const user = parts[0];
  const domain = parts[1];
  const maskedUser = user.length <= 2 ? `${user[0]}*` : `${user[0]}${'*'.repeat(Math.min(user.length - 2, 4))}${user[user.length - 1]}`;
  return `${maskedUser}@${domain}`;
}

export class EmailNotificationProvider implements INotificationProvider {
  name = 'SecureEmailDeliveryProvider';
  providerType: NotificationProviderType = 'email';

  async send(
    destination: string,
    payload: MinimizedEventPayload,
    options?: { timeoutMs?: number }
  ): Promise<{ success: boolean; rawResponse?: any; error?: string }> {
    const cleanDestination = sanitizeHeaderValue(destination);
    if (!isValidEmail(cleanDestination)) {
      return {
        success: false,
        error: `Invalid email recipient format: ${maskEmail(cleanDestination)}`,
      };
    }

    const apiKey = process.env.NOTIFICATION_EMAIL_API_KEY;
    const fromAddress = sanitizeHeaderValue(process.env.NOTIFICATION_EMAIL_FROM || 'Reflections AI <notifications@reflections.ai>');
    const endpoint = EMAIL_NOTIFICATION_DIRECTIVE.endpoint;
    const timeoutMs = options?.timeoutMs || EMAIL_NOTIFICATION_DIRECTIVE.timeoutMs;

    // Build human-friendly sanitized subject and message
    const eventNameFormatted = payload.eventType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    
    const subject = sanitizeHeaderValue(`[Reflections AI] ${eventNameFormatted}: ${payload.eventTitle || 'New Journal Insight'}`);
    
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: #fafaf9;">
        <div style="padding-bottom: 16px; border-bottom: 1px solid #e7e5e4; margin-bottom: 16px;">
          <h2 style="color: #78350f; margin: 0; font-size: 18px; font-weight: 600;">Reflections AI Notification</h2>
          <span style="display: inline-block; margin-top: 6px; font-size: 11px; text-transform: uppercase; background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
            ${escapeHtml(eventNameFormatted)}
          </span>
        </div>
        <div style="color: #292524; font-size: 14px; line-height: 1.6;">
          <p style="font-weight: 600; margin-bottom: 8px; color: #1c1917;">${escapeHtml(payload.eventTitle)}</p>
          <p style="background-color: #ffffff; padding: 14px; border-radius: 8px; border: 1px solid #e7e5e4; color: #44403c; margin: 12px 0;">
            ${escapeHtml(payload.eventSnippet)}
          </p>
          <p style="font-size: 12px; color: #78716c; margin-top: 16px;">
            This notification was triggered because of your configured notification rules for <strong>${escapeHtml(payload.eventType)}</strong>.
          </p>
        </div>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e7e5e4; font-size: 11px; color: #a8a29e; text-align: center;">
          Reflections AI • Isolated Firestore Journal Vault • Data Minimization Applied
        </div>
      </div>
    `;

    const textBody = `Reflections AI Notification\n\nEvent: ${eventNameFormatted}\nTitle: ${payload.eventTitle}\n\n${payload.eventSnippet}\n\nTriggered according to your Reflections AI notification rules.`;

    // Sandbox / Mock Mode when API key is not yet configured in Secret Manager / .env
    if (!apiKey || apiKey === 'MY_NOTIFICATION_EMAIL_API_KEY' || apiKey.startsWith('mock_')) {
      console.log(`[Email Sandbox Delivery] Simulated sending ${payload.eventType} notification to ${maskEmail(cleanDestination)}`);
      console.log(`[Email Sandbox Delivery] Subject: "${subject}" | Snippet: "${payload.eventSnippet}"`);
      return {
        success: true,
        rawResponse: {
          id: `sandbox_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          mode: 'sandbox_simulation',
          to: maskEmail(cleanDestination),
          timestamp: Date.now(),
        },
      };
    }

    // Live HTTP REST email provider call (Resend / Mailgun standard API schema)
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'ReflectionsAI-NotificationService/1.0',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [cleanDestination],
          subject,
          html: htmlBody,
          text: textBody,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutTimer);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown provider error');
        return {
          success: false,
          error: `Provider rejected request (HTTP ${response.status}): ${errorText.substring(0, 150)}`,
        };
      }

      const responseData = await response.json().catch(() => ({ status: 'ok' }));
      return {
        success: true,
        rawResponse: responseData,
      };
    } catch (err: any) {
      clearTimeout(timeoutTimer);
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: `Email provider request timed out after ${timeoutMs}ms`,
        };
      }
      return {
        success: false,
        error: err.message || 'Failed to connect to email provider service.',
      };
    }
  }
}
