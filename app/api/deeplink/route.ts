import { NextResponse } from 'next/server';
import { z } from 'zod';

import deeplinkCrypto from '@/lib/deeplink-crypto';

// Fail fast if server key is not configured
if (!process.env.DEEPLINK_KEY) {
  console.error(
    'DEEPLINK_KEY is not configured. Deeplink API will return errors until configured.',
  );
}

const RecipientPayloadSchema = z
  .object({
    missionaryName: z.string().trim().optional(),
    nation: z.string().trim().optional(),
    travelDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Travel Date must be in YYYY-MM-DD format')
      .optional()
      .refine((val) => {
        if (!val) return true;
        try {
          const now = new Date();
          const pad = (n: number) => String(n).padStart(2, '0');
          const localToday = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
            now.getDate(),
          )}`;
          return val >= localToday;
        } catch {
          return false;
        }
      }, 'Travel Date cannot be earlier than today'),
    sendingChurch: z.string().trim().optional(),
  })
  .refine(
    (obj) => {
      // ensure at least one allowed key is present
      return Boolean(obj.missionaryName || obj.nation || obj.travelDate || obj.sendingChurch);
    },
    { message: 'At least one recipient field is required' },
  );

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    if (!token) return NextResponse.json({ fields: null }, { status: 400 });
    const fields = deeplinkCrypto.decryptRecipient(token);
    if (!fields) {
      // invalid or tampered token
      console.warn('DEEPLINK: attempted decrypt of invalid token');
      return NextResponse.json({ error: 'invalid token' }, { status: 400 });
    }
    return NextResponse.json({ fields });
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.DEEPLINK_KEY) {
      return NextResponse.json({ error: 'server misconfiguration' }, { status: 500 });
    }
    const body = await req.json();
    // Validate and sanitize incoming payload to only allow expected fields
    const parsed = RecipientPayloadSchema.parse(body);
    const token = deeplinkCrypto.encryptRecipient(
      parsed as Record<string, string | null | undefined>,
    );
    return NextResponse.json({ token });
  } catch {
    console.warn('DEEPLINK: failed to create deeplink token');
    return NextResponse.json({ error: 'unable to create token' }, { status: 400 });
  }
}
