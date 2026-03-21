import { writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Non-production mapper persistence endpoint.
 *
 * Accepts mapper-produced coordinates and rewrites `lib/pdf-coordinates.ts`
 * so local preview/export uses updated field mappings immediately.
 * This route is intentionally unavailable in production.
 */
export const runtime = "nodejs";

const textFieldSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().optional(),
  height: z.number().finite().optional(),
  fontSize: z.number().finite().optional(),
  fontName: z.string().optional(),
});

const checkboxSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().optional(),
  height: z.number().finite().optional(),
  checkSymbol: z.string().optional(),
  fontSize: z.number().finite().optional(),
  fontName: z.string().optional(),
});

const signatureSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite(),
  height: z.number().finite(),
  maxWidth: z.number().finite().optional(),
  maxHeight: z.number().finite().optional(),
});

const templateCoordinatesSchema = z.object({
  partnerName: textFieldSchema,
  emailAddress: textFieldSchema,
  mobileNumber: textFieldSchema,
  localChurch: textFieldSchema,
  missionaryName: textFieldSchema,
  amount: textFieldSchema,
  nation: textFieldSchema,
  travelDate: textFieldSchema,
  sendingChurch: textFieldSchema,
  consentCheckbox: checkboxSchema.optional(),
  unableToGoTeamFund: checkboxSchema.optional(),
  unableToGoGeneralFund: checkboxSchema.optional(),
  reroutedRetain: checkboxSchema.optional(),
  reroutedGeneralFund: checkboxSchema.optional(),
  canceledGeneralFund: checkboxSchema.optional(),
  partnerSignature: signatureSchema,
  partnerSignaturePrintedName: textFieldSchema,
});

const payloadSchema = z.object({
  coordinates: z.object({
    victory: templateCoordinatesSchema,
    nonVictory: templateCoordinatesSchema,
  }),
});

type PrimitiveValue = number | string;
type ConfigRecord = Record<string, PrimitiveValue | undefined>;

const FIELD_ORDER = [
  "partnerName",
  "emailAddress",
  "mobileNumber",
  "localChurch",
  "missionaryName",
  "amount",
  "nation",
  "travelDate",
  "sendingChurch",
  "consentCheckbox",
  "unableToGoTeamFund",
  "unableToGoGeneralFund",
  "reroutedRetain",
  "reroutedGeneralFund",
  "canceledGeneralFund",
  "partnerSignature",
  "partnerSignaturePrintedName",
] as const;

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return String(Number(value.toFixed(2)));
}

function formatValue(value: PrimitiveValue): string {
  if (typeof value === "number") {
    return formatNumber(value);
  }

  return JSON.stringify(value);
}

function serializeConfig(config: ConfigRecord, indentLevel = 1): string {
  const indent = "  ".repeat(indentLevel);
  const childIndent = "  ".repeat(indentLevel + 1);
  const keyOrder = [
    "x",
    "y",
    "width",
    "height",
    "maxWidth",
    "maxHeight",
    "checkSymbol",
    "fontSize",
    "fontName",
  ];

  const lines: string[] = [];
  for (const key of keyOrder) {
    const value = config[key];
    if (value === undefined) {
      continue;
    }
    lines.push(`${childIndent}${key}: ${formatValue(value)},`);
  }

  return `${indent}{\n${lines.join("\n")}\n${indent}}`;
}

function serializeTemplateObject(template: Record<string, ConfigRecord | undefined>): string {
  const lines: string[] = [];

  for (const field of FIELD_ORDER) {
    const config = template[field];
    if (!config) {
      continue;
    }

    lines.push(`  ${field}: ${serializeConfig(config as ConfigRecord, 1)},`);
  }

  return `{\n${lines.join("\n")}\n}`;
}

function buildCoordinatesFileContent(
  coordinates: z.infer<typeof payloadSchema>["coordinates"],
): string {
  const victoryObject = serializeTemplateObject(coordinates.victory as Record<string, ConfigRecord | undefined>);
  const nonVictoryObject = serializeTemplateObject(coordinates.nonVictory as Record<string, ConfigRecord | undefined>);

  return `/**
 * PDF coordinate mappings for Victory and Non-Victory templates.
 *
 * Coordinates are in mm, origin is bottom-left.
 * Template size is 612 x 252 pt (~215.9 x 88.9 mm), landscape.
 */

import type { TemplateCoordinates } from "@/types/pdf-form";

/**
 * Victory Member template coordinates
 * Adjust these based on your actual PDF layout
 */
export const victoryCourseCoordinates: TemplateCoordinates = ${victoryObject};

/**
 * Non-Victory Member template coordinates
 * Adjust these based on your actual PDF layout
 */
export const nonVictoryCoordinates: TemplateCoordinates = ${nonVictoryObject};

/**
 * Get coordinates for the appropriate template
 */
export function getTemplateCoordinates(
  membershipType: "victory" | "nonVictory"
): TemplateCoordinates {
  return membershipType === "victory"
    ? victoryCourseCoordinates
    : nonVictoryCoordinates;
}
`;
}

/**
 * Save mapper coordinates to source.
 *
 * Responses:
 * - 200: coordinates saved
 * - 400: payload fails zod validation
 * - 404: route disabled in production
 * - 500: unexpected write/parse failure
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const json = await request.json();
    const parsed = payloadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const nextFileContent = buildCoordinatesFileContent(parsed.data.coordinates);
    const targetPath = path.join(process.cwd(), "lib", "pdf-coordinates.ts");
    await writeFile(targetPath, nextFileContent, "utf8");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save coordinates" }, { status: 500 });
  }
}
