import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CONTACT_TIMEOUT_MS,
  sendContact,
  submitContact,
  validateContact,
  type ContactPayload,
} from '../../src/lib/contact';

const validPayload: ContactPayload = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'I would like to discuss a real interface system.',
  _gotcha: '',
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('validateContact', () => {
  it('enforces the exact name boundaries', () => {
    expect(validateContact({ ...validPayload, name: 'A' })).toEqual({
      name: 'invalid',
    });
    expect(validateContact({ ...validPayload, name: 'AB' })).toEqual({});
    expect(validateContact({ ...validPayload, name: 'A'.repeat(80) })).toEqual(
      {},
    );
    expect(validateContact({ ...validPayload, name: 'A'.repeat(81) })).toEqual({
      name: 'invalid',
    });
  });

  it('requires a valid email no longer than 254 characters', () => {
    expect(validateContact({ ...validPayload, email: 'not-an-email' })).toEqual(
      { email: 'invalid' },
    );
    const validLongEmail = `${'a'.repeat(242)}@example.com`;
    expect(validLongEmail).toHaveLength(254);
    expect(validateContact({ ...validPayload, email: validLongEmail })).toEqual(
      {},
    );
    expect(
      validateContact({ ...validPayload, email: `a${validLongEmail}` }),
    ).toEqual({ email: 'invalid' });
  });

  it('enforces the exact message boundaries', () => {
    expect(
      validateContact({ ...validPayload, message: 'A'.repeat(19) }),
    ).toEqual({ message: 'invalid' });
    expect(
      validateContact({ ...validPayload, message: 'A'.repeat(20) }),
    ).toEqual({});
    expect(
      validateContact({ ...validPayload, message: 'A'.repeat(2000) }),
    ).toEqual({});
    expect(
      validateContact({ ...validPayload, message: 'A'.repeat(2001) }),
    ).toEqual({ message: 'invalid' });
  });
});

describe('submitContact', () => {
  it('serializes the complete payload, including the empty honeypot', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    await expect(
      submitContact('test-form-id', validPayload, controller.signal),
    ).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://formspree.io/f/test-form-id',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validPayload),
        signal: controller.signal,
      }),
    );
  });

  it.each([
    [429, 'rate-limit'],
    [400, 'provider'],
    [500, 'provider'],
  ] as const)('maps HTTP %s to %s', async (status, reason) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));

    await expect(
      submitContact('test-form-id', validPayload, new AbortController().signal),
    ).resolves.toEqual({ ok: false, reason });
  });
});

describe('sendContact', () => {
  it('returns validation and offline states without making a request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sendContact('test-form-id', { ...validPayload, name: 'A' }),
    ).resolves.toEqual({ ok: false, reason: 'validation' });
    await expect(
      sendContact('test-form-id', validPayload, { online: false }),
    ).resolves.toEqual({ ok: false, reason: 'offline' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses the exact ten-second default timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      ),
    );

    const result = sendContact('test-form-id', validPayload, { online: true });
    await vi.advanceTimersByTimeAsync(CONTACT_TIMEOUT_MS - 1);
    let settled = false;
    void result.finally(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toEqual({ ok: false, reason: 'timeout' });
    expect(CONTACT_TIMEOUT_MS).toBe(10_000);
  });

  it('maps an unexpected request failure to unknown', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));

    await expect(
      sendContact('test-form-id', validPayload, { online: true }),
    ).resolves.toEqual({ ok: false, reason: 'unknown' });
  });
});
