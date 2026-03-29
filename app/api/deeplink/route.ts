import { NextResponse } from "next/server";
import deeplinkCrypto from "@/lib/deeplink-crypto";
import { z } from "zod";

const RecipientPayloadSchema = z.object({
  missionaryName: z.string().trim().optional(),
  nation: z.string().trim().optional(),
  travelDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Travel Date must be in YYYY-MM-DD format")
    .optional()
    .refine((val) => {
      if (!val) return true;
      try {
        const today = new Date().toISOString().slice(0, 10);
        return val >= today;
      } catch {
        return false;
      }
    }, "Travel Date cannot be earlier than today"),
  sendingChurch: z.string().trim().optional(),
}).refine((obj) => {
  // ensure at least one allowed key is present
  return Boolean(obj.missionaryName || obj.nation || obj.travelDate || obj.sendingChurch);
}, { message: "At least one recipient field is required" });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) return NextResponse.json({ fields: null });
    const fields = deeplinkCrypto.decryptRecipient(token);
    return NextResponse.json({ fields });
  } catch {
    return NextResponse.json({ fields: null }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Validate and sanitize incoming payload to only allow expected fields
    const parsed = RecipientPayloadSchema.parse(body);
    const token = deeplinkCrypto.encryptRecipient(parsed as Record<string, string | null | undefined>);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "unable to create token" }, { status: 400 });
  }
}
