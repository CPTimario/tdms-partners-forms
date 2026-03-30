import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

import DisclaimerModal from '@/components/ui/DisclaimerModal';

describe('DisclaimerModal', () => {
  let container: HTMLDivElement | null = null;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  afterEach(() => {
    if (container) {
      container.innerHTML = '';
      container.remove();
      container = null;
    }
    vi.resetAllMocks();
  });

  test('renders and calls onClose when acknowledged', async () => {
    const onClose = vi.fn();
    await act(async () => {
      const root = createRoot(container!);
      root.render(<DisclaimerModal open={true} onClose={onClose} />);
      // let microtasks run
      await Promise.resolve();
    });

    const title = container!.querySelector('#disclaimer-title');
    expect(title).toBeTruthy();
    expect(title?.textContent).toBe('Privacy notice');

    const button = Array.from(container!.querySelectorAll('button')).find(
      (b) => b.textContent === 'Understood',
    );
    expect(button).toBeTruthy();
    if (!button) throw new Error('Understood button not found');

    await act(async () => {
      (button as HTMLButtonElement).click();
    });

    expect(onClose).toHaveBeenCalled();
  });
});
