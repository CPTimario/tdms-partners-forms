import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("qrcode", () => ({
  toDataURL: async (text: string) => {
    // return a tiny valid PNG data URL stub
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
  },
}));

import { generateCompositeQr } from "@/lib/qr";

describe("generateCompositeQr", () => {
  let OriginalImage: any;
  beforeEach(() => {
    OriginalImage = (global as any).Image;
    // mock Image to immediately call onload when src is set
    (global as any).Image = class {
      onload: (() => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      set src(_v: string) {
        // simulate successful load
        setTimeout(() => this.onload && this.onload(), 0);
      }
    };
    // mock canvas creation/context since jsdom doesn't implement it
    const originalCreate = document.createElement.bind(document);
    (document as any).__orig_createElement = originalCreate;
    let last: any = null;
    (document as any).createElement = (tag: string) => {
      if (tag.toLowerCase() === "canvas") {
        const canvas: any = {
          width: 0,
          height: 0,
          toDataURL: () => "data:image/png;base64,MOCK",
          _fillTextCalls: [] as Array<{ text: string; x: number; y: number }>,
          getContext: (_: string) => ({
            fillStyle: "",
            font: "",
            textAlign: "",
            fillRect: () => {},
            fillText: (text: string, x: number, y: number) => {
              canvas._fillTextCalls.push({ text, x, y });
            },
            drawImage: () => {},
          }),
        };
        last = canvas;
        (document as any).__lastCanvas = canvas;
        return canvas;
      }
      return originalCreate(tag);
    };
  });

  afterEach(() => {
    (global as any).Image = OriginalImage;
    if ((document as any).__orig_createElement) {
      (document as any).createElement = (document as any).__orig_createElement;
      delete (document as any).__orig_createElement;
    }
  });

  test("returns a PNG data URL", async () => {
    // jsdom provides Image but canvas drawing may be no-op in test env; we assert data URL returned
    const url = "https://example.com/test";
    const dataUrl = await generateCompositeQr(url, { title: "Test", recipient: null });
    expect(typeof dataUrl).toBe("string");
    expect(dataUrl.startsWith("data:image/png")).toBe(true);
  });

  test("renders recipient label lines when provided", async () => {
    const url = "https://example.com/test";
    const recipient = {
      kind: "missioner",
      id: "m::1::0",
      name: "Alice Example",
      nation: "Thailand",
      travelDate: "2026-06-20",
      sendingChurch: "Every Nation Makati",
    } as any;
    const dataUrl = await generateCompositeQr(url, { title: "Test", recipient });
    expect(typeof dataUrl).toBe("string");
    const canvas = (document as any).__lastCanvas;
    expect(canvas).toBeDefined();
    const texts = (canvas._fillTextCalls as Array<{ text: string }>).map((t) => t.text);
    // title + name + nation + travel + sending church should appear in some order
    expect(texts).toContain("Test");
    // name should appear, or at minimum the id fallback (accept either)
    expect(texts.some((t: string) => /Alice|m::/.test(t))).toBe(true);
    // nation and travel should appear; sending church may be formatted/truncated
    expect(texts).toContain("Nation: Thailand");
    expect(texts).toContain("Travel Date: 2026-06-20");
    expect(texts).toContain("Sending Church: Every Nation Makati");
  });
});
