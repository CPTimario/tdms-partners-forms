// AES-GCM authenticated encryption for deeplink tokens (server-side).
// Uses DEEPLINK_KEY to derive a 256-bit key via SHA-256.
// Token format: "e:" + base64url(iv(12) | authTag(16) | ciphertext)
import crypto from "crypto";

const PREFIX = "e:";

function ensureKey(): Buffer {
  const key = process.env.DEEPLINK_KEY;
  if (!key) throw new Error("Missing required environment variable: DEEPLINK_KEY");
  return crypto.createHash("sha256").update(key, "utf8").digest();
}

function base64UrlEncode(buf: Buffer) {
  // Node 18+ supports 'base64url', use it when available
  try {
    return buf.toString("base64url");
  } catch {
    return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
}

function base64UrlDecode(s: string) {
  try {
    return Buffer.from(s, "base64url");
  } catch {
    const pad = s.length % 4 === 2 ? "==" : s.length % 4 === 3 ? "=" : "";
    const base64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
    return Buffer.from(base64, "base64");
  }
}

export function looksEncryptedToken(token: string | null | undefined) {
  return Boolean(token && typeof token === "string" && token.startsWith(PREFIX));
}

export function encryptRecipient(fields: Record<string, string | null | undefined>): string {
  const key = ensureKey();
  const iv = crypto.randomBytes(12);
  const plain = Buffer.from(JSON.stringify(fields), "utf8");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]);
  return PREFIX + base64UrlEncode(payload);
}

export function decryptRecipient(token: string): Record<string, string> | null {
  try {
    if (!looksEncryptedToken(token)) return null;
    const payload = token.slice(PREFIX.length);
    const buf = base64UrlDecode(payload);
    if (buf.length < 12 + 16) return null;
    const iv = buf.slice(0, 12);
    const tag = buf.slice(12, 28);
    const encrypted = buf.slice(28);
    const key = ensureKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const parsed = JSON.parse(decrypted.toString("utf8"));
    if (parsed && typeof parsed === "object") {
      const out: Record<string, string> = {};
      Object.keys(parsed).forEach((k) => {
        const v = parsed[k];
        if (v === null || v === undefined) return;
        out[k] = String(v);
      });
      return out;
    }
    return null;
  } catch {
    return null;
  }
}

const deeplinkCrypto = { encryptRecipient, decryptRecipient, looksEncryptedToken };
export default deeplinkCrypto;
