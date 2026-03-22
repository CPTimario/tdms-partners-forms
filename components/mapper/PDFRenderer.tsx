"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Set worker at component load time
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
}

type PDFRendererProps = {
  /** Path to PDF file (e.g., '/tdms-forms/pic-saf-victory.pdf') */
  pdfPath: string;
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Zoom multiplier */
  zoom: number;
  /** Optional callback for loading state */
  onLoadingChange?: (isLoading: boolean) => void;
};

export function PDFRenderer({
  pdfPath,
  pageNumber,
  width,
  height,
  zoom,
  onLoadingChange,
}: PDFRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | null = null;
    let renderTask: { promise: Promise<void>; cancel?: () => void } | null = null;

    const renderPDF = async () => {
      if (!canvasRef.current) return;

      try {
        setError(null);
        onLoadingChange?.(true);

        loadingTask = pdfjsLib.getDocument(pdfPath);
        const pdf = await loadingTask.promise;

        if (cancelled) {
          onLoadingChange?.(false);
          return;
        }

        if (pageNumber < 1 || pageNumber > pdf.numPages) {
          throw new Error(`Page ${pageNumber} not found (PDF has ${pdf.numPages} pages)`);
        }

        const page = await pdf.getPage(pageNumber);

        // Get the page viewport at the target dimensions
        const scale = (width / page.getViewport({ scale: 1 }).width) * zoom;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Failed to get canvas context");
        }

        const currentRenderTask = page.render({
          canvasContext: context,
          viewport,
        });
        renderTask = currentRenderTask;
        await currentRenderTask.promise;

        if (cancelled) {
          onLoadingChange?.(false);
          return;
        }

        onLoadingChange?.(false);
      } catch (err) {
        if (cancelled) {
          onLoadingChange?.(false);
          return;
        }

        const message = err instanceof Error ? err.message : "Unknown error rendering PDF";
        setError(message);
        onLoadingChange?.(false);
      }
    };

    renderPDF();

    return () => {
      cancelled = true;
      renderTask?.cancel?.();
      loadingTask?.destroy?.();
    };
  }, [pdfPath, pageNumber, width, height, zoom, onLoadingChange]);

  if (error) {
    return (
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          background: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#d32f2f",
          fontSize: "0.875rem",
          padding: "1rem",
          textAlign: "center",
          border: "1px solid #d32f2f",
          borderRadius: "4px",
        }}
      >
        <div>
          <strong>PDF Render Error</strong>
          <p style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "fill",
        pointerEvents: "none",
        userSelect: "none",
      }}
      data-testid="mapper-pdf-canvas"
    />
  );
}
