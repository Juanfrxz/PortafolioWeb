export const CONTACT_TIMEOUT_MS = 10_000;

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
  _gotcha: string;
};

export type ContactField = 'name' | 'email' | 'message';
export type ContactFieldErrors = Partial<Record<ContactField, 'invalid'>>;
export type ContactFailureReason =
  'validation' | 'offline' | 'timeout' | 'rate-limit' | 'provider' | 'unknown';

export type ContactResult =
  { ok: true } | { ok: false; reason: ContactFailureReason };

type SendContactOptions = {
  online?: boolean;
  timeoutMs?: number;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(payload: ContactPayload): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  const name = payload.name.trim();
  const email = payload.email.trim();
  const message = payload.message.trim();

  if (name.length < 2 || name.length > 80) {
    errors.name = 'invalid';
  }

  if (email.length > 254 || !emailPattern.test(email)) {
    errors.email = 'invalid';
  }

  if (message.length < 20 || message.length > 2_000) {
    errors.message = 'invalid';
  }

  return errors;
}

export async function submitContact(
  formId: string,
  payload: ContactPayload,
  signal: AbortSignal,
): Promise<ContactResult> {
  const response = await fetch(`https://formspree.io/f/${formId}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (response.ok) {
    return { ok: true };
  }

  return {
    ok: false,
    reason: response.status === 429 ? 'rate-limit' : 'provider',
  };
}

export async function sendContact(
  formId: string,
  payload: ContactPayload,
  options: SendContactOptions = {},
): Promise<ContactResult> {
  if (Object.keys(validateContact(payload)).length > 0) {
    return { ok: false, reason: 'validation' };
  }

  const online =
    options.online ??
    (typeof navigator === 'undefined' ? true : navigator.onLine);

  if (!online) {
    return { ok: false, reason: 'offline' };
  }

  const controller = new AbortController();
  let didTimeout = false;
  const timeout = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, options.timeoutMs ?? CONTACT_TIMEOUT_MS);

  try {
    return await submitContact(formId, payload, controller.signal);
  } catch (error) {
    if (
      didTimeout ||
      (error instanceof DOMException && error.name === 'AbortError')
    ) {
      return { ok: false, reason: 'timeout' };
    }

    return { ok: false, reason: 'unknown' };
  } finally {
    clearTimeout(timeout);
  }
}
