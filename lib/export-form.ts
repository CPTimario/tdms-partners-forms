import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function exportFormElement(
  element: HTMLDivElement,
  type: "pdf" | "png",
  filename: string,
) {
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
  });

  if (type === "png") {
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    return;
  }

  const url = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  pdf.addImage(url, "PNG", 0, 0, 210, 297, undefined, "FAST");
  pdf.save(filename);
}
