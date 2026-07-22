import { expect, test } from '@playwright/test';

import { SITE } from '../../src/config/site';

const formspreePattern = '**/formspree.io/f/**';

test('hydrates on visibility, submits the honeypot safely, and focuses success', async ({
  page,
}) => {
  let submittedBody: Record<string, string> | undefined;
  await page.route(formspreePattern, async (route) => {
    submittedBody = route.request().postDataJSON() as Record<string, string>;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    });
  });
  await page.goto('/');

  const form = page.locator('[data-contact-form]');
  await expect(form).toHaveAttribute('data-hydrated', 'false');
  await form.scrollIntoViewIfNeeded();
  await expect(form).toHaveAttribute('data-hydrated', 'true');

  await form.getByLabel('Name', { exact: true }).fill('Ada Lovelace');
  await form.getByLabel('Email', { exact: true }).fill('ada@example.com');
  await form
    .getByLabel('Message', { exact: true })
    .fill('I would like to discuss a real interface system.');
  await form.getByRole('button', { name: 'Send message' }).click();

  const status = form.getByRole('status');
  await expect(status).toContainText('Message sent.');
  await expect(status).toBeFocused();
  expect(submittedBody).toMatchObject({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    message: 'I would like to discuss a real interface system.',
    _gotcha: '',
  });
});

test('retains values after a rate limit and never sends an unhandled request', async ({
  page,
}) => {
  await page.route(formspreePattern, (route) =>
    route.fulfill({ status: 429, contentType: 'application/json', body: '{}' }),
  );
  await page.goto('/es/');
  const form = page.locator('[data-contact-form]');
  await form.scrollIntoViewIfNeeded();
  await expect(form).toHaveAttribute('data-hydrated', 'true');

  await form.getByLabel('Nombre', { exact: true }).fill('Ada Lovelace');
  await form
    .getByLabel('Correo electrónico', { exact: true })
    .fill('ada@example.com');
  await form
    .getByLabel('Mensaje', { exact: true })
    .fill('Quiero conversar sobre un sistema de interfaz real.');
  await form.getByRole('button', { name: 'Enviar mensaje' }).click();

  await expect(form.getByRole('status')).toContainText('Demasiados intentos');
  await expect(form.getByLabel('Nombre', { exact: true })).toHaveValue(
    'Ada Lovelace',
  );
  await expect(
    form.getByRole('button', { name: 'Enviar mensaje' }),
  ).toBeEnabled();
});

test('keeps direct contact alternatives in static HTML without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  let formspreeRequests = 0;
  await page.route(formspreePattern, (route) => {
    formspreeRequests += 1;
    return route.abort();
  });
  await page.goto('/');

  const contact = page.locator('#contact');
  await expect(contact).toBeVisible();
  await expect(contact.getByText(SITE.email)).toBeVisible();
  await expect(contact.getByRole('link', { name: 'GitHub' })).toBeVisible();
  expect(formspreeRequests).toBe(0);
  await context.close();
});
