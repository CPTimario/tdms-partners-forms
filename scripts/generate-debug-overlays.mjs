import fs from 'node:fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const MM_TO_PT = 2.834645669;
const OUTPUT_DIR = 'test-results/debug-pdf';

const PAGE1_FIELDS = [
  ['partnerName', 40, 58],
  ['emailAddress', 40, 44],
  ['mobileNumber', 40, 29],
  ['localChurch', 40, 15],
  ['missionaryName', 139, 58],
  ['amount', 147, 44],
  ['nation', 139, 29],
  ['travelDate', 188, 29],
  ['sendingChurch', 142, 15],
  ['consentCheckbox', 7, 79],
];

const TEMPLATES = [
  {
    key: 'victory',
    inputPath: 'public/tdms-forms/pic-saf-victory.pdf',
    markersByPage: {
      0: PAGE1_FIELDS,
      1: [
        ['unableToGoTeamFund', 7, 30],
        ['unableToGoGeneralFund', 7, 21],
        ['reroutedRetain', 74, 34],
        ['reroutedGeneralFund', 74, 24],
        ['canceledGeneralFund', 143, 30],
        ['partnerSignature', 155, 12],
      ],
    },
  },
  {
    key: 'non-victory',
    inputPath: 'public/tdms-forms/pic-saf-non-victory.pdf',
    markersByPage: {
      0: PAGE1_FIELDS,
      1: [
        ['unableToGoTeamFund', 7, 39],
        ['unableToGoGeneralFund', 7, 29],
        ['reroutedRetain', 74, 42],
        ['reroutedGeneralFund', 74, 33],
        ['canceledGeneralFund', 143, 39],
        ['partnerSignature', 155, 12],
      ],
    },
  },
];

function mmToPt(mm) {
  return mm * MM_TO_PT;
}

function ensureOutputDirectory() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function drawGrid(page, font) {
  const { width, height } = page.getSize();
  const gridColor = rgb(0.85, 0.85, 0.85);
  const labelColor = rgb(0.5, 0.5, 0.5);

  for (let x = 0; x <= width; x += 20) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: 0.4,
      color: gridColor,
    });

    if (x % 40 === 0) {
      page.drawText(String(x), {
        x: x + 1,
        y: 10,
        size: 6,
        font,
        color: labelColor,
      });
    }
  }

  for (let y = 0; y <= height; y += 20) {
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: 0.4,
      color: gridColor,
    });

    if (y % 40 === 0) {
      page.drawText(String(y), {
        x: 2,
        y: y + 2,
        size: 6,
        font,
        color: labelColor,
      });
    }
  }
}

function drawMarkers(page, markers, font) {
  for (const [label, xMm, yMm] of markers) {
    const x = mmToPt(xMm);
    const y = mmToPt(yMm);

    page.drawCircle({
      x,
      y,
      size: 2,
      color: rgb(1, 0.2, 0.2),
      borderColor: rgb(1, 0, 0),
      borderWidth: 0.8,
    });

    page.drawText(label, {
      x: x + 4,
      y: y + 3,
      size: 6,
      font,
      color: rgb(1, 0, 0),
    });
  }
}

async function generateGridOverlay(template) {
  const sourcePdfBytes = fs.readFileSync(template.inputPath);
  const pdfDoc = await PDFDocument.load(sourcePdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const page of pdfDoc.getPages()) {
    drawGrid(page, font);
  }

  const outputPath = `${OUTPUT_DIR}/${template.key}-grid-overlay.pdf`;
  const outputBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, outputBytes);
}

async function generateMarkerOverlay(template) {
  const sourcePdfBytes = fs.readFileSync(template.inputPath);
  const pdfDoc = await PDFDocument.load(sourcePdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const [pageIndexText, markers] of Object.entries(template.markersByPage)) {
    const pageIndex = Number(pageIndexText);
    const page = pdfDoc.getPage(pageIndex);
    drawMarkers(page, markers, font);
  }

  const outputPath = `${OUTPUT_DIR}/${template.key}-field-markers.pdf`;
  const outputBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, outputBytes);
}

async function main() {
  ensureOutputDirectory();

  for (const template of TEMPLATES) {
    await generateGridOverlay(template);
    await generateMarkerOverlay(template);
  }

  console.log('Debug overlays generated in test-results/debug-pdf/.');
}

main().catch((error) => {
  console.error('Failed to generate debug overlays:', error);
  process.exit(1);
});
