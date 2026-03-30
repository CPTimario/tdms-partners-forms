declare module 'qrcode' {
  export interface QrToDataUrlOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    type?: string;
    width?: number;
    margin?: number;
    scale?: number;
    color?: { dark?: string; light?: string };
    [key: string]: unknown;
  }

  export function toDataURL(text: string, options?: QrToDataUrlOptions): Promise<string>;
  const _default: {
    toDataURL: typeof toDataURL;
  };
  export default _default;
}
