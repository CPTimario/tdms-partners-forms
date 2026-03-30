/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('qrcode', () => ({
  toDataURL: async () => {
    // return a tiny valid PNG data URL stub
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
  },
}));

import { generateCompositeQr } from '@/lib/qr';
import type { Recipient } from '@/lib/recipient';

describe('generateCompositeQr', () => {
  let OriginalImage: unknown;
  beforeEach(() => {
    OriginalImage = (global as unknown as Record<string, unknown>).Image;
    // mock Image to immediately call onload when src is set
    (global as unknown as Record<string, unknown>).Image = class {
      onload: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      set src(_v: string) {
        // simulate successful load
        setTimeout(() => this.onload && this.onload(), 0);
      }
    } as unknown as typeof Image;
    // mock canvas creation/context since jsdom doesn't implement it
    const originalCreate = document.createElement.bind(document);
    (document as any).__orig_createElement = originalCreate;
    (document as any).createElement = (tag: string) => {
      if (tag.toLowerCase() === 'canvas') {
        const canvas = {
          width: 0,
          height: 0,
          toDataURL: () => 'data:image/png;base64,MOCK',
          _fillTextCalls: [] as Array<{ text: string; x: number; y: number }>,
          getContext: () => ({
            fillStyle: '',
            font: '',
            textAlign: '',
            fillRect: () => {},
            fillText: (text: string, x: number, y: number) => {
              // push typed entry
              (canvas._fillTextCalls as Array<{ text: string; x: number; y: number }>).push({
                text,
                x,
                y,
              });
            },
            drawImage: () => {},
          }),
        } as const;
        (document as any).__lastCanvas = canvas;
        return canvas as unknown as HTMLCanvasElement;
      }
      return originalCreate(tag);
    };
  });

  afterEach(() => {
    (global as any).Image = OriginalImage as any;
    if ((document as any).__orig_createElement) {
      (document as any).createElement = (document as any).__orig_createElement as unknown as (
        tag: string,
      ) => Element;
      delete (document as any).__orig_createElement;
    }
  });

  test('returns a PNG data URL', async () => {
    // jsdom provides Image but canvas drawing may be no-op in test env; we assert data URL returned
    const url = 'https://example.com/test';
    const dataUrl = await generateCompositeQr(url, { title: 'Test', recipient: null });
    expect(typeof dataUrl).toBe('string');
    expect(dataUrl.startsWith('data:image/png')).toBe(true);
  });

  test('renders recipient label lines when provided', async () => {
    const url = 'https://example.com/test';
    const recipient = {
      kind: 'missioner',
      id: 'm::1::0',
      name: 'Alice Example',
      nation: 'Thailand',
      travelDate: '2026-06-20',
      sendingChurch: 'Every Nation Makati',
    } as const;
    const dataUrl = await generateCompositeQr(url, {
      title: 'Test',
      recipient: recipient as unknown as Recipient,
    });
    expect(typeof dataUrl).toBe('string');
    const canvas = (document as unknown as Record<string, any>).__lastCanvas as any;
    expect(canvas).toBeDefined();
    const texts = (canvas!._fillTextCalls as Array<{ text: string }>).map((t) => t.text);
    // title + name + nation + travel + sending church should appear in some order
    expect(texts).toContain('Test');
    // name should appear, or at minimum the id fallback (accept either)
    expect(texts.some((t) => /Alice|m::/.test(t))).toBe(true);
    // nation and travel should appear; sending church may be formatted/truncated
    expect(texts).toContain('Nation: Thailand');
    expect(texts).toContain('Travel Date: June 20, 2026');
    expect(texts).toContain('Sending Church: Every Nation Makati');
  });
});
