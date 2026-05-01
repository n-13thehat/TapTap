import { randomBytes } from "crypto";

// Crockford base32: no I, L, O, U
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const TTID_BODY_LEN = 10;
export const TTID_PREFIX = "tt_";

function base32(bytes: Buffer, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i % bytes.length] & 0x1f];
  }
  return out;
}

export function generateTtid(): string {
  return TTID_PREFIX + base32(randomBytes(16), TTID_BODY_LEN);
}

export function generateTtidBatch(count: number): string[] {
  if (!Number.isInteger(count) || count <= 0) return [];
  const out = new Set<string>();
  while (out.size < count) {
    out.add(generateTtid());
  }
  return Array.from(out);
}

export function isTtid(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!value.startsWith(TTID_PREFIX)) return false;
  const body = value.slice(TTID_PREFIX.length);
  if (body.length !== TTID_BODY_LEN) return false;
  for (const ch of body) {
    if (!ALPHABET.includes(ch)) return false;
  }
  return true;
}
