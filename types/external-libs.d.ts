declare module "html2canvas" {
  type Html2CanvasOptions = {
    backgroundColor?: string | null;
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
  };

  export default function html2canvas(
    element: HTMLElement,
    options?: Html2CanvasOptions,
  ): Promise<HTMLCanvasElement>;
}

declare module "jspdf" {
  export class jsPDF {
    constructor(options?: {
      orientation?: "portrait" | "landscape";
      unit?: string;
      format?: string;
    });

    addImage(
      imageData: string,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
      alias?: string,
      compression?: "NONE" | "FAST" | "MEDIUM" | "SLOW",
      rotation?: number,
    ): jsPDF;

    save(filename: string): void;
  }
}
