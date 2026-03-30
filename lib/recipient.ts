export type Recipient = {
  kind: 'team' | 'missioner';
  id: string;
  // optional display fields used by UI and QR generation
  name?: string | null;
  nation?: string | null;
  travelDate?: string | null; // ISO date or human string
  sendingChurch?: string | null;
};

/**
 * Parse and validate a recipient query param into a canonical recipient object.
 * Accepts values like "team::123" or "m::123::0" and returns the canonical form.
 * Returns null for inputs that don't match expected patterns.
 */
export function parseRecipientParam(param: string | null): Recipient | null {
  if (!param || typeof param !== 'string') return null;

  // canonical forms we support
  if (/^team::[\w-]+$/.test(param)) return { kind: 'team', id: param };
  if (/^m::[\w-:]+$/.test(param)) return { kind: 'missioner', id: param };

  // explicit short-hand numeric team id (e.g. "123") -> normalize to team::123
  if (/^[0-9]+$/.test(param)) return { kind: 'team', id: `team::${param}` };

  return null;
}

export function canonicalRecipientId(recipient: Recipient) {
  return recipient.id;
}
