import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ContactForm, {
  type ContactFormLabels,
} from '../../src/components/contact/ContactForm';

const labels: ContactFormLabels = {
  name: 'Name',
  email: 'Email',
  message: 'Message',
  submit: 'Send message',
  sending: 'Sending message…',
  success: 'Message sent.',
  invalid: 'Review the highlighted fields.',
  nameInvalid: 'Name must contain between 2 and 80 characters.',
  emailInvalid: 'Enter a valid email with at most 254 characters.',
  messageInvalid: 'Message must contain between 20 and 2000 characters.',
  offline: 'You appear to be offline.',
  timeout: 'The request took too long.',
  rateLimit: 'Too many attempts.',
  provider: 'The message service could not complete the request.',
  unknown: 'Something went wrong.',
  unavailable: 'The contact form is temporarily unavailable.',
};

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.type(
    screen.getByLabelText('Message'),
    'I would like to discuss a real interface system.',
  );
}

function fillValidFormSynchronously() {
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Ada Lovelace' },
  });
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'ada@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Message'), {
    target: {
      value: 'I would like to discuss a real interface system.',
    },
  });
}

function expectLegitimateValuesRetained() {
  expect(screen.getByLabelText(labels.name)).toHaveValue('Ada Lovelace');
  expect(screen.getByLabelText(labels.email)).toHaveValue('ada@example.com');
  expect(screen.getByLabelText(labels.message)).not.toHaveValue('');
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ContactForm', () => {
  it('shows localized field errors, descriptions, and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    render(
      <ContactForm
        formId="test-form-id"
        labels={labels}
        idPrefix="contact-en"
      />,
    );

    await user.click(screen.getByRole('button', { name: labels.submit }));

    const name = screen.getByLabelText(labels.name);
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAttribute('aria-describedby', 'contact-en-name-error');
    expect(screen.getByText(labels.nameInvalid)).toHaveAttribute(
      'id',
      'contact-en-name-error',
    );
    expect(screen.getByRole('status')).toHaveTextContent(labels.invalid);
  });

  it('disables only submit while pending and serializes an empty honeypot', async () => {
    const user = userEvent.setup();
    let resolveRequest:
      ((value: { ok: boolean; status: number }) => void) | undefined;
    const fetchMock = vi.fn(
      (_url: RequestInfo | URL, _init?: RequestInit) =>
        new Promise<{ ok: boolean; status: number }>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    render(
      <ContactForm
        formId="test-form-id"
        labels={labels}
        idPrefix="contact-en"
      />,
    );
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: labels.submit }));

    expect(screen.getByRole('button', { name: labels.sending })).toBeDisabled();
    expect(screen.getByLabelText(labels.name)).toBeEnabled();
    expect(screen.getByLabelText(labels.email)).toBeEnabled();
    expect(screen.getByLabelText(labels.message)).toBeEnabled();
    const requestInit = fetchMock.mock.calls[0]?.[1];
    expect(requestInit).toBeDefined();
    const payload = JSON.parse(requestInit?.body as string);
    expect(payload).toMatchObject({ _gotcha: '' });

    resolveRequest?.({ ok: true, status: 200 });
    await screen.findByText(labels.success);
  });

  it('moves focus to success and clears legitimate values', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    );
    render(
      <ContactForm
        formId="test-form-id"
        labels={labels}
        idPrefix="contact-en"
      />,
    );
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: labels.submit }));

    const status = await screen.findByRole('status');
    await waitFor(() => expect(status).toHaveFocus());
    expect(status).toHaveTextContent(labels.success);
    expect(screen.getByLabelText(labels.name)).toHaveValue('');
    expect(screen.getByLabelText(labels.email)).toHaveValue('');
    expect(screen.getByLabelText(labels.message)).toHaveValue('');
  });

  it.each([
    [429, 'rateLimit'],
    [500, 'provider'],
  ] as const)(
    'retains values for HTTP %s failures',
    async (status, labelKey) => {
      const user = userEvent.setup();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));
      render(
        <ContactForm
          formId="test-form-id"
          labels={labels}
          idPrefix="contact-en"
        />,
      );
      await fillValidForm(user);

      await user.click(screen.getByRole('button', { name: labels.submit }));

      expect(await screen.findByRole('status')).toHaveTextContent(
        labels[labelKey],
      );
      expectLegitimateValuesRetained();
      expect(screen.getByRole('button', { name: labels.submit })).toBeEnabled();
    },
  );

  it('shows the offline state without requesting and retains values', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    render(
      <ContactForm
        formId="test-form-id"
        labels={labels}
        idPrefix="contact-en"
      />,
    );
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: labels.submit }));

    expect(await screen.findByRole('status')).toHaveTextContent(labels.offline);
    expect(fetchMock).not.toHaveBeenCalled();
    expectLegitimateValuesRetained();
  });

  it('shows the unknown state and retains values after an unexpected failure', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
    render(
      <ContactForm
        formId="test-form-id"
        labels={labels}
        idPrefix="contact-en"
      />,
    );
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: labels.submit }));

    expect(await screen.findByRole('status')).toHaveTextContent(labels.unknown);
    expectLegitimateValuesRetained();
  });

  it('shows the ten-second timeout state and retains values', async () => {
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
    render(
      <ContactForm
        formId="test-form-id"
        labels={labels}
        idPrefix="contact-en"
      />,
    );
    fillValidFormSynchronously();

    fireEvent.click(screen.getByRole('button', { name: labels.submit }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(screen.getByRole('status')).toHaveTextContent(labels.timeout);
    expectLegitimateValuesRetained();
    expect(screen.getByRole('button', { name: labels.submit })).toBeEnabled();
  });

  it('renders a safe localized configuration state without an endpoint', () => {
    render(<ContactForm formId="" labels={labels} idPrefix="contact-en" />);

    expect(screen.getByRole('button', { name: labels.submit })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(labels.unavailable);
    expect(screen.getByLabelText(labels.name)).toBeEnabled();
    expect(screen.getByLabelText(labels.email)).toBeEnabled();
    expect(screen.getByLabelText(labels.message)).toBeEnabled();
  });
});
