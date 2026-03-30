import { describe, test, expect } from 'vitest';

import { parseRecipientParam } from '@/lib/recipient';

describe('parseRecipientParam', () => {
  test('parses team ObjectId-like ids', () => {
    const oid = '507f1f77bcf86cd799439011'; // 24 hex
    const parsed = parseRecipientParam(`team::${oid}`);
    expect(parsed).not.toBeNull();
    expect(parsed?.kind).toBe('team');
    expect(parsed?.id).toBe(`team::${oid}`);
  });

  test('normalizes numeric shorthand to team::<id>', () => {
    const parsed = parseRecipientParam('123');
    expect(parsed).not.toBeNull();
    expect(parsed?.kind).toBe('team');
    expect(parsed?.id).toBe('team::123');
  });

  test('parses missioner canonical form', () => {
    const parsed = parseRecipientParam('m::1::0');
    expect(parsed).not.toBeNull();
    expect(parsed?.kind).toBe('missioner');
  });

  test('rejects invalid values', () => {
    expect(parseRecipientParam('')).toBeNull();
    expect(parseRecipientParam('not-a-match')).toBeNull();
  });
});
