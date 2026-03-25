import type { Recipient } from "./recipient";

export type QROptions = {
  title?: string;
  recipient?: Recipient | null;
};

export async function generateCompositeQr(url: string, opts: QROptions = {}): Promise<string> {
  const QRCode = await import("qrcode");
  const qrData = await QRCode.toDataURL(url, { margin: 1, scale: 6 });

  const img = new Image();
  img.src = qrData;
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = (e) => rej(e);
  });

  const title = opts.title ?? "PIC & SAF Form";
  const labelLines: string[] = [title];
  if (opts.recipient) {
    const r = opts.recipient;
    // prefer a human-friendly name when available, fall back to id
    const nameLabel = r.name ? r.name : r.id;
    labelLines.push(r.kind === 'team' ? `Team: ${nameLabel}`: `Missioner: ${nameLabel}`);
    if (r.nation) labelLines.push(`Nation: ${r.nation}`);
    if (r.travelDate) labelLines.push(`Travel Date: ${r.travelDate}`);
    if (r.sendingChurch) labelLines.push(`Sending Church: ${r.sendingChurch}`);
  }

  const canvasWidth = 480;
  const qrSize = 300;
  const padding = 16;
  const lineHeight = 20;
  const textHeight = labelLines.length * lineHeight;
  const canvasHeight = qrSize + padding * 2 + textHeight + 8;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to get canvas context");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#111111";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, canvasWidth / 2, padding + 16);

  const qrX = (canvasWidth - qrSize) / 2;
  const qrY = padding + 28;
  ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = "#111111";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  labelLines.slice(1).forEach((line, i) => {
    const y = qrY + qrSize + lineHeight * (i + 1) + 4;
    ctx.fillText(line, canvasWidth / 2, y);
  });

  return canvas.toDataURL("image/png");
}
