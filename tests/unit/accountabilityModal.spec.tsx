import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { test, expect, vi } from 'vitest';

test('AccountabilityModal renders and responds to actions', async () => {
  const { default: AccountabilityModal } = await import('@/components/AccountabilityModal');
  const { ThemeProvider, createTheme } = await import('@mui/material/styles');

  const container = document.createElement('div');
  document.body.appendChild(container);

  const onAgree = vi.fn();
  const onClose = vi.fn();

  let root: Root | null = null;
  try {
    await act(async () => {
      root = createRoot(container);
      root.render(
        <ThemeProvider theme={createTheme()}>
          <AccountabilityModal open onAgree={onAgree} onClose={onClose} />
        </ThemeProvider>,
      );
      await Promise.resolve();
    });

    const title = document.body.querySelector('#membership-agreement-title');
    expect(title).toBeTruthy();

    const buttons = Array.from(document.body.querySelectorAll('button'));
    const agree = buttons.find((b) => /I Agree/i.test(b.textContent || ''));
    const cancel = buttons.find((b) => /Cancel/i.test(b.textContent || ''));
    expect(agree).toBeTruthy();
    expect(cancel).toBeTruthy();

    await act(async () => {
      (agree as HTMLButtonElement).click();
      await Promise.resolve();
    });
    expect(onAgree).toHaveBeenCalled();

    await act(async () => {
      (cancel as HTMLButtonElement).click();
      await Promise.resolve();
    });
    expect(onClose).toHaveBeenCalled();
    // flush any pending updates to satisfy React testing requirements
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  } finally {
    if (root) (root as unknown as { unmount: () => void }).unmount();
    container.remove();
  }
});
