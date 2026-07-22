import React, {
  type ChangeEvent,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  sendContact,
  validateContact,
  type ContactFailureReason,
  type ContactField,
  type ContactFieldErrors,
  type ContactPayload,
} from '../../lib/contact';

export type ContactFormLabels = {
  name: string;
  email: string;
  message: string;
  submit: string;
  sending: string;
  success: string;
  invalid: string;
  nameInvalid: string;
  emailInvalid: string;
  messageInvalid: string;
  offline: string;
  timeout: string;
  rateLimit: string;
  provider: string;
  unknown: string;
  unavailable: string;
};

type ContactFormProps = {
  formId: string;
  labels: ContactFormLabels;
  idPrefix: string;
};

type ContactStatus = 'idle' | 'sending' | 'success' | ContactFailureReason;

const emptyPayload: ContactPayload = {
  name: '',
  email: '',
  message: '',
  _gotcha: '',
};

export default function ContactForm({
  formId,
  labels,
  idPrefix,
}: ContactFormProps) {
  const [payload, setPayload] = useState<ContactPayload>(emptyPayload);
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [status, setStatus] = useState<ContactStatus>('idle');
  const [pending, setPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (status === 'success') {
      statusRef.current?.focus();
    }
  }, [status]);

  function updateField(
    field: keyof ContactPayload,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setPayload((current) => ({ ...current, [field]: event.target.value }));

    if (field !== '_gotcha' && errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  }

  function focusFirstInvalid(nextErrors: ContactFieldErrors) {
    const field = (['name', 'email', 'message'] as const).find(
      (candidate) => nextErrors[candidate],
    );
    const refs: Record<ContactField, React.RefObject<HTMLElement | null>> = {
      name: nameRef,
      email: emailRef,
      message: messageRef,
    };
    if (field) {
      refs[field].current?.focus();
    }
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formId || pending) {
      return;
    }

    const nextErrors = validateContact(payload);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus('validation');
      focusFirstInvalid(nextErrors);
      return;
    }

    setPending(true);
    setStatus('sending');
    const result = await sendContact(formId, payload);
    setPending(false);

    if (result.ok) {
      setPayload(emptyPayload);
      setErrors({});
      setStatus('success');
      return;
    }

    setStatus(result.reason);
  }

  const statusMessage = !formId
    ? labels.unavailable
    : {
        idle: '',
        sending: labels.sending,
        success: labels.success,
        validation: labels.invalid,
        offline: labels.offline,
        timeout: labels.timeout,
        'rate-limit': labels.rateLimit,
        provider: labels.provider,
        unknown: labels.unknown,
      }[status];

  return (
    <form
      className="contact-form"
      data-contact-form
      data-hydrated={String(hydrated)}
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="contact-form__field">
        <label htmlFor={`${idPrefix}-name`}>{labels.name}</label>
        <input
          ref={nameRef}
          id={`${idPrefix}-name`}
          name="name"
          type="text"
          autoComplete="name"
          value={payload.name}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${idPrefix}-name-error` : undefined}
          onChange={(event) => updateField('name', event)}
        />
        {errors.name && (
          <p id={`${idPrefix}-name-error`} className="contact-form__error">
            {labels.nameInvalid}
          </p>
        )}
      </div>

      <div className="contact-form__field">
        <label htmlFor={`${idPrefix}-email`}>{labels.email}</label>
        <input
          ref={emailRef}
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          autoComplete="email"
          value={payload.email}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={
            errors.email ? `${idPrefix}-email-error` : undefined
          }
          onChange={(event) => updateField('email', event)}
        />
        {errors.email && (
          <p id={`${idPrefix}-email-error`} className="contact-form__error">
            {labels.emailInvalid}
          </p>
        )}
      </div>

      <div className="contact-form__field">
        <label htmlFor={`${idPrefix}-message`}>{labels.message}</label>
        <textarea
          ref={messageRef}
          id={`${idPrefix}-message`}
          name="message"
          rows={6}
          value={payload.message}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            errors.message ? `${idPrefix}-message-error` : undefined
          }
          onChange={(event) => updateField('message', event)}
        />
        {errors.message && (
          <p id={`${idPrefix}-message-error`} className="contact-form__error">
            {labels.messageInvalid}
          </p>
        )}
      </div>

      <input
        className="contact-form__honeypot"
        name="_gotcha"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={payload._gotcha}
        onChange={(event) => updateField('_gotcha', event)}
      />

      <button type="submit" disabled={pending || !formId}>
        {pending ? labels.sending : labels.submit}
      </button>
      <p
        ref={statusRef}
        className="contact-form__status"
        role="status"
        tabIndex={-1}
      >
        {statusMessage}
      </p>

      <style>{`
        .contact-form {
          display: grid;
          gap: 1.25rem;
          padding: clamp(1.25rem, 4vw, 2.5rem);
          border: 1px solid var(--color-border);
          background: color-mix(in srgb, var(--color-panel), transparent 8%);
        }

        .contact-form__field {
          display: grid;
          gap: 0.5rem;
        }

        .contact-form__field label {
          color: var(--color-signal);
          font-family: var(--font-mono);
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .contact-form__field input,
        .contact-form__field textarea {
          inline-size: 100%;
          border: 1px solid var(--color-border);
          border-radius: 0;
          background: var(--color-bg);
          color: var(--color-text);
          padding: 0.875rem;
          resize: vertical;
        }

        .contact-form__field input {
          min-block-size: 2.75rem;
        }

        .contact-form__field [aria-invalid='true'] {
          border-color: var(--color-signal);
        }

        .contact-form button {
          min-block-size: 2.75rem;
          border: 1px solid var(--color-signal);
          background: var(--color-signal);
          color: var(--color-bg);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .contact-form button:disabled {
          cursor: not-allowed;
          opacity: 0.62;
        }

        .contact-form__error,
        .contact-form__status {
          margin: 0;
          font-family: var(--font-mono);
          font-size: 0.75rem;
        }

        .contact-form__error {
          color: var(--color-signal);
        }

        .contact-form__status {
          min-block-size: 1.2em;
          color: var(--color-muted);
        }

        .contact-form__honeypot {
          position: absolute;
          inline-size: 1px;
          block-size: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          clip-path: inset(50%);
          white-space: nowrap;
        }
      `}</style>
    </form>
  );
}
