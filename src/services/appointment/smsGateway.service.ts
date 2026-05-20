/**
 * Outbound SMS via configurable HTTP gateway (env FEATURE_SMS_REMINDERS).
 */

import envConfig from '../../../config/env.config';

export function isSmsGatewayConfigured(): boolean {
  return (
    envConfig.smsGateway.enabled &&
    !!envConfig.smsGateway.apiUrl?.trim() &&
    !!envConfig.smsGateway.apiKey?.trim()
  );
}

/** Normalize Greek mobile to E.164-ish (+30…). */
export function normalizeGreekPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('30')) {
    return `+${digits}`;
  }
  if (digits.startsWith('69') && digits.length === 10) {
    return `+30${digits}`;
  }
  if (digits.length >= 10) {
    return `+${digits}`;
  }
  return raw.trim();
}

/**
 * Generic JSON POST — adapt body shape to your provider in env URL docs.
 * Default payload: { to, message, sender }
 */
export async function sendSms(to: string, body: string): Promise<void> {
  if (!isSmsGatewayConfigured()) {
    throw new Error('SMS gateway is not configured');
  }

  const phone = normalizeGreekPhone(to);
  const response = await fetch(envConfig.smsGateway.apiUrl!.trim(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${envConfig.smsGateway.apiKey}`,
    },
    body: JSON.stringify({
      to: phone,
      message: body,
      sender: envConfig.smsGateway.senderId || 'DentalApp',
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `SMS gateway error ${response.status}${text ? `: ${text.slice(0, 120)}` : ''}`,
    );
  }
}
